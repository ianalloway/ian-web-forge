export const CANVAS_W = 600;
export const CANVAS_H = 480;

export const BRICK_COLS = 10;
export const BRICK_ROWS = 6;
export const BRICK_W = 54;
export const BRICK_H = 14;
export const BRICK_GAP = 4;
export const BRICK_OFFSET_X =
  (CANVAS_W - BRICK_COLS * BRICK_W - (BRICK_COLS - 1) * BRICK_GAP) / 2;
export const BRICK_OFFSET_Y = 50;

export const PADDLE_W = 80;
export const PADDLE_H = 10;
export const PADDLE_Y = CANVAS_H - 30;
export const BALL_R = 7;

const SPEED_INIT = 260;
const SPEED_CAP = 520;
const SPEED_STEP = 12;

export const ROW_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
] as const;

export interface Brick {
  x: number;
  y: number;
  row: number;
  alive: boolean;
}

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface Physics {
  ball: Ball;
  paddleX: number;
  bricks: Brick[];
  speed: number;
}

export interface StepResult {
  physics: Physics;
  scored: number;
  lifeLost: boolean;
  won: boolean;
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function brickX(col: number): number {
  return BRICK_OFFSET_X + col * (BRICK_W + BRICK_GAP);
}

function brickY(row: number): number {
  return BRICK_OFFSET_Y + row * (BRICK_H + BRICK_GAP);
}

export function createPhysics(): Physics {
  const bricks: Brick[] = [];
  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      bricks.push({ x: brickX(col), y: brickY(row), row, alive: true });
    }
  }
  const angle = (-72 * Math.PI) / 180;
  return {
    ball: {
      x: CANVAS_W / 2,
      y: CANVAS_H * 0.65,
      vx: Math.cos(angle) * SPEED_INIT,
      vy: Math.sin(angle) * SPEED_INIT,
    },
    paddleX: CANVAS_W / 2,
    bricks,
    speed: SPEED_INIT,
  };
}

export function resetBall(physics: Physics): Physics {
  const angle = (-72 * Math.PI) / 180;
  return {
    ...physics,
    ball: {
      x: CANVAS_W / 2,
      y: CANVAS_H * 0.65,
      vx: Math.cos(angle) * SPEED_INIT,
      vy: Math.sin(angle) * SPEED_INIT,
    },
    paddleX: CANVAS_W / 2,
    speed: SPEED_INIT,
  };
}

export function step(physics: Physics, paddleX: number, dt: number): StepResult {
  const dt2 = Math.min(dt, 0.05);
  const newPaddleX = clamp(paddleX, PADDLE_W / 2, CANVAS_W - PADDLE_W / 2);

  let { x, y, vx, vy } = physics.ball;
  let { speed } = physics;
  let bricks = physics.bricks;
  let scored = 0;

  x += vx * dt2;
  y += vy * dt2;

  if (x - BALL_R < 0) {
    x = BALL_R;
    vx = Math.abs(vx);
  } else if (x + BALL_R > CANVAS_W) {
    x = CANVAS_W - BALL_R;
    vx = -Math.abs(vx);
  }
  if (y - BALL_R < 0) {
    y = BALL_R;
    vy = Math.abs(vy);
  }

  if (vy > 0) {
    const pLeft = newPaddleX - PADDLE_W / 2;
    const pRight = newPaddleX + PADDLE_W / 2;
    if (
      y + BALL_R >= PADDLE_Y &&
      y - BALL_R <= PADDLE_Y + PADDLE_H &&
      x >= pLeft - BALL_R &&
      x <= pRight + BALL_R
    ) {
      y = PADDLE_Y - BALL_R;
      const hit = clamp((x - newPaddleX) / (PADDLE_W / 2), -1, 1);
      const bounceAngle = hit * ((65 * Math.PI) / 180);
      vy = -speed * Math.cos(bounceAngle);
      vx = speed * Math.sin(bounceAngle);
    }
  }

  let hitIdx = -1;
  let hitDx = 0;
  let hitDy = 0;
  for (let i = 0; i < bricks.length; i++) {
    const b = bricks[i];
    if (!b.alive) continue;
    const cx = clamp(x, b.x, b.x + BRICK_W);
    const cy = clamp(y, b.y, b.y + BRICK_H);
    const dx = x - cx;
    const dy = y - cy;
    if (dx * dx + dy * dy <= BALL_R * BALL_R) {
      hitIdx = i;
      hitDx = dx;
      hitDy = dy;
      break;
    }
  }

  if (hitIdx >= 0) {
    const overlapX = BALL_R - Math.abs(hitDx);
    const overlapY = BALL_R - Math.abs(hitDy);
    if (overlapY <= overlapX) {
      vy = hitDy <= 0 ? -Math.abs(vy) : Math.abs(vy);
    } else {
      vx = hitDx <= 0 ? -Math.abs(vx) : Math.abs(vx);
    }
    speed = Math.min(speed + SPEED_STEP, SPEED_CAP);
    scored = (BRICK_ROWS - bricks[hitIdx].row) * 10;
    bricks = bricks.map((b, i) => (i === hitIdx ? { ...b, alive: false } : b));
  }

  const lifeLost = y - BALL_R > CANVAS_H;
  const won = !lifeLost && bricks.every((b) => !b.alive);

  return {
    physics: { ball: { x, y, vx, vy }, paddleX: newPaddleX, bricks, speed },
    scored,
    lifeLost,
    won,
  };
}
