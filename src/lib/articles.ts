/**
 * Helper utility for handling article photos and thumbnails safely
 * across all client and server environments.
 */

export function getArticlePhotos(article: { thumbnail?: string | null; images?: string | null }): string[] {
  if (!article) return [];
  if (article.images) {
    try {
      const parsed = JSON.parse(article.images);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.filter(Boolean);
      }
    } catch {}
  }
  if (article.thumbnail) {
    if (article.thumbnail.includes('|||')) {
      return article.thumbnail.split('|||').filter(Boolean);
    }
    return [article.thumbnail];
  }
  return [];
}

export function getMainThumbnail(thumbnail: string | null | undefined): string {
  if (!thumbnail) return '/newposter.jpeg';
  if (thumbnail.includes('|||')) {
    return thumbnail.split('|||')[0] || '/newposter.jpeg';
  }
  return thumbnail;
}
