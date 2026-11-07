# Birthday Bloom Current Architecture

## Actual Repository Structure

The AI must always work with the current repository structure before suggesting refactors.

Current structure:

```text
src/
├── assets/
├── components/
│   ├── birthday/
│   └── ui/
├── config/
├── features/
│   ├── cinematic-story/
│   └── core/
├── hooks/
├── lib/
├── pages/
├── services/
├── test/
├── utils/
```

## Repository Rules

Do NOT assume architecture.

Inspect existing folders before creating new ones.

Prefer existing locations.

Examples:

Birthday-specific UI:
→ components/birthday

Reusable UI:
→ components/ui

Configuration:
→ config

Business Logic:
→ features

Hooks:
→ hooks

Utilities:
→ utils

Services:
→ services

Libraries:
→ lib

Pages:
→ pages

Tests:
→ test

## Refactoring Rules

Do NOT perform large architectural rewrites unless explicitly requested.

Avoid:

* Moving hundreds of files
* Rebuilding folder structures
* Renaming major systems
* Breaking imports

Prefer:

* Incremental improvements
* Small focused changes
* Existing conventions

## Birthday Bloom Decision Tree

When a request arrives:

1. Check existing feature.
2. Check existing component.
3. Check existing env variable.
4. Check existing template support.
5. Check family system compatibility.
6. Implement using current structure.
7. Create new files only when necessary.

## Feature Awareness

Current major systems include:

* Cinematic Story System
* Countdown System
* Fireworks System
* Cursor Emoji Trail
* Music Player
* Cake Cutting
* Quiz Engine
* Memory Gallery
* Hidden Gift System
* Family Template System
* Password Protection
* Final Video Reveal
* Relationship Templates
* Environment Configuration

Always integrate with existing systems instead of creating parallel implementations.

## Coding Priority

Priority Order:

1. Fix existing implementation.
2. Extend existing implementation.
3. Reuse existing component.
4. Reuse existing hook.
5. Reuse existing utility.
6. Create new component.
7. Create new feature.

Never duplicate functionality already present in the project.

## Goal

Birthday Bloom is an env-first, template-driven, cinematic celebration platform.

The AI should optimize for:

* Maintainability
* Reusability
* Performance
* Mobile support
* Customization
* Consistency

Every change should make the project easier to customize and easier to extend.
