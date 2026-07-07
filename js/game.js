class Game {
  constructor() {
    this.state = {
      wordlist: [],          // The pool of all loaded words
      grid: [],              // The crossword grid
      gridSize: 13,          // Grid dimension
      words: [],             // Words currently placed
      placedWords: [],       // Same as above
      selectedCell: null,    // { row, col }
      selectedWord: null,    // Word object currently selected
      direction: 'across',   // 'across' or 'down'
      timer: 0,              // Timer in seconds
      timerInterval: null,   // Timer interval handle
      hintsUsed: 0,          // Count of hints used
      maxHints: 3,           // Limit on hints
      completedWords: new Set(), // Set of completed word keys: "number_direction"
      showClues: true,       // UI toggles
      showHints: false,
      romajiBuffer: '',      // Typing buffer
      currentDifficulty: 'medium', // 'easy', 'medium', 'hard'
      keyboardVisible: false
    };
  }

  init() {
    const wlSelector = document.getElementById('wordlist-selector');
    const url = wlSelector ? wlSelector.value : 'data/puzzles.csv';
    this.loadPuzzles(url);
    this.setupEventListeners();
    this.setupKeyboard();
  }

  loadPuzzles(url = 'data/puzzles.csv') {
    fetch(url)
      .then(r => r.text())
      .then(text => {
        const parsed = parseCSV(text);
        if (parsed.rows && parsed.rows.length > 0) {
          const isManual = parsed.rows[0].hasOwnProperty('row') &&
            parsed.rows[0].row !== undefined &&
            parsed.rows[0].row !== '';

          this.state.wordlist = parsed.rows;
          if (isManual) {
            this.loadManualLayout(parsed.rows);
          } else {
            this.generateRandomPuzzle(this.state.currentDifficulty);
          }
        } else {
          this.loadSamplePuzzle();
        }
      })
      .catch(() => {
        this.loadSamplePuzzle();
      });
  }

  loadSamplePuzzle() {
    const sample = [
      { word: '病院', reading: 'びょういん', meaning: 'hospital', thai_meaning: 'โรงพยาบาล' },
      { word: '冷蔵庫', reading: 'れいぞうこ', meaning: 'refrigerator', thai_meaning: 'ตู้เย็น' },
      { word: '来週', reading: 'らいしゅう', meaning: 'next week', thai_meaning: 'สัปดาห์หน้า' },
      { word: '勉強する', reading: 'べんきょうする', meaning: 'to study', thai_meaning: 'เรียนหนังสือ' },
      { word: '広い', reading: 'ひろい', meaning: 'spacious', thai_meaning: 'กว้างขวาง' },
      { word: '映画', reading: 'えいが', meaning: 'movie', thai_meaning: 'ภาพยนตร์' },
      { word: '水曜日', reading: 'すいようび', meaning: 'Wednesday', thai_meaning: 'วันพุธ' },
      { word: '弁当', reading: 'べんとう', meaning: 'boxed lunch', thai_meaning: 'ข้าวกล่อง' },
      { word: '死ぬ', reading: 'しぬ', meaning: 'to die', thai_meaning: 'ตาย' },
      { word: 'コーヒー', reading: 'こーひー', meaning: 'coffee', thai_meaning: 'กาแฟ' },
      { word: '牛乳', reading: 'ぎゅうにゅう', meaning: 'milk', thai_meaning: 'นม' },
      { word: '外国', reading: 'がいこく', meaning: 'foreign country', thai_meaning: 'ต่างประเทศ' },
      { word: '青い', reading: 'あおい', meaning: 'blue', thai_meaning: 'สีน้ำเงิน' },
      { word: '口', reading: 'くち', meaning: 'mouth', thai_meaning: 'ปาก' },
      { word: '両親', reading: 'りょうしん', meaning: 'both parents', thai_meaning: 'พ่อแม่' },
      { word: '住む', reading: 'すむ', meaning: 'to live', thai_meaning: 'อาศัยอยู่' },
      { word: 'お姉さん', reading: 'おねえさん', meaning: 'older sister', thai_meaning: 'พี่สาว' },
      { word: '病気', reading: 'びょうき', meaning: 'illness', thai_meaning: 'การเจ็บป่วย' },
      { word: '先週', reading: 'せんしゅう', meaning: 'last week', thai_meaning: 'สัปดาห์ที่แล้ว' },
      { word: '狭い', reading: 'せまい', meaning: 'narrow', thai_meaning: 'แคบ' },
    ];
    this.state.wordlist = sample;
    this.generateRandomPuzzle('medium');
  }

  loadManualLayout(words) {
    this.state.gridSize = 15;
    this.state.grid = Array(15).fill(null).map(() => Array(15).fill(null));
    this.state.words = words;

    words.forEach((w, wIdx) => {
      const row = parseInt(w.row);
      const col = parseInt(w.col);
      const dir = w.direction || 'across';
      const syllables = splitIntoSyllables(w.reading || '');

      for (let i = 0; i < syllables.length; i++) {
        const r = dir === 'across' ? row : row + i;
        const c = dir === 'across' ? col + i : col;
        if (r >= 0 && r < 15 && c >= 0 && c < 15) {
          const existing = this.state.grid[r][c];
          this.state.grid[r][c] = {
            char: syllables[i],
            reading: syllables[i],
            wordIndex: wIdx,
            userInput: ''
          };
        }
      }
    });

    this.state.placedWords = words.map((w, i) => ({
      ...w,
      number: w.number ? parseInt(w.number) : i + 1,
      row: parseInt(w.row),
      col: parseInt(w.col),
      direction: w.direction || 'across'
    }));

    if (this.state.placedWords.length > 0 && !this.state.placedWords[0].number) {
      this.assignManualNumbers(this.state.placedWords);
    }

    this.resetGameplayState();

    const firstWord = this.state.placedWords[0];
    if (firstWord) {
      this.state.direction = firstWord.direction;
      this.state.selectedWord = firstWord;
      this.state.selectedCell = { row: firstWord.row, col: firstWord.col };
    }

    this.render();
  }

  assignManualNumbers(placedWords) {
    placedWords.sort((a, b) => {
      if (a.row !== b.row) return a.row - b.row;
      return a.col - b.col;
    });
    placedWords.forEach((w, i) => {
      w.number = i + 1;
    });
  }

  generateRandomPuzzle(difficulty = 'medium') {
    this.state.currentDifficulty = difficulty;

    let size = 13;
    if (difficulty === 'easy') {
      size = 10;
    } else if (difficulty === 'hard') {
      size = 15;
    }

    this.state.gridSize = size;

    const pool = shuffle([...this.state.wordlist]);
    const filteredPool = pool.filter(w => {
      const syllables = splitIntoSyllables(w.reading || '');
      const len = syllables.length;
      if (difficulty === 'easy') return len >= 2 && len <= 5;
      return len >= 2 && len <= 8;
    });

    const candidateCount = difficulty === 'easy' ? 20 : (difficulty === 'medium' ? 35 : 50);
    const candidates = filteredPool.slice(0, candidateCount);

    const result = generatePuzzle(candidates, size);

    if (result && result.words.length >= 4) {
      this.state.grid = result.grid;
      this.state.placedWords = result.words;
      this.state.words = result.words;

      this.resetGameplayState();

      const firstWord = this.state.placedWords[0];
      if (firstWord) {
        this.state.direction = firstWord.direction;
        this.state.selectedWord = firstWord;
        this.state.selectedCell = { row: firstWord.row, col: firstWord.col };
      }

      this.render();
      this.updateDifficultyControls();
    } else {
      this.generateRandomPuzzle(difficulty);
    }
  }

  resetGameplayState() {
    this.state.completedWords.clear();
    this.state.selectedCell = null;
    this.state.selectedWord = null;
    this.state.hintsUsed = 0;
    this.state.timer = 0;
    this.state.romajiBuffer = '';

    if (this.state.timerInterval) {
      clearInterval(this.state.timerInterval);
    }
    this.state.timerInterval = setInterval(() => {
      this.state.timer++;
      this.updateTimer();
    }, 1000);
  }

  setupEventListeners() {
    document.addEventListener('keydown', (e) => this.handleKeydown(e));
    document.addEventListener('click', (e) => this.handleClick(e));

    const selector = document.getElementById('difficulty-selector');
    if (selector) {
      selector.addEventListener('change', (e) => {
        this.generateRandomPuzzle(e.target.value);
      });
    }

    const wlSelector = document.getElementById('wordlist-selector');
    if (wlSelector) {
      wlSelector.addEventListener('change', (e) => {
        this.loadPuzzles(e.target.value);
      });
    }
  }

  handleKeydown(e) {
    const victoryModal = document.getElementById('victory-modal');
    if (victoryModal && !victoryModal.classList.contains('hidden')) return;

    if (!this.state.selectedCell) return;

    const key = e.key;

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      e.preventDefault();
      this.moveSelection(key);
      return;
    }

    if (key === 'Backspace') {
      e.preventDefault();
      if (this.state.romajiBuffer.length > 0) {
        this.state.romajiBuffer = this.state.romajiBuffer.slice(0, -1);
        this.render();
      } else {
        this.deleteChar();
      }
      return;
    }

    if (key === 'Tab') {
      e.preventDefault();
      this.nextWord(e.shiftKey);
      return;
    }

    if (key === ' ') {
      e.preventDefault();
      this.toggleDirection();
      return;
    }

    if (/^[a-zA-Z-]$/.test(key)) {
      e.preventDefault();
      this.inputRomaji(key);
    }
  }

  handleClick(e) {
    const cell = e.target.closest('.cell');
    if (cell) {
      const row = parseInt(cell.dataset.row);
      const col = parseInt(cell.dataset.col);
      this.selectCell(row, col);
      return;
    }

    const clue = e.target.closest('.clue-item');
    if (clue) {
      const number = parseInt(clue.dataset.number);
      const direction = clue.closest('.clues-section').querySelector('h3').textContent.toLowerCase().includes('across') ? 'across' : 'down';
      this.selectWordByNumber(number, direction);
    }
  }

  flushRomajiBuffer() {
    if (this.state.romajiBuffer === 'n' && this.state.selectedCell) {
      const { row, col } = this.state.selectedCell;
      const cell = this.state.grid[row]?.[col];
      if (cell) {
        cell.userInput = 'ん';
        this.checkWordCompletion();
      }
    }
  }

  selectCell(row, col) {
    const cell = this.state.grid[row]?.[col];
    if (!cell) return;

    this.flushRomajiBuffer();

    this.state.selectedCell = { row, col };
    this.state.romajiBuffer = '';

    let word = this.findWordForCell(row, col, this.state.direction);
    if (!word) {
      const otherDir = this.state.direction === 'across' ? 'down' : 'across';
      word = this.findWordForCell(row, col, otherDir);
      if (word) {
        this.state.direction = otherDir;
      }
    }

    if (word) {
      this.state.selectedWord = word;
    }

    this.render();
  }

  findWordForCell(row, col, direction) {
    return this.state.placedWords.find(w => {
      if (w.direction !== direction) return false;
      const syllables = splitIntoSyllables(w.reading || '');
      if (direction === 'across') {
        return w.row === row && col >= w.col && col < w.col + syllables.length;
      } else {
        return w.col === col && row >= w.row && row < w.row + syllables.length;
      }
    });
  }

  selectWordByNumber(number, direction) {
    const word = this.state.placedWords.find(w => w.number === number && w.direction === direction);
    if (!word) return;

    this.flushRomajiBuffer();

    this.state.direction = word.direction;
    this.state.selectedWord = word;
    this.state.selectedCell = { row: word.row, col: word.col };
    this.state.romajiBuffer = '';
    this.render();
  }

  moveSelection(key) {
    if (!this.state.selectedCell) return;
    let { row, col } = this.state.selectedCell;

    this.flushRomajiBuffer();

    if (key === 'ArrowUp') row--;
    if (key === 'ArrowDown') row++;
    if (key === 'ArrowLeft') col--;
    if (key === 'ArrowRight') col++;

    const size = this.state.gridSize;
    if (row < 0 || row >= size || col < 0 || col >= size) return;
    if (!this.state.grid[row][col]) return;

    this.state.selectedCell = { row, col };
    this.state.romajiBuffer = '';

    const word = this.findWordForCell(row, col, this.state.direction);
    if (word) {
      this.state.selectedWord = word;
    } else {
      const otherDir = this.state.direction === 'across' ? 'down' : 'across';
      const oWord = this.findWordForCell(row, col, otherDir);
      if (oWord) {
        this.state.direction = otherDir;
        this.state.selectedWord = oWord;
      }
    }

    this.render();
  }

  deleteChar() {
    if (!this.state.selectedCell) return;
    const { row, col } = this.state.selectedCell;
    const cell = this.state.grid[row][col];
    if (!cell) return;

    if (cell.userInput) {
      cell.userInput = '';
      this.checkWordCompletion();
      this.render();
    } else {
      this.moveBackward();
    }
  }

  moveBackward() {
    if (!this.state.selectedCell || !this.state.selectedWord) return;
    const { row, col } = this.state.selectedCell;
    const word = this.state.selectedWord;

    let prevRow, prevCol;
    if (word.direction === 'across') {
      prevRow = row;
      prevCol = col - 1;
    } else {
      prevRow = row - 1;
      prevCol = col;
    }

    if (prevRow >= 0 && prevCol >= 0 && this.state.grid[prevRow]?.[prevCol]) {
      this.state.selectedCell = { row: prevRow, col: prevCol };
      this.render();
    }
  }

  inputRomaji(key) {
    if (!this.state.selectedCell) return;
    const { row, col } = this.state.selectedCell;
    const cell = this.state.grid[row][col];
    if (!cell) return;

    this.state.romajiBuffer += key.toLowerCase();
    const match = getLongestRomajiMatch(this.state.romajiBuffer);

    if (match.matched) {
      cell.userInput = match.kana;
      this.state.romajiBuffer = match.remainder;
      this.checkWordCompletion();
      this.moveToNextCell();
    }

    this.render();
  }

  moveToNextCell() {
    if (!this.state.selectedCell || !this.state.selectedWord) return;
    const { row, col } = this.state.selectedCell;
    const word = this.state.selectedWord;

    let nextRow, nextCol;
    if (word.direction === 'across') {
      nextRow = row;
      nextCol = col + 1;
    } else {
      nextRow = row + 1;
      nextCol = col;
    }

    const syllables = splitIntoSyllables(word.reading || '');
    const wordLen = syllables.length;
    const wordStart = word.direction === 'across' ? word.col : word.row;
    const currentPos = word.direction === 'across' ? col : row;

    if (currentPos - wordStart < wordLen) {
      if (nextRow >= 0 && nextRow < 15 && nextCol >= 0 && nextCol < 15) {
        this.state.selectedCell = { row: nextRow, col: nextCol };
      }
    }
  }

  checkWordCompletion() {
    if (!this.state.selectedWord) return;

    this.state.placedWords.forEach(w => {
      const syllables = splitIntoSyllables(w.reading || '');
      const wordLen = syllables.length;
      let correct = true;
      let filled = true;

      for (let i = 0; i < wordLen; i++) {
        const r = w.direction === 'across' ? w.row : w.row + i;
        const c = w.direction === 'across' ? w.col + i : w.col;
        const cell = this.state.grid[r]?.[c];

        if (!cell || !cell.userInput) {
          filled = false;
          correct = false;
          break;
        }
        if (cell.userInput !== cell.char) {
          correct = false;
        }
      }

      const key = `${w.number}_${w.direction}`;
      if (filled && correct) {
        this.state.completedWords.add(key);
      } else {
        this.state.completedWords.delete(key);
      }
    });

    this.checkVictory();
  }

  toggleDirection() {
    this.state.direction = this.state.direction === 'across' ? 'down' : 'across';
    if (this.state.selectedCell) {
      const word = this.findWordForCell(
        this.state.selectedCell.row,
        this.state.selectedCell.col,
        this.state.direction
      );
      if (word) {
        this.state.selectedWord = word;
      }
    }
    this.render();
  }

  nextWord(reverse) {
    if (!this.state.selectedWord) return;
    const currentNum = this.state.selectedWord.number;
    const direction = this.state.direction;

    const words = this.state.placedWords
      .filter(w => w.direction === direction)
      .sort((a, b) => a.number - b.number);

    if (words.length === 0) return;

    const idx = words.findIndex(w => w.number === currentNum);
    let nextIdx;
    if (reverse) {
      nextIdx = idx > 0 ? idx - 1 : words.length - 1;
    } else {
      nextIdx = idx < words.length - 1 ? idx + 1 : 0;
    }

    this.selectWordByNumber(words[nextIdx].number, direction);
  }

  useHint() {
    if (this.state.hintsUsed >= this.state.maxHints) return;
    if (!this.state.selectedCell) return;

    const { row, col } = this.state.selectedCell;
    const cell = this.state.grid[row]?.[col];
    if (!cell) return;

    if (cell.userInput !== cell.char) {
      cell.userInput = cell.char;
      this.state.hintsUsed++;
      this.checkWordCompletion();
      this.render();
    }
  }

  revealWord() {
    if (!this.state.selectedWord) return;
    const word = this.state.selectedWord;
    const syllables = splitIntoSyllables(word.reading || '');
    const wordLen = syllables.length;

    for (let i = 0; i < wordLen; i++) {
      let r, c;
      if (word.direction === 'across') {
        r = word.row;
        c = word.col + i;
      } else {
        r = word.row + i;
        c = word.col;
      }

      const cell = this.state.grid[r]?.[c];
      if (cell) {
        cell.userInput = cell.char;
      }
    }

    this.checkWordCompletion();
    this.render();
  }

  toggleClues() {
    this.state.showClues = !this.state.showClues;
    this.render();
  }

  toggleHints() {
    this.state.showHints = !this.state.showHints;
    this.render();
  }

  checkAnswers() {
    this.state.placedWords.forEach(word => {
      const syllables = splitIntoSyllables(word.reading || '');
      const wordLen = syllables.length;
      let correct = true;
      let filled = true;

      for (let i = 0; i < wordLen; i++) {
        let r, c;
        if (word.direction === 'across') {
          r = word.row;
          c = word.col + i;
        } else {
          r = word.row + i;
          c = word.col;
        }

        const cell = this.state.grid[r]?.[c];
        if (!cell || !cell.userInput) {
          filled = false;
          correct = false;
          break;
        }
        if (cell.userInput !== syllables[i]) {
          correct = false;
        }
      }

      const key = `${word.number}_${word.direction}`;
      if (filled && correct) {
        this.state.completedWords.add(key);
      } else {
        this.state.completedWords.delete(key);
      }
    });

    this.checkVictory();
    this.render();
  }

  checkVictory() {
    let allCorrect = true;
    for (let r = 0; r < this.state.gridSize; r++) {
      for (let c = 0; c < this.state.gridSize; c++) {
        const cell = this.state.grid[r][c];
        if (cell) {
          if (cell.userInput !== cell.char) {
            allCorrect = false;
            break;
          }
        }
      }
      if (!allCorrect) break;
    }

    if (allCorrect) {
      if (this.state.timerInterval) {
        clearInterval(this.state.timerInterval);
        this.state.timerInterval = null;
      }
      setTimeout(() => this.showVictoryModal(), 600);
    }
  }

  showVictoryModal() {
    const modal = document.getElementById('victory-modal');
    if (!modal) return;

    const timeEl = document.getElementById('victory-time');
    if (timeEl) {
      const mins = Math.floor(this.state.timer / 60);
      const secs = this.state.timer % 60;
      timeEl.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
    }

    const hintsEl = document.getElementById('victory-hints');
    if (hintsEl) {
      hintsEl.textContent = `${this.state.hintsUsed} / ${this.state.maxHints}`;
    }

    const listEl = document.getElementById('victory-words-list');
    if (listEl) {
      const sortedWords = [...this.state.placedWords].sort((a, b) => {
        if (a.direction !== b.direction) {
          return a.direction === 'across' ? -1 : 1;
        }
        return a.number - b.number;
      });

      listEl.innerHTML = sortedWords.map(w =>
        `<div class="victory-word-item">
          <span class="victory-word-number">${w.number} ${w.direction.toUpperCase()}</span>
          <span class="victory-word-kanji">${w.word}</span>
          <span class="victory-word-kana">(${w.reading})</span>
          <span class="victory-word-meaning">${w.meaning}${w.thai_meaning ? ` / ${w.thai_meaning}` : ''}</span>
        </div>`
      ).join('');
    }

    modal.classList.remove('hidden');
  }

  closeVictoryModal() {
    const modal = document.getElementById('victory-modal');
    if (modal) modal.classList.add('hidden');
  }

  closeVictoryModalAndPlayAgain() {
    this.closeVictoryModal();
    this.generateRandomPuzzle(this.state.currentDifficulty);
  }

  render() {
    this.renderGrid();
    this.renderClues();
    this.renderActiveCluesBanner();
    this.updateTimer();
    this.updateProgress();
    this.updateHints();
  }

  getRomajiFromKana(kana) {
    const match = Object.entries(ROMAJI_MAP).find(([key, val]) => val === kana);
    return match ? match[0] : '';
  }

  renderGrid() {
    const gridEl = document.getElementById('grid');
    if (!gridEl) return;

    const size = this.state.gridSize;
    gridEl.style.setProperty('--grid-size', size);

    let html = '';

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = this.state.grid[r][c];
        if (!cell) {
          html += '<div class="cell empty"></div>';
          continue;
        }

        const isSelected = this.state.selectedCell?.row === r && this.state.selectedCell?.col === c;
        const isCompleted = this.isCellCompleted(r, c);
        const isCurrentWord = this.isCellInCurrentWord(r, c);
        const hasHint = cell.userInput && cell.userInput !== cell.char;

        let classes = 'cell';
        if (isSelected) classes += ' selected';
        if (isCompleted) classes += ' completed';
        if (isCurrentWord && !isCompleted) classes += ' current-word';
        if (hasHint) classes += ' incorrect';

        const wordNum = this.getWordNumber(r, c);
        const numHtml = wordNum ? '<span class="cell-number">' + wordNum + '</span>' : '';

        const readingHtml = this.state.showHints && cell.char
          ? '<span class="reading">' + this.getRomajiFromKana(cell.char) + '</span>'
          : '';

        let displayChar = cell.userInput || '';
        if (isSelected && this.state.romajiBuffer) {
          displayChar += '<span class="romaji-buffer">' + this.state.romajiBuffer + '</span>';
        }

        html += '<div class="' + classes + '" data-row="' + r + '" data-col="' + c + '">' +
          numHtml + readingHtml +
          '<span class="cell-char">' + displayChar + '</span></div>';
      }
    }

    gridEl.innerHTML = html;
  }

  isCellCompleted(row, col) {
    const cell = this.state.grid[row]?.[col];
    if (!cell || !cell.userInput) return false;
    return cell.userInput === cell.char;
  }

  isCellInCurrentWord(row, col) {
    if (!this.state.selectedWord) return false;
    const word = this.state.selectedWord;
    const syllables = splitIntoSyllables(word.reading || '');
    if (word.direction === 'across') {
      return word.row === row && col >= word.col && col < word.col + syllables.length;
    } else {
      return word.col === col && row >= word.row && row < word.row + syllables.length;
    }
  }

  getWordNumber(row, col) {
    const word = this.state.placedWords.find(w => w.row === row && w.col === col);
    return word ? word.number : null;
  }

  renderClues() {
    const acrossEl = document.getElementById('clues-across');
    const downEl = document.getElementById('clues-down');
    if (!acrossEl || !downEl) return;

    const across = this.state.placedWords
      .filter(w => w.direction === 'across')
      .sort((a, b) => a.number - b.number);

    const down = this.state.placedWords
      .filter(w => w.direction === 'down')
      .sort((a, b) => a.number - b.number);

    acrossEl.innerHTML = across.map(w => this.renderClueItem(w)).join('');
    downEl.innerHTML = down.map(w => this.renderClueItem(w)).join('');
  }

  renderClueItem(word) {
    const isCompleted = this.state.completedWords.has(`${word.number}_${word.direction}`);
    const isSelected = this.state.selectedWord?.number === word.number && this.state.selectedWord?.direction === word.direction;

    let classes = 'clue-item';
    if (isCompleted) classes += ' completed';
    if (isSelected) classes += ' selected';

    return '<div class="' + classes + '" data-number="' + word.number + '">' +
      '<span class="clue-number">' + word.number + '</span>' +
      '<span class="clue-meaning">' + (word.meaning || '') + (word.thai_meaning ? ' / ' + word.thai_meaning : '') + '</span></div>';
  }

  renderActiveCluesBanner() {
    const bannerEl = document.getElementById('active-clues-banner');
    if (!bannerEl) return;

    if (!this.state.selectedCell) {
      bannerEl.innerHTML = '<div class="active-clue-placeholder">Select a crossword cell to see clues here</div>';
      return;
    }

    const { row, col } = this.state.selectedCell;
    const words = this.getWordsForCell(row, col);

    if (words.length === 0) {
      bannerEl.innerHTML = '<div class="active-clue-placeholder">Select a crossword cell to see clues here</div>';
      return;
    }

    let html = '';
    words.forEach(w => {
      const isCompleted = this.state.completedWords.has(`${w.number}_${w.direction}`);
      const isSelected = this.state.selectedWord?.number === w.number && this.state.selectedWord?.direction === w.direction;
      const isAcross = w.direction === 'across';

      let classes = 'active-clue-item';
      if (isCompleted) classes += ' completed';
      if (isSelected) classes += ' selected';

      html += '<div class="' + classes + '" onclick="game.toggleActiveClueDirection(\'' + w.direction + '\')">' +
        '<span class="direction-badge ' + w.direction + '">' + (isAcross ? 'Across' : 'Down') + '</span>' +
        '<span class="active-clue-number">' + w.number + '</span>' +
        '<span class="active-clue-text">' + (w.meaning || '') + (w.thai_meaning ? ' / ' + w.thai_meaning : '') + '</span>' +
        '</div>';
    });

    bannerEl.innerHTML = html;
  }

  getWordsForCell(row, col) {
    return this.state.placedWords.filter(w => {
      const syllables = splitIntoSyllables(w.reading || '');
      if (w.direction === 'across') {
        return w.row === row && col >= w.col && col < w.col + syllables.length;
      } else {
        return w.col === col && row >= w.row && row < w.row + syllables.length;
      }
    });
  }

  toggleActiveClueDirection(direction) {
    if (this.state.selectedCell) {
      const { row, col } = this.state.selectedCell;
      const word = this.findWordForCell(row, col, direction);
      if (word) {
        this.state.direction = direction;
        this.state.selectedWord = word;
        this.render();
      }
    }
  }

  setupKeyboard() {
    const container = document.getElementById('on-screen-keyboard');
    if (!container) return;

    const keys = container.querySelectorAll('.osk-key');
    keys.forEach(key => {
      let startX = 0, startY = 0, startTime = 0;
      let isTracking = false;

      const onStart = (x, y) => {
        startX = x;
        startY = y;
        startTime = Date.now();
        isTracking = true;
        key.classList.add('osk-key-pressed');
      };

      const onEnd = (x, y) => {
        if (!isTracking) return;
        isTracking = false;
        key.classList.remove('osk-key-pressed');

        const dx = x - startX;
        const dy = y - startY;
        const elapsed = Date.now() - startTime;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let direction = 'center';
        if (dist > 20 && elapsed < 1000) {
          if (Math.abs(dx) > Math.abs(dy)) {
            direction = dx > 0 ? 'right' : 'left';
          } else {
            direction = dy > 0 ? 'down' : 'up';
          }
        }

        key.classList.add('osk-key-flicked');
        setTimeout(() => key.classList.remove('osk-key-flicked'), 120);

        const action = key.dataset.action;
        if (action === 'backspace') {
          this.handleBackspace();
          return;
        }
        if (action === 'space') {
          this.handleSpace();
          return;
        }
        if (action === 'dakuten') {
          this.handleDakuten(direction);
          return;
        }

        const keyLabel = key.dataset.key;
        const kana = this.getFlickKana(keyLabel, direction);
        if (kana) {
          this.handleKeyInput(kana);
        }
      };

      key.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const t = e.touches[0];
        onStart(t.clientX, t.clientY);
      }, { passive: false });

      key.addEventListener('touchend', (e) => {
        e.preventDefault();
        const t = e.changedTouches[0];
        onEnd(t.clientX, t.clientY);
      }, { passive: false });

      key.addEventListener('touchmove', (e) => {
        e.preventDefault();
      }, { passive: false });

      key.addEventListener('touchcancel', (e) => {
        isTracking = false;
        key.classList.remove('osk-key-pressed');
      });

      let endX = 0, endY = 0;

      key.addEventListener('mousedown', (e) => {
        e.preventDefault();
        endX = e.clientX;
        endY = e.clientY;
        onStart(e.clientX, e.clientY);
      });

      document.addEventListener('mousemove', (e) => {
        if (!isTracking) return;
        endX = e.clientX;
        endY = e.clientY;
      });

      document.addEventListener('mouseup', (e) => {
        if (!isTracking) return;
        onEnd(endX, endY);
      });
    });
  }

  getFlickKana(key, direction) {
    const flickMap = {
      a: { center: 'あ', up: 'う', left: 'い', right: 'え', down: 'お' },
      k: { center: 'か', up: 'く', left: 'き', right: 'け', down: 'こ' },
      s: { center: 'さ', up: 'す', left: 'し', right: 'せ', down: 'そ' },
      t: { center: 'た', up: 'つ', left: 'ち', right: 'て', down: 'と' },
      n: { center: 'な', up: 'ぬ', left: 'に', right: 'ね', down: 'の' },
      h: { center: 'は', up: 'ふ', left: 'ひ', right: 'へ', down: 'ほ' },
      m: { center: 'ま', up: 'む', left: 'み', right: 'め', down: 'も' },
      y: { center: 'や', up: 'ゆ', down: 'よ' },
      r: { center: 'ら', up: 'る', left: 'り', right: 'れ', down: 'ろ' },
      w: { center: 'わ', up: 'ん', left: 'を', right: 'ー', down: '〜' },
    };
    const map = flickMap[key];
    return map ? map[direction] || null : null;
  }

  handleKeyInput(kana) {
    if (!this.state.selectedCell) return;
    const { row, col } = this.state.selectedCell;
    const cell = this.state.grid[row]?.[col];
    if (!cell) return;

    if (kana === 'ー') {
      cell.userInput = (cell.userInput || '') + 'ー';
      this.checkWordCompletion();
      this.moveToNextCell();
      this.render();
      return;
    }

    if (['ゃ', 'ゅ', 'ょ'].includes(kana)) {
      const prevCell = this.getPreviousCell();
      if (prevCell) {
        const base = prevCell.userInput || '';
        if (base.length === 1 && this.canCombine(base, kana)) {
          prevCell.userInput = base + kana;
          this.checkWordCompletion();
          this.moveToNextCell();
          this.render();
          return;
        }
      }
      cell.userInput = kana;
      this.checkWordCompletion();
      this.moveToNextCell();
      this.render();
      return;
    }

    cell.userInput = kana;
    this.checkWordCompletion();
    this.moveToNextCell();
    this.render();
  }

  canCombine(base, small) {
    const ya = ['き', 'し', 'ち', 'に', 'ひ', 'み', 'り', 'ぎ', 'じ', 'び', 'ぴ'];
    const yu = ['き', 'く', 'し', 'す', 'ち', 'つ', 'に', 'ぬ', 'ひ', 'ふ', 'み', 'む', 'り', 'る', 'ぎ', 'ぐ', 'じ', 'ず', 'び', 'ぶ', 'ぴ', 'ぷ'];
    const yo = ['き', 'け', 'こ', 'し', 'せ', 'そ', 'ち', 'て', 'と', 'に', 'ね', 'の', 'ひ', 'へ', 'ほ', 'み', 'め', 'も', 'り', 'れ', 'ろ', 'ぎ', 'げ', 'ご', 'じ', 'ぜ', 'ぞ', 'び', 'べ', 'ぼ', 'ぴ', 'ぺ', 'ぽ'];
    if (small === 'ゃ') return ya.includes(base);
    if (small === 'ゅ') return yu.includes(base);
    if (small === 'ょ') return yo.includes(base);
    return false;
  }

  getPreviousCell() {
    if (!this.state.selectedCell || !this.state.selectedWord) return null;
    const { row, col } = this.state.selectedCell;
    const word = this.state.selectedWord;

    let prevRow, prevCol;
    if (word.direction === 'across') {
      prevRow = row;
      prevCol = col - 1;
    } else {
      prevRow = row - 1;
      prevCol = col;
    }

    if (prevRow >= 0 && prevCol >= 0 && this.state.grid[prevRow]?.[prevCol]) {
      return this.state.grid[prevRow][prevCol];
    }
    return null;
  }

  handleBackspace() {
    if (this.state.romajiBuffer.length > 0) {
      this.state.romajiBuffer = this.state.romajiBuffer.slice(0, -1);
      this.render();
      return;
    }
    this.deleteChar();
  }

  handleSpace() {
    this.toggleDirection();
  }

  handleDakuten(direction) {
    if (!this.state.selectedCell || !this.state.selectedWord) return;
    const prevCell = this.getPreviousCell();
    if (!prevCell || !prevCell.userInput) return;

    const { row, col } = this.state.selectedCell;
    const word = this.state.selectedWord;

    let prevRow, prevCol;
    let prevPrevRow, prevPrevCol;

    if (word.direction === 'across') {
      prevRow = row;
      prevCol = col - 1;
      prevPrevRow = row;
      prevPrevCol = col - 2;
    } else {
      prevRow = row - 1;
      prevCol = col;
      prevPrevRow = row - 2;
      prevPrevCol = col;
    }

    const kana = prevCell.userInput;
    const toBaseDakuten = this.dakutenToBase[kana];
    const toBaseHanda = this.handakutenToBase[kana];

    let converted = null;

    if (kana.length === 2) {
      // Handle 2-character Yōon (e.g. しゃ -> じゃ)
      const base = kana[0];
      const small = kana[1];
      let convertedBase = null;

      if (this.baseToDakuten[base] || this.baseToHandakuten[base]) {
        convertedBase = this.baseToDakuten[base] || this.baseToHandakuten[base];
      } else if (this.dakutenToBase[base]) {
        if (this.baseToHandakuten[this.dakutenToBase[base]]) {
          convertedBase = this.baseToHandakuten[this.dakutenToBase[base]];
        } else {
          convertedBase = this.dakutenToBase[base];
        }
      } else if (this.handakutenToBase[base]) {
        convertedBase = this.handakutenToBase[base];
      }

      if (convertedBase) {
        converted = convertedBase + small;
      }
    } else {
      // Standard 1-character logic
      if (this.baseToDakuten[kana] || this.baseToHandakuten[kana]) {
        converted = this.baseToDakuten[kana];
      } else if (toBaseDakuten) {
        if (this.baseToHandakuten[toBaseDakuten]) {
          converted = this.baseToHandakuten[toBaseDakuten];
        } else {
          converted = toBaseDakuten;
        }
      } else if (toBaseHanda) {
        converted = toBaseHanda;
      } else if (this.smallToNormal[kana]) {
        converted = this.smallToNormal[kana];
      } else if (this.normalToSmall[kana]) {
        converted = this.normalToSmall[kana];
      }
    }

    if (converted && converted !== kana) {
      // Check if we converted to a small Yōon (ゃ, ゅ, ょ) and can merge with the previous cell
      if (['ゃ', 'ゅ', 'ょ'].includes(converted)) {
        const prevPrevCell = (prevPrevRow >= 0 && prevPrevCol >= 0) ? this.state.grid[prevPrevRow]?.[prevPrevCol] : null;
        if (prevPrevCell && prevPrevCell.userInput && prevPrevCell.userInput.length === 1) {
          const base = prevPrevCell.userInput;
          if (this.canCombine(base, converted)) {
            prevPrevCell.userInput = base + converted;
            prevCell.userInput = ''; // clear the merged cell
            
            // Move cursor back to the cleared cell
            this.state.selectedCell = { row: prevRow, col: prevCol };
            
            this.checkWordCompletion();
            this.render();
            return;
          }
        }
      }

      // Default: just apply conversion to prevCell
      prevCell.userInput = converted;
      this.checkWordCompletion();
      this.render();
    }
  }

  baseToDakuten = {
    'か': 'が', 'き': 'ぎ', 'く': 'ぐ', 'け': 'げ', 'こ': 'ご',
    'さ': 'ざ', 'し': 'じ', 'す': 'ず', 'せ': 'ぜ', 'そ': 'ぞ',
    'た': 'だ', 'ち': 'ぢ', 'つ': 'づ', 'て': 'で', 'と': 'ど',
    'は': 'ば', 'ひ': 'び', 'ふ': 'ぶ', 'へ': 'べ', 'ほ': 'ぼ',
  };

  baseToHandakuten = {
    'は': 'ぱ', 'ひ': 'ぴ', 'ふ': 'ぷ', 'へ': 'ぺ', 'ほ': 'ぽ',
  };

  dakutenToBase = {
    'が': 'か', 'ぎ': 'き', 'ぐ': 'く', 'げ': 'け', 'ご': 'こ',
    'ざ': 'さ', 'じ': 'し', 'ず': 'す', 'ぜ': 'せ', 'ぞ': 'そ',
    'だ': 'た', 'ぢ': 'ち', 'づ': 'つ', 'で': 'て', 'ど': 'と',
    'ば': 'は', 'び': 'ひ', 'ぶ': 'ふ', 'べ': 'へ', 'ぼ': 'ほ',
  };

  handakutenToBase = {
    'ぱ': 'は', 'ぴ': 'ひ', 'ぷ': 'ふ', 'ぺ': 'へ', 'ぽ': 'ほ',
  };

  normalToSmall = {
    'あ': 'ぁ', 'い': 'ぃ', 'う': 'ぅ', 'え': 'ぇ', 'お': 'ぉ',
    'つ': 'っ', 'や': 'ゃ', 'ゆ': 'ゅ', 'よ': 'ょ', 'を': 'ゎ',
  };

  smallToNormal = {
    'ぁ': 'あ', 'ぃ': 'い', 'ぅ': 'う', 'ぇ': 'え', 'ぉ': 'お',
    'っ': 'つ', 'ゃ': 'や', 'ゅ': 'ゆ', 'ょ': 'よ', 'ゎ': 'を',
  };

  toggleKeyboard() {
    this.state.keyboardVisible = !this.state.keyboardVisible;
    const container = document.getElementById('on-screen-keyboard');
    const toggle = document.getElementById('keyboard-toggle');

    if (this.state.keyboardVisible) {
      container.classList.remove('hidden');
      toggle.classList.add('active');
      document.body.classList.add('osk-visible');
    } else {
      container.classList.add('hidden');
      toggle.classList.remove('active');
      document.body.classList.remove('osk-visible');
    }
  }

  updateTimer() {
    const timerEl = document.getElementById('timer');
    if (!timerEl) return;

    const mins = Math.floor(this.state.timer / 60);
    const secs = this.state.timer % 60;
    timerEl.textContent = String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
  }

  updateProgress() {
    const progressEl = document.getElementById('progress');
    if (!progressEl) return;

    const total = this.state.placedWords.length;
    const completed = this.state.completedWords.size;
    progressEl.textContent = completed + '/' + total;

    const dotsEl = document.getElementById('progress-dots');
    if (dotsEl) {
      let dots = '';
      for (let i = 0; i < total; i++) {
        const w = this.state.placedWords[i];
        const isCompleted = this.state.completedWords.has(`${w.number}_${w.direction}`);
        dots += '<span class="dot' + (isCompleted ? ' completed' : '') + '"></span>';
      }
      dotsEl.innerHTML = dots;
    }
  }

  updateHints() {
    const hintsEl = document.getElementById('hints-remaining');
    if (!hintsEl) return;
    hintsEl.textContent = this.state.maxHints - this.state.hintsUsed;
  }

  updateDifficultyControls() {
    const selector = document.getElementById('difficulty-selector');
    if (selector) {
      selector.value = this.state.currentDifficulty;
    }
  }

  exportPuzzle() {
    const headers = ['word', 'reading', 'meaning', 'thai_meaning'];
    const csv = rowsToCSV(headers, this.state.placedWords);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'crossword_puzzle.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  importPuzzle(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target.result);
      if (parsed.rows && parsed.rows.length > 0) {
        const isManual = parsed.rows[0].hasOwnProperty('row') &&
          parsed.rows[0].row !== undefined &&
          parsed.rows[0].row !== '';

        this.state.wordlist = parsed.rows;
        if (isManual) {
          this.loadManualLayout(parsed.rows);
        } else {
          this.generateRandomPuzzle('medium');
        }
      }
    };
    reader.readAsText(file);
  }
}
