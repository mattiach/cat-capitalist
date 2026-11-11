import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const phaserSrc = fileURLToPath(new URL('./node_modules/phaser/src', import.meta.url));
const phaserBuild = fileURLToPath(new URL('./src/game/phaser-build.js', import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Production builds Phaser from its source without what the game doesn't use (see src/game/phaser-build.js).
  // Dev keeps the prebuilt package: Vite serves Phaser's CommonJS sources poorly without a full bundle.
  ...(command === 'build' && {
    resolve: {
      alias: [
        { find: /^phaser$/, replacement: phaserBuild },
        { find: /^phaser-src\//, replacement: `${phaserSrc}/` },
      ],
    },
    // Phaser tests these as `if (typeof FLAG)`, so the define must replace the whole `typeof` expression,
    // as Phaser's own build config does.
    define: {
      'typeof WEBGL_RENDERER': 'true',
      'typeof CANVAS_RENDERER': 'true',
      'typeof FEATURE_SOUND': 'false',
      'typeof PLUGIN_CAMERA3D': 'false',
      'typeof PLUGIN_FBINSTANT': 'false',
      'typeof WEBGL_DEBUG': 'false',
    },
  }),
  build: {
    rolldownOptions: {
      // Phaser's WebGL debugger, required only inside `if (WEBGL_DEBUG)`, which the define above removes.
      external: ['phaser3spectorjs'],
      output: {
        // Phaser and React change far less often than the game: separate chunks stay cached across releases.
        codeSplitting: {
          groups: [
            { name: 'phaser', test: /[\\/](phaser|phaser-build)[\\/.]/ },
            { name: 'react', test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
    // ponytail: Phaser alone is one ~1 MB chunk by design (it can't be split further); the limit sits just above it.
    chunkSizeWarningLimit: 1200,
  },
  // Tauri expects this exact port (devUrl in src-tauri/tauri.conf.json).
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: { ignored: ['**/src-tauri/**'] },
  },
}))
