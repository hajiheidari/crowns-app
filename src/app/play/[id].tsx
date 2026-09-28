import { useLocalSearchParams } from 'expo-router';

import { GameScreen } from '@/features/game/game-screen';

export default function PlayRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <GameScreen key={id} id={id} />;
}
