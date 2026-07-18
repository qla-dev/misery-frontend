import GameBoard from '@/components/GameBoard';
import { GameCountdown } from '@/components/GameCountdown';
import { useGame } from '@/context/GameContext';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export default function GameScreen() {
  const { session, language, setIsGameCountingDown } = useGame();
  const [isCountingDown, setIsCountingDown] = useState(true);

  if (!session) {
    return <Redirect href="/" />;
  }

  return (
    <View style={styles.root}>
      <GameBoard
        mode={session.mode}
        initialPlayers={session.players}
        targetScore={session.targetScore}
        deckType={session.deckType}
        gameId={session.gameId}
        userId={session.userId}
      />
      {isCountingDown ? (
        <View style={styles.countdown}>
          <GameCountdown
            bottomLabel={language === 'bs' ? 'SPREMI SE ZA PATNJU' : 'GET READY FOR MISERY'}
            finalLabel={language === 'bs' ? 'KRENI' : 'GO'}
            onComplete={() => {
              setIsCountingDown(false);
              setIsGameCountingDown(false);
            }}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  countdown: { bottom: 0, elevation: 20000, left: 0, position: 'absolute', right: 0, top: 0, zIndex: 20000 },
  root: { flex: 1 },
});
