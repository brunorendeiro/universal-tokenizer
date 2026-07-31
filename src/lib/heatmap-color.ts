// Diverging blue -> white -> red scale, the standard convention for
// visualizing embedding values (negative / near-zero / positive).
function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function mix(c0: [number, number, number], c1: [number, number, number], t: number) {
  return `rgb(${lerp(c0[0], c1[0], t)}, ${lerp(c0[1], c1[1], t)}, ${lerp(c0[2], c1[2], t)})`;
}

const BLUE: [number, number, number] = [37, 99, 235]; // blue-600
const WHITE: [number, number, number] = [244, 244, 245]; // zinc-100
const RED: [number, number, number] = [220, 38, 38]; // red-600

/** t in [0, 1], where 0.5 is the zero point. */
export function valueToColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped < 0.5 ? mix(BLUE, WHITE, clamped * 2) : mix(WHITE, RED, (clamped - 0.5) * 2);
}
