import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['src/main.ts', 'src/prisma/**', '**/*.module.ts', '**/*.controller.ts'],
    },
  },
});
