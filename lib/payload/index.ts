import { getPayload as getPayloadInstance } from 'payload';
import config from '@payload-config';

export const getPayload = async () => {
  return getPayloadInstance({ config });
};

// Helper to get all published posts
export async function getPublishedPosts(locale: 'en' | 'fr' = 'en') {
  const payload = await getPayload();

  const posts = await payload.find({
    collection: 'posts',
    where: {
      status: { equals: 'published' },
    },
    sort: '-publishedAt',
    locale,
    depth: 2, // Include category relationship
  });

  return posts.docs;
}

// Helper to get a single post by slug
export async function getPostBySlug(slug: string, locale: 'en' | 'fr' = 'en') {
  const payload = await getPayload();

  const posts = await payload.find({
    collection: 'posts',
    where: {
      slug: { equals: slug },
      status: { equals: 'published' },
    },
    locale,
    depth: 2,
  });

  return posts.docs[0] || null;
}

// Helper to get featured posts
export async function getFeaturedPosts(locale: 'en' | 'fr' = 'en') {
  const payload = await getPayload();

  const posts = await payload.find({
    collection: 'posts',
    where: {
      status: { equals: 'published' },
      featured: { equals: true },
    },
    sort: '-publishedAt',
    locale,
    depth: 2,
  });

  return posts.docs;
}

// Helper to get all categories
export async function getCategories(locale: 'en' | 'fr' = 'en') {
  const payload = await getPayload();

  const categories = await payload.find({
    collection: 'categories',
    locale,
  });

  return categories.docs;
}
