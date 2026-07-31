// Lightweight PCA, dependency-free — reduces a small set of high-dimensional
// vectors (one per token, 384 dims from the embedding model) down to 3D for
// plotting. Because we always have far fewer tokens (n) than dimensions (d),
// this uses the standard "small sample, high dimension" trick: eigen-decompose
// the n×n Gram matrix (X · Xᵀ) instead of the d×d covariance matrix, then map
// the resulting eigenvectors back into the original space. Cheap enough to
// run on every keystroke for realistic prompt lengths.

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function norm(a: number[]): number {
  return Math.sqrt(dot(a, a));
}

function scale(a: number[], s: number): number[] {
  return a.map((v) => v * s);
}

function subtract(a: number[], b: number[]): number[] {
  return a.map((v, i) => v - b[i]);
}

/** Dominant eigenvector of a symmetric matrix via power iteration. */
function powerIteration(matrix: number[][], iterations = 100): { vector: number[]; eigenvalue: number } {
  const n = matrix.length;
  let v = Array.from({ length: n }, () => Math.random() - 0.5);
  const vn = norm(v) || 1;
  v = scale(v, 1 / vn);

  for (let iter = 0; iter < iterations; iter++) {
    const next = matrix.map((row) => dot(row, v));
    const nn = norm(next);
    if (nn < 1e-10) break;
    v = scale(next, 1 / nn);
  }

  const mv = matrix.map((row) => dot(row, v));
  const eigenvalue = dot(v, mv);
  return { vector: v, eigenvalue };
}

export interface PcaResult {
  /** One [x, y, z] triple per input vector. */
  points: [number, number, number][];
}

/**
 * @param vectors n vectors of equal length d (n is expected to be small — token counts)
 */
export function pcaTo3D(vectors: number[][]): PcaResult {
  const n = vectors.length;
  if (n === 0) return { points: [] };
  if (n === 1) return { points: [[0, 0, 0]] };

  const dims = vectors[0].length;
  const mean = new Array(dims).fill(0);
  for (const v of vectors) for (let i = 0; i < dims; i++) mean[i] += v[i] / n;
  const centered = vectors.map((v) => subtract(v, mean));

  // Gram matrix G[i][j] = centered[i] . centered[j], size n×n.
  const gram: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      const d = dot(centered[i], centered[j]);
      gram[i][j] = d;
      gram[j][i] = d;
    }
  }

  const numComponents = Math.min(3, n - 1);
  const axes: number[][] = []; // each axis lives in the original d-dim space
  const deflated = gram.map((row) => [...row]);

  for (let c = 0; c < numComponents; c++) {
    const { vector, eigenvalue } = powerIteration(deflated);
    if (eigenvalue <= 1e-10) break;

    // Map the n-dim eigenvector back into d-dim space: axis = Xᵀ * vector, then normalize.
    const axis = new Array(dims).fill(0);
    for (let i = 0; i < n; i++) {
      for (let k = 0; k < dims; k++) axis[k] += vector[i] * centered[i][k];
    }
    const axisNorm = norm(axis) || 1;
    axes.push(scale(axis, 1 / axisNorm));

    // Deflate: remove this component's contribution from the Gram matrix.
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        deflated[i][j] -= eigenvalue * vector[i] * vector[j];
      }
    }
  }

  const points: [number, number, number][] = centered.map((v) => {
    const coords = axes.map((axis) => dot(v, axis));
    return [coords[0] ?? 0, coords[1] ?? 0, coords[2] ?? 0];
  });

  return { points };
}
