import * as Haptics from 'expo-haptics';

const CLICK_AUDIO = require('../assets/audio/click.mp3');
const SHUFFLE_AUDIO = require('../assets/audio/shuffle.mp3');
const GAME_BACKGROUND_AUDIO = require('../assets/audio/game-bg.mp3');
const LOBBY_BACKGROUND_AUDIO = require('../assets/audio/lobby.mp3');

export type SoundType = 'correct' | 'wrong' | 'victory' | 'click' | 'steal' | 'shuffle';

let audioModule: typeof import('expo-audio') | null = null;
let clickPlayer: any = null;
let shufflePlayer: any = null;
let backgroundPlayer: any = null;
let lobbyBackgroundPlayer: any = null;
let musicMuted = false;
let gameMusicActive = false;
let lobbyMusicActive = false;
let audioReadyPromise: Promise<void> | null = null;
let lastClickAt = 0;

async function ensureAudio() {
  if (audioReadyPromise) return audioReadyPromise;
  audioReadyPromise = (async () => {
    audioModule = require('expo-audio');
    await audioModule?.setIsAudioActiveAsync?.(true);
    await audioModule?.setAudioModeAsync({ interruptionMode: 'mixWithOthers', playsInSilentMode: true });
  })().catch(() => {
    audioModule = null;
    audioReadyPromise = null;
  });
  return audioReadyPromise;
}

async function effectPlayer(type: 'click' | 'shuffle') {
  await ensureAudio();
  if (!audioModule) return null;
  if (type === 'click') {
    clickPlayer ??= audioModule.createAudioPlayer(CLICK_AUDIO, { keepAudioSessionActive: true });
    return clickPlayer;
  }
  shufflePlayer ??= audioModule.createAudioPlayer(SHUFFLE_AUDIO, { keepAudioSessionActive: true });
  return shufflePlayer;
}

async function playEffect(type: 'click' | 'shuffle') {
  if (type === 'click') {
    const now = Date.now();
    if (now - lastClickAt < 80) return;
    lastClickAt = now;
  }
  try {
    const player = await effectPlayer(type);
    if (!player) return;
    await player.seekTo?.(0);
    player.play?.();
  } catch {
    // Audio must never block interactions.
  }
}

async function syncBackgroundMusic() {
  try {
    await ensureAudio();
    if (!audioModule) return;
    backgroundPlayer ??= audioModule.createAudioPlayer(GAME_BACKGROUND_AUDIO, { keepAudioSessionActive: true });
    lobbyBackgroundPlayer ??= audioModule.createAudioPlayer(LOBBY_BACKGROUND_AUDIO, { keepAudioSessionActive: true });
    backgroundPlayer.loop = true;
    backgroundPlayer.volume = 0.22;
    lobbyBackgroundPlayer.loop = true;
    lobbyBackgroundPlayer.volume = 0.22;
    if (gameMusicActive && !musicMuted) backgroundPlayer.play?.();
    else backgroundPlayer.pause?.();
    if (lobbyMusicActive && !gameMusicActive && !musicMuted) lobbyBackgroundPlayer.play?.();
    else lobbyBackgroundPlayer.pause?.();
  } catch {
    // Game remains playable if audio is unavailable.
  }
}

export function setGameMusicMuted(value: boolean) {
  musicMuted = value;
  void syncBackgroundMusic();
}

export function setGameMusicActive(value: boolean) {
  gameMusicActive = value;
  void syncBackgroundMusic();
}

export function setLobbyMusicActive(value: boolean) {
  lobbyMusicActive = value;
  void syncBackgroundMusic();
}

export function playHaptic(type: SoundType = 'click') {
  try {
    if (type === 'correct' || type === 'victory') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (type === 'wrong') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else if (type === 'steal' || type === 'shuffle') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else void Haptics.selectionAsync();
  } catch {
    // Haptics are optional.
  }
}

export function playSound(type: SoundType) {
  if (type === 'click' || type === 'shuffle') void playEffect(type);
  playHaptic(type);
}
