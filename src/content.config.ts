import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob, file } from 'astro/loaders';

const musicCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/music' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).optional(),
    featured: z.boolean().default(false),
    spotifyUrl: z.string().optional(),
    youtubeUrl: z.string().optional(),
    soundcloudUrl: z.string().optional(),
    genre: z.string().optional(),
    collaborators: z.array(z.string()).optional(),
    coverImage: z.string().optional(),
    duration: z.string().optional(),
    status: z.enum(['released', 'upcoming', 'demo']).default('released'),
  }),
});

const devCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/dev' }),
  schema: ({ image }) =>
    z.discriminatedUnion('type', [
      z.object({
        type: z.literal('project'),
        title: z.string(),
        description: z.string(),
        date: z.coerce.date(),
        tags: z.array(z.string()).optional(),
        url: z.string().optional(),
        tech: z.array(z.string()).optional(),
        category: z.enum(['web', 'mobile', 'desktop', 'library', 'tool']).optional(),
        coverImage: z.array(image()).optional(),
      }),
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
  loader: glob({ pattern: '**/*.md', base: './src/content/photography' }),
  schema: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('about'),
      title: z.string(),
      description: z.string().optional(),
    }),
    z.object({
      type: z.literal('camera'),
      title: z.string(),
      details: z.array(z.string()).optional(),
    }),
    z.object({
      type: z.literal('lens'),
      title: z.string(),
      details: z.array(z.string()).optional(),
    }),
  ]),
});

const photosCollection = defineCollection({
  loader: file('src/data/photos.json'),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    camera: z.string().optional(),
    lens: z.string().optional(),
    film: z.string().optional(),
    date: z.coerce.date().optional(),
    location: z.string().optional(),
    featured: z.boolean().default(false),
    forSale: z.boolean().default(false),
  }),
});

const collectionsCollection = defineCollection({
  loader: file('src/data/collections.json'),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    coverPhoto: z.string().optional(),
    photos: z.array(z.string()).default([]),
  }),
});

export const collections = {
  music: musicCollection,
  dev: devCollection,
  photography: photographyCollection,
  photos: photosCollection,
  collections: collectionsCollection,
};