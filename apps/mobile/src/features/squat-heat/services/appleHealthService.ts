import type { HeatSessionLog } from '@company/domain';
import {
  AuthorizationStatus,
  WorkoutActivityType,
  WorkoutTypeIdentifier,
  authorizationStatusFor,
  isHealthDataAvailableAsync,
  requestAuthorization,
  saveWorkoutSample
} from '@kingstinct/react-native-healthkit';
import { Platform } from 'react-native';

type AppleHealthSyncResult =
  | 'saved'
  | 'skipped-platform'
  | 'skipped-unavailable'
  | 'skipped-unauthorized'
  | 'skipped-invalid-session'
  | 'failed';

let availabilityChecked = false;
let isHealthDataAvailable = false;
let authorizationRequested = false;

function toDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function hasWorkoutWriteAuthorization() {
  return authorizationStatusFor(WorkoutTypeIdentifier) === AuthorizationStatus.sharingAuthorized;
}

async function checkHealthDataAvailability() {
  if (availabilityChecked) {
    return isHealthDataAvailable;
  }

  try {
    isHealthDataAvailable = await isHealthDataAvailableAsync();
  } catch {
    isHealthDataAvailable = false;
  }

  availabilityChecked = true;
  return isHealthDataAvailable;
}

async function ensureWorkoutAuthorization() {
  if (!(await checkHealthDataAvailability())) {
    return false;
  }

  if (hasWorkoutWriteAuthorization()) {
    return true;
  }

  if (authorizationRequested) {
    return false;
  }

  authorizationRequested = true;

  try {
    const granted = await requestAuthorization({
      toShare: [WorkoutTypeIdentifier]
    });

    if (!granted) {
      return false;
    }

    return hasWorkoutWriteAuthorization();
  } catch {
    return false;
  }
}

export async function syncSessionToAppleHealth(session: HeatSessionLog): Promise<AppleHealthSyncResult> {
  if (Platform.OS !== 'ios') {
    return 'skipped-platform';
  }

  if (!(await checkHealthDataAvailability())) {
    return 'skipped-unavailable';
  }

  if (!(await ensureWorkoutAuthorization())) {
    return 'skipped-unauthorized';
  }

  const startedAt = toDate(session.startedAt);
  const completedAt = toDate(session.completedAt);
  if (!startedAt || !completedAt || completedAt.getTime() <= startedAt.getTime()) {
    return 'skipped-invalid-session';
  }

  try {
    await saveWorkoutSample(
      WorkoutActivityType.functionalStrengthTraining,
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
