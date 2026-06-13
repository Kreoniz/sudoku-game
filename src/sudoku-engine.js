const SIZE = 9;
const BOX = 3;
const CELL_COUNT = SIZE * SIZE;
const ALL_MASK = 0b1111111110;

export function generatePuzzle(targetClues, seed) {
  let best = null;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const rng = createRng(`${seed}:${attempt}`);
    const solution = generateSolution(rng);
    const puzzle = solution.slice();
    const positions = shuffle(
      Array.from({ length: CELL_COUNT }, (_, index) => index),
      rng
    );
    const targetRemovals = CELL_COUNT - targetClues;
    let removed = 0;

    for (const index of positions) {
      if (removed >= targetRemovals) break;

      const value = puzzle[index];
      puzzle[index] = 0;
      if (countSolutions(puzzle, 2) === 1) {
        removed += 1;
      } else {
        puzzle[index] = value;
      }
    }

    const clues = puzzle.filter(Boolean).length;
    const candidate = { puzzle, solution, clues };
    if (!best || clues < best.clues) best = candidate;
    if (clues <= targetClues + 1) return candidate;
  }

  return best;
}

function generateSolution(rng) {
  const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
  const rows = shuffle([0, 1, 2], rng).flatMap((group) =>
    shuffle([0, 1, 2], rng).map((row) => group * BOX + row)
  );
  const cols = shuffle([0, 1, 2], rng).flatMap((group) =>
    shuffle([0, 1, 2], rng).map((col) => group * BOX + col)
  );
  const grid = Array(CELL_COUNT).fill(0);

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      grid[row * SIZE + col] = nums[pattern(rows[row], cols[col])];
    }
  }

  return grid;
}

function pattern(row, col) {
  return (BOX * (row % BOX) + Math.floor(row / BOX) + col) % SIZE;
}

function countSolutions(board, limit = 2) {
  const work = board.slice();
  let count = 0;

  function solve() {
    if (count >= limit) return;

    let bestIndex = -1;
    let bestMask = 0;
    let bestCount = 10;

    for (let index = 0; index < CELL_COUNT; index += 1) {
      if (work[index] !== 0) continue;

      const mask = getCandidateMask(work, index);
      const candidateCount = bitCount(mask);
      if (candidateCount === 0) return;
      if (candidateCount < bestCount) {
        bestCount = candidateCount;
        bestIndex = index;
        bestMask = mask;
        if (candidateCount === 1) break;
      }
    }

    if (bestIndex === -1) {
      count += 1;
      return;
    }

    for (let number = 1; number <= SIZE; number += 1) {
      if (!(bestMask & (1 << number))) continue;
      work[bestIndex] = number;
      solve();
      work[bestIndex] = 0;
      if (count >= limit) return;
    }
  }

  solve();
  return count;
}

function getCandidateMask(board, index) {
  if (board[index] !== 0) return 0;

  let mask = ALL_MASK;
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;

  for (let i = 0; i < SIZE; i += 1) {
    mask &= ~(1 << board[row * SIZE + i]);
    mask &= ~(1 << board[i * SIZE + col]);
  }

  const boxRow = Math.floor(row / BOX) * BOX;
  const boxCol = Math.floor(col / BOX) * BOX;
  for (let r = boxRow; r < boxRow + BOX; r += 1) {
    for (let c = boxCol; c < boxCol + BOX; c += 1) {
      mask &= ~(1 << board[r * SIZE + c]);
    }
  }

  return mask;
}

function bitCount(value) {
  let count = 0;
  let current = value;
  while (current) {
    current &= current - 1;
    count += 1;
  }
  return count;
}

function shuffle(items, rng) {
  const array = items.slice();
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng() * (index + 1));
    [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
  }
  return array;
}

function createRng(seed) {
  return mulberry32(xmur3(seed)());
}

function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }

  return function seedHash() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  };
}

function mulberry32(seed) {
  return function nextRandom() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
