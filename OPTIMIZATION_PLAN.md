# 🦁 Lion Festival Spelling - Optimization Plan

## Phase 1: 感官觉醒 (Sensory & Feedback)
- [x] **Task 1.1: 听觉交互 (Text-to-Speech)**
  - [x] Implement `speakWord(text)` utility using `window.speechSynthesis`.
  - [x] Add "Listen" button in the UI (`views.js`).
  - [x] Auto-play sound on new word appearance.
- [x] **Task 1.2: 视觉反馈 (Visual FX)**
  - [x] Add CSS keyframes for "Shake" animation (Error feedback).
  - [x] Integrate `canvas-confetti` library (Success feedback).
  - [x] Trigger effects in `main.js` based on input validation.

## Phase 2: 核心玩法 (Core Gameplay Loop)
- [x] **Task 2.1: 连击系统 (Combo Streak)**
  - [x] Update `state` in `main.js` to track `currentStreak` and `maxStreak`.
  - [x] Update `views.js` to display a dynamic Combo counter.
  - [x] Reset streak on error; increment on success.
- [x] **Task 2.2: 计分升级 (Scoring V2)**
  - [x] Refactor `calculateScore` in `utils.js` to include streak multipliers.
  - [x] Show detailed score breakdown in the Summary view.

## Phase 3: 长期留存 (Meta & Progression)
- [x] **Task 3.1: 数据持久化 (Persistence)**
  - [x] Expand `User` model in `auth.js` to store `coins` and `unlockedItems`.
  - [x] Persist `maxStreak` to global stats.
- [x] **Task 3.2: 奖励系统 (Rewards)**
  - [x] Create a simple "Theme Store" or "Badge" UI.
  - [x] Implement unlocking logic based on coin balance.
