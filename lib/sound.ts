import * as Haptics from 'expo-haptics';

const CLICK_AUDIO = require('../assets/audio/click.mp3');
const SHUFFLE_AUDIO = require('../assets/audio/shuffle.mp3');
const GAME_BACKGROUND_AUDIO = require('../assets/audio/game-bg.mp3');
const LOBBY_BACKGROUND_AUDIO = require('../assets/audio/lobby.mp3');
const BELL_AUDIO = require('../assets/audio/bell-ring.mp3');
const APPLAUSE_AUDIO = require('../assets/audio/applause.mp3');
const COUNTDOWN_AUDIO = require('../assets/audio/connect.mp3');

export type SoundType = 'correct' | 'wrong' | 'victory' | 'click' | 'steal' | 'shuffle' | 'bell' | 'applause' | 'countdown';

let audioModule: typeof import('expo-audio') | null = null;
let clickPlayer: any = null;
let shufflePlayer: any = null;
let bellPlayer: any = null;
let applausePlayer: any = null;
let countdownPlayer: any = null;
let backgroundPlayer: any = null;
let lobbyBackgroundPlayer: any = null;
let musicMuted = false;
let gameMusicActive = false;
let lobbyMusicActive = false;
let lockScreenPlayer: any = null;
let audioReadyPromise: Promise<void> | null = null;
let lastClickAt = 0;

async function ensureAudio() {
  if (audioReadyPromise) return audioReadyPromise;
  audioReadyPromise = (async () => {
    audioModule = require('expo-audio');
    await audioModule?.setIsAudioActiveAsync?.(true);
    await audioModule?.setAudioModeAsync({
      interruptionMode: 'doNotMix',
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    });
  })().catch(() => {
    audioModule = null;
    audioReadyPromise = null;
  });
  return audioReadyPromise;
}

function syncLockScreenPlayer(player: any, title?: string) {
  if (lockScreenPlayer === player) return;
  try {
    lockScreenPlayer?.setActiveForLockScreen?.(false);
    lockScreenPlayer = player;
    lockScreenPlayer?.setActiveForLockScreen?.(
      true,
      {
        albumTitle: 'Misery Meter',
        artist: 'Misery Meter',
        title: title ?? 'Background Music',
      },
      {
        isLiveStream: true,
        showSeekBackward: false,
        showSeekForward: false,
      },
    );
  } catch {
    // Lock-screen media controls are unavailable on web and some development clients.
  }
}

async function effectPlayer(type: 'click' | 'shuffle' | 'bell' | 'applause' | 'countdown') {
  await ensureAudio();
  if (!audioModule) return null;
  if (type === 'click') {
    clickPlayer ??= audioModule.createAudioPlayer(CLICK_AUDIO, { keepAudioSessionActive: true });
    return clickPlayer;
  }
  if (type === 'shuffle') {
    shufflePlayer ??= audioModule.createAudioPlayer(SHUFFLE_AUDIO, { keepAudioSessionActive: true });
    return shufflePlayer;
  }
  if (type === 'bell') {
    bellPlayer ??= audioModule.createAudioPlayer(BELL_AUDIO, { keepAudioSessionActive: true });
    return bellPlayer;
  }
  if (type === 'countdown') {
    countdownPlayer ??= audioModule.createAudioPlayer(COUNTDOWN_AUDIO, { keepAudioSessionActive: true });
    return countdownPlayer;
  }
  applausePlayer ??= audioModule.createAudioPlayer(APPLAUSE_AUDIO, { keepAudioSessionActive: true });
  return applausePlayer;
}

async function playEffect(type: 'click' | 'shuffle' | 'bell' | 'applause' | 'countdown') {
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
    const shouldPlayGameMusic = gameMusicActive && !musicMuted;
    const shouldPlayLobbyMusic = lobbyMusicActive && !gameMusicActive && !musicMuted;
    syncLockScreenPlayer(
      shouldPlayGameMusic ? backgroundPlayer : shouldPlayLobbyMusic ? lobbyBackgroundPlayer : null,
      shouldPlayGameMusic ? 'Game Music' : 'Lobby Music',
    );
    if (shouldPlayGameMusic) {
      if (!backgroundPlayer.playing) backgroundPlayer.play?.();
    } else if (backgroundPlayer.playing) {
      backgroundPlayer.pause?.();
    }
    if (shouldPlayLobbyMusic) {
      if (!lobbyBackgroundPlayer.playing) lobbyBackgroundPlayer.play?.();
    } else if (lobbyBackgroundPlayer.playing) {
      lobbyBackgroundPlayer.pause?.();
    }
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
    if (type === 'correct' || type === 'victory' || type === 'applause') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (type === 'wrong') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    else if (type === 'bell') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    else if (type === 'steal' || type === 'shuffle') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else void Haptics.selectionAsync();
  } catch {
    // Haptics are optional.
  }
}

export function playSound(type: SoundType) {
  if (type === 'click' || type === 'shuffle' || type === 'bell' || type === 'applause' || type === 'countdown') void playEffect(type);
  playHaptic(type);
}

export function playClickSound() {
  void playEffect('click');
}
