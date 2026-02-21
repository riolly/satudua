/// <reference types="vite/client" />

// This file tells convex-test where to find the Convex functions
// It uses Vite's import.meta.glob to dynamically import all Convex function files
// The pattern includes all .ts and .js files in the convex directory and subdirectories
export const modules = import.meta.glob('./**/*.{ts,js}')
