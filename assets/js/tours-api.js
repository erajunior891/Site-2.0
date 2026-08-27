/**
 * K.K. Tour — Public Tours API
 * Provides read-only access to published tours and translations from Supabase PostgreSQL.
 * Strictly separates public queries from admin mutations (admin-api.js).
 */

(function () {
  // In-memory cache for fast language switching without repeated network round-trips
  let cachedRawTours = null;
  let lastFetchTimestamp = 0;
  const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

  /**
   * Normalizes a raw Supabase tour record with its translations and includes for a specific language
   */
  function normalizeTour(rawTour, lang) {
    if (!rawTour) return null;
    const currentLang = lang || (typeof window.getCurrentLang === 'function' ? window.getCurrentLang() : 'ru');

    // Build translation lookup
    const translationsByLang = {};
    if (Array.isArray(rawTour.tour_translations)) {
      rawTour.tour_translations.forEach(t => {
        if (t && t.language) translationsByLang[t.language] = t;
      });
    }

    // Build includes lookup
    const includesByLang = { ru: [], kz: [], en: [] };
    if (Array.isArray(rawTour.tour_includes)) {
      // Sort by sort_order
      const sorted = [...rawTour.tour_includes].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      sorted.forEach(item => {
        if (item && item.language && includesByLang[item.language]) {
          includesByLang[item.language].push(item.text);
        }
      });
    }

    // Preferred language -> fallback to RU -> fallback to any available
    const activeTranslation = translationsByLang[currentLang]
      || translationsByLang['ru']
      || Object.values(translationsByLang)[0]
      || {};

    const activeIncludes = (includesByLang[currentLang] && includesByLang[currentLang].length > 0)
      ? includesByLang[currentLang]
      : (includesByLang['ru'] && includesByLang['ru'].length > 0 ? includesByLang['ru'] : []);

    return {
      id: rawTour.id,
      slug: rawTour.slug,
      price: rawTour.price || 0,
      rating: parseFloat(rawTour.rating) || 5.0,
      photo: rawTour.photo || 'assets/images/album_lake.jpg',
      duration_days: rawTour.duration_days || 1,
      category: rawTour.category || 'lakes',
      featured: Boolean(rawTour.featured),
      featured_order: rawTour.featured_order || 0,
      status: rawTour.status || 'published',

      // Localized presentation fields
      name: activeTranslation.name || rawTour.slug || 'Тур K.K. Tour',
      description: activeTranslation.description || '',
      full_description: activeTranslation.full_description || activeTranslation.description || '',
      duration: activeTranslation.duration_label || `${rawTour.duration_days} дн.`,
      days: activeTranslation.days_label || '',
      badge: activeTranslation.badge || '',
      includes: activeIncludes,

      // Complete multi-language maps preserved for instant offline switching
      translations: translationsByLang,
      all_includes: includesByLang
    };
  }

  /**
   * Fetches published tours from Supabase with relational translations and includes.
   * @param {Object} options
   * @param {boolean} [options.featuredOnly=false] - Return only tours marked as featured for index.html
   * @param {string} [options.category] - Filter by category (e.g. 'lakes', 'canyons', 'mountains')
   * @param {string} [options.language] - Preferred language ('ru', 'kz', 'en')
   * @param {boolean} [options.forceFresh=false] - Bypass in-memory cache
   * @returns {Promise<Array>} Normalized array of tours
   */
  async function fetchPublishedTours({ featuredOnly = false, category = null, language = null, forceFresh = false } = {}) {
    const activeLang = language || (typeof window.getCurrentLang === 'function' ? window.getCurrentLang() : 'ru');
    const now = Date.now();

    // Check in-memory cache
    if (!forceFresh && cachedRawTours && (now - lastFetchTimestamp < CACHE_TTL_MS)) {
      return filterAndNormalize(cachedRawTours, { featuredOnly, category, language: activeLang });
    }

    const client = window.supabaseClient;
    if (!client) {
      console.warn('[K.K. Tour API] Supabase client not initialized.');
      return [];
    }

    try {
      let query = client
        .from('tours')
        .select(`
          id,
          slug,
          price,
          rating,
          photo,
          duration_days,
          category,
          featured,
          featured_order,
          status,
          created_at,
          tour_translations (
            id, language, name, description, full_description, duration_label, days_label, badge
          ),
          tour_includes (
            id, language, text, sort_order
          )
        `)
        .eq('status', 'published')
        .order('featured_order', { ascending: true })
        .order('created_at', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('[K.K. Tour API] Error fetching tours from Supabase:', error);
        return [];
      }

      if (Array.isArray(data)) {
        cachedRawTours = data;
        lastFetchTimestamp = now;
        return filterAndNormalize(data, { featuredOnly, category, language: activeLang });
      }

      return [];
    } catch (err) {
      console.error('[K.K. Tour API] Network or unexpected error:', err);
      return [];
    }
  }

  function filterAndNormalize(rawList, { featuredOnly, category, language }) {
    let list = rawList || [];
    if (featuredOnly) {
      list = list.filter(t => t.featured === true);
    }
    if (category && category !== 'all') {
      list = list.filter(t => t.category === category);
    }
    return list.map(raw => normalizeTour(raw, language));
  }

  /**
   * Fetches a single tour by its slug or UUID.
   */
  async function fetchTourBySlug(slugOrId, language = null) {
    const activeLang = language || (typeof window.getCurrentLang === 'function' ? window.getCurrentLang() : 'ru');
    const all = await fetchPublishedTours({ language: activeLang });
    return all.find(t => t.slug === slugOrId || t.id === slugOrId) || null;
  }

  /**
   * Clears the API cache when user/admin changes something
   */
  function invalidateCache() {
    cachedRawTours = null;
    lastFetchTimestamp = 0;
  }

  // Export public API
  window.toursApi = {
    fetchPublishedTours,
    fetchTourBySlug,
    normalizeTour,
    invalidateCache
  };
})();
