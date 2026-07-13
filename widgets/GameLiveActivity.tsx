import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  activityBackgroundTint,
  font,
  foregroundStyle,
  frame,
  padding,
} from '@expo/ui/swift-ui/modifiers';
import { createLiveActivity, type LiveActivityEnvironment } from 'expo-widgets';

export type GameLiveActivityProps = {
  cardTitle: string;
  inactive: boolean;
  isMyTurn: boolean;
  laneCount: number;
  laneSummary: string;
  playerName: string;
  status: 'playing' | 'finished';
};

const GameLiveActivity = (
  props: GameLiveActivityProps,
  environment: LiveActivityEnvironment
) => {
  'widget';

  const accent = props.inactive ? '#FACC15' : '#FBBF24';
  const primary = environment.isLuminanceReduced ? '#D4D4D4' : '#FFFFFF';
  const secondary = environment.isLuminanceReduced ? '#A3A3A3' : '#D4D4D4';
  const statusText = props.status === 'finished'
    ? 'GAME FINISHED'
    : props.inactive
      ? 'YOUR TURN IS WAITING'
      : props.isMyTurn
        ? 'YOUR TURN'
        : `${props.playerName} IS PLAYING`;

  return {
    banner: (
      <VStack
        spacing={8}
        modifiers={[
          padding({ all: 14 }),
          activityBackgroundTint('#0A0A0A'),
        ]}
      >
        <HStack spacing={7}>
          <Image systemName={props.inactive ? 'bell.badge.fill' : 'bolt.fill'} color={accent} />
          <Text modifiers={[font({ size: 12, weight: 'bold' }), foregroundStyle(accent)]}>
            MISERY METER
          </Text>
          <Spacer />
          <Text modifiers={[font({ size: 11, weight: 'bold' }), foregroundStyle(accent)]}>
            {statusText}
          </Text>
        </HStack>
        <HStack spacing={12}>
          <VStack spacing={3} modifiers={[frame({ maxWidth: 120, alignment: 'leading' })]}>
            <Text modifiers={[font({ size: 10, weight: 'semibold' }), foregroundStyle(secondary)]}>
              LANE · {props.laneCount} CARDS
            </Text>
            <Text modifiers={[font({ size: 14, weight: 'bold' }), foregroundStyle(primary)]}>
              {props.laneSummary}
            </Text>
          </VStack>
          <VStack spacing={3} modifiers={[frame({ maxWidth: 210, alignment: 'leading' })]}>
            <Text modifiers={[font({ size: 10, weight: 'semibold' }), foregroundStyle(secondary)]}>
              CURRENT CARD
            </Text>
            <Text modifiers={[font({ size: 14, weight: 'bold' }), foregroundStyle(primary)]}>
              {props.cardTitle}
            </Text>
          </VStack>
        </HStack>
      </VStack>
    ),
    bannerSmall: (
      <HStack spacing={8} modifiers={[padding({ all: 10 }), activityBackgroundTint('#0A0A0A')]}>
        <Image systemName={props.inactive ? 'bell.badge.fill' : 'bolt.fill'} color={accent} />
        <VStack spacing={2}>
          <Text modifiers={[font({ size: 12, weight: 'bold' }), foregroundStyle(accent)]}>
            {statusText}
          </Text>
          <Text modifiers={[font({ size: 11 }), foregroundStyle(primary)]}>{props.cardTitle}</Text>
        </VStack>
      </HStack>
    ),
    compactLeading: <Image systemName={props.inactive ? 'bell.fill' : 'bolt.fill'} color={accent} />,
    compactTrailing: (
      <Text modifiers={[font({ size: 12, weight: 'bold' }), foregroundStyle(accent)]}>
        {props.laneCount}
      </Text>
    ),
    minimal: <Image systemName={props.inactive ? 'bell.fill' : 'bolt.fill'} color={accent} />,
    expandedLeading: (
      <VStack spacing={3} modifiers={[padding({ all: 10 })]}>
        <Image systemName={props.inactive ? 'bell.badge.fill' : 'bolt.fill'} color={accent} />
        <Text modifiers={[font({ size: 11, weight: 'bold' }), foregroundStyle(accent)]}>
          {props.playerName}
        </Text>
      </VStack>
    ),
    expandedTrailing: (
      <VStack spacing={2} modifiers={[padding({ all: 10 })]}>
        <Text modifiers={[font({ size: 20, weight: 'bold' }), foregroundStyle(accent)]}>
          {props.laneCount}
        </Text>
        <Text modifiers={[font({ size: 10 }), foregroundStyle(secondary)]}>CARDS</Text>
      </VStack>
    ),
    expandedBottom: (
      <VStack spacing={4} modifiers={[padding({ all: 10 })]}>
        <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(accent)]}>
          {statusText}
        </Text>
        <Text modifiers={[font({ size: 13, weight: 'bold' }), foregroundStyle(primary)]}>
          {props.cardTitle}
        </Text>
        <Text modifiers={[font({ size: 11 }), foregroundStyle(secondary)]}>{props.laneSummary}</Text>
      </VStack>
    ),
  };
};

export default createLiveActivity<GameLiveActivityProps>('MiseryGameActivity', GameLiveActivity);
