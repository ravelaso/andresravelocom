import { defineCollection } from 'astro:content';
import { cldAssetsLoader } from 'astro-cloudinary/loaders';

export const collections = {
    images: defineCollection({
        loader: cldAssetsLoader({
        })
    }),
}

