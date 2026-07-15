export type GameDiagnosticEntry = {
  action: string;
  details: Record<string, unknown>;
  id: number;
  timestamp: number;
};

const MAX_ENTRIES = 120;
const GAME_DIAGNOSTICS_ENABLED = __DEV__;
let nextId = 0;
let entries: GameDiagnosticEntry[] = [];
const listeners = new Set<(entries: GameDiagnosticEntry[]) => void>();

export function getGameDiagnostics(): GameDiagnosticEntry[] {
  return entries;
}

export function clearGameDiagnostics(): void {
  if (!GAME_DIAGNOSTICS_ENABLED) return;
  entries = [];
  listeners.forEach((listener) => listener(entries));
}

export function logGameAction(action: string, details: Record<string, unknown> = {}): void {
  if (!GAME_DIAGNOSTICS_ENABLED) return;
  const entry = { action, details, id: ++nextId, timestamp: Date.now() };
  entries = [entry, ...entries].slice(0, MAX_ENTRIES);
  console.info(`[Game] ${action}`, details);
  listeners.forEach((listener) => listener(entries));
}

export function subscribeToGameDiagnostics(listener: (entries: GameDiagnosticEntry[]) => void): () => void {
  if (!GAME_DIAGNOSTICS_ENABLED) return () => undefined;
  listeners.add(listener);
  listener(entries);
  return () => listeners.delete(listener);
}
