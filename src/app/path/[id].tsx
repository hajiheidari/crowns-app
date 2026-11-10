import { useLocalSearchParams } from 'expo-router';

import { PathScreen } from '@/features/path/path-screen';

export default function PathRoute() {
  const { id, vs } = useLocalSearchParams<{ id: string; vs?: string }>();
  const versus = vs !== undefined && /^\d+$/.test(vs) ? Number(vs) : undefined;
  return <PathScreen key={id} id={id} versus={versus} />;
}
