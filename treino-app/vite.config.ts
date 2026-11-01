import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/**
 * Depois do build, lista todos os arquivos de dist/ e injeta essa lista no
 * service worker. Assim o app inteiro fica em cache já na primeira visita e
 * funciona offline (academia sem sinal, modo avião etc.).
 */
function precacheManifest(): Plugin {
  let outDir = 'dist';
  return {
    name: 'treino-precache-manifest',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const files: string[] = [];
      const walk = (dir: string) => {
        for (const name of readdirSync(dir)) {
          const full = join(dir, name);
          if (statSync(full).isDirectory()) walk(full);
          else files.push(full);
        }
      };
      walk(outDir);
      const swPath = join(outDir, 'sw.js');
      const hash = createHash('sha256');
      const urls: string[] = ['./'];
      for (const file of files.sort()) {
        const rel = relative(outDir, file).split('\\').join('/');
        if (rel === 'sw.js' || rel.endsWith('.map')) continue;
        urls.push('./' + rel);
        hash.update(rel).update(readFileSync(file));
      }
      const version = hash.digest('hex').slice(0, 12);
      const sw = readFileSync(swPath, 'utf8')
        .replace(/["']__PRECACHE_MANIFEST__["']/, JSON.stringify(urls))
        .replace(/["']__PRECACHE_VERSION__["']/, JSON.stringify(version));
      writeFileSync(swPath, sw);
    },
  };
}

export default defineConfig({
  // Caminhos relativos: funciona em qualquer subpasta (ex.: GitHub Pages).
  base: './',
  build: {
    target: 'es2020',
    rollupOptions: {
      input: { index: 'index.html', sw: 'src/sw.ts' },
      output: {
        entryFileNames: (chunk) => (chunk.name === 'sw' ? 'sw.js' : 'assets/[name]-[hash].js'),
      },
    },
  },
  plugins: [precacheManifest()],
  test: { environment: 'node' },
} as Parameters<typeof defineConfig>[0]);
