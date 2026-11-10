import { useMemo } from 'react';

import { binaryHint, isBinarySolved, SUN, type BinaryPuzzle, type Sky } from '@/engine';
import { ExtraScreen, type ExtraHint } from '@/features/extra/extra-screen';
import { binaryInfo, binaryUnlimitedId, getBinaryPuzzle } from '@/features/puzzles/binary-catalog';
import { haptics } from '@/services/haptics';
import { useGameStore } from '@/store/game-store';
import { S } from '@/strings';

import { BinaryBoard } from './binary-board';

export function BinaryScreen({ id, versus }: { id: string; versus?: number }) {
  const puzzle = useMemo(() => getBinaryPuzzle(id), [id]);
  const info = useMemo(() => binaryInfo(id), [id]);
  const hapticsOn = useGameStore((s) => s.settings.haptics);
  if (!puzzle || !info) return null;
  const nextIndex = () => useGameStore.getState().extraIndex.binary[info.difficulty];
  const isNext = info.mode === 'unlimited' && binaryUnlimitedId(info.difficulty, nextIndex()) === id;
  const title = `${S.binaryName} · ${info.mode === 'daily' ? S.daily(info.number) : S.unlimitedTitle(info.difficulty, info.number)}`;
  const total = puzzle.n * puzzle.n;
  return (
    <ExtraScreen
      kind="binary"
      id={id}
      title={title}
      difficulty={puzzle.difficulty}
      dailyKey={info.mode === 'daily' ? info.key : null}
      isNextUnlimited={isNext}
      initial={[...puzzle.givens]}
      status={(cells) => S.binaryStatus(cells.filter(Boolean).length, total)}
      controls={S.binaryControls}
      solved={(cells) => isBinarySolved(puzzle, cells as Sky[])}
      hint={(cells) => hintFor(puzzle, cells as Sky[])}
      nextId={() => (info.mode === 'unlimited' ? binaryUnlimitedId(info.difficulty, nextIndex()) : null)}
      route="/binary/[id]"
      versus={versus}
      board={({ cells, locked, highlight, onChange }) => (
        <BinaryBoard
          puzzle={puzzle}
          cells={cells}
          locked={locked}
          highlight={highlight}
          onChange={onChange}
          onTap={hapticsOn ? haptics.tap : undefined}
        />
      )}
    />
  );
}

function hintFor(p: BinaryPuzzle, cells: Sky[]): ExtraHint | null {
  const h = binaryHint(p, cells);
  if (h.kind === 'solved') return null;
  if (h.kind === 'mistake') {
    const apply = [...cells];
    h.cells.forEach((x) => (apply[x] = 0));
    return { title: S.hintMistakeTitle, body: S.hintMistakeBody(h.cells.length), highlight: h.cells, apply };
  }
  const { step } = h;
  const apply = [...cells];
  step.cells.forEach((x, i) => (apply[x] = step.values[i]));
  // The kind the reason talks about: the pair / the sides of the gap / the full half of the line.
  const seen = step.focus.map((x) => cells[x]).find(Boolean);
  const kind = (step.rule === 'balance' ? (step.values[0] === SUN ? 'moon' : 'sun') : seen === SUN ? 'sun' : 'moon') as 'sun' | 'moon';
  return {
    title: S.binaryTitles[step.rule],
    body: S.binaryWhy(step.rule, kind, step.line?.kind ?? 'row'),
    highlight: step.cells,
    apply,
  };
}
