import { useLocalSearchParams } from 'expo-router';

import { GameScreen } from '@/features/game/game-screen';

export default function PlayRoute() {
  const { id, vs } = useLocalSearchParams<{ id: string; vs?: string }>();
  const versus = vs !== undefined && /^\d+$/.test(vs) ? Number(vs) : undefined;
  return <GameScreen key={id} id={id} versus={versus} />;
}
