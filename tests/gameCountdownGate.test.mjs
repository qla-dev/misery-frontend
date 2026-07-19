import test from 'node:test';
import assert from 'node:assert/strict';
import { countdownForceReleaseDelay, GAME_COUNTDOWN_FAILSAFE_MS, shouldForceReleaseCountdown } from '../lib/gameCountdownGate.ts';

test('queued events remain gated during the real countdown', () => {
  assert.equal(shouldForceReleaseCountdown(1_000, 1_000 + GAME_COUNTDOWN_FAILSAFE_MS - 1, true), false);
});

test('a stale global countdown can never block queued events indefinitely', () => {
  assert.equal(shouldForceReleaseCountdown(1_000, 1_000 + GAME_COUNTDOWN_FAILSAFE_MS, true), true);
  assert.equal(shouldForceReleaseCountdown(1_000, 100_000, false), false);
});

test('reasserting the stale flag does not restart the 6.5 second clock', () => {
  const gameMountedAt = 1_000;
  assert.equal(countdownForceReleaseDelay(gameMountedAt, 2_000), 5_500);
  assert.equal(countdownForceReleaseDelay(gameMountedAt, 8_000), 0);
  assert.equal(countdownForceReleaseDelay(gameMountedAt, 50_000), 0);
});
