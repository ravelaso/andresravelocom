import type { APIRoute } from 'astro';
import { env } from "cloudflare:workers";
import type { PhotoMeta, PhotoCollection, R2ListedPhoto } from '@/types/photos';
import rawPhotosData from '@/data/photos.json';
import rawCollectionsData from '@/data/collections.json';

// Cache for all photos - since bucket is not huge, we can cache this
let cachedPhotos: R2ListedPhoto[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const GET: APIRoute = async ({ url }) => {
    try {
        const bucket = env.PHOTOGRAPHY;

        if (!bucket) {
            return new Response(JSON.stringify({ error: 'R2 bucket not configured' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const searchParams = new URLSearchParams(url.search);
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        const now = Date.now();
        if (!cachedPhotos || (now - cacheTimestamp) > CACHE_DURATION) {
            console.log('Fetching all photos from R2...');

            const allPhotos: R2ListedPhoto[] = [];
            let cursor: string | undefined;

            do {
                const listResult = await bucket.list({
                    limit: 1000,
                    cursor,
                    include: ['httpMetadata']
                });

                if (listResult.objects) {
                    const batchPhotos = listResult.objects
                        .filter((obj: R2Object) => {
                            const ext = obj.key.toLowerCase().split('.').pop();
                            return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'].includes(ext || '');
                        })
                        .map((obj: R2Object) => ({
                            key: obj.key,
                            url: `/api/photos/${encodeURIComponent(obj.key)}`,
                            size: obj.size,
                            lastModified: obj.uploaded.toISOString()
                        }));

                    allPhotos.push(...batchPhotos);
                }

                cursor = listResult.truncated ? listResult.cursor : undefined;
            } while (cursor);

            allPhotos.sort((a, b) => {
                return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
            });

            cachedPhotos = allPhotos;
            cacheTimestamp = now;

            console.log(`Cached ${allPhotos.length} photos, newest first`);
        }

        const allMeta = rawPhotosData as Record<string, PhotoMeta>;
        const metadataMap = new Map<string, PhotoMeta>(Object.entries(allMeta));
        const collectionsData = rawCollectionsData as Record<string, PhotoCollection>;

        const tagFilters = searchParams.getAll('tag');
        const collectionFilter = searchParams.get('collection') || null;

        let filteredPhotos = cachedPhotos;
        if (tagFilters.length > 0) {
            filteredPhotos = filteredPhotos.filter(p => {
                const meta = metadataMap.get(p.key);
                return meta && tagFilters.every(t => meta.tags?.includes(t));
            });
        }
        if (collectionFilter && collectionsData[collectionFilter]) {
            const colSet = new Set(collectionsData[collectionFilter].photos);
            filteredPhotos = filteredPhotos.filter(p => colSet.has(p.key));
        }

        function enrich(p: R2ListedPhoto) {
            const meta = metadataMap.get(p.key);
            return {
                ...p,
                title: meta?.title ?? '',
                description: meta?.description,
                tags: meta?.tags ?? [],
                camera: meta?.camera,
                lens: meta?.lens,
                film: meta?.film,
                date: meta?.date,
                location: meta?.location,
                featured: meta?.featured ?? false,
                forSale: meta?.forSale ?? false,
            };
        }

        const featuredPhotos = filteredPhotos
            .filter(p => metadataMap.get(p.key)?.featured)
            .slice(0, 20)
            .map(enrich);

        const totalPhotos = filteredPhotos.length;
        const startIndex = offset;
        const endIndex = Math.min(startIndex + limit, totalPhotos);

        const paginatedPhotos = filteredPhotos.slice(startIndex, endIndex);
        const hasMore = endIndex < totalPhotos;

        const enrichedImages = paginatedPhotos.map(enrich);

        const allTags = [...new Set(
            Object.values(allMeta).flatMap(m => m.tags ?? [])
        )];

        const collectionBriefs = Object.entries(collectionsData).map(([slug, col]) => ({
            slug,
            title: col.title,
            photoCount: col.photos.length,
        }));

        return new Response(JSON.stringify({
            images: enrichedImages,
            hasMore,
            cursor: hasMore ? (offset + limit).toString() : null,
            total: totalPhotos,
            tags: allTags,
            collections: collectionBriefs,
            featured: featuredPhotos,
        }), {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=300'
            }
        });

    } catch (error) {
        console.error('Error listing photos:', error);
        return new Response(JSON.stringify({
            error: 'Failed to list photos',
            images: [],
            hasMore: false,
            cursor: null,
            tags: [],
            collections: [],
            featured: [],
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};

export const prerender = false;