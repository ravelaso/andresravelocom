import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { requireDev } from '@/lib/admin-guard';
import { buildZip } from '@/lib/zip';

export const GET: APIRoute = async (ctx) => {
  const guard = requireDev();
  if (guard) return guard;

  const base = new URL(ctx.url).origin;

  try {
    const bucket = env.PHOTOGRAPHY;

    const allPhotos: { key: string; size: number }[] = [];
    let cursor: string | undefined;

    do {
      const listResult = await bucket.list({ limit: 1000, cursor, include: ['httpMetadata'] });
      if (listResult.objects) {
        for (const obj of listResult.objects) {
          const ext = obj.key.toLowerCase().split('.').pop();
          if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(ext || '')) continue;
          allPhotos.push({ key: obj.key, size: obj.size });
        }
      }
      cursor = listResult.truncated ? listResult.cursor : undefined;
    } while (cursor);

    const imageEntries = await Promise.all(
      allPhotos.map(async ({ key }) => {
        const object = await bucket.get(key);
        const data = object ? new Uint8Array(await object.arrayBuffer()) : new Uint8Array(0);
        return { name: `photos/${key}`, data };
      }),
    );

    const metaFiles = ['photos.json', 'collections.json', 'cameras.json', 'lenses.json'];
    const metaEntries: { name: string; data: Uint8Array }[] = [];

    for (const file of metaFiles) {
      try {
        const res = await fetch(`${base}/_admin-io/read?file=${file}`);
        if (res.ok) {
          const text = await res.text();
          metaEntries.push({ name: `metadata/${file}`, data: new TextEncoder().encode(text) });
        }
      } catch {
        // metadata file not available, skip
      }
    }

    const zip = buildZip([...imageEntries, ...metaEntries]);

    return new Response(zip, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="backup-${new Date().toISOString().slice(0, 10)}.zip"`,
      },
    });
  } catch (error) {
    console.error('Backup error:', error);
    return new Response(JSON.stringify({ error: 'Backup failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
