import GameBoard from '@/components/GameBoard';
import { GameCountdown } from '@/components/GameCountdown';
import { useGame } from '@/context/GameContext';
import { Redirect } from 'expo-router';
import { useState } from 'react';

export default function GameScreen() {
  const { session, language, setIsGameCountingDown } = useGame();
  const [isCountingDown, setIsCountingDown] = useState(true);

  if (!session) {
    return <Redirect href="/" />;
  }

  if (isCountingDown) {
    return (
      <GameCountdown
        bottomLabel={language === 'bs' ? 'SPREMI SE ZA NESREĆU' : 'GET READY FOR MISERY'}
        finalLabel={language === 'bs' ? 'KRENI' : 'GO'}
        onComplete={() => {
          setIsCountingDown(false);
          setIsGameCountingDown(false);
        }}
      />
    );
  }

  return (
    <>
      <GameBoard
        mode={session.mode}
        initialPlayers={session.players}
        targetScore={session.targetScore}
        deckType={session.deckType}
      />
    </>
  );
}
