import type { ApiGameEvent } from '@/lib/api';

type LocalMoveResponseEventSelection = {
  highestObservedEventId: number | null;
  relevantEvents: ApiGameEvent[];
};

export function selectLocalMoveResponseEvents(
  events: ApiGameEvent[],
  previousEventId: number | null,
  userId: number,
  cardId: string,
): LocalMoveResponseEventSelection {
  const ordered = [...events].sort((a, b) => a.id - b.id);
  const matchingResult = [...ordered].reverse().find((event) =>
    event.type === 'MOVE_RESULT' &&
    Number(event.payload?.player_id) === Number(userId) &&
    String(event.payload?.card_id ?? '') === cardId
  );
  const eventFloor = previousEventId ?? (matchingResult ? matchingResult.id - 1 : null);
  if (eventFloor === null) {
    return { highestObservedEventId: previousEventId, relevantEvents: [] };
  }
  const unseen = ordered.filter((event) => event.id > eventFloor);
  const highestObservedEventId = ordered.reduce<number | null>(
    (maximum, event) => maximum === null ? event.id : Math.max(maximum, event.id),
    previousEventId,
  );

  return {
    highestObservedEventId,
    relevantEvents: unseen.filter((event) =>
      event.target_user_id === null || Number(event.target_user_id) === Number(userId)
    ),
  };
}
