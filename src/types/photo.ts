import { z } from 'astro/zod';

export const PhotoMetaSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  camera: z.string().optional(),
  lens: z.string().optional(),
  film: z.string().optional(),
  date: z.string().optional(),
  location: z.string().optional(),
  featured: z.boolean().default(false),
  forSale: z.boolean().default(false),
});

export const CollectionSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  coverPhoto: z.string().optional(),
  photos: z.array(z.string()).default([]),
});

export type PhotoMeta = z.infer<typeof PhotoMetaSchema>;
export type PhotoCollection = z.infer<typeof CollectionSchema>;
