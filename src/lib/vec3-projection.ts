// Minimal hand-rolled 3D camera: rotate points by yaw/pitch, then project to
// 2D screen space with a basic perspective divide. Deliberately not using a
// 3D library — a few dozen points don't need one, and plain math keeps this
// dependency-free and easy to reason about.

export interface Projected {
  x: number;
  y: number;
  /** 0 (far) .. 1 (near) — drive size/opacity for a cheap depth cue. */
  depth: number;
}

/**
 * @param point [x, y, z] in world space
 * @param yaw rotation around the vertical axis, radians
 * @param pitch rotation around the horizontal axis, radians
 * @param scaleFactor world-units-to-pixels multiplier
 * @param viewportRadius half the render area's smaller dimension, for depth normalization
 */
export function project(
  point: [number, number, number],
  yaw: number,
  pitch: number,
  scaleFactor: number,
  viewportRadius: number,
): Projected {
  let [x, y, z] = point;

  // Rotate around Y (yaw)
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const x1 = x * cosY - z * sinY;
  const z1 = x * sinY + z * cosY;
  x = x1;
  z = z1;

  // Rotate around X (pitch)
  const cosX = Math.cos(pitch);
  const sinX = Math.sin(pitch);
  const y1 = y * cosX - z * sinX;
  const z2 = y * sinX + z * cosX;
  y = y1;
  z = z2;

  const cameraDistance = viewportRadius * 3;
  const perspective = cameraDistance / (cameraDistance - z * scaleFactor);

  return {
    x: x * scaleFactor * perspective,
    y: y * scaleFactor * perspective,
    depth: Math.max(0, Math.min(1, (z * scaleFactor + viewportRadius) / (2 * viewportRadius))),
  };
}
