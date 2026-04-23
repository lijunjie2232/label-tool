/**
 * Global Image Cache
 * Caches image blobs to avoid redundant network requests
 * Shared across all components and views
 */

class ImageCache {
  constructor() {
    // Map to store cached image blobs: path -> blob
    this.cache = new Map();
    // Map to track loading promises to avoid duplicate requests: path -> promise
    this.loadingPromises = new Map();
    // Maximum number of images to cache (to prevent memory issues)
    this.maxCacheSize = 100;
  }

  /**
   * Get cached image blob for a given path
   * @param {string} path - Absolute path of the image
   * @returns {Blob|null} Cached blob or null if not found
   */
  get(path) {
    return this.cache.get(path) || null;
  }

  /**
   * Check if an image is cached
   * @param {string} path - Absolute path of the image
   * @returns {boolean} True if image is cached
   */
  has(path) {
    return this.cache.has(path);
  }

  /**
   * Cache an image blob
   * @param {string} path - Absolute path of the image
   * @param {Blob} blob - Image blob to cache
   */
  set(path, blob) {
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(path, blob);
  }

  /**
   * Remove an image from cache
   * @param {string} path - Absolute path of the image
   */
  delete(path) {
    this.cache.delete(path);
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  /**
   * Fetch and cache an image
   * @param {string} path - Absolute path of the image
   * @param {Function} fetchFn - Function to fetch the image (should return a promise resolving to blob)
   * @returns {Promise<Blob>} The image blob
   */
  async fetchAndCache(path, fetchFn) {
    // Return cached image if available
    if (this.cache.has(path)) {
      return this.cache.get(path);
    }

    // If already loading, return the existing promise
    if (this.loadingPromises.has(path)) {
      return this.loadingPromises.get(path);
    }

    // Start loading
    const loadPromise = fetchFn()
      .then(blob => {
        this.cache.set(path, blob);
        this.loadingPromises.delete(path);
        return blob;
      })
      .catch(error => {
        this.loadingPromises.delete(path);
        throw error;
      });

    this.loadingPromises.set(path, loadPromise);
    return loadPromise;
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      loading: this.loadingPromises.size
    };
  }
}

// Create a singleton instance
const imageCache = new ImageCache();

export default imageCache;
