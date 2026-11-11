import { defineConfig, type Plugin } from 'vite';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

/** Dev only: the atelier page (atelier.html) posts baked PNGs here and they land in public/art. */
function atelierSave(): Plugin {
  return {
    name: 'atelier-save',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__atelier/save', (req, res) => {
        const name = new URL(req.url ?? '', 'http://x').searchParams.get('name') ?? '';
        if (!/^[a-zA-Z0-9-]+\.(png|webp)$/.test(name)) {
          res.statusCode = 400;
          res.end('bad name');
          return;
        }
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          const dir = resolve(__dirname, 'public/art');
          mkdirSync(dir, { recursive: true });
          writeFileSync(resolve(dir, name), Buffer.from(body.replace(/^data:image\/(png|webp);base64,/, ''), 'base64'));
          res.end('ok');
        });
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [atelierSave()],
});
