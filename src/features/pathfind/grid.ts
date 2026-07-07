export const ROWS = 18;
export const COLS = 24;

const DIRS: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];

export function key(r: number, c: number): string {
  return `${r},${c}`;
}

export function fromKey(k: string): [number, number] {
  const i = k.indexOf(",");
  return [parseInt(k.slice(0, i), 10), parseInt(k.slice(i + 1), 10)];
}

function getNeighbors(k: string): string[] {
  const [r, c] = fromKey(k);
  const result: string[] = [];
  for (const [dr, dc] of DIRS) {
    const nr = r + dr;
    const nc = c + dc;
    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
      result.push(key(nr, nc));
    }
  }
  return result;
}

function tracePath(end: string, parent: Map<string, string>): string[] {
  const path: string[] = [];
  let node: string | undefined = end;
  while (node !== undefined) {
    path.unshift(node);
    node = parent.get(node);
  }
  return path;
}

export interface PathfindStep {
  visited: string[];
  frontier: string[];
  path: string[];
  done: boolean;
  found: boolean;
}

export function generateBfsSteps(
  walls: Set<string>,
  start: string,
  end: string,
): PathfindStep[] {
  const steps: PathfindStep[] = [];
  const visited = new Set<string>([start]);
  const queue: string[] = [start];
  const parent = new Map<string, string>();

  const snap = (path: string[] = []): void => {
    steps.push({
      visited: [...visited],
      frontier: [...queue],
      path,
      done: path.length > 0 || queue.length === 0,
      found: path.length > 0,
    });
  };

  snap();

  while (queue.length > 0) {
    const curr = queue.shift()!;

    if (curr === end) {
      const path = tracePath(end, parent);
      steps.push({ visited: [...visited], frontier: [], path, done: true, found: true });
      return steps;
    }

    for (const nb of getNeighbors(curr)) {
      if (!visited.has(nb) && !walls.has(nb)) {
        visited.add(nb);
        parent.set(nb, curr);
        queue.push(nb);
      }
    }

    snap();
  }

  steps.push({ visited: [...visited], frontier: [], path: [], done: true, found: false });
  return steps;
}

export function generateAstarSteps(
  walls: Set<string>,
  start: string,
  end: string,
): PathfindStep[] {
  const steps: PathfindStep[] = [];
  const [er, ec] = fromKey(end);
  const h = (k: string): number => {
    const [r, c] = fromKey(k);
    return Math.abs(r - er) + Math.abs(c - ec);
  };

  const gScore = new Map<string, number>([[start, 0]]);
  const fScore = new Map<string, number>([[start, h(start)]]);
  const openSet = new Set<string>([start]);
  const closedSet = new Set<string>();
  const parent = new Map<string, string>();

  const snap = (path: string[] = []): void => {
    steps.push({
      visited: [...closedSet],
      frontier: [...openSet],
      path,
      done: path.length > 0 || openSet.size === 0,
      found: path.length > 0,
    });
  };

  snap();

  while (openSet.size > 0) {
    let curr = "";
    let bestF = Infinity;
    for (const k of openSet) {
      const f = fScore.get(k) ?? Infinity;
      if (f < bestF) { bestF = f; curr = k; }
    }

    if (curr === end) {
      const path = tracePath(end, parent);
      steps.push({ visited: [...closedSet], frontier: [], path, done: true, found: true });
      return steps;
    }

    openSet.delete(curr);
    closedSet.add(curr);

    for (const nb of getNeighbors(curr)) {
      if (closedSet.has(nb) || walls.has(nb)) continue;
      const tentativeG = (gScore.get(curr) ?? 0) + 1;
      if (tentativeG < (gScore.get(nb) ?? Infinity)) {
        parent.set(nb, curr);
        gScore.set(nb, tentativeG);
        fScore.set(nb, tentativeG + h(nb));
        openSet.add(nb);
      }
    }

    snap();
  }

  steps.push({ visited: [...closedSet], frontier: [], path: [], done: true, found: false });
  return steps;
}
