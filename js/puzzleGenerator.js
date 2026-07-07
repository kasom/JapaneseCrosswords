function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function splitIntoSyllables(reading) {
  if (!reading) return [];
  const syllables = [];
  const smallKana = ['ゃ', 'ゅ', 'ょ', 'ぁ', 'ぃ', 'ぅ', 'ぇ', 'ぉ', 'ゎ'];
  
  for (let i = 0; i < reading.length; i++) {
    const char = reading[i];
    const nextChar = reading[i + 1];
    if (nextChar && smallKana.includes(nextChar)) {
      syllables.push(char + nextChar);
      i++;
    } else {
      syllables.push(char);
    }
  }
  return syllables;
}

function calculateGridIntersections(grid, gridSize) {
  let intersections = 0;
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (grid[r][c]) {
        const hasHorizontal = (c > 0 && grid[r][c - 1]) || (c < gridSize - 1 && grid[r][c + 1]);
        const hasVertical = (r > 0 && grid[r - 1][c]) || (r < gridSize - 1 && grid[r + 1][c]);
        if (hasHorizontal && hasVertical) {
          intersections++;
        }
      }
    }
  }
  return intersections;
}

function assignNumbers(placedWords) {
  placedWords.sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });

  let currentNumber = 0;
  const coordToNumber = {};

  placedWords.forEach(w => {
    const key = `${w.row},${w.col}`;
    if (coordToNumber[key]) {
      w.number = coordToNumber[key];
    } else {
      currentNumber++;
      coordToNumber[key] = currentNumber;
      w.number = currentNumber;
    }
  });
}

function rebuildGrid(placedWords, gridSize) {
  const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
  placedWords.forEach((w, wIdx) => {
    const wSyllables = splitIntoSyllables(w.reading || '');
    for (let i = 0; i < wSyllables.length; i++) {
      const r = w.direction === 'across' ? w.row : w.row + i;
      const c = w.direction === 'across' ? w.col + i : w.col;
      
      const existing = grid[r][c];
      grid[r][c] = {
        char: wSyllables[i],
        reading: wSyllables[i],
        wordIndex: wIdx,
        userInput: existing ? existing.userInput : ''
      };
    }
  });
  return grid;
}

function generateSinglePuzzle(words, gridSize, startWordIndex) {
  const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(null));
  const placed = [];
  
  if (words.length === 0) return { grid, words: [], gridSize, count: 0 };

  const first = words[startWordIndex];
  const syllables = splitIntoSyllables(first.reading || '');
  const startRow = Math.floor(gridSize / 2);
  const startCol = Math.floor((gridSize - syllables.length) / 2);
  
  for (let i = 0; i < syllables.length; i++) {
    grid[startRow][startCol + i] = { 
      char: syllables[i], 
      reading: syllables[i], 
      wordIndex: 0, 
      userInput: '' 
    };
  }
  placed.push({ ...first, direction: 'across', row: startRow, col: startCol });
  
  for (let i = 0; i < words.length; i++) {
    if (i === startWordIndex) continue;
    const w = words[i];
    const placement = findBestPlacement(grid, w, placed, gridSize);
    if (placement) {
      const wSyllables = splitIntoSyllables(w.reading || '');
      for (let j = 0; j < wSyllables.length; j++) {
        let r, c;
        if (placement.direction === 'across') { r = placement.row; c = placement.col + j; }
        else { r = placement.row + j; c = placement.col; }
        if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
          grid[r][c] = { 
            char: wSyllables[j], 
            reading: wSyllables[j], 
            wordIndex: placed.length, 
            userInput: '' 
          };
        }
      }
      placed.push({ ...w, direction: placement.direction, row: placement.row, col: placement.col });
    }
  }
  
  return { grid, words: placed, gridSize, count: placed.length };
}

function findBestPlacement(grid, word, placed, gridSize) {
  let bestScore = -1;
  let bestPlacement = null;
  const wSyllables = splitIntoSyllables(word.reading || '');
  for (const pw of placed) {
    const pwSyllables = splitIntoSyllables(pw.reading || '');
    for (let pi = 0; pi < pwSyllables.length; pi++) {
      for (let wi = 0; wi < wSyllables.length; wi++) {
        if (pwSyllables[pi] === wSyllables[wi]) {
          const direction = pw.direction === 'across' ? 'down' : 'across';
          let startRow, startCol;
          if (direction === 'down') { startRow = pw.row - wi; startCol = pw.col + pi; }
          else { startRow = pw.row + pi; startCol = pw.col - wi; }
          if (canPlace(grid, wSyllables, direction, startRow, startCol, gridSize)) {
            const score = calculateScore(grid, wSyllables, direction, startRow, startCol, gridSize);
            if (score > bestScore) { bestScore = score; bestPlacement = { direction, row: startRow, col: startCol }; }
          }
        }
      }
    }
  }
  return bestPlacement;
}

function canPlace(grid, word, direction, startRow, startCol, gridSize) {
  if (direction === 'across') {
    if (startRow < 0 || startRow >= gridSize) return false;
    if (startCol < 0 || startCol + word.length > gridSize) return false;
  } else {
    if (startCol < 0 || startCol >= gridSize) return false;
    if (startRow < 0 || startRow + word.length > gridSize) return false;
  }
  let intersections = 0;
  for (let i = 0; i < word.length; i++) {
    const r = direction === 'across' ? startRow : startRow + i;
    const c = direction === 'across' ? startCol + i : startCol;
    const cell = grid[r][c];
    if (cell) {
      if (cell.char !== word[i]) return false;
      intersections++;
    } else {
      if (hasConflict(grid, r, c, direction, gridSize)) return false;
    }
  }
  if (direction === 'across') {
    if (startCol > 0 && grid[startRow][startCol - 1]) return false;
    if (startCol + word.length < gridSize && grid[startRow][startCol + word.length]) return false;
  } else {
    if (startRow > 0 && grid[startRow - 1][startCol]) return false;
    if (startRow + word.length < gridSize && grid[startRow + word.length][startCol]) return false;
  }
  return intersections > 0;
}

function hasConflict(grid, row, col, direction, gridSize) {
  if (direction === 'across') {
    if (row > 0 && grid[row - 1][col]) return true;
    if (row < gridSize - 1 && grid[row + 1][col]) return true;
  } else {
    if (col > 0 && grid[row][col - 1]) return true;
    if (col < gridSize - 1 && grid[row][col + 1]) return true;
  }
  return false;
}

function calculateScore(grid, word, direction, startRow, startCol, gridSize) {
  let score = 0;
  let intersections = 0;
  for (let i = 0; i < word.length; i++) {
    const r = direction === 'across' ? startRow : startRow + i;
    const c = direction === 'across' ? startCol + i : startCol;
    if (grid[r][c]) { intersections++; score += 10; }
  }
  score += intersections * 5;
  const centerRow = gridSize / 2;
  const centerCol = gridSize / 2;
  const midRow = direction === 'across' ? startRow : startRow + Math.floor(word.length / 2);
  const midCol = direction === 'across' ? startCol + Math.floor(word.length / 2) : startCol;
  const dist = Math.abs(midRow - centerRow) + Math.abs(midCol - centerCol);
  score -= dist;
  return score;
}

function generatePuzzle(words, gridSize = 15) {
  if (!words || words.length === 0) return null;
  
  let bestResult = null;
  const maxAttempts = Math.min(25, words.length * 2);
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const shuffled = shuffle(words);
    const sorted = [...shuffled].sort((a, b) => (b.reading || '').length - (a.reading || '').length);
    
    const startWordIndex = attempt % Math.min(5, sorted.length);
    const result = generateSinglePuzzle(sorted, gridSize, startWordIndex);
    
    if (!bestResult || result.count > bestResult.count) {
      bestResult = result;
    } else if (result.count === bestResult.count) {
      const currentIntersections = calculateGridIntersections(result.grid, gridSize);
      const bestIntersections = calculateGridIntersections(bestResult.grid, gridSize);
      if (currentIntersections > bestIntersections) {
        bestResult = result;
      }
    }
    
    if (bestResult.count === words.length) break;
  }
  
  if (bestResult) {
    assignNumbers(bestResult.words);
    bestResult.grid = rebuildGrid(bestResult.words, gridSize);
  }
  
  return bestResult;
}
