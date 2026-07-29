import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { requireDev } from '@/lib/admin-guard';

export const DELETE: APIRoute = async ({ params }) => {
  const guard = requireDev();
  if (guard) return guard;

  try {
    const key = params.key ? decodeURIComponent(params.key) : null;
    if (!key) {
      return new Response(JSON.stringify({ error: 'Missing photo key' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const bucket = env.PHOTOGRAPHY;
    await bucket.delete(key);

    return new Response(JSON.stringify({ deleted: key }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Delete error:', error);
    return new Response(JSON.stringify({ error: 'Delete failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
