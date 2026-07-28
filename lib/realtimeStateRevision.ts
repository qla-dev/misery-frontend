export type AppliedStateVersion = {
  revision: number;
  sentAtMs: number;
};

export const initialAppliedStateVersion: AppliedStateVersion = {
  revision: -1,
  sentAtMs: 0,
};

export function shouldApplyServerState(
  current: AppliedStateVersion,
  incomingRevision: number,
  incomingSentAt: string | number,
): boolean {
  const sentAtMs = typeof incomingSentAt === 'number'
    ? incomingSentAt
    : Date.parse(incomingSentAt);
  const safeSentAtMs = Number.isFinite(sentAtMs) ? sentAtMs : 0;

  return incomingRevision > current.revision || (
    incomingRevision === current.revision && safeSentAtMs >= current.sentAtMs
  );
}

export function appliedStateVersion(revision: number, sentAt: string | number): AppliedStateVersion {
  const sentAtMs = typeof sentAt === 'number' ? sentAt : Date.parse(sentAt);
  return {
    revision,
    sentAtMs: Number.isFinite(sentAtMs) ? sentAtMs : 0,
  };
}
