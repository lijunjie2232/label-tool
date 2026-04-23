/**
 * Image Cache Manager
 * Provides utilities for managing the global image cache
 */

import imageCache from './imageCache';

/**
 * Clear the entire image cache
 */
export const clearImageCache = () => {
  imageCache.clear();
  console.log('Image cache cleared');
};

/**
 * Get cache statistics
 * @returns {Object} Cache statistics
 */
export const getCacheStats = () => {
  return imageCache.getStats();
};

/**
 * Preload images into cache
 * @param {Array<string>} paths - Array of image paths to preload
 * @param {Function} fetchFn - Function to fetch images (should accept path and return promise resolving to blob)
 * @returns {Promise<void>}
 */
export const preloadImages = async (paths, fetchFn) => {
  const promises = paths.map(path => 
    imageCache.fetchAndCache(path, () => fetchFn(path))
      .catch(error => {
        console.error(`Failed to preload image ${path}:`, error);
        return null;
      })
  );
  
  await Promise.all(promises);
  console.log(`Preloaded ${paths.length} images`);
};

/**
 * Remove specific images from cache
 * @param {Array<string>} paths - Array of image paths to remove
 */
export const removeFromCache = (paths) => {
  paths.forEach(path => {
    imageCache.delete(path);
  });
  console.log(`Removed ${paths.length} images from cache`);
};

export default {
  clear: clearImageCache,
  getStats: getCacheStats,
  preload: preloadImages,
  remove: removeFromCache
};
