import { Audio } from 'expo-av';

export type HeatAudioCue =
  | { id: number; kind: 'start' }
  | { id: number; kind: 'countdown'; seconds: 1 | 2 | 3 }
  | { id: number; kind: 'phase-change'; phase: 'work' | 'rest' }
  | { id: number; kind: 'finish' };

let sound: Audio.Sound | null = null;
let initialized = false;

async function ensureReady() {
  if (!initialized) {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false
    });
    initialized = true;
  }

  if (sound) {
    return sound;
  }

  const nextSound = new Audio.Sound();
  await nextSound.loadAsync(require('../../../../assets/sounds/beep.wav'));
  sound = nextSound;
  return sound;
}

async function playBeep() {
  const loaded = await ensureReady();
  const status = await loaded.getStatusAsync();
  if (status.isLoaded && status.isPlaying) {
    await loaded.stopAsync();
  }
  await loaded.setPositionAsync(0);
  await loaded.playAsync();
}

export async function playCue(_: HeatAudioCue) {
  try {
    await playBeep();
  } catch {
    // Keep timer flow running even when audio playback fails.
  }
}

export async function releaseCueAudio() {
  if (!sound) {
    return;
  }
  await sound.unloadAsync();
  sound = null;
}
