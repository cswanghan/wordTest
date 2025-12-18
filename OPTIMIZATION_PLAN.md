# 🦁 Lion Festival Spelling - Optimization Plan

## Phase 1: 感官觉醒 (Sensory & Feedback)
- [ ] **Task 1.1: 听觉交互 (Text-to-Speech)**
  - [ ] Implement `speakWord(text)` utility using `window.speechSynthesis`.
  - [ ] Add "Listen" button in the UI (`views.js`).
  - [ ] Auto-play sound on new word appearance (optional toggle).
- [ ] **Task 1.2: 视觉反馈 (Visual FX)**
  - [ ] Add CSS keyframes for "Shake" animation (Error feedback).
  - [ ] Integrate `canvas-confetti` library (Success feedback).
  - [ ] Trigger effects in `main.js` based on input validation.

## Phase 2: 核心玩法 (Core Gameplay Loop)
- [ ] **Task 2.1: 连击系统 (Combo Streak)**
  - [ ] Update `state` in `main.js` to track `currentStreak` and `maxStreak`.
  - [ ] Update `views.js` to display a dynamic Combo counter.
  - [ ] Reset streak on error; increment on success.
- [ ] **Task 2.2: 计分升级 (Scoring V2)**
  - [ ] Refactor `calculateScore` in `utils.js` to include streak multipliers.
  - [ ] Show detailed score breakdown in the Summary view.

## Phase 3: 长期留存 (Meta & Progression)
- [ ] **Task 3.1: 数据持久化 (Persistence)**
  - [ ] Expand `User` model in `auth.js` to store `coins` and `unlockedItems`.
  - [ ] Persist `maxStreak` to global stats.
- [ ] **Task 3.2: 奖励系统 (Rewards)**
  - [ ] Create a simple "Theme Store" or "Badge" UI.
  - [ ] Implement unlocking logic based on coin balance.
