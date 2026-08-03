import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { requireDev } from '@/lib/admin-guard';
import type { R2ListedPhoto } from '@/types/photos';

export const GET: APIRoute = async () => {
  const guard = requireDev();
  if (guard) return guard;

  try {
    const bucket = env.PHOTOGRAPHY;

    const allPhotos: R2ListedPhoto[] = [];
    let cursor: string | undefined;

    do {
      const listResult = await bucket.list({ limit: 1000, cursor, include: ['httpMetadata'] });
      if (listResult.objects) {
        for (const obj of listResult.objects) {
          const ext = obj.key.toLowerCase().split('.').pop();
          if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(ext || '')) continue;
          allPhotos.push({
            key: obj.key,
            url: `/api/photos/${encodeURIComponent(obj.key)}`,
            size: obj.size,
            lastModified: obj.uploaded.toISOString(),
          });
        }
      }
      cursor = listResult.truncated ? listResult.cursor : undefined;
    } while (cursor);

    allPhotos.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

    return new Response(JSON.stringify({ photos: allPhotos, total: allPhotos.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Admin list error:', error);
    return new Response(JSON.stringify({ error: 'Failed to list photos' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
