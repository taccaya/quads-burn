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

  try {
    await healthkit.saveWorkoutSample(
      healthkit.WorkoutActivityType.functionalStrengthTraining,
      [],
      startedAt,
      completedAt,
      undefined,
      {
        HKExternalUUID: session.id,
        HKWasUserEntered: true,
        quadsBurnSessionId: session.id,
        quadsBurnTotalReps: session.totalReps,
        quadsBurnBestIntervalReps: session.bestIntervalReps
      }
    );
    return 'saved';
  } catch {
    return 'failed';
  }
}
