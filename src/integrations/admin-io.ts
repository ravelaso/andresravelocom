import type { AstroIntegration } from 'astro';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';

export function adminIo(): AstroIntegration {
  return {
    name: 'admin-io',
    hooks: {
      'astro:server:setup': ({ server }) => {
        server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
          const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

          if (url.pathname === '/_admin-io/read' && req.method === 'GET') {
            const file = url.searchParams.get('file');
            if (!file || file.includes('/') || !file.endsWith('.json')) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Invalid file' }));
              return;
            }
            const filePath = resolve(process.cwd(), 'src', 'data', file);
            try {
              const content = readFileSync(filePath, 'utf-8');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(content);
            } catch {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end('{}');
            }
            return;
          }

          if (url.pathname === '/_admin-io/write' && req.method === 'POST') {
            let body = '';
            req.on('data', (chunk: string) => (body += chunk));
            req.on('end', () => {
              try {
                const { file, data } = JSON.parse(body);
                if (!file || file.includes('/') || !file.endsWith('.json')) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Invalid file' }));
                  return;
                }
                const filePath = resolve(process.cwd(), 'src', 'data', file);
                mkdirSync(dirname(filePath), { recursive: true });
                writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: true }));
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: String(err) }));
              }
            });
            return;
          }

          next();
        });
      },
    },
  };
}
