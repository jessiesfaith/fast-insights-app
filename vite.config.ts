import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Single-file build is available via `npm run build:single`.
// The default build produces standard output for Vercel deployment.
const isSingleFile = process.env.SINGLE_FILE === '1';

export default defineConfig(async () => {
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
    },
  };
});
