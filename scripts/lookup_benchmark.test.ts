import { describe, it } from 'vitest';

describe('Lookup Benchmark', () => {
  const ARRAY_SIZE = 1000;
  const ITERATIONS = 100000;

  const array1 = Array.from({ length: ARRAY_SIZE }, (_, i) => ({ metadata: { id: `a${i}` } }));
  const array2 = Array.from({ length: ARRAY_SIZE }, (_, i) => ({ metadata: { id: `b${i}` } }));
  const targetId = `b${ARRAY_SIZE - 1}`;

  it('benchmark array spreading', () => {
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      const target = [...array1, ...array2].find((item) => item.metadata.id === targetId);
      if (!target) throw new Error('Not found');
    }
    const end = performance.now();
    console.log(`Array spreading took: ${(end - start).toFixed(2)}ms`);
  });

  it('benchmark sequential searching', () => {
    const start = performance.now();
    for (let i = 0; i < ITERATIONS; i++) {
      const target = array1.find((item) => item.metadata.id === targetId) ||
                     array2.find((item) => item.metadata.id === targetId);
      if (!target) throw new Error('Not found');
    }
    const end = performance.now();
    console.log(`Sequential searching took: ${(end - start).toFixed(2)}ms`);
  });
});
