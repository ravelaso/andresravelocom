import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

// const musicCollection = defineCollection({
//   loader: glob({ pattern: '**/*.md', base: './src/content/music' }),
//   schema: z.object({
//     title: z.string(),
//     description: z.string(),
//     date: z.coerce.date(),
//     tags: z.array(z.string()).optional(),
//     featured: z.boolean().default(false),
//     spotifyUrl: z.string().optional(),
//     youtubeUrl: z.string().optional(),
//     soundcloudUrl: z.string().optional(),
//     genre: z.string().optional(),
//     collaborators: z.array(z.string()).optional(),
//     coverImage: z.string().optional(),
//     duration: z.string().optional(),
//     status: z.enum(['released', 'upcoming', 'demo']).default('released'),
//   }),
// });
//
// const devCollection = defineCollection({
//   loader: glob({ pattern: '**/*.md', base: './src/content/dev' }),
//   schema: ({ image }) =>
//     z.discriminatedUnion('type', [
//       z.object({
//         type: z.literal('project'),
//         title: z.string(),
//         description: z.string(),
//         date: z.coerce.date(),
//         tags: z.array(z.string()).optional(),
//         url: z.string().optional(),
//         tech: z.array(z.string()).optional(),
//         category: z.enum(['web', 'mobile', 'desktop', 'library', 'tool']).optional(),
//         coverImage: z.array(image()).optional(),
//       }),
//       z.object({
//         type: z.literal('about'),
//         title: z.string(),
//         description: z.string().optional(),
//         frontend: z.array(z.string()).optional(),
//         backend: z.array(z.string()).optional(),
//         cloud: z.array(z.string()).optional(),
//       }),
//     ]),
// });

const photographyCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/photography' }),
  schema: z.object({
    type: z.literal('about'),
    title: z.string(),
    description: z.string().optional(),
  }),
});

const exposeFilmCollection = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/expose-film' }),
  schema: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('hero'),
      eyebrow: z.string(),
      title: z.string(),
      description: z.string(),
      badges: z.array(z.string()),
    }),
    z.object({
      type: z.literal('feature'),
      eyebrow: z.string(),
      title: z.string(),
      description: z.string(),
      highlights: z.array(z.string()),
      card: z.object({
        icon: z.string(),
        caption: z.string(),
        stats: z
          .array(
            z.object({
              value: z.string(),
              label: z.string(),
            }),
          )
          .optional(),
      }),
      reversed: z.boolean().default(false),
    }),
    z.object({
      type: z.literal('library'),
      eyebrow: z.string(),
      title: z.string(),
      description: z.string(),
      items: z.array(
        z.object({
          icon: z.string(),
          title: z.string(),
          description: z.string(),
        }),
      ),
    }),
    z.object({
      type: z.literal('philosophy'),
      title: z.string(),
      text: z.string(),
    }),
  ]),
});

export const collections = {
  photography: photographyCollection,
  exposeFilm: exposeFilmCollection,
};
