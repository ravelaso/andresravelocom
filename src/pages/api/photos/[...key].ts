import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params, locals }) => {
    const runtime = locals.runtime;
    const bucket = runtime.env.PHOTOGRAPHY;

    if (!params.key) {
        return new Response('Image key is required', { status: 400 });
    }

    // Join all parts of the key (handles nested paths)
    const key = Array.isArray(params.key) ? params.key.join('/') : params.key;

    try {
        const object = await bucket.get(key);

        if (!object) {
            return new Response('Image not found', { status: 404 });
        }

        const headers = new Headers();
        headers.set('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
        headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

        if (object.httpMetadata?.contentLength) {
            headers.set('Content-Length', object.httpMetadata.contentLength.toString());
        }

        return new Response(object.body, {
            headers
        });

    } catch (error) {
        console.error('Error fetching image from R2:', error);
        return new Response('Internal server error', { status: 500 });
    }
};

export const prerender = false;