import { useLocalSearchParams } from 'expo-router';

import { BinaryScreen } from '@/features/binary/binary-screen';

export default function BinaryRoute() {
  const { id, vs } = useLocalSearchParams<{ id: string; vs?: string }>();
  const versus = vs !== undefined && /^\d+$/.test(vs) ? Number(vs) : undefined;
  return <BinaryScreen key={id} id={id} versus={versus} />;
}
