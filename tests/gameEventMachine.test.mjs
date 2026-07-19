import assert from 'node:assert/strict';
import test from 'node:test';
import { gameEventMachineReducer, initialGameEventMachineState } from '../lib/gameEventMachine.ts';

function event(id, type) {
  return { id, type, target_user_id: null, payload: {}, created_at: new Date(0).toISOString() };
}

test('holds the current event until that exact presentation completes', () => {
  const ingested = gameEventMachineReducer(initialGameEventMachineState, {
    type: 'INGEST',
    events: [event(10, 'MOVE_RESULT'), event(11, 'STEAL_OFFERED')],
  });
  assert.equal(ingested.current?.id, 10);
  assert.deepEqual(ingested.pending.map((item) => item.id), [11]);
  assert.equal(gameEventMachineReducer(ingested, { type: 'COMPLETE', eventId: 11 }), ingested);
  const completed = gameEventMachineReducer(ingested, { type: 'COMPLETE', eventId: 10 });
  assert.equal(completed.current?.id, 11);
});

test('deduplicates realtime and polling copies and preserves server id order', () => {
  const first = gameEventMachineReducer(initialGameEventMachineState, {
    type: 'INGEST',
    events: [event(22, 'TURN_STARTED'), event(20, 'MOVE_RESULT'), event(21, 'TURN_ENDED')],
  });
  const duplicate = gameEventMachineReducer(first, {
    type: 'INGEST',
    events: [event(20, 'MOVE_RESULT'), event(22, 'TURN_STARTED')],
  });
  assert.equal(duplicate, first);
  assert.equal(duplicate.current?.id, 20);
  assert.deepEqual(duplicate.pending.map((item) => item.id), [21, 22]);
});

test('a batch cannot skip result, steal, next turn, or finish events', () => {
  let state = gameEventMachineReducer(initialGameEventMachineState, {
    type: 'INGEST',
    events: [
      event(30, 'MOVE_RESULT'), event(31, 'STEAL_OFFERED'), event(32, 'MOVE_RESULT'),
      event(33, 'TURN_STARTED'), event(34, 'GAME_FINISHED'),
    ],
  });
  const consumed = [];
  while (state.current) {
    consumed.push(state.current.id);
    state = gameEventMachineReducer(state, { type: 'COMPLETE', eventId: state.current.id });
  }
  assert.deepEqual(consumed, [30, 31, 32, 33, 34]);
});

test('ingesting more events can never replace the presentation already on screen', () => {
  const presenting = gameEventMachineReducer(initialGameEventMachineState, {
    type: 'INGEST', events: [event(42, 'STEAL_OFFERED')],
  });
  const updated = gameEventMachineReducer(presenting, {
    type: 'INGEST', events: [event(41, 'MOVE_RESULT'), event(43, 'TURN_STARTED')],
  });
  assert.equal(updated.current?.id, 42);
  assert.deepEqual(updated.pending.map((item) => item.id), [43]);
});
