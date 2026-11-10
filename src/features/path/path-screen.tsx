import { useMemo } from 'react';

import { isPathSolved, pathHint, type PathPuzzle } from '@/engine';
import { ExtraScreen } from '@/features/extra/extra-screen';
import { getPathPuzzle, pathInfo, pathUnlimitedId } from '@/features/puzzles/path-catalog';
import { haptics } from '@/services/haptics';
import { useGameStore } from '@/store/game-store';
import { S } from '@/strings';

import { PathBoard } from './path-board';

export function PathScreen({ id, versus }: { id: string; versus?: number }) {
  const puzzle = useMemo(() => getPathPuzzle(id), [id]);
  const info = useMemo(() => pathInfo(id), [id]);
  const hapticsOn = useGameStore((s) => s.settings.haptics);
  if (!puzzle || !info) return null;
  const isNext = info.mode === 'unlimited' && pathUnlimitedId(info.difficulty, useGameStore.getState().extraIndex.path[info.difficulty]) === id;
  const title = `${S.pathName} · ${info.mode === 'daily' ? S.daily(info.number) : S.unlimitedTitle(info.difficulty, info.number)}`;
  return (
    <ExtraScreen
      kind="path"
      id={id}
      title={title}
      difficulty={puzzle.difficulty}
      dailyKey={info.mode === 'daily' ? info.key : null}
      isNextUnlimited={isNext}
      initial={[puzzle.clues[0]]}
      status={(line) => S.pathStatus(line.length, puzzle.n * puzzle.n)}
      controls={S.pathControls}
      solved={(line) => isPathSolved(puzzle, line)}
      hint={(line) => lineHint(puzzle, line)}
      nextId={() => (info.mode === 'unlimited' ? pathUnlimitedId(info.difficulty, useGameStore.getState().extraIndex.path[info.difficulty]) : null)}
      route="/path/[id]"
      versus={versus}
      board={({ cells, locked, highlight, onChange }) => (
        <PathBoard
          puzzle={puzzle}
          line={cells}
          locked={locked}
          highlight={highlight}
          onStroke={onChange}
          onStep={hapticsOn ? haptics.tick : undefined}
        />
      )}
    />
  );
}

function lineHint(p: PathPuzzle, line: number[]) {
  if (isPathSolved(p, line)) return null;
  const { keep, next } = pathHint(p, line);
  return {
    title: S.pathHintTitle,
    body: S.pathHintBody(keep < line.length),
    highlight: next,
    apply: p.solution.slice(0, keep + next.length),
  };
}
