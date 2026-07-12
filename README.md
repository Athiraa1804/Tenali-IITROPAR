# Tenali Platform: Feature & Implementation Guide

Welcome to the **Tenali Educational Platform**! This document provides an overview of the platform's core architectural features, specifically focusing on the recent **Learn-Test Gateway**, the **Pedagogical Framework**, and the **Adaptive Quiz UI**.

---

## 1. The Learn-Test Gateway (Pedagogical Framework)

### Overview
To ensure students focus on deep conceptual understanding rather than just rote practice, Tenali implements a **Learn-Test Gateway**. Users are mandated to navigate through structured, step-by-step learning materials for each topic *before* they are allowed to attempt the quiz.

### 5-Block Pedagogical Structure
Every learning module across the platform is built on a strict **5-block pedagogical framework** designed to maximize student retention and clarify common misunderstandings.

1. **The Core Concept**: High-level introduction and intuition behind the topic.
2. **The Rules**: The strict mathematical or logical rules required to solve the problem.
3. **Step-by-Step Method**: A structured algorithm detailing exactly how to execute the rules.
4. **Worked Example**: A fully solved problem demonstrating the method in action.
5. **Common Pitfalls**: A critical warning section highlighting the most frequent mistakes made by students in exams.

### Implementation Details
- **Architecture**: Content is stored dynamically in lightweight `.json` files under `client/src/data/learnContent/`.
- **Dynamic Imports**: A gateway script (`learnContent.js`) handles asynchronous fetching of these JSON files, preventing bundle bloat and ensuring robust error fallback.
- **UI Integration**: The `App.jsx` handles routing, displaying the learning blocks as attractive, colorful cards using standardized Unicode emojis as icons before revealing the quiz entry.

---

## 2. Content Encoding & Stability Automation

### Overview
Historically, dynamically importing complex mathematical characters and emojis via Node.js batch scripts on Windows caused severe encoding corruption (e.g., `??` or replacement characters like ``). 

### Implementation Details
- We developed and executed a suite of automated Node.js stabilization scripts (`fix_batch_a.cjs` through `fix_batch_g.cjs`).
- **Unicode Standardization**: These scripts systematically rewrote all **82 JSON learning modules**, securely escaping mathematical symbols and inserting standard Unicode emojis (e.g., `\ud83d\udcda` for 📚). 
- **Robustness**: The platform is now fully UTF-8 compliant and entirely free of visual rendering bugs across all text blocks.

---

## 3. Quiz Module System & Configuration UI

### Overview
Tenali offers a massive suite of quizzes ranging from basic arithmetic to advanced vector dot products. Some of these are styled as high-intensity "Gym" modules (e.g., `LinearEquations-Gym`, `Fractions-add-gym`).

### Implementation Details
- **Difficulty Configuration**: The quiz setup interface was recently standardized. Instead of forcing users into a singular "Adaptive mode" for Gym modules, the UI now uses a universal configuration component.
- **Adaptive vs Manual**: Users can explicitly choose their difficulty level via intuitive radio buttons (`Easy`, `Medium`, `Hard`, `Extra Hard`) or opt into `Adaptive` mode.
- **Adaptive Algorithm**: When `Adaptive` mode is selected, a rolling-window algorithm tracks the user's accuracy and response times (in milliseconds) to dynamically scale question difficulty up or down in real-time.
- **Component Design**: This is managed inside `App.jsx` by removing forced `adaptiveOnly` parameters in the factory function (`makeMCQuizApp`), seamlessly blending the Gym apps back into the original, standard Tenali quiz layout.

---

## Quick Start (Development)

1. Navigate to the `server` directory and run `node index.js` to start the backend.
2. Navigate to the `client` directory and start the Vite dev server (e.g. `npm run dev`).
3. To update learning content, directly modify the UTF-8 encoded JSON files in `client/src/data/learnContent/`. Be sure to use valid stringified emojis.

