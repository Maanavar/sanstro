// Vinaadi AI — Mobile Motion Tokens
// Source of truth: packages/design-tokens/tokens.json

export const spring = {
  default: { damping: 20, stiffness: 300, mass: 1 },
  gentle:  { damping: 25, stiffness: 200, mass: 1 },
  snappy:  { damping: 15, stiffness: 400, mass: 0.8 },
};

export const duration = {
  fast:   150,
  base:   250,
  medium: 300, // tertiary entrance, constellation line draw-in
  slow:   400,
  slower: 600,
  reveal: 1200, // score ring stroke-in, chart house draw-in — keep long
};

// Entrance rhythm delays (milliseconds)
export const entranceDelay = {
  surface:    0,
  hero:       80,
  supporting: 120,
  tertiary:   200,
};

export const staggerInterval = 40; // ms between staggered items
