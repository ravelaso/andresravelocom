import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { env } from 'process';

const PHOTOS_JSON_PATH = join(import.meta.dirname, '..', 'src', 'data', 'photos.json');

interface PhotoMeta {
  title: string;
  description?: string;
  tags: string[];
  camera?: string;
  lens?: string;
  film?: string;
  date?: string;
  location?: string;
  featured: boolean;
  forSale: boolean;
}

function filenameToTitle(key: string): string {
  const name = key.split('/').pop()?.replace(/\.[^.]+$/, '') ?? key;
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function main() {
  const devUrl = env.PHOTOS_API_URL ?? 'http://localhost:4321';

  console.log(`Fetching photos from ${devUrl}/api/photos...`);

  const response = await fetch(`${devUrl}/api/photos?limit=5000`);
  if (!response.ok) {
    console.error(`API returned ${response.status}. Is the dev server running?`);
    process.exit(1);
  }

  const data: { images: { key: string }[] } = await response.json();

  let existing: Record<string, PhotoMeta> = {};
  try {
    existing = JSON.parse(readFileSync(PHOTOS_JSON_PATH, 'utf-8'));
  } catch {
    console.log('No existing photos.json found, creating fresh.');
  }

  const existingKeys = new Set(Object.keys(existing));
  const newEntries: string[] = [];

  for (const photo of data.images) {
    if (!existingKeys.has(photo.key)) {
      existing[photo.key] = {
        title: filenameToTitle(photo.key),
        tags: [],
        featured: false,
        forSale: false,
      };
      newEntries.push(photo.key);
    }
  }

  const staleKeys = existingKeys.difference(new Set(data.images.map((p) => p.key)));
  if (staleKeys.size > 0) {
    console.log(`Stale entries (in JSON but not in R2):`);
    for (const key of staleKeys) {
      console.log(`  - ${key}`);
    }
  }

  writeFileSync(PHOTOS_JSON_PATH, JSON.stringify(existing, null, 2) + '\n');

  console.log(`\nDone. ${newEntries.length} new photo(s) added.`);
  console.log(`Total photos in JSON: ${Object.keys(existing).length}`);
  console.log(`R2 has: ${data.images.length} images`);
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
