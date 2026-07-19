import test from 'node:test';
import assert from 'node:assert/strict';
import { routeAfterGameplayNotification } from '../lib/gameNavigation.ts';

test('a gameplay notification returns a flipped card directly to lane', () => {
  assert.equal(routeAfterGameplayNotification(true), '/game/lane');
});

test('a gameplay notification returns to card only when it is not flipped', () => {
  assert.equal(routeAfterGameplayNotification(false), '/game');
});

test('answering on lane pins every following notification to lane', () => {
  assert.equal(routeAfterGameplayNotification(false, true), '/game/lane');
  assert.equal(routeAfterGameplayNotification(true, true), '/game/lane');
});

test('game finished always opens final standings even when lane was pinned', () => {
  assert.equal(routeAfterGameplayNotification(false, true, true), '/game');
  assert.equal(routeAfterGameplayNotification(true, true, true), '/game');
});
