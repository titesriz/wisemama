# WiseMama — Project Context for Claude Code

## What is WiseMama?

WiseMama is a React app (Vite) designed to help young children learn Chinese (Mandarin) through structured lessons. It's built for a bilingual family context — with a parent ("Maman") and child (Eli) in mind. The app blends reading, listening, flashcard, writing, and radical discovery exercises around curated lesson texts.

## Tech Stack

- **React 18** with JSX, no TypeScript
- **Vite** for bundling/dev server
- **hanzi-writer** for animated Chinese character stroke tracing
- **pinyin-pro** for pinyin generation
- **tesseract.js** for OCR (lesson builder from photos)
- Bundled data files (no backend): lessons, character DB, character stroke structure

## Project Structure

```
src/
  App.jsx                  — main router / app shell
  main.jsx
  components/              — all UI pages and panels
  context/                 — React context providers
  data/                    — bundled JSON (lessons, character DB, cedict, structure)
  hooks/                   — custom React hooks
  lib/                     — helper modules (e.g. lessonRadicals.js)
  styles/                  — CSS files per component
  utils/                   — utility functions
scripts/
  build-character-structure.mjs  — builds character-structure.json from stroke data
```

## Key Data Files

- `src/data/lessons-v2.json` — primary lesson data (v2 format)
- `src/data/character-database.json` — character metadata (pinyin, meaning, radicals, stroke count)
- `src/data/character-structure.json` — stroke structure used by hanzi-writer
- `src/data/cedict-mini.json` — mini Chinese-English dictionary

## Main User Flows

1. **Landing page** (`LandingPage.jsx`) — lesson selection cards for Eli and Maman profiles
2. **Lesson text view** (`LessonTextView.jsx`) — reads lesson text with character tap-to-inspect
3. **Flashcard practice** (`FlashcardOnlyPage.jsx`, `FlashcardStandaloneUI.jsx`)
4. **Audio practice** (`AudioOnlyPage.jsx`, `AudioPracticePanel.jsx`) — parent-recorded audio playback
5. **Writing practice** (`WritingOnlyPage.jsx`, `WritingPractice.jsx`) — hanzi-writer stroke tracing
6. **Radical discovery** (`RadicalDiscoveryPage.jsx`) — explore radicals in lesson characters
7. **Unified learning flow** (`UnifiedLearningFlow.jsx`) — combines the above into a full session
8. **Parent dashboard** (`ParentModeDashboard.jsx`) — lesson CRUD, audio recording, lesson editor
9. **FTUE flow** (`FTUEFlow.jsx`) — first-time user experience / onboarding

## Recent Work (as of April 2026)

- Added writing worksheet layout (printable/practice sheet)
- Refined lesson selection UI and radical preview
- Added character metadata and radical tracing flow
- Writing practice uses parent-recorded audio
- Bundled default profiles for Eli and Maman
- Switched to v2 character database
- Added lesson 9 (family text)
- OCR-based lesson builder (`OcrLessonBuilder.jsx`)
- Unified lesson editor (`UnifiedLessonEditor.jsx`)
- Daily ritual flow (`DailyRituelFlow.jsx`)
- Emotional duo avatar system (`EmotionalDuoSystem.jsx`, `AvatarEditor.jsx`)

## Conventions

- Component files are `.jsx`, no TypeScript
- CSS is per-component in `src/styles/`
- No test suite currently
- Data is bundled at build time; no API calls to a backend
- `lessons-v2.json` is the source of truth for lesson content
