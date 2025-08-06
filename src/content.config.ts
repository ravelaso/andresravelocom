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
    schema: z.object({
        title: z.string(),
        description: z.string(),
        date: z.date(),
        tags: z.array(z.string()).optional(),
        featured: z.boolean().default(false),
        githubUrl: z.string().optional(),
        liveUrl: z.string().optional(),
        tech: z.array(z.string()).optional(), // Technologies used
        category: z.enum(['web', 'mobile', 'desktop', 'library', 'tool']).optional(),
        status: z.enum(['completed', 'in-progress', 'archived']).default('completed'),
        coverImage: z.string().optional(),
        screenshots: z.array(z.string()).optional(),
    })
});

export const collections = {
    'music': musicCollection,
    'code': codeCollection,
};