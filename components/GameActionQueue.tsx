import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { ShieldAlert } from 'lucide-react-native';
import { ConfirmModal } from '@/components/ConfirmModal';
import { LaneModal } from '@/components/LaneModal';
import { LaneProgress } from '@/components/LaneProgressBadge';
import { TurnNotice } from '@/context/GameContext';
import { logGameAction } from '@/lib/gameDiagnostics';

type ActionKind = 'room-exit' | 'lane-result' | 'turn-notice' | 'steal-decision' | 'inactivity';

type GameActionQueueProps = {
  activeStealerName?: string;
  hasPendingLaneAnimation: boolean;
  inactivityWarningVisible: boolean;
  inactivityWarningCount?: number;
  inactivitySecondsRemaining?: number | null;
  isBs: boolean;
  laneFailureMessage: string;
  laneResult: 'success' | 'failure' | 'steal' | null;
  laneResultProgress?: LaneProgress;
  laneStealMessage: string;
  laneSuccessMessage: string;
  lastResultCardScore?: number | null;
  onInactivityComplete: () => void;
  onLaneResultComplete: () => void;
  onRoomExitComplete: () => void;
  onStealChoice: (accept: boolean) => void;
  onTurnNoticeComplete: () => void;
  stealDecisionVisible: boolean;
  turnNotice?: TurnNotice;
  roomExitReason?: string | null;
};

export function GameActionQueue({
  activeStealerName,
  hasPendingLaneAnimation,
  inactivityWarningVisible,
  inactivityWarningCount = 0,
  inactivitySecondsRemaining = null,
  isBs,
  laneFailureMessage,
  laneResult,
  laneResultProgress,
  laneStealMessage,
  laneSuccessMessage,
  lastResultCardScore,
  onInactivityComplete,
  onLaneResultComplete,
  onRoomExitComplete,
  onStealChoice,
  onTurnNoticeComplete,
  stealDecisionVisible,
  turnNotice,
  roomExitReason,
}: GameActionQueueProps) {
  const [activeAction, setActiveAction] = useState<ActionKind | null>(null);
  const [handledStealOffer, setHandledStealOffer] = useState(false);
  const laneAvailable = laneResult !== null;
  const turnAvailable = Boolean(turnNotice && !hasPendingLaneAnimation);
  const stealAvailable = stealDecisionVisible && !handledStealOffer && !hasPendingLaneAnimation;
  const inactivityAvailable = inactivityWarningVisible && !hasPendingLaneAnimation;
  const roomExitAvailable = Boolean(roomExitReason);

  useEffect(() => {
    if (!stealDecisionVisible) setHandledStealOffer(false);
  }, [stealDecisionVisible]);

  useEffect(() => {
    logGameAction('action-queue.state', {
      activeAction,
      hasPendingLaneAnimation,
      inactivityAvailable,
      laneAvailable,
      stealAvailable,
      turnAvailable,
      turnNoticeType: turnNotice?.type ?? null,
      roomExitReason: roomExitReason ?? null,
    });
  }, [activeAction, hasPendingLaneAnimation, inactivityAvailable, laneAvailable, roomExitReason, stealAvailable, turnAvailable, turnNotice?.type]);

  useEffect(() => {
    if (roomExitAvailable && activeAction !== 'room-exit') {
      logGameAction('action-queue.preempt', { action: 'room-exit', previousAction: activeAction });
      setActiveAction('room-exit');
      return;
    }
    const available: Record<ActionKind, boolean> = {
      'room-exit': roomExitAvailable,
      'lane-result': laneAvailable,
      'turn-notice': turnAvailable,
      'steal-decision': stealAvailable,
      inactivity: inactivityAvailable,
    };

    if (activeAction && available[activeAction]) return;
    if (activeAction) {
      setActiveAction(null);
      return;
    }

    const next = (['room-exit', 'lane-result', 'turn-notice', 'steal-decision', 'inactivity'] as ActionKind[])
      .find((action) => available[action]);
    if (!next) return;
    logGameAction('action-queue.show', { action: next });
    setActiveAction(next);
  }, [activeAction, inactivityAvailable, laneAvailable, roomExitAvailable, stealAvailable, turnAvailable]);

  const complete = (action: ActionKind, callback: () => void) => {
    logGameAction('action-queue.complete', { action });
    if (action === 'steal-decision') setHandledStealOffer(true);
    setActiveAction(null);
    callback();
  };

  return (
    <>
      <LaneModal
        failureMessage={roomExitReason === 'player_inactive'
          ? isBs ? 'UKLONJEN SI NAKON 60 SEKUNDI NEAKTIVNOSTI' : 'YOU WERE REMOVED AFTER 60 SECONDS OF INACTIVITY'
          : roomExitReason === 'host_inactive'
            ? isBs ? 'DOMAĆIN JE BIO NEAKTIVAN. IGRA JE ZAVRŠENA' : 'THE HOST WAS INACTIVE. THE GAME HAS ENDED'
            : isBs ? 'DOMAĆIN JE NAPUSTIO SOBU. IGRA JE ZAVRŠENA' : 'THE HOST LEFT THE ROOM. THE GAME HAS ENDED'}
        failureTitle={roomExitReason === 'player_inactive'
          ? isBs ? 'UKLONJEN SI' : 'YOU WERE REMOVED'
          : isBs ? 'IGRA JE ZAVRŠENA' : 'GAME ENDED'}
        onComplete={() => complete('room-exit', onRoomExitComplete)}
        success={false}
        successMessage=""
        successTitle=""
        visible={activeAction === 'room-exit'}
      />

      <LaneModal
        failureMessage={laneFailureMessage}
        failureTitle={isBs ? 'NETAČNO' : 'INCORRECT'}
        onComplete={() => complete('lane-result', onLaneResultComplete)}
        laneProgress={laneResultProgress}
        success={laneResult !== 'failure'}
        successMessage={laneResult === 'steal' ? laneStealMessage : laneSuccessMessage}
        successTitle={laneResult === 'steal'
          ? isBs ? 'KARTA UKRADENA' : 'CARD STOLEN'
          : isBs ? 'TAČNO' : 'CORRECT'}
        score={laneResult === 'steal' && lastResultCardScore !== null
          ? lastResultCardScore
          : undefined}
        scoreLabel={isBs ? 'STOPA BIJEDE' : 'MISERY RATE'}
        visible={activeAction === 'lane-result'}
        warning={laneResult === 'steal'}
      />

      <LaneModal
        key={turnNotice?.id ?? 'no-turn-notice'}
        ending={turnNotice?.type === 'end' || turnNotice?.type === 'finish'}
        failureMessage=""
        failureTitle=""
        holding={turnNotice?.type === 'hold'}
        neutral={turnNotice?.type !== 'hold'}
        onComplete={() => complete('turn-notice', onTurnNoticeComplete)}
        success
        successMessage={turnNotice?.type === 'finish'
          ? isBs ? 'KONAČNI POREDAK JE SPREMAN' : 'YOUR FINAL STANDINGS ARE READY'
          : turnNotice?.type === 'hold'
            ? isBs
              ? `TVOJA KARTA JE PONUĐENA IGRAČU ${turnNotice.playerName ?? 'SLJEDEĆEM IGRAČU'}. SAČEKAJ ODLUKU`
              : `YOUR CARD IS OFFERED TO ${turnNotice.playerName ?? 'THE NEXT PLAYER'}. WAIT FOR THEIR DECISION`
          : turnNotice?.type === 'end'
            ? turnNotice.steal
              ? isBs
                ? `KARTA JE PONUĐENA IGRAČU ${turnNotice.playerName ?? ''} ZA KRAĐU`
                : `THE CARD IS NOW OFFERED TO ${turnNotice.playerName ?? 'THE NEXT PLAYER'} TO STEAL`
              : isBs ? 'ČEKAJ SLJEDEĆU PRILIKU' : 'WAITING FOR THE NEXT PLAYER'
            : turnNotice?.steal
              ? isBs ? 'DODIRNI KARTU I POKUŠAJ KRAĐU' : 'TAP THE CARD TO TRY TO STEAL'
              : isBs ? 'DODIRNI KARTU ZA IGRU' : 'TAP THE CARD TO PLAY'}
        successTitle={turnNotice?.type === 'finish'
          ? isBs ? 'IGRA JE ZAVRŠENA' : 'GAME FINISHED'
          : turnNotice?.type === 'hold'
            ? isBs ? 'NA \u010CEKANJU SI' : `YOU'RE ON HOLD`
          : turnNotice?.type === 'end'
            ? isBs ? 'TVOJ POTEZ JE ZAVRŠEN' : 'YOUR TURN ENDED'
            : turnNotice?.steal
              ? isBs ? 'POKU\u0160AJ KRA\u0110E' : 'YOUR STEAL ATTEMPT'
              : isBs ? 'TVOJ POTEZ JE PO\u010CEO' : 'YOUR TURN STARTED'}
        visible={activeAction === 'turn-notice'}
        warning={turnNotice?.type === 'hold'}
      />

      <ConfirmModal
        cancelLabel={isBs ? 'PRESKOČI' : 'PASS'}
        confirmLabel={isBs ? 'POKUŠAJ KRAĐU' : 'TRY TO STEAL'}
        onCancel={() => complete('steal-decision', () => onStealChoice(false))}
        onConfirm={() => complete('steal-decision', () => onStealChoice(true))}
        onRequestClose={() => complete('steal-decision', () => onStealChoice(false))}
        visible={activeAction === 'steal-decision'}
      >
        <View className="items-center" style={{ gap: 10 }}>
          <ShieldAlert size={38} color="#fbbf24" />
          <Text className="text-center text-lg font-black uppercase tracking-wider text-amber-400">
            {isBs ? 'MOGUĆNOST KRAĐE' : 'STEAL OPPORTUNITY'}
          </Text>
          <Text className="text-center text-sm leading-6 text-neutral-300">
            {isBs
              ? `${activeStealerName}, želiš li pokušati pravilno smjestiti kartu i ukrasti je?`
              : `${activeStealerName}, do you want to place the card correctly and steal it?`}
          </Text>
        </View>
      </ConfirmModal>

      <LaneModal
        bell
        failureMessage=""
        failureTitle=""
        onComplete={() => complete('inactivity', onInactivityComplete)}
        success
        successMessage={inactivityWarningCount >= 3 && inactivitySecondsRemaining !== null
          ? isBs
            ? `ODIGRAJ SADA — BIT ĆEŠ UKLONJEN ZA ${inactivitySecondsRemaining} SEKUNDI`
            : `PLAY NOW — YOU WILL BE KICKED IN ${inactivitySecondsRemaining} SECONDS`
          : isBs ? 'ODIGRAJ TRENUTNU KARTU DA SE IGRA NASTAVI' : 'PLAY THE CURRENT CARD TO KEEP THE GAME MOVING'}
        successTitle={isBs ? 'TVOJ POTEZ \u010CEKA' : 'YOUR TURN IS WAITING'}
        visible={activeAction === 'inactivity'}
        warning
      />
    </>
  );
}
