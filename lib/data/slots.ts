// Slot definitions shared between client store and server API routes
export const REGULAR_SLOTS = Array.from({ length: 11 }, (_, i) => `p${i}`)
export const TALENT_SLOTS = Array.from({ length: 4 }, (_, i) => `t${i}`)
export const ALL_SLOTS = [...REGULAR_SLOTS, ...TALENT_SLOTS]
export const SCRATCHPAD_SLOTS = Array.from({ length: 20 }, (_, i) => `k${i}`)
