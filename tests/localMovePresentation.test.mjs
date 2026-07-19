import test from 'node:test';
import assert from 'node:assert/strict';
import { canOfferLaneInsertion, insertionAnimationTarget, LANE_CARD_HEIGHT, LANE_CARD_SUBTITLE_LINES, LANE_CARD_TITLE_LINES, localMovePresentationPlan, shouldKeepSelectedInputMounted, shouldKeepTopCardVisible, shouldReleaseLaneLockOnCardFlip } from '../lib/localMovePresentation.ts';

test('correct input shows one overlay before score reveal and lane clamp', () => {
  assert.deepEqual(localMovePresentationPlan(true, false), {
    result: 'success',
    steps: [
      'input',
      'previous-insert-marker.clear',
      'result-overlay.show',
      'selected-input.remains-mounted-under-overlay',
      'selected-input.local-color',
      'server-confirm',
      'result-overlay.complete',
      'navigation.lane.pin-after-answer',
      'score-reveal',
      'insert-input.fade-out-complete',
      'server-confirm-may-arrive-before-or-after-fade',
      'top-card.remains-visible-through-clamp',
      'lane-clamp',
      'inserted-card.pop-and-content-nudge',
      'insert-slots.lock-until-next-local-action',
      'navigation-pin.separate-from-input-lock',
      'inputs.unlock-only-when-card-flips',
      'game-master.until-turn-ended',
    ],
  });
});

test('wrong input completes its overlay without inserting the card', () => {
  assert.deepEqual(localMovePresentationPlan(false, false), {
    result: 'failure',
    steps: [
      'input',
      'previous-insert-marker.clear',
      'result-overlay.show',
      'selected-input.remains-mounted-under-overlay',
      'selected-input.local-color',
      'server-confirm',
      'result-overlay.complete',
      'navigation.lane.pin-after-answer',
      'score-reveal',
      'insert-input.fade-out-complete',
      'server-confirm-may-arrive-before-or-after-fade',
      'top-card.remains-visible-through-clamp',
      'lane-no-insert',
      'no-card-pop',
      'insert-slots.lock-until-next-local-action',
      'navigation-pin.separate-from-input-lock',
      'inputs.unlock-only-when-card-flips',
      'game-master.until-next-action',
    ],
  });
});

test('successful steal uses the same single-overlay clamp lifecycle', () => {
  const plan = localMovePresentationPlan(true, true);
  assert.equal(plan.result, 'steal');
  assert.equal(plan.steps.filter((step) => step === 'result-overlay.show').length, 1);
  assert.ok(plan.steps.indexOf('result-overlay.complete') < plan.steps.indexOf('lane-clamp'));
  assert.equal(plan.steps.includes('applause'), false);
});

test('a correct result cannot hide the top card before it is actually inserted', () => {
  assert.equal(shouldKeepTopCardVisible('card-9', null, false), true);
  assert.equal(shouldKeepTopCardVisible('card-9', 'older-card', false), true);
  assert.equal(shouldKeepTopCardVisible('card-9', 'card-9', false), true);
  assert.equal(shouldKeepTopCardVisible('card-9', 'card-9', true), true);
  assert.equal(shouldKeepTopCardVisible(null, 'card-9', true), false);
});

test('insert animation targets only the newly submitted card, never the previous first card', () => {
  assert.deepEqual(insertionAnimationTarget('old-first-card', 'new-card'), {
    beforeOverlay: null,
    afterOverlay: 'new-card',
    staleTargetWasCleared: true,
  });
});

test('insert slots cannot reappear after answering and clamping the same card', () => {
  assert.equal(canOfferLaneInsertion(true, true), false);
  assert.equal(canOfferLaneInsertion(true, false), true);
  assert.equal(canOfferLaneInsertion(false, false), false);
});

test('the input fully fades before the new card pops in and nudges lane content', () => {
  const steps = localMovePresentationPlan(true, false).steps;
  assert.ok(steps.indexOf('insert-input.fade-out-complete') < steps.indexOf('lane-clamp'));
  assert.ok(steps.indexOf('lane-clamp') < steps.indexOf('inserted-card.pop-and-content-nudge'));
});

test('every lane card, including the retained top card, uses the fixed two-by-two layout', () => {
  assert.equal(LANE_CARD_HEIGHT, 88);
  assert.equal(LANE_CARD_TITLE_LINES, 2);
  assert.equal(LANE_CARD_SUBTITLE_LINES, 2);
});

test('only the clicked input remains mounted through overlay and owns the fade', () => {
  assert.equal(shouldKeepSelectedInputMounted(2, 2), true);
  assert.equal(shouldKeepSelectedInputMounted(2, 1), false);
  assert.equal(shouldKeepSelectedInputMounted(null, 2), false);
  const steps = localMovePresentationPlan(true, false).steps;
  assert.ok(steps.indexOf('selected-input.remains-mounted-under-overlay') < steps.indexOf('insert-input.fade-out-complete'));
});

test('lane inputs unlock only when the actionable card is flipped', () => {
  assert.equal(shouldReleaseLaneLockOnCardFlip(false), false);
  assert.equal(shouldReleaseLaneLockOnCardFlip(true), true);
});

test('a failed steal placement uses the same wrong-answer presentation path', () => {
  assert.deepEqual(localMovePresentationPlan(false, true), localMovePresentationPlan(false, false));
});
