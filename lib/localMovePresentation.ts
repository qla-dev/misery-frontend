export type LocalMoveResult = 'success' | 'failure' | 'steal';
export const LANE_CARD_HEIGHT = 88;
export const LANE_CARD_TITLE_LINES = 2;
export const LANE_CARD_SUBTITLE_LINES = 2;

export function shouldKeepTopCardVisible(drawnCardId: string | null, lastInsertedCardId: string | null) {
  return drawnCardId !== null && drawnCardId !== lastInsertedCardId;
}

export function insertionAnimationTarget(previousInsertedCardId: string | null, submittedCardId: string) {
  return {
    beforeOverlay: null,
    afterOverlay: submittedCardId,
    staleTargetWasCleared: previousInsertedCardId !== null,
  } as const;
}

export function canOfferLaneInsertion(baseCanPlaceCard: boolean, stayOnLaneAfterAnswer: boolean) {
  return baseCanPlaceCard && !stayOnLaneAfterAnswer;
}

export function localMovePresentationPlan(correct: boolean, isSteal: boolean) {
  const result: LocalMoveResult = correct ? (isSteal ? 'steal' : 'success') : 'failure';
  return {
    result,
    steps: [
      'input',
      'previous-insert-marker.clear',
      'result-overlay.show',
      'server-confirm',
      'result-overlay.complete',
      'navigation.lane.pin-after-answer',
      'score-reveal',
      'insert-input.fade-out-complete',
      correct ? 'lane-clamp' : 'lane-no-insert',
      correct ? 'inserted-card.pop-and-content-nudge' : 'no-card-pop',
      'insert-slots.lock-until-next-local-action',
      correct ? 'game-master.until-turn-ended' : 'game-master.until-next-action',
    ] as const,
  };
}
