export function requireDev(): Response | null {
  if (!import.meta.env.DEV) {
    return new Response(null, { status: 404 });
  }
  return null;
}
