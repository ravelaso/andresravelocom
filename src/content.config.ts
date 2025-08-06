import { defineCollection, z } from 'astro:content';

const musicCollection = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string(),
        date: z.date(),
        tags: z.array(z.string()).optional(),
        featured: z.boolean().default(false),
        spotifyUrl: z.string().optional(),
        youtubeUrl: z.string().optional(),
        soundcloudUrl: z.string().optional(),
        genre: z.string().optional(),
        collaborators: z.array(z.string()).optional(),
        coverImage: z.string().optional(),
        duration: z.string().optional(), // e.g., "3:45"
        status: z.enum(['released', 'upcoming', 'demo']).default('released'),
    })
});

const codeCollection = defineCollection({
    type: 'content',
    schema : ({image}) => z.object({
        title: z.string(),
        description: z.string(),
        date: z.date(),
        tags: z.array(z.string()).optional(),
        url: z.string().optional(),
        tech: z.array(z.string()).optional(), // Technologies used
        category: z.enum(['web', 'mobile', 'desktop', 'library', 'tool']).optional(),
        coverImage: image(),
    })
});


const photographyCollection = defineCollection({
    type: 'content',
    schema: z.object({
        type: z.enum(['about', 'camera', 'lens']),
        title: z.string(),
        description: z.string().optional(),
        details: z.array(z.string()).optional(), // For cameras or lenses
    }),
});

export const collections = {
    'music': musicCollection,
    'code': codeCollection,
    'photography': photographyCollection,
};