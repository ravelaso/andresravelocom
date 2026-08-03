import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { requireDev } from '@/lib/admin-guard';

export const POST: APIRoute = async ({ request }) => {
  const guard = requireDev();
  if (guard) return guard;

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const bucket = env.PHOTOGRAPHY;
    const arrayBuffer = await file.arrayBuffer();
    const key = file.name;

    await bucket.put(key, arrayBuffer, {
      httpMetadata: { contentType: file.type },
    });

    return new Response(JSON.stringify({ key }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: 'Upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
