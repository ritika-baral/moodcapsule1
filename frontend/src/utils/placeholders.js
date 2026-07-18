// Central place for mapping a recommendation category to its local
// fallback/placeholder image. This is the ONLY place these paths should
// be defined — components should import from here instead of hardcoding
// image paths.
//
// Place the actual image files in: /public/placeholders/
// (adjust the base path below if your static assets live elsewhere)

export const CATEGORY_PLACEHOLDERS = {
  movies: '/placeholders/movie.png',
  tv_shows: '/placeholders/tv.png',
  music: '/placeholders/music.png',
  books: '/placeholders/books.png',
  podcasts: '/placeholders/podcast.png',
}

/**
 * Returns the local placeholder image path for a given category,
 * or null if the category has no configured placeholder (e.g. text-forward
 * categories like activities/journal_prompts/quotes/games that don't
 * render an image at all).
 */
export function getPlaceholderForCategory(category) {
  return CATEGORY_PLACEHOLDERS[category] || null
}