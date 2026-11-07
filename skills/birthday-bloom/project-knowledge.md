# Birthday Bloom - Project Knowledge

## Project Overview

Birthday Bloom is an env-first, highly customizable birthday experience platform built with React, TypeScript, Framer Motion, Tailwind CSS, and Vite.

The project focuses on creating cinematic, emotional, interactive birthday experiences through animations, storytelling, personalized content, family-aware templates, memory galleries, videos, music, fireworks, and interactive celebration elements.

Primary goal:

* Maximum personalization.
* Minimal code editing.
* Environment-variable-driven customization.
* Mobile-first performance.
* Smooth 60fps animations.

---

## Core Development Philosophy

Before modifying source code:

1. Check if the requested feature already exists.
2. Check if the requested change can be solved using environment variables.
3. Prefer configuration over code modifications.
4. Edit source code only when:

   * A feature does not exist.
   * A bug exists.
   * Existing configuration cannot support the request.

Birthday Bloom is designed to be env-first.

---

## Current Architecture

Technology Stack:

* React
* TypeScript
* Vite
* Framer Motion
* Tailwind CSS
* Zustand (state management)
* Canvas animations
* SVG animations

Architecture Style:

* Feature-based organization.
* Template-driven customization.
* Env-driven configuration.
* Component-based UI.
* Lightweight animation systems.
* No heavy 3D frameworks.

---

## User Experience Flow

Default celebration flow:

Splash Screen
→ Password Screen (optional)
→ Cinematic Intro
→ Story Sequence
→ Countdown
→ Cake Selection
→ Blow Candles
→ Cake Cutting
→ Fireworks Celebration
→ Music Player Activation
→ Main Birthday Experience
→ Memory Gallery
→ Quiz Section
→ Wishes Section
→ Hidden Gift
→ Heart Tree
→ Final Video
→ Closing Message

---

## Supported Relationship Templates

Supported templates:

* Partner
* Boyfriend
* Girlfriend
* Friend
* Best Friend
* Brother
* Sister
* Father
* Mother
* Grandfather
* Grandmother
* Uncle
* Aunt
* Cousin
* Son
* Daughter
* Guardian
* Custom

Template selection affects:

* Colors
* Messages
* Emojis
* Animations
* Tone
* Storytelling
* Quiz content
* Gift generation
* Visual theme

---

## Family System

Birthday Bloom uses a scalable family template architecture.

Important concepts:

* BaseFamilyMemberProfile
* Specialized relationship extensions
* Relationship metadata
* Timeline system
* Media system
* Privacy controls
* Dynamic fields
* Custom templates

Supported family categories:

* sibling
* parent
* grandparent
* relative
* child
* guardian
* friend
* custom

Custom templates should use:

createCustomFamilyMemberTemplate()

Do not create isolated profile systems.

Extend the existing registry.

---

## Environment-First Configuration

Always check environment variables before modifying components.

Important env groups:

Identity:

* VITE_BIRTHDAY_NAME
* VITE_BIRTHDAY_AGE
* VITE_BIRTHDAY_GENDER
* VITE_BIRTHDAY_DATE
* VITE_BIRTHDAY_RELATIONSHIP

Theme:

* VITE_BIRTHDAY_COLOR
* VITE_THEME
* VITE_BIRTHDAY_INTERESTS
* VITE_FAVORITE_EMOJIS

Media:

* VITE_PHOTOS
* VITE_VIDEO_1
* VITE_VIDEO_2
* VITE_VIDEO_3
* VITE_FINAL_VIDEO_URL
* VITE_SOUND_URL

Sections:

* VITE_SHOW_PHOTO_SECTION
* VITE_SHOW_QUIZ_SECTION
* VITE_SHOW_GIFT_SECTION
* VITE_SHOW_VIDEO_SECTION
* VITE_SHOW_CAKE_SECTION
* VITE_SHOW_HEART_TREE_SECTION

Family:

* VITE_FAMILY_MEMBER_TYPE
* VITE_FAMILY_PROFILE_JSON
* VITE_FAMILY_CLOSENESS
* VITE_FAMILY_RELATIONSHIP_LABEL

Password:

* VITE_PASSWORD_REQUIRED
* VITE_PASSWORD
* VITE_PASSWORD_HINT
* VITE_PASSWORD_FORMAT

---

## Animation Philosophy

Animations should feel:

* Cinematic
* Smooth
* Emotional
* Meaningful
* Performance-friendly

Preferred tools:

* Framer Motion
* requestAnimationFrame
* SVG animations
* Canvas particles

Avoid:

* Excessive animation noise
* Heavy dependencies
* Unoptimized particle systems

Every animation should support mobile devices.

---

## Existing Animation Systems

Current effects include:

* Cinematic intro
* Story transitions
* Typewriter effects
* Floating particles
* Fireworks
* Cursor emoji trails
* Balloon systems
* Heart Tree growth
* Confetti
* Cake animations
* Music player transitions
* Countdown sequences

New animations should match the existing visual language.

---

## Performance Rules

Target:

* 60 FPS
* Fast page loads
* Mobile compatibility

Priorities:

1. Performance
2. UX
3. Visual quality

Use:

* requestAnimationFrame
* cleanup functions
* lazy rendering
* optimized particle counts

Avoid:

* unnecessary rerenders
* memory leaks
* large animation libraries

---

## Design Principles

The experience should feel:

* Personal
* Emotional
* Premium
* Modern
* Memorable

Design language:

* Glassmorphism
* Soft glows
* Gradients
* Cinematic transitions
* Romantic and celebratory visuals

---

## Coding Rules

When implementing features:

* Preserve existing architecture.
* Reuse existing components.
* Reuse existing env variables.
* Avoid duplicate systems.
* Prefer extending current systems over replacing them.
* Maintain TypeScript type safety.
* Keep code modular and reusable.

Always check if a feature already exists before creating a new one.

---

## Future Roadmap

Potential future features:

* AI-generated wishes
* Voice message generation
* More family templates
* Admin dashboard
* Analytics
* Multi-language support
* Dynamic theme packs
* Advanced music systems
* Memory timeline editor
* Public template marketplace

Goal:
Birthday Bloom should become the most customizable open-source birthday experience platform.