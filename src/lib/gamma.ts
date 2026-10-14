// The sample behind the footer's background: the gamma density and the rug
// of draws from it along the axis. The draws come from a fixed seed,
// so the picture is the same on every build; the blog asks its figures to be
// reproducible, and the decoration gets held to the same rule.

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Shape 3 puts the mode at 2, away from the edge, with the long tail running
// to the right; a draw is the sum of three unit exponentials.
export const SHAPE = 3;
// the drawn stretch of the axis; draws beyond it are left out
export const LO = 0;
export const HI = 9;

/** Gamma(SHAPE, 1) density, scaled to a peak of 1 at the mode. */
export const density = (v: number) =>
  (v / (SHAPE - 1)) ** (SHAPE - 1) * Math.exp(SHAPE - 1 - v);

const rand = mulberry32(20261013);
const exp1 = () => -Math.log(1 - rand());
const draw = () =>
  Array.from({ length: SHAPE }, exp1).reduce((s, e) => s + e, 0);

export const draws: number[] = Array.from({ length: 160 }, draw).filter(
  (v) => v > LO && v < HI,
);

/** Position on [0, width] for a value on the drawn axis. */
export const toX = (v: number, width: number) => ((v - LO) / (HI - LO)) * width;
