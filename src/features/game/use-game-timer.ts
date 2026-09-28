import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Calls onTick once per second while `running` and the app is in the foreground. */
export function useGameTimer(running: boolean, onTick: () => void) {
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => setActive(s === 'active'));
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (!running || !active) return;
    const t = setInterval(onTick, 1000);
    return () => clearInterval(t);
  }, [running, active, onTick]);
}
