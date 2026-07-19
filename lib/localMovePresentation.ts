export type LocalMoveResult = 'success' | 'failure' | 'steal';
export const LANE_CARD_HEIGHT = 88;
export const LANE_CARD_TITLE_LINES = 2;
export const LANE_CARD_SUBTITLE_LINES = 2;

export function shouldKeepTopCardVisible(
  drawnCardId: string | null,
  _lastInsertedCardId: string | null,
  _insertedCardIsInRenderedLane = false,
) {
  // Clamping adds a lane copy; it must never remove the drawn-card presentation.
  // That top card changes only when authoritative state supplies the next card.
  return drawnCardId !== null;
}

export function insertionAnimationTarget(previousInsertedCardId: string | null, submittedCardId: string) {
  return {
    beforeOverlay: null,
    afterOverlay: submittedCardId,
    staleTargetWasCleared: previousInsertedCardId !== null,
  } as const;
}

export function canOfferLaneInsertion(baseCanPlaceCard: boolean, laneInputsLockedAfterAnswer: boolean) {
  return baseCanPlaceCard && !laneInputsLockedAfterAnswer;
}

export function shouldKeepSelectedInputMounted(selectedSlotIndex: number | null, slotIndex: number) {
  return selectedSlotIndex === slotIndex;
}

export function shouldReleaseLaneLockOnCardFlip(flipped: boolean) {
  return flipped;
}

export function localMovePresentationPlan(correct: boolean, isSteal: boolean) {
  const result: LocalMoveResult = correct ? (isSteal ? 'steal' : 'success') : 'failure';
  return {
    result,
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
      correct ? 'lane-clamp' : 'lane-no-insert',
      correct ? 'inserted-card.pop-and-content-nudge' : 'no-card-pop',
      'insert-slots.lock-until-next-local-action',
      'navigation-pin.separate-from-input-lock',
      'inputs.unlock-only-when-card-flips',
      correct ? 'game-master.until-turn-ended' : 'game-master.until-next-action',
    ] as const,
  };
}
