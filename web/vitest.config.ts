import { defineConfig } from 'vitest/config';

/** Limite la contention jsdom/TestBed sur les suites Angular volumineuses. */
export default defineConfig({
  test: {
    maxWorkers: 4,
    testTimeout: 90_000,
    hookTimeout: 90_000,
  },
});
