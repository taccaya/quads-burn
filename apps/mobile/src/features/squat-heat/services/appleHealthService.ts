import type { HeatSessionLog } from '@company/domain';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

type HealthKitModule = typeof import('@kingstinct/react-native-healthkit');
type AppleHealthSyncResult =
  | 'saved'
  | 'skipped-platform'
  | 'skipped-expo-go'
  | 'skipped-unavailable'
  | 'skipped-unauthorized'
  | 'skipped-invalid-session'
  | 'failed';

const JST_TIME_ZONE = 'Asia/Tokyo';
const KCAL_PER_REP = 0.31;
const MIN_KILOCALORIES = 1;
const MAX_KILOCALORIES = 999;

const jstDateFormatter = new Intl.DateTimeFormat('ja-JP', {
  timeZone: JST_TIME_ZONE,
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

let availabilityChecked = false;
let isHealthDataAvailable = false;
let authorizationRequested = false;
let healthKitModulePromise: Promise<HealthKitModule | null> | null = null;

function isExpoGoRuntime() {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

async function loadHealthKitModule() {
  if (healthKitModulePromise) {
    return healthKitModulePromise;
  }

  healthKitModulePromise = import('@kingstinct/react-native-healthkit')
    .then((module) => module)
    .catch(() => null);

  return healthKitModulePromise;
}

function toDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function estimateKilocalories(totalReps: number) {
  const normalizedReps = Math.max(0, Math.round(totalReps));
  if (normalizedReps <= 0) {
    return 0;
  }

  const estimated = Math.round(normalizedReps * KCAL_PER_REP);
  return clamp(estimated, MIN_KILOCALORIES, MAX_KILOCALORIES);
}

function formatJstDateTime(value: Date) {
  const parts = jstDateFormatter.formatToParts(value);
  const map: Record<string, string> = {};

  for (const part of parts) {
    if (part.type !== 'literal') {
      map[part.type] = part.value;
    }
  }

  const year = map.year ?? '0000';
  const month = map.month ?? '01';
  const day = map.day ?? '01';
  const hour = map.hour ?? '00';
  const minute = map.minute ?? '00';
  const second = map.second ?? '00';

  return `${year}-${month}-${day}T${hour}:${minute}:${second}+09:00`;
}

function hasWorkoutWriteAuthorization(healthkit: HealthKitModule) {
  return (
    healthkit.authorizationStatusFor(healthkit.WorkoutTypeIdentifier) ===
    healthkit.AuthorizationStatus.sharingAuthorized
  );
}

async function checkHealthDataAvailability(healthkit: HealthKitModule) {
  if (availabilityChecked) {
    return isHealthDataAvailable;
  }

  try {
    isHealthDataAvailable = await healthkit.isHealthDataAvailableAsync();
  } catch {
    isHealthDataAvailable = false;
  }

  availabilityChecked = true;
  return isHealthDataAvailable;
}

async function ensureWorkoutAuthorization(healthkit: HealthKitModule) {
  if (!(await checkHealthDataAvailability(healthkit))) {
    return false;
  }

  if (hasWorkoutWriteAuthorization(healthkit)) {
    return true;
  }

  if (authorizationRequested) {
    return false;
  }

  authorizationRequested = true;

  try {
    const granted = await healthkit.requestAuthorization({
      toShare: [healthkit.WorkoutTypeIdentifier]
    });

    if (!granted) {
      return false;
    }

    return hasWorkoutWriteAuthorization(healthkit);
  } catch {
    return false;
  }
}

export async function syncSessionToAppleHealth(session: HeatSessionLog): Promise<AppleHealthSyncResult> {
  if (Platform.OS !== 'ios') {
    return 'skipped-platform';
  }

  if (isExpoGoRuntime()) {
    return 'skipped-expo-go';
  }

  const healthkit = await loadHealthKitModule();
  if (!healthkit) {
    return 'failed';
  }

  if (!(await checkHealthDataAvailability(healthkit))) {
    return 'skipped-unavailable';
  }

  if (!(await ensureWorkoutAuthorization(healthkit))) {
    return 'skipped-unauthorized';
  }

  const startedAt = toDate(session.startedAt);
  const completedAt = toDate(session.completedAt);
  if (!startedAt || !completedAt || completedAt.getTime() <= startedAt.getTime()) {
    return 'skipped-invalid-session';
  }

  const estimatedKilocalories = estimateKilocalories(session.totalReps);
  const workoutTotals =
    estimatedKilocalories > 0
      ? {
          energyBurned: estimatedKilocalories
        }
      : undefined;

  try {
    await healthkit.saveWorkoutSample(
      healthkit.WorkoutActivityType.highIntensityIntervalTraining,
      [],
      startedAt,
      completedAt,
      workoutTotals,
      {
        HKExternalUUID: session.id,
        HKWasUserEntered: true,
        quadsBurnTimezone: JST_TIME_ZONE,
        quadsBurnStartedAtJst: formatJstDateTime(startedAt),
        quadsBurnCompletedAtJst: formatJstDateTime(completedAt),
        quadsBurnEstimatedKilocalories: estimatedKilocalories,
        quadsBurnSessionId: session.id,
        quadsBurnTotalReps: session.totalReps,
        quadsBurnBestIntervalReps: session.bestIntervalReps,
        quadsBurnWorkoutActivityType: 'highIntensityIntervalTraining'
      }
    );
    return 'saved';
  } catch {
    return 'failed';
  }
}
