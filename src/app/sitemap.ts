import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://jjannaewang.vercel.app';
  const now = new Date();

  const staticRoutes = ['/', '/search', '/feed', '/tips', '/ranking', '/profile', '/premium'].map(
    (route) => ({
      url: `${appUrl}${route}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: route === '/' ? 1 : 0.8,
    }),
  );

  return staticRoutes;
}
