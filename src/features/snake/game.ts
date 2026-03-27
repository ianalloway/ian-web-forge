export const GRID_COLUMNS = 16;
export const GRID_ROWS = 16;
export const TICK_MS = 140;

export type Position = {
  x: number;
  y: number;
};

export type Direction = "up" | "down" | "left" | "right";
export type GameStatus = "running" | "paused" | "game_over";

export type SnakeGameState = {
  columns: number;
  rows: number;
  snake: Position[];
  direction: Direction;
  food: Position | null;
  score: number;
  status: GameStatus;
  won: boolean;
};

export const DIRECTION_VECTORS: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

function createInitialSnake(columns: number, rows: number): Position[] {
  const centerX = Math.floor(columns / 2);
  const centerY = Math.floor(rows / 2);

  return [
    { x: centerX, y: centerY },
    { x: centerX - 1, y: centerY },
    { x: centerX - 2, y: centerY },
  ];
}

function toCellKey({ x, y }: Position) {
  return `${x},${y}`;
}

function randomIndex(length: number, random: () => number) {
  return Math.floor(random() * length);
}

export function placeFood(
  snake: Position[],
  columns: number,
  rows: number,
  random: () => number = Math.random,
) {
  const occupied = new Set(snake.map(toCellKey));
  const openCells: Position[] = [];

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        openCells.push({ x, y });
      }
    }
  }

  if (openCells.length === 0) {
    return null;
  }

  return openCells[randomIndex(openCells.length, random)];
}

export function createGame({
  columns = GRID_COLUMNS,
  rows = GRID_ROWS,
  random = Math.random,
}: {
  columns?: number;
  rows?: number;
  random?: () => number;
} = {}): SnakeGameState {
  const snake = createInitialSnake(columns, rows);

  return {
    columns,
    rows,
    snake,
    direction: "right",
    food: placeFood(snake, columns, rows, random),
    score: 0,
    status: "running",
    won: false,
  };
}

export function setDirection(state: SnakeGameState, nextDirection: Direction) {
  if (OPPOSITE_DIRECTIONS[state.direction] === nextDirection) {
    return state;
  }

  return {
    ...state,
    direction: nextDirection,
  };
}

export function togglePause(state: SnakeGameState) {
  if (state.status === "game_over") {
    return state;
  }

  return {
    ...state,
    status: state.status === "paused" ? "running" : "paused",
  };
}

export function restartGame(state: SnakeGameState) {
  return createGame({
    columns: state.columns,
    rows: state.rows,
  });
}

export function advanceGame(
  state: SnakeGameState,
  { random = Math.random }: { random?: () => number } = {},
) {
  if (state.status !== "running") {
    return state;
  }

  const vector = DIRECTION_VECTORS[state.direction];
  const nextHead = {
    x: state.snake[0].x + vector.x,
    y: state.snake[0].y + vector.y,
  };

  const hitWall =
    nextHead.x < 0 ||
    nextHead.x >= state.columns ||
    nextHead.y < 0 ||
    nextHead.y >= state.rows;

  if (hitWall) {
    return {
      ...state,
      status: "game_over",
      won: false,
    };
  }

  const willEat =
    state.food !== null &&
    nextHead.x === state.food.x &&
    nextHead.y === state.food.y;

  const collisionBody = willEat ? state.snake : state.snake.slice(0, -1);
  const hitSelf = collisionBody.some(
    (segment) => segment.x === nextHead.x && segment.y === nextHead.y,
  );

  if (hitSelf) {
    return {
      ...state,
      status: "game_over",
      won: false,
    };
  }

  const nextSnake = [nextHead, ...state.snake];
  if (!willEat) {
    nextSnake.pop();
  }

  const nextFood = willEat
    ? placeFood(nextSnake, state.columns, state.rows, random)
    : state.food;

  const hasWon = willEat && nextFood === null;

  return {
    ...state,
    snake: nextSnake,
    food: nextFood,
    score: willEat ? state.score + 1 : state.score,
    status: hasWon ? "game_over" : state.status,
    won: hasWon,
  };
}
