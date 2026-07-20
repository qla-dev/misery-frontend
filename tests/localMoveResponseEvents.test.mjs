import assert from 'node:assert/strict';
import test from 'node:test';
import { selectLocalMoveResponseEvents } from '../lib/localMoveResponseEvents.ts';

function event(id, type, targetUserId, payload = {}) {
  return {
    id,
    type,
    target_user_id: targetUserId,
    payload,
    created_at: new Date(0).toISOString(),
  };
}

test('an incorrect local move queues its result and hold directly from the response', () => {
  const selection = selectLocalMoveResponseEvents([
    event(10, 'TURN_STARTED', 1),
    event(11, 'MOVE_RESULT', null, { player_id: 1, card_id: 55, correct: false }),
    event(12, 'TURN_HOLD', 1, { player_id: 2, player_name: 'Amina', card_id: 55 }),
    event(13, 'STEAL_OFFERED', 2, { player_id: 2, card_id: 55 }),
  ], 10, 1, '55');

  assert.equal(selection.highestObservedEventId, 13);
  assert.deepEqual(selection.relevantEvents.map((item) => item.type), ['MOVE_RESULT', 'TURN_HOLD']);
});

test('the first native move can recover its response sequence without an event cursor', () => {
  const selection = selectLocalMoveResponseEvents([
    event(20, 'TURN_STARTED', 1),
    event(21, 'MOVE_RESULT', null, { player_id: 1, card_id: 99, correct: false }),
    event(22, 'TURN_HOLD', 1, { player_id: 2, card_id: 99 }),
    event(23, 'STEAL_OFFERED', 2, { player_id: 2, card_id: 99 }),
  ], null, 1, '99');

  assert.deepEqual(selection.relevantEvents.map((item) => item.id), [21, 22]);
});

test('events already observed by polling are not queued twice', () => {
  const selection = selectLocalMoveResponseEvents([
    event(31, 'MOVE_RESULT', null, { player_id: 1, card_id: 77, correct: false }),
    event(32, 'TURN_HOLD', 1, { player_id: 2, card_id: 77 }),
  ], 32, 1, '77');

  assert.deepEqual(selection.relevantEvents, []);
});

test('a response without the submitted move leaves an uninitialized cursor untouched', () => {
  const selection = selectLocalMoveResponseEvents([
    event(40, 'TURN_STARTED', 2),
  ], null, 1, '88');

  assert.equal(selection.highestObservedEventId, null);
  assert.deepEqual(selection.relevantEvents, []);
});
