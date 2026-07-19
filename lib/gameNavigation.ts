export function routeAfterGameplayNotification(
  isCardFlipped: boolean,
  stayOnLaneAfterAnswer = false,
  isGameFinished = false,
) {
  if (isGameFinished) return '/game';
  if (stayOnLaneAfterAnswer) return '/game/lane';
  return isCardFlipped ? '/game/lane' : '/game';
}
