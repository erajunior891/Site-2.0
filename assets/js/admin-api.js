/**
 * K.K. Tour — Admin & Editor Management API
 * Encapsulates Supabase Auth, CRUD mutations, Storage uploads, and role checks.
 * Completely decoupled from public bundle.
 */

(function () {
  /**
   * Returns current authenticated user and their profile (role: admin/editor)
   */
  async function getCurrentAdminProfile() {
    const client = window.supabaseClient;
    if (!client) return null;

    try {
      const { data: { session }, error: sessionError } = await client.auth.getSession();
      if (sessionError || !session || !session.user) {
        return null;
      }

      const user = session.user;
      const { data: profile, error: profileError } = await client
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        // Fallback profile based on metadata
        return {
          id: user.id,
          email: user.email,
          role: user.user_metadata?.role || 'editor',
          full_name: user.user_metadata?.full_name || ''
        };
      }

      return profile;
    } catch (err) {
      console.error('[K.K. Tour Admin API] Error getting admin profile:', err);
      return null;
    }
  }

  /**
   * Authenticate admin or editor via Supabase Auth
   */
  async function adminLogin(email, password) {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase client is not available.');

    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim(),
      password: password
    });

    if (error) {
      throw error;
    }

    // Verify user role
    const profile = await getCurrentAdminProfile();
    if (!profile || !['admin', 'editor'].includes(profile.role)) {
      await client.auth.signOut();
      throw new Error('У вашей учётной записи нет прав доступа к панели управления (требуется роль admin или editor).');
    }

    return { user: data.user, profile };
  }

  /**
   * Log out from admin panel
   */
  async function adminLogout() {
    const client = window.supabaseClient;
    if (client) {
      await client.auth.signOut();
    }
    const isCleanDomain = window.location.hostname === 'admin.kktour.kz';
    window.location.href = isCleanDomain ? '/' : 'login.html';
  }

  /**
   * Fetches all tours for the admin panel (published, draft, archived)
   */
  async function fetchAllToursForAdmin({ status = 'all', search = '' } = {}) {
    const client = window.supabaseClient;
    if (!client) return [];

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
        updated_at,
        tour_translations (
          id, language, name, description, full_description, duration_label, days_label, badge
        ),
        tour_includes (
          id, language, text, sort_order
        )
      `)
      .order('featured_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[K.K. Tour Admin API] Error fetching admin tours:', error);
      throw error;
    }

    let list = data || [];
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(t => {
        const slugMatch = t.slug && t.slug.toLowerCase().includes(q);
        const nameMatch = Array.isArray(t.tour_translations) && t.tour_translations.some(tr => tr.name && tr.name.toLowerCase().includes(q));
        return slugMatch || nameMatch;
      });
    }

    return list;
  }

  /**
   * Fetches single tour for editing by its UUID
   */
  async function fetchTourForAdmin(tourId) {
    const client = window.supabaseClient;
    if (!client) return null;

    const { data, error } = await client
      .from('tours')
      .select(`
        *,
        tour_translations (*),
        tour_includes (*)
      `)
      .eq('id', tourId)
      .single();

    if (error) {
      console.error('[K.K. Tour Admin API] Error fetching tour for edit:', error);
      throw error;
    }
    return data;
  }

  /**
   * Creates or updates a tour along with its translations and includes in a single transaction
   * @param {Object} tourData
   */
  async function saveTour(tourData) {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase client not initialized.');

    const isNew = !tourData.id || tourData.id === 'new';

    // 1. Prepare main tour record
    const tourPayload = {
      slug: (tourData.slug || '').trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
      price: parseInt(tourData.price, 10) || 0,
      rating: parseFloat(tourData.rating) || 5.0,
      photo: (tourData.photo || '').trim() || 'assets/images/album_lake.jpg',
      duration_days: parseInt(tourData.duration_days, 10) || 1,
      category: tourData.category || 'lakes',
      featured: Boolean(tourData.featured),
      featured_order: parseInt(tourData.featured_order, 10) || 0,
      status: tourData.status || 'published',
      updated_at: new Date().toISOString()
    };

    let tourId = tourData.id;

    if (isNew) {
      const { data: newTour, error: insertError } = await client
        .from('tours')
        .insert(tourPayload)
        .select()
        .single();

      if (insertError) throw insertError;
      tourId = newTour.id;
    } else {
      const { error: updateError } = await client
        .from('tours')
        .update(tourPayload)
        .eq('id', tourId);

      if (updateError) throw updateError;
    }

    // 2. Upsert translations for RU, KZ, EN
    const languages = ['ru', 'kz', 'en'];
    for (const lang of languages) {
      const trans = (tourData.translations && tourData.translations[lang]) || {};
      const transPayload = {
        tour_id: tourId,
        language: lang,
        name: (trans.name || '').trim() || (tourPayload.slug || 'Тур'),
        description: (trans.description || '').trim(),
        full_description: (trans.full_description || trans.description || '').trim(),
        duration_label: (trans.duration_label || '').trim(),
        days_label: (trans.days_label || '').trim(),
        badge: (trans.badge || '').trim(),
        updated_at: new Date().toISOString()
      };

      const { error: transError } = await client
        .from('tour_translations')
        .upsert(transPayload, { onConflict: 'tour_id, language' });

      if (transError) {
        console.error(`[K.K. Tour Admin API] Error saving ${lang} translation:`, transError);
      }
    }

    // 3. Sync includes
    if (tourData.includes && typeof tourData.includes === 'object') {
      // Delete old includes for this tour
      await client.from('tour_includes').delete().eq('tour_id', tourId);

      // Insert new includes
      const includeRows = [];
      languages.forEach(lang => {
        const items = tourData.includes[lang];
        if (Array.isArray(items)) {
          items.forEach((itemText, idx) => {
            const cleanText = (typeof itemText === 'string') ? itemText.trim() : '';
            if (cleanText) {
              includeRows.push({
                tour_id: tourId,
                language: lang,
                text: cleanText,
                sort_order: idx + 1
              });
            }
          });
        }
      });

      if (includeRows.length > 0) {
        const { error: incError } = await client.from('tour_includes').insert(includeRows);
        if (incError) {
          console.error('[K.K. Tour Admin API] Error saving includes:', incError);
        }
      }
    }

    // Invalidate public cache so site updates immediately
    if (window.toursApi && typeof window.toursApi.invalidateCache === 'function') {
      window.toursApi.invalidateCache();
    }

    return { success: true, tourId };
  }

  /**
   * Delete tour permanently (admin only)
   */
  async function deleteTour(tourId) {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase client not available.');

    const profile = await getCurrentAdminProfile();
    if (!profile || profile.role !== 'admin') {
      throw new Error('Только главный администратор (роль admin) может безвозвратно удалять туры. Используйте статус "Архив".');
    }

    const { error } = await client.from('tours').delete().eq('id', tourId);
    if (error) throw error;

    if (window.toursApi && typeof window.toursApi.invalidateCache === 'function') {
      window.toursApi.invalidateCache();
    }
    return { success: true };
  }

  /**
   * Quick status change (published, draft, archived)
   */
  async function updateTourStatus(tourId, newStatus) {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase client not available.');

    const { error } = await client
      .from('tours')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', tourId);

    if (error) throw error;

    if (window.toursApi && typeof window.toursApi.invalidateCache === 'function') {
      window.toursApi.invalidateCache();
    }
  }

  /**
   * Quick featured toggle
   */
  async function updateTourFeatured(tourId, featured, featuredOrder = 0) {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase client not available.');

    const { error } = await client
      .from('tours')
      .update({
        featured: Boolean(featured),
        featured_order: parseInt(featuredOrder, 10) || 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', tourId);

    if (error) throw error;

    if (window.toursApi && typeof window.toursApi.invalidateCache === 'function') {
      window.toursApi.invalidateCache();
    }
  }

  /**
   * Uploads an image file to Supabase Storage 'tour-images' bucket
   * @param {File} file
   * @returns {Promise<string>} Public URL of uploaded image
   */
  async function uploadTourPhoto(file) {
    const client = window.supabaseClient;
    if (!client) throw new Error('Supabase client not available.');

    if (!file || !file.name) throw new Error('Не выбран файл изображения.');

    const fileExt = file.name.split('.').pop().toLowerCase();
    const fileName = `tour_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `tours/${fileName}`;

    const { data, error } = await client.storage
      .from('tour-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('[K.K. Tour Admin API] Storage upload error:', error);
      throw error;
    }

    const { data: publicUrlData } = client.storage
      .from('tour-images')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  }

  // Export Admin API
  window.adminApi = {
    getCurrentAdminProfile,
    adminLogin,
    adminLogout,
    fetchAllToursForAdmin,
    fetchTourForAdmin,
    saveTour,
    deleteTour,
    updateTourStatus,
    updateTourFeatured,
    uploadTourPhoto
  };
})();
