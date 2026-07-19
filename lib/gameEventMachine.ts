import type { ApiGameEvent } from '@/lib/api';

export type GameEventMachineState = {
  current: ApiGameEvent | null;
  pending: ApiGameEvent[];
};

export type GameEventMachineAction =
  | { type: 'INGEST'; events: ApiGameEvent[] }
  | { type: 'COMPLETE'; eventId: number }
  | { type: 'RESET' };

export const initialGameEventMachineState: GameEventMachineState = {
  current: null,
  pending: [],
};

function promote(events: ApiGameEvent[]): GameEventMachineState {
  const [current = null, ...pending] = events;
  return { current, pending };
}

export function gameEventMachineReducer(
  state: GameEventMachineState,
  action: GameEventMachineAction,
): GameEventMachineState {
  if (action.type === 'RESET') return initialGameEventMachineState;

  if (action.type === 'INGEST') {
    const knownIds = new Set([
      state.current?.id,
      ...state.pending.map((event) => event.id),
    ].filter((id): id is number => id !== undefined));
    const incoming = action.events.filter((event) =>
      !knownIds.has(event.id) && (!state.current || event.id > state.current.id)
    );
    if (incoming.length === 0) return state;
    const pending = [...state.pending, ...incoming].sort((a, b) => a.id - b.id);
    return state.current ? { current: state.current, pending } : promote(pending);
  }

  if (!state.current || state.current.id !== action.eventId) return state;
  return promote(state.pending);
}
