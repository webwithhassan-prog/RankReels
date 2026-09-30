// The longest stretch of one clip that can play. Longer files are accepted and trimmed down to this.
export const MAX_CLIP_SECONDS = 60;
export const MIN_CLIP_SECONDS = 0.5;
export const MAX_CLIP_BYTES = 100 * 1024 * 1024;
// The speeds a clip can play at: 0.5 is slow motion, 2 is double speed.
export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
