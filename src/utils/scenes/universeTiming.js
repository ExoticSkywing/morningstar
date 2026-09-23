const BEAT_VH = 60;
const SUBTITLE_BEAT_COUNT = 4;
const SCROLL_PADDING = 1.2;
const INTRO_VH = BEAT_VH * SUBTITLE_BEAT_COUNT * SCROLL_PADDING;

const CAPTION_VH = 30;
const CAPTION_COUNT = 4;
const CAPTIONS_VH = CAPTION_VH * CAPTION_COUNT * SCROLL_PADDING;

export const PLUNGE_VH = BEAT_VH * 4;

export const TOTAL_VH = INTRO_VH + CAPTIONS_VH + PLUNGE_VH;

export const SUBTITLE_STORY_END = INTRO_VH / TOTAL_VH;
export const PLUNGE_START = (INTRO_VH + CAPTIONS_VH) / TOTAL_VH;

// Retain the source scene's scroll distance, then stop after its smoke exit.
export const HERO_SCROLL_VH = TOTAL_VH - 100;
export const SMOKE_EXIT_VH = 30;
export const HERO_HEIGHT_VH = HERO_SCROLL_VH + SMOKE_EXIT_VH + 100;

// Both renderers overlap after the original camera travel, then hero1 starts.
export const HANDOFF_VH = 120;
export const HERO1_START_VH = HERO_SCROLL_VH + HANDOFF_VH;
