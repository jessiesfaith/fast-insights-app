/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Single-file build is available via `npm run build:single`.
// The default build produces standard output for Vercel deployment.

export default defineConfig(async ({ mode }) => {
  // `build:single` selects this with `--mode single`, which needs no shell
  // syntax and so works the same on Windows and Unix. SINGLE_FILE=1 is still
  // honoured for anyone who has it exported or invokes vite directly.
  const isSingleFile = mode === 'single' || process.env.SINGLE_FILE === '1';

  const plugins: any[] = [react()];

  if (isSingleFile) {
    const { viteSingleFile } = await import('vite-plugin-singlefile');
    const { rename } = await import('node:fs/promises');
    const { resolve } = await import('node:path');

    plugins.push(viteSingleFile());
    plugins.push({
      name: 'ar-tool-beta:rename-output',
      apply: 'build' as const,
      closeBundle: async () => {
        const distDir = resolve(__dirname, 'dist');
        const from = resolve(distDir, 'index.html');
        const to = resolve(distDir, 'ar-tool-beta.html');
        try {
          await rename(from, to);
          console.log('\n  ✓ build emitted dist/ar-tool-beta.html (single self-contained file)\n');
        } catch (err) {
          console.warn('  ! could not rename dist/index.html → ar-tool-beta.html:', err);
        }
      },
    });
  }

  return {
    plugins,
    build: {
      target: 'es2020',
      cssCodeSplit: false,
      ...(isSingleFile
        ? {
            assetsInlineLimit: 100_000_000,
            chunkSizeWarningLimit: 100_000_000,
            rollupOptions: {
              output: { inlineDynamicImports: true },
            },
          }
        : {}),
    },
    server: {
      port: 5173,
      open: true,
      watch: {
        // Added to Vite's own defaults (node_modules, .git), not replacing
        // them. None of these are application source, and .claude/worktrees
        // holds full copies of this repo — watching them means chokidar keeps
        // a file handle on every file in every worktree for nothing.
        ignored: [
          '**/.claude/**',
          '**/agent-state/**',
          '**/financial-model/**',
          '**/dist/**',
          '**/*.tsbuildinfo',
        ],
      },
    },
    test: {
      // Skip Vitest copies inside .claude/worktrees (test-discovery would otherwise
      // run each suite N+1 times). Defaults retained for node_modules/dist.
      exclude: ['**/node_modules/**', '**/dist/**', '**/.claude/**', '**/.{idea,git,cache,output,temp}/**'],
    },
  };
});
