export function routeAfterGameplayNotification(isCardFlipped: boolean, stayOnLaneAfterAnswer = false) {
  if (stayOnLaneAfterAnswer) return '/game/lane';
  return isCardFlipped ? '/game/lane' : '/game';
}
