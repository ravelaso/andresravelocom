import { env } from 'process';

const PHOTOS_API_URL = env.PHOTOS_API_URL ?? 'http://localhost:4321';

async function main() {
  console.log(`Fetching photo list from ${PHOTOS_API_URL}/api/admin/photos...`);

  const response = await fetch(`${PHOTOS_API_URL}/api/admin/photos`);
  if (!response.ok) {
    const body = await response.text();
    console.error(`Photos API returned ${response.status}: ${body}`);
    process.exit(1);
  }

  const { photos } = (await response.json()) as { photos: unknown[] };
  console.log(`Found ${photos.length} photos in R2`);
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
