import assert from 'node:assert/strict';
import test from 'node:test';
import { appliedStateVersion, initialAppliedStateVersion, shouldApplyServerState } from '../lib/realtimeStateRevision.ts';

test('accepts the first snapshot and newer event revisions', () => {
  assert.equal(shouldApplyServerState(initialAppliedStateVersion, 6280, '2026-07-20T10:03:41.000Z'), true);
  const current = appliedStateVersion(6280, '2026-07-20T10:03:41.000Z');
  assert.equal(shouldApplyServerState(current, 6283, '2026-07-20T10:03:42.000Z'), true);
});

test('rejects an older heartbeat that arrives after a newer pusher update', () => {
  const pusher = appliedStateVersion(6283, '2026-07-20T10:03:42.500Z');
  assert.equal(shouldApplyServerState(pusher, 6280, '2026-07-20T10:03:41.900Z'), false);
});

test('uses server send time to order state changes with the same event revision', () => {
  const current = appliedStateVersion(6283, '2026-07-20T10:03:45.000Z');
  assert.equal(shouldApplyServerState(current, 6283, '2026-07-20T10:03:44.000Z'), false);
  assert.equal(shouldApplyServerState(current, 6283, '2026-07-20T10:03:46.000Z'), true);
});
