import { 
  Candy, 
  BoardGrid, 
  CandyColor, 
  CandyType, 
  MatchGroup, 
  LevelConfig, 
  CellState,
  ObstacleType,
  JellyType
} from './types';

const CANDY_COLORS: CandyColor[] = ['red', 'blue', 'green', 'yellow', 'orange', 'purple'];

// Unique ID helper
export const generateId = (): string => Math.random().toString(36).substring(2, 9);

// Create a randomized or specific candy
export const createRandomCandy = (
  color?: CandyColor, 
  type: CandyType = 'standard',
  bombTimer?: number
): Candy => {
  return {
    id: generateId(),
    color: color || CANDY_COLORS[Math.floor(Math.random() * CANDY_COLORS.length)],
    type,
    bombTimer,
  };
};

/**
 * Initializes the full cell grid according to Level configurations
 */
export const initializeBoardForLevel = (level: LevelConfig): BoardGrid => {
  const board: BoardGrid = Array(64).fill(null).map(() => ({
    candy: null,
    obstacle: 'none',
    jelly: 'none',
  }));

  // Apply Pre-configured Jelly Tiles
  if (level.initialJelly) {
    level.initialJelly.forEach((j) => {
      if (j.index >= 0 && j.index < 64) {
        board[j.index].jelly = j.type;
      }
    });
  }

  // Apply Pre-configured Obstacles (Ice, Stones, Chocolates, Locks)
  if (level.initialObstacles) {
    level.initialObstacles.forEach((o) => {
      if (o.index >= 0 && o.index < 64) {
        board[o.index].obstacle = o.type;
      }
    });
  }

  // Fill cells with initial candies (or special ingredient drops)
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const idx = r * 8 + c;

      // Skip candy if cell is a solid Stone block (stones don't hold candies!)
      if (board[idx].obstacle === 'stone') {
        continue;
      }

      // Check if this column spawns an ingredient at the top on start
      const isIngCol = level.initialIngredients && level.initialIngredients.includes(c) && r === 0;

      if (isIngCol) {
        board[idx].isIngredient = true;
        // In our game, ingredients are modeled as a sweet cherry/hazelnut item. We can render it with a special flag!
        continue;
      }

      // Populate random candies that don't make immediate matches
      let validColors = [...CANDY_COLORS];
      let attempts = 0;
      
      while (attempts < 15) {
        const testColor = validColors[Math.floor(Math.random() * validColors.length)];
        
        // Horizontal Check
        let hMatch = false;
        if (c >= 2) {
          const left1 = board[idx - 1].candy;
          const left2 = board[idx - 2].candy;
          if (left1 && left2 && left1.color === testColor && left2.color === testColor) {
            hMatch = true;
          }
        }

        // Vertical Check
        let vMatch = false;
        if (r >= 2) {
          const up1 = board[idx - 8].candy;
          const up2 = board[idx - 16].candy;
          if (up1 && up2 && up1.color === testColor && up2.color === testColor) {
            vMatch = true;
          }
        }

        if (!hMatch && !vMatch) {
          // Normal standard candy
          // Random 2% chance to place a Tick-down Bomb Candy to add tension in challenge modes
          const isBombSpawn = level.mode === 'challenge' && Math.random() < 0.03;
          board[idx].candy = createRandomCandy(
            testColor, 
            'standard', 
            isBombSpawn ? 9 : undefined
          );
          break;
        }

        attempts++;
      }

      // Fallback if loop didn't find one
      if (!board[idx].candy && !board[idx].isIngredient) {
        board[idx].candy = createRandomCandy(validColors[0]);
      }
    }
  }

  // Double check the move options
  if (!isMovePossible(board)) {
    return initializeBoardForLevel(level);
  }

  return board;
};

/**
 * Searches the grid for any match groups of 3 or more of the same color.
 * Correctly distinguishes Row Match 4, Column Match 4, L/T Intersection 5, and Line 5.
 */
export const checkForMatches = (board: BoardGrid): MatchGroup[] => {
  const matches: MatchGroup[] = [];

  // Horizontal Scans
  for (let r = 0; r < 8; r++) {
    let matchLength = 1;
    let matchColor: CandyColor | null = null;
    let startIndex = 0;

    for (let c = 0; c < 8; c++) {
      const idx = r * 8 + c;
      const cell = board[idx];
      const candy = cell.candy;

      // Stones and ingredients cannot match
      const canMatch = candy && cell.obstacle !== 'stone' && !cell.isIngredient;

      if (canMatch && matchColor === candy.color) {
        matchLength++;
      } else {
        if (matchLength >= 3 && matchColor) {
          const indices: number[] = [];
          for (let i = 0; i < matchLength; i++) {
            indices.push(startIndex + i);
          }
          matches.push({ indices, color: matchColor, type: 'row' });
        }
        matchColor = canMatch ? candy.color : null;
        matchLength = 1;
        startIndex = idx;
      }
    }
    if (matchLength >= 3 && matchColor) {
      const indices: number[] = [];
      for (let i = 0; i < matchLength; i++) {
        indices.push(startIndex + i);
      }
      matches.push({ indices, color: matchColor, type: 'row' });
    }
  }

  // Vertical Scans
  for (let c = 0; c < 8; c++) {
    let matchLength = 1;
    let matchColor: CandyColor | null = null;
    let startIndex = 0;

    for (let r = 0; r < 8; r++) {
      const idx = r * 8 + c;
      const cell = board[idx];
      const candy = cell.candy;

      const canMatch = candy && cell.obstacle !== 'stone' && !cell.isIngredient;

      if (canMatch && matchColor === candy.color) {
        matchLength++;
      } else {
        if (matchLength >= 3 && matchColor) {
          const indices: number[] = [];
          for (let i = 0; i < matchLength; i++) {
            indices.push(startIndex + i * 8);
          }
          matches.push({ indices, color: matchColor, type: 'col' });
        }
        matchColor = canMatch ? candy.color : null;
        matchLength = 1;
        startIndex = idx;
      }
    }
    if (matchLength >= 3 && matchColor) {
      const indices: number[] = [];
      for (let i = 0; i < matchLength; i++) {
        indices.push(startIndex + i * 8);
      }
      matches.push({ indices, color: matchColor, type: 'col' });
    }
  }

  // Consolidate intersections (e.g. row match sharing indices with vertical match -> L/T Wrapped Shape)
  const consolidatedMatches: MatchGroup[] = [];
  const processedRowColMap = new Set<string>();

  for (let i = 0; i < matches.length; i++) {
    const matchA = matches[i];
    let isIntersected = false;

    for (let j = 0; j < matches.length; j++) {
      if (i === j) continue;
      const matchB = matches[j];

      if (matchA.color === matchB.color) {
        const overlap = matchA.indices.filter(idx => matchB.indices.includes(idx));
        if (overlap.length > 0) {
          const combined = Array.from(new Set([...matchA.indices, ...matchB.indices]));
          
          // Order keys to avoid duplicates
          const key = combined.sort((a,b)=>a-b).join(',');
          if (!processedRowColMap.has(key)) {
            processedRowColMap.add(key);
            consolidatedMatches.push({
              indices: combined,
              color: matchA.color,
              type: 'intersection',
            });
          }
          isIntersected = true;
          break;
        }
      }
    }

    if (!isIntersected) {
      const key = matchA.indices.sort((a,b)=>a-b).join(',');
      if (!processedRowColMap.has(key)) {
        processedRowColMap.add(key);
        consolidatedMatches.push(matchA);
      }
    }
  }

  return consolidatedMatches;
};

/**
 * Validates whether swap is permissible, taking lock obstructions and score rules into account.
 */
export const isValidSwap = (board: BoardGrid, indexA: number, indexB: number): boolean => {
  const cellA = board[indexA];
  const cellB = board[indexB];

  if (!cellA || !cellB) return false;

  // Cannot swap locked candies, stones, or empty spots
  if (cellA.obstacle === 'locked' || cellB.obstacle === 'locked') return false;
  if (cellA.obstacle === 'stone' || cellB.obstacle === 'stone') return false;
  if (cellA.candy === null && !cellA.isIngredient) return false;
  if (cellB.candy === null && !cellB.isIngredient) return false;

  // Swapping two special items, or swapping color bomb is ALWAYS valid!
  const hasColorBomb = (cellA.candy?.type === 'color-bomb') || (cellB.candy?.type === 'color-bomb');
  if (hasColorBomb) return true;

  const colorA = cellA.candy?.color;
  const colorB = cellB.candy?.color;

  // Helper to get simulated color after swap
  const getSimulatedColor = (idx: number): CandyColor | null => {
    const cell = board[idx];
    if (!cell || cell.obstacle === 'stone' || cell.isIngredient) return null;
    if (idx === indexA) return colorB || null;
    if (idx === indexB) return colorA || null;
    return cell.candy ? cell.candy.color : null;
  };

  const checkLocalMatchSimulated = (idx: number, color: CandyColor | null): boolean => {
    if (!color) return false;
    const r = Math.floor(idx / 8);
    const c = idx % 8;

    const getColor = (row: number, col: number): CandyColor | null => {
      if (row < 0 || row >= 8 || col < 0 || col >= 8) return null;
      return getSimulatedColor(row * 8 + col);
    };

    // Horizontal check
    if (c <= 5 && getColor(r, c + 1) === color && getColor(r, c + 2) === color) return true;
    if (c >= 1 && c <= 6 && getColor(r, c - 1) === color && getColor(r, c + 1) === color) return true;
    if (c >= 2 && getColor(r, c - 2) === color && getColor(r, c - 1) === color) return true;

    // Vertical check
    if (r <= 5 && getColor(r + 1, c) === color && getColor(r + 2, c) === color) return true;
    if (r >= 1 && r <= 6 && getColor(r - 1, c) === color && getColor(r + 1, c) === color) return true;
    if (r >= 2 && getColor(r - 2, c) === color && getColor(r - 1, c) === color) return true;

    return false;
  };

  // The swap is valid if it forms a match at either indexA (with colorB) or indexB (with colorA)
  return checkLocalMatchSimulated(indexA, colorB) || checkLocalMatchSimulated(indexB, colorA);
};

/**
 * Deadlock scanner. Runs over the entire board to confirm if any moves exist.
 */
export const isMovePossible = (board: BoardGrid): boolean => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const idx = r * 8 + c;

      // Test Swap Right
      if (c < 7) {
        if (isValidSwap(board, idx, idx + 1)) return true;
      }
      // Test Swap Down
      if (r < 7) {
        if (isValidSwap(board, idx, idx + 8)) return true;
      }
    }
  }
  return false;
};

/**
 * Searches the grid for a viable match-3 swap hint.
 * Returns the two adjacent index positions of the potential match, or null.
 */
export const findHintMove = (board: BoardGrid): [number, number] | null => {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const idx = r * 8 + c;

      // Right Swap check
      if (c < 7) {
        const rightIdx = idx + 1;
        if (isValidSwap(board, idx, rightIdx)) {
          // Verify it generates actual matches
          const cellA = board[idx];
          const cellB = board[rightIdx];
          const testBoard = [...board];
          testBoard[idx] = { ...cellA, candy: cellB.candy };
          testBoard[rightIdx] = { ...cellB, candy: cellA.candy };
          if (checkForMatches(testBoard).length > 0 || cellA.candy?.type === 'color-bomb' || cellB.candy?.type === 'color-bomb') {
            return [idx, rightIdx];
          }
        }
      }

      // Down Swap check
      if (r < 7) {
        const downIdx = idx + 8;
        if (isValidSwap(board, idx, downIdx)) {
          const cellA = board[idx];
          const cellB = board[downIdx];
          const testBoard = [...board];
          testBoard[idx] = { ...cellA, candy: cellB.candy };
          testBoard[downIdx] = { ...cellB, candy: cellA.candy };
          if (checkForMatches(testBoard).length > 0 || cellA.candy?.type === 'color-bomb' || cellB.candy?.type === 'color-bomb') {
            return [idx, downIdx];
          }
        }
      }
    }
  }
  return null;
};

/**
 * Shuffles only the existing loose candies without touching obstacles or jellies.
 */
export const shuffleBoard = (board: BoardGrid): BoardGrid => {
  // Extract all existing unblocked candies
  const shuffleCandies: Candy[] = [];
  const immovableIndices = new Set<number>();

  for (let i = 0; i < 64; i++) {
    const cell = board[i];
    if (cell.obstacle === 'stone' || cell.isIngredient || cell.obstacle === 'locked') {
      immovableIndices.add(i);
    } else if (cell.candy) {
      shuffleCandies.push(cell.candy);
    }
  }

  // Shuffle the candies array
  for (let i = shuffleCandies.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffleCandies[i];
    shuffleCandies[i] = shuffleCandies[j];
    shuffleCandies[j] = temp;
  }

  // Re-write candies back to empty movable board spaces
  const newBoard = board.map(cell => ({ ...cell }));
  let candyPtr = 0;

  for (let i = 0; i < 64; i++) {
    if (!immovableIndices.has(i) && newBoard[i].candy) {
      newBoard[i].candy = shuffleCandies[candyPtr++];
    }
  }

  // Ensure shuffle didn't form starting match-3 layouts or get deadlocked
  if (checkForMatches(newBoard).length > 0 || !isMovePossible(newBoard)) {
    return shuffleBoard(board); // Re-try recursively
  }

  return newBoard;
};

/**
 * Spreads chocolate blocks in the event that no chocolate blocks were destroyed on the move.
 */
export const spreadChocolate = (board: BoardGrid): BoardGrid => {
  const chocolateIndices: number[] = [];
  const targetIndices = new Set<number>();

  // Find all current chocolates
  for (let i = 0; i < 64; i++) {
    if (board[i].obstacle === 'chocolate') {
      chocolateIndices.push(i);
    }
  }

  if (chocolateIndices.length === 0) return board;

  // Search for adjacent candidate blocks to turn into chocolate
  chocolateIndices.forEach((idx) => {
    const row = Math.floor(idx / 8);
    const col = idx % 8;

    const adjacent = [
      { r: row - 1, c: col },
      { r: row + 1, c: col },
      { r: row, c: col - 1 },
      { r: row, c: col + 1 },
    ];

    adjacent.forEach(({ r, c }) => {
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const neighborIdx = r * 8 + c;
        const targetCell = board[neighborIdx];
        
        // Chocolates can spread to normal candy spots or empty spots
        // It cannot override stones, ingredients, ice, locks or existing chocolates
        if (
          targetCell.obstacle === 'none' && 
          !targetCell.isIngredient
        ) {
          targetIndices.add(neighborIdx);
        }
      }
    });
  });

  if (targetIndices.size === 0) return board;

  const targetArr = Array.from(targetIndices);
  const randomChoice = targetArr[Math.floor(Math.random() * targetArr.length)];

  const newBoard = board.map(cell => ({ ...cell }));
  newBoard[randomChoice].obstacle = 'chocolate';
  newBoard[randomChoice].candy = null; // vaporize whatever candy was there

  return newBoard;
};
