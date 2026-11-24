// Calibrated Framer Motion physics & timing constants derived from
// FFmpeg frame-by-frame analysis (30 fps, 1 frame = 33.33 ms)

export const FRAME_MS = 1000 / 30;
export const frames = (n: number) => (n / 30);

// Exponential studio ease-out (~85-90% AE incoming speed-graph influence)
export const EASE_EXPO_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_SNAPPY_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
export const EASE_ANTICIPATE: [number, number, number, number] = [0.36, 0, 0.66, -0.56];

// Calibrated springs for character impact, bubble pops, and inline flexbox layout
export const SPRING_POP = {
  type: 'spring' as const,
  stiffness: 520,
  damping: 26,
  mass: 0.8,
};

export const SPRING_LAYOUT = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 30,
  mass: 0.9,
};

export const SPRING_FLOAT = {
  type: 'spring' as const,
  stiffness: 180,
  damping: 14,
  mass: 1.0,
};

export const SPRING_PUNCH = {
  type: 'spring' as const,
  stiffness: 460,
  damping: 24,
  mass: 0.75,
};

// Exact sampled Bitmap Studio palette
export const COLORS = {
  lightBg: '#f7f8fd',
  green: '#0b9f64',
  greenBright: '#13b674',
  yellow: '#f9e125',
  ink: '#08090c',
  white: '#ffffff',
  emeraldDeep: '#04160f',
  emeraldMid: '#072119',
  redDecline: '#ff3b30',
  greenAccept: '#30d158',
} as const;
