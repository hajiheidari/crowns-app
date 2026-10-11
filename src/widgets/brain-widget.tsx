/**
 * iPhone home-screen widget (expo-widgets): this week's brain score, its level, the streak and whether today's
 * puzzle is done. The component runs in the widget's own runtime: no imports or outer values inside it, every text
 * comes in through props (already translated by the app, see `syncWidget`).
 */
import { HStack, RoundedRectangle, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { containerBackground, font, foregroundStyle, frame, padding } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

export interface BrainWidgetProps {
  title: string;
  /** Already in the player's digits (Persian digits in Persian). */
  score: string;
  level: string;
  change: string;
  streak: string;
  today: string;
  /** Points per day, oldest first, 7 values. */
  days: number[];
  rtl: boolean;
}

const BrainWidget = (props: BrainWidgetProps, environment: WidgetEnvironment) => {
  'widget';
  const dark = environment.colorScheme === 'dark';
  const ink = dark ? '#F3EEE6' : '#1F1B16';
  const soft = dark ? '#A69E92' : '#6B6358';
  const gold = dark ? '#E0BD4A' : '#C9A227';
  const bg = dark ? '#1C1A17' : '#FAF7F0';
  const align = props.rtl ? 'trailing' : 'leading';
  const max = Math.max(1, ...props.days);

  const head = (
    <VStack alignment={align} spacing={2}>
      <Text modifiers={[font({ size: 12, weight: 'semibold' }), foregroundStyle(soft)]}>{props.title}</Text>
      <HStack spacing={6}>
        <Text modifiers={[font({ size: 34, weight: 'heavy' }), foregroundStyle(ink)]}>{props.score}</Text>
        <Text modifiers={[font({ size: 13, weight: 'bold' }), foregroundStyle(gold)]}>{props.level}</Text>
      </HStack>
      <Text modifiers={[font({ size: 11, weight: 'medium' }), foregroundStyle(soft)]}>{props.change}</Text>
    </VStack>
  );
  const foot = (
    <HStack spacing={6}>
      <Text modifiers={[font({ size: 12, weight: 'bold' }), foregroundStyle(ink)]}>{`🔥 ${props.streak}`}</Text>
      <Text modifiers={[font({ size: 11 }), foregroundStyle(soft)]}>{props.today}</Text>
    </HStack>
  );

  if (environment.widgetFamily === 'systemMedium') {
    return (
      <HStack spacing={12} modifiers={[containerBackground(bg, 'widget')]}>
        <VStack alignment={align} spacing={8}>
          {head}
          <Spacer />
          {foot}
        </VStack>
        <Spacer />
        <HStack alignment="bottom" spacing={5} modifiers={[frame({ height: 70 })]}>
          {props.days.map((v, i) => (
            <RoundedRectangle
              key={i}
              cornerRadius={3}
              modifiers={[frame({ width: 9, height: 6 + (v / max) * 60 }), foregroundStyle(i === 6 ? gold : v > 0 ? ink : soft)]}
            />
          ))}
        </HStack>
      </HStack>
    );
  }

  return (
    <VStack alignment={align} spacing={6} modifiers={[containerBackground(bg, 'widget'), padding({ all: 2 })]}>
      {head}
      <Spacer />
      {foot}
    </VStack>
  );
};

export default createWidget('BrainWidget', BrainWidget);
