import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://orulabs.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/_next/static/', '/_next/image/'],
        disallow: ['/api/', '/dashboard/', '/participant/'],
      },
      {
        userAgent: ['ChatGPT-User', 'CCBot', 'anthropic-ai', 'PerplexityBot', 'OAI-SearchBot', 'Google-Extended'],
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/participant/'],
        crawlDelay: 2
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
