export const GAME_COUNTDOWN_FAILSAFE_MS = 6_500;

export function shouldForceReleaseCountdown(startedAt: number, now: number, isCountingDown: boolean) {
  return isCountingDown && now - startedAt >= GAME_COUNTDOWN_FAILSAFE_MS;
}

export function countdownForceReleaseDelay(startedAt: number, now: number) {
  return Math.max(0, GAME_COUNTDOWN_FAILSAFE_MS - (now - startedAt));
}
