import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Use edge-runtime for Convex tests
    environment: 'edge-runtime',
    server: { deps: { inline: ['convex-test'] } },
    // Include convex tests
    include: ['convex/**/*.test.ts'],
  },
})
