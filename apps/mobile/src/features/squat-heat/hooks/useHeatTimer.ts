import {
  SQUAT_HEAT_PROTOCOL,
  normalizeIntervalReps,
  type HeatSessionDraft
} from '@company/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { HeatAudioCue } from '../services/soundService';

const WORK_SECONDS = SQUAT_HEAT_PROTOCOL.workSeconds;
const REST_SECONDS = SQUAT_HEAT_PROTOCOL.restSeconds;
const ROUND_COUNT = SQUAT_HEAT_PROTOCOL.rounds;
const TOTAL_SECONDS = SQUAT_HEAT_PROTOCOL.totalSeconds;
const DEFAULT_REP = SQUAT_HEAT_PROTOCOL.defaultRepCount;
const CYCLE_SECONDS = WORK_SECONDS + REST_SECONDS;

export type HeatTimerStatus = 'idle' | 'running' | 'completed';
export type HeatTimerPhase = 'work' | 'rest';

type HeatTimerFrame = {
  elapsedSeconds: number;
  remainingTotalSeconds: number;
  remainingPhaseSeconds: number;
  roundIndex: number;
  phase: HeatTimerPhase;
};

type UseHeatTimerOptions = {
  onSessionComplete?: (draft: HeatSessionDraft) => void;
};

type HeatAudioCueInput =
  | { kind: 'start' }
  | { kind: 'countdown'; seconds: 1 | 2 | 3 }
  | { kind: 'phase-change'; phase: 'work' | 'rest' }
  | { kind: 'finish' };

function createDefaultReps() {
  return Array.from({ length: ROUND_COUNT }, () => DEFAULT_REP);
}

function clampRep(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(999, Math.round(value)));
}

function buildFrame(elapsedSeconds: number): HeatTimerFrame {
  if (elapsedSeconds >= TOTAL_SECONDS) {
    return {
      elapsedSeconds: TOTAL_SECONDS,
      remainingTotalSeconds: 0,
      remainingPhaseSeconds: 0,
      roundIndex: ROUND_COUNT - 1,
      phase: 'rest'
    };
  }

  const roundIndex = Math.min(ROUND_COUNT - 1, Math.floor(elapsedSeconds / CYCLE_SECONDS));
  const secondInCycle = elapsedSeconds % CYCLE_SECONDS;
  const phase: HeatTimerPhase = secondInCycle < WORK_SECONDS ? 'work' : 'rest';
  const phaseElapsed = phase === 'work' ? secondInCycle : secondInCycle - WORK_SECONDS;
  const phaseDuration = phase === 'work' ? WORK_SECONDS : REST_SECONDS;

  return {
    elapsedSeconds,
    remainingTotalSeconds: TOTAL_SECONDS - elapsedSeconds,
    remainingPhaseSeconds: phaseDuration - phaseElapsed,
    roundIndex,
    phase
  };
}

export function useHeatTimer({ onSessionComplete }: UseHeatTimerOptions = {}) {
  const [status, setStatus] = useState<HeatTimerStatus>('idle');
  const [frame, setFrame] = useState<HeatTimerFrame>(() => buildFrame(0));
  const [intervalReps, setIntervalReps] = useState<number[]>(() => createDefaultReps());
  const [latestCue, setLatestCue] = useState<HeatAudioCue | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAtMsRef = useRef<number | null>(null);
  const startedAtIsoRef = useRef<string>('');
  const previousElapsedRef = useRef<number>(-1);
  const cueIdRef = useRef<number>(0);
  const completionSentRef = useRef<boolean>(false);
  const repsRef = useRef<number[]>(intervalReps);
  const onSessionCompleteRef = useRef(onSessionComplete);

  useEffect(() => {
    repsRef.current = intervalReps;
  }, [intervalReps]);

  useEffect(() => {
    onSessionCompleteRef.current = onSessionComplete;
  }, [onSessionComplete]);

  const clearTimer = useCallback(() => {
    if (!timerRef.current) {
      return;
    }
    clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const emitCue = useCallback((cue: HeatAudioCueInput) => {
    cueIdRef.current += 1;
    setLatestCue({
      id: cueIdRef.current,
      ...cue
    } as HeatAudioCue);
  }, []);

  const flushCompletion = useCallback(() => {
    if (completionSentRef.current) {
      return;
    }
    completionSentRef.current = true;
    setStatus('completed');
    clearTimer();
    emitCue({ kind: 'finish' });

    const startedAtMs = startedAtMsRef.current;
    if (!startedAtMs) {
      return;
    }

    const completedAt = new Date(startedAtMs + TOTAL_SECONDS * 1000).toISOString();
    onSessionCompleteRef.current?.({
      startedAt: startedAtIsoRef.current,
      completedAt,
      durationSec: TOTAL_SECONDS,
      intervalReps: normalizeIntervalReps(repsRef.current)
    });
  }, [clearTimer, emitCue]);

  const tick = useCallback(() => {
    const startedAtMs = startedAtMsRef.current;
    if (!startedAtMs) {
      return;
    }

    const elapsedSeconds = Math.min(TOTAL_SECONDS, Math.floor((Date.now() - startedAtMs) / 1000));
    if (elapsedSeconds === previousElapsedRef.current) {
      return;
    }

    const previousElapsed = previousElapsedRef.current;
    previousElapsedRef.current = elapsedSeconds;

    const nextFrame = buildFrame(elapsedSeconds);
    setFrame(nextFrame);

    if (previousElapsed === -1 && elapsedSeconds === 0) {
      emitCue({ kind: 'start' });
      return;
    }

    if (elapsedSeconds >= TOTAL_SECONDS) {
      flushCompletion();
      return;
    }

    if (previousElapsed >= 0) {
      const previousFrame = buildFrame(previousElapsed);
      if (previousFrame.phase !== nextFrame.phase) {
        if (nextFrame.phase === 'rest' && nextFrame.roundIndex > 0) {
          setIntervalReps((prev) => {
            if (prev[nextFrame.roundIndex] !== DEFAULT_REP) {
              return prev;
            }

            const next = [...prev];
            next[nextFrame.roundIndex] = prev[nextFrame.roundIndex - 1];
            repsRef.current = next;
            return next;
          });
        }

        emitCue({ kind: 'phase-change', phase: nextFrame.phase });
        return;
      }
    }

    if (nextFrame.remainingPhaseSeconds >= 1 && nextFrame.remainingPhaseSeconds <= 3) {
      emitCue({
        kind: 'countdown',
        seconds: nextFrame.remainingPhaseSeconds as 1 | 2 | 3
      });
    }
  }, [emitCue, flushCompletion]);

  const reset = useCallback(() => {
    clearTimer();
    const nextReps = createDefaultReps();
    setStatus('idle');
    setFrame(buildFrame(0));
    setLatestCue(null);
    setIntervalReps(nextReps);
    repsRef.current = nextReps;
    startedAtMsRef.current = null;
    startedAtIsoRef.current = '';
    previousElapsedRef.current = -1;
    completionSentRef.current = false;
  }, [clearTimer]);

  const start = useCallback(() => {
    clearTimer();
    const nextReps = createDefaultReps();
    const startedAtMs = Date.now();

    setStatus('running');
    setFrame(buildFrame(0));
    setLatestCue(null);
    setIntervalReps(nextReps);

    repsRef.current = nextReps;
    startedAtMsRef.current = startedAtMs;
    startedAtIsoRef.current = new Date(startedAtMs).toISOString();
    previousElapsedRef.current = -1;
    completionSentRef.current = false;

    timerRef.current = setInterval(tick, 250);
    tick();
  }, [clearTimer, tick]);

  const setRepForRound = useCallback((roundIndex: number, value: number) => {
    if (roundIndex < 0 || roundIndex >= ROUND_COUNT) {
      return;
    }

    const rep = clampRep(value);
    setIntervalReps((prev) => {
      const next = [...prev];
      next[roundIndex] = rep;
      repsRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  const editableRoundIndex =
    status === 'running' && frame.phase === 'rest' && frame.remainingTotalSeconds > 0
      ? frame.roundIndex
      : null;

  return {
    status,
    phase: frame.phase,
    roundIndex: frame.roundIndex,
    roundNumber: frame.roundIndex + 1,
    elapsedSeconds: frame.elapsedSeconds,
    remainingTotalSeconds: frame.remainingTotalSeconds,
    remainingPhaseSeconds: frame.remainingPhaseSeconds,
    editableRoundIndex,
    intervalReps,
    latestCue,
    start,
    reset,
    setRepForRound
  };
}
