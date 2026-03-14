import type { APIRoute } from 'astro';
import { env } from "cloudflare:workers";

interface PhotoObject {
    key: string;
    url: string;
    size: number;
    lastModified: Date;
}

export const GET: APIRoute = async ({ url }) => {
    try {
        const bucket = env.PHOTOGRAPHY;

        if (!bucket) {
            return new Response(JSON.stringify({ error: 'R2 bucket not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get pagination parameters
        const searchParams = new URLSearchParams(url.search);
        const limit = parseInt(searchParams.get('limit') || '20');
        const cursor = searchParams.get('cursor') || undefined;

        // List objects with pagination
        const listResult = await bucket.list({
            limit,
            cursor,
            include: ['httpMetadata']
        });

        if (!listResult || !listResult.objects) {
            return new Response(JSON.stringify({
                images: [],
                hasMore: false,
                cursor: null
            }), {
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Filter for image files and sort newest first
        const images: PhotoObject[] = listResult.objects
            .filter((obj: any) => {
                const ext = obj.key.toLowerCase().split('.').pop();
                return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(ext || '');
            })
            .sort((a: any, b: any) => {
                return new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime();
            })
            .map((obj: any) => ({
                key: obj.key,
                url: `/api/photos/${encodeURIComponent(obj.key)}`,
                size: obj.size,
                lastModified: obj.uploaded
            }));

        return new Response(JSON.stringify({
            images,
            hasMore: !!listResult.truncated,
            cursor: listResult.cursor || null
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error listing photos:', error);
        return new Response(JSON.stringify({
            error: 'Failed to list photos',
            images: [],
            hasMore: false,
            cursor: null
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const prerender = false;