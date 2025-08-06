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

const devCollection = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.discriminatedUnion('type', [
      // Project type (existing structure)
      z.object({
        type: z.literal('project'),
        title: z.string(),
        description: z.string(),
        date: z.date(),
        tags: z.array(z.string()).optional(),
        url: z.string().optional(),
        tech: z.array(z.string()).optional(),
        category: z.enum(['web', 'mobile', 'desktop', 'library', 'tool']).optional(),
        coverImage: image().optional(),
      }),
      // About type (new structure)
      z.object({
        type: z.literal('about'),
        title: z.string(),
        description: z.string().optional(),
        frontend: z.array(z.string()).optional(),
        backend: z.array(z.string()).optional(),
        cloud: z.array(z.string()).optional(),
      }),
    ]),
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
    'dev': devCollection,
    'photography': photographyCollection,
};