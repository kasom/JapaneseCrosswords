# 🧩 Japanese Crosswords (日本語クロスワード)

An interactive, responsive, and beautifully designed web-based crossword game to help learners practice and reinforce Japanese vocabulary, readings, and writing systems. Play directly in your browser with dynamic, on-the-fly generated puzzles!

👉 **[Play Japanese Crosswords Live](https://kasom.github.io/JapaneseCrosswords/)**

---

## 🌟 Key Features

- **Infinite Replayability**: Generates crosswords dynamically using an intersection-density scoring algorithm. Every session offers a fresh layout and combination of words!
- **Categorized Wordlists**:
  - **General Japanese**: A rich set of common nouns, verbs, and phrases.
  - **Verbs & Adjectives**: Focuses on actions and descriptors.
  - **JLPT N5**: Ideal for beginners studying for the JLPT N5 exam.
  - **JLPT N4**: Vocabulary suited for intermediate learners.
  - **Numbers & Counters**: Perfect for practicing tricky irregular counter readings (e.g., 一本 / いっぽん, 一日 / ついたち, 二十歳 / はたち).
- **Flexible Grid Sizes**: Select between **Small (10x10)**, **Medium (13x13)**, or **Large (15x15)** grid layouts based on your preference and difficulty level.
- **Smart Input Methods**:
  - **Keyboard Romaji-to-Kana Engine**: Type directly in Romaji on physical/virtual keyboards (e.g., typing `ka` converts to `か`, `tsu`/`tu` to `つ`, `ss` to double consonant `っ`), enabling smooth input without installing a Japanese IME.
  - **Mobile 12-Key Flick Keyboard**: A built-in virtual keyboard optimized for mobile devices. Tap to enter the center kana, or flick up/down/left/right to input variant kana. Includes dakuten/handakuten and small kana toggle keys (`゛゜`).
- **Interactive Hints & Assists**:
  - **Romaji Hints**: Toggle phonetic Romaji guide characters above filled cells.
  - **Reveal Cell**: Instantly fill the correct kana for the selected cell.
  - **Reveal Word**: Reveal the entire word for a difficult clue.
  - **Active Clues Banner**: A sticky indicator displaying the current clue context directly below the grid—ideal for mobile vertical screens.
- **Victory Statistics & Vocab Recap**: A statistics summary screen displaying time taken and hints used, alongside a vocabulary recap table showing Kanji, Hiragana/Katakana, English definitions, and Thai translations side-by-side.
- **Bilingual Interface**: Word clues and vocabulary recaps are presented in both **English and Thai** (e.g., `hospital / โรงพยาบาล`).

---

## 🛠️ Technology Stack

- **Frontend**: Vanilla HTML5, CSS3, ES6 JavaScript.
- **Styling**: Curated dark theme built with modern CSS custom properties (variables), backdrop filters (glassmorphism), responsive media queries, and Google Fonts (`Outfit`).
- **Data Engine**: Custom lightweight CSV parser (`js/csvParser.js`) that dynamically fetches and processes wordlist data.
- **Generator**: Custom backtracking grid algorithm (`js/puzzleGenerator.js`) optimized to compute placements based on grid intersections and distance from the center.

---

## 🚀 How to Run Locally

Since this is a fully static client-side web application, running it locally is extremely simple:

1. Clone this repository:
   ```bash
   git clone https://github.com/kasom/JapaneseCrosswords.git
   ```
2. Navigate to the project folder:
   ```bash
   cd JapaneseCrosswords
   ```
3. Open `index.html` in your favorite web browser (e.g., double-click the file or open it via terminal).
4. *Alternatively*, serve it using a lightweight local server:
   ```bash
   npx serve .
   # or
   python3 -m http.server 8000
   ```

---

## 📂 Project Structure

- `index.html` — The main game layout, structure, and HTML controls.
- `css/`
  - `style.css` — Custom CSS styles, dark-theme styling, responsive layouts, victory modal, and flick keyboard styles.
- `js/`
  - `game.js` — Core game state, timer, UI event handling, input processing, and victory condition checking.
  - `puzzleGenerator.js` — Crossword placement algorithm and intersection calculations.
  - `romaji.js` — Romaji-to-Kana translation mapper and buffers.
  - `csvParser.js` — Light utility to read and write CSV vocabulary files.
- `data/` — CSV vocabulary lists organized by category (General, Verbs & Adjectives, JLPT levels, Numbers & Counters).

---

## 🤝 Contributing

Contributions, feedback, and word list suggestions are welcome! Feel free to open an issue or submit a pull request on the [GitHub Repository](https://github.com/kasom/JapaneseCrosswords).

Enjoy learning Japanese through puzzles! 🎌🧩
