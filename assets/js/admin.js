/**
 * K.K. Tour — Admin Panel Controller (admin.js)
 * Manages authentication guards, dashboard statistics, dynamic table filtering,
 * tour creation/editing with multilingual tabs, Supabase Storage uploads, and toasts.
 */

(function () {
  let currentAdminProfile = null;
  let allAdminTours = [];
  let currentStatusFilter = 'all';
  let currentSearchQuery = '';
  let tourToDeleteId = null;

  /**
   * Displays a floating toast notification in the admin UI
   */
  function showAdminToast(message, isError = false) {
    const toast = document.getElementById('adminToast');
    const toastMsg = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');
    if (!toast || !toastMsg) return;

    toastMsg.textContent = message;
    if (isError) {
      toast.firstElementChild.className = 'bg-slate-900 border border-rose-500/50 text-white rounded-2xl px-5 py-3.5 shadow-2xl flex items-center gap-3';
      if (toastIcon) toastIcon.className = 'w-5 h-5 text-rose-400';
    } else {
      toast.firstElementChild.className = 'bg-slate-900 border border-emerald-500/50 text-white rounded-2xl px-5 py-3.5 shadow-2xl flex items-center gap-3';
      if (toastIcon) toastIcon.className = 'w-5 h-5 text-emerald-400';
    }

    toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
    setTimeout(() => {
      toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
    }, 3500);
  }

  /**
   * Enforces authentication on all admin pages
   */
  async function checkAuthGuard() {
    if (!window.adminApi) return;

    currentAdminProfile = await window.adminApi.getCurrentAdminProfile();
    if (!currentAdminProfile || !['admin', 'editor'].includes(currentAdminProfile.role)) {
      window.location.href = 'login.html';
      return false;
    }

    // Populate user profile info in header
    const emailEl = document.getElementById('adminUserEmail');
    const badgeEl = document.getElementById('adminRoleBadge');
    if (emailEl) emailEl.textContent = currentAdminProfile.email || 'Администратор';
    if (badgeEl) {
      badgeEl.textContent = (currentAdminProfile.role || 'editor').toUpperCase();
      if (currentAdminProfile.role === 'admin') {
        badgeEl.className = 'inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      } else {
        badgeEl.className = 'inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30';
      }
    }

    // Bind logout button
    const logoutBtn = document.getElementById('btnAdminLogout');
    if (logoutBtn) {
      logoutBtn.onclick = () => window.adminApi.adminLogout();
    }

    return true;
  }

  // ==========================================================================
  // PAGE 1: TOURS LIST / DASHBOARD (admin/index.html)
  // ==========================================================================

  async function initDashboardPage() {
    const tableBody = document.getElementById('adminToursTableBody');
    if (!tableBody) return;

    await loadAndRenderAdminTours();

    // Bind search input
    const searchInput = document.getElementById('adminSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.trim().toLowerCase();
        renderAdminTable();
      });
    }

    // Bind status filter tabs
    const statusTabs = document.querySelectorAll('#adminStatusFilter .status-tab');
    statusTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        statusTabs.forEach(t => {
          t.classList.remove('active', 'bg-emerald-600', 'text-white');
          t.classList.add('bg-slate-800', 'text-slate-300');
        });
        tab.classList.add('active', 'bg-emerald-600', 'text-white');
        tab.classList.remove('bg-slate-800', 'text-slate-300');
        currentStatusFilter = tab.getAttribute('data-status') || 'all';
        renderAdminTable();
      });
    });

    // Bind Delete Confirmation Modal
    initDeleteModal();
  }

  async function loadAndRenderAdminTours() {
    try {
      allAdminTours = await window.adminApi.fetchAllToursForAdmin({ status: 'all' });
      updateDashboardStats();
      renderAdminTable();
    } catch (err) {
      console.error('[K.K. Tour Admin] Error loading tours:', err);
      const tableBody = document.getElementById('adminToursTableBody');
      if (tableBody) {
        tableBody.innerHTML = `
          <tr>
            <td colspan="7" class="py-12 text-center text-rose-400">
              <p class="font-bold">Ошибка загрузки туров из базы данных</p>
              <p class="text-xs text-slate-500 mt-1">${err.message || ''}</p>
            </td>
          </tr>`;
      }
    }
  }

  function updateDashboardStats() {
    const statTotal = document.getElementById('statTotalTours');
    const statPublished = document.getElementById('statPublishedTours');
    const statDraft = document.getElementById('statDraftTours');
    const statFeatured = document.getElementById('statFeaturedTours');

    if (!Array.isArray(allAdminTours)) return;

    const total = allAdminTours.length;
    const published = allAdminTours.filter(t => t.status === 'published').length;
    const draft = allAdminTours.filter(t => t.status === 'draft').length;
    const featured = allAdminTours.filter(t => t.featured === true).length;

    if (statTotal) statTotal.textContent = total;
    if (statPublished) statPublished.textContent = published;
    if (statDraft) statDraft.textContent = draft;
    if (statFeatured) statFeatured.textContent = featured;
  }

  function renderAdminTable() {
    const tableBody = document.getElementById('adminToursTableBody');
    if (!tableBody) return;

    let list = [...allAdminTours];

    // Status Filter
    if (currentStatusFilter !== 'all') {
      list = list.filter(t => t.status === currentStatusFilter);
    }

    // Search Query
    if (currentSearchQuery) {
      list = list.filter(t => {
        const slug = (t.slug || '').toLowerCase();
        const ruTrans = (t.tour_translations || []).find(tr => tr.language === 'ru') || {};
        const name = (ruTrans.name || '').toLowerCase();
        return slug.includes(currentSearchQuery) || name.includes(currentSearchQuery);
      });
    }

    if (list.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="py-12 text-center text-slate-500 font-medium">
            Туры по выбранным параметрам не найдены.
          </td>
        </tr>`;
      return;
    }

    tableBody.innerHTML = list.map(tour => {
      const ruTrans = (tour.tour_translations || []).find(tr => tr.language === 'ru') || {};
      const kzTrans = (tour.tour_translations || []).find(tr => tr.language === 'kz');
      const enTrans = (tour.tour_translations || []).find(tr => tr.language === 'en');

      const tourName = ruTrans.name || tour.slug;
      const priceFormatted = (tour.price || 0).toLocaleString('ru-RU') + ' ₸';
      const photoSrc = tour.photo || '../assets/images/album_lake.jpg';

      // Status pill
      let statusBadge = '';
      if (tour.status === 'published') {
        statusBadge = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">🟢 Опубликован</span>';
      } else if (tour.status === 'draft') {
        statusBadge = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">🟡 Черновик</span>';
      } else {
        statusBadge = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-700 text-slate-400">⚪ Архив</span>';
      }

      // Featured star toggle button
      const starIconColor = tour.featured ? 'text-amber-400 fill-amber-400' : 'text-slate-600 hover:text-slate-400';
      const featuredOrderText = tour.featured ? `#${tour.featured_order || 1}` : '';

      return `
        <tr class="hover:bg-slate-800/40 transition-colors group">
          
          <!-- Tour Thumbnail & Title -->
          <td class="py-4 px-4">
            <div class="flex items-center gap-3.5">
              <img src="${photoSrc}" alt="${tourName}" class="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0" onerror="this.src='../assets/images/album_lake.jpg'">
              <div class="max-w-[280px]">
                <a href="tour-edit.html?id=${tour.id}" class="text-white font-bold hover:text-emerald-400 transition-colors line-clamp-1 block">${tourName}</a>
                <span class="text-xs font-mono text-slate-500">${tour.slug}</span>
                <div class="flex items-center gap-1.5 mt-0.5 text-[10px] font-bold">
                  <span class="text-emerald-400">RU</span>
                  <span class="${kzTrans ? 'text-emerald-400' : 'text-slate-600'}">KZ</span>
                  <span class="${enTrans ? 'text-emerald-400' : 'text-slate-600'}">EN</span>
                </div>
              </div>
            </div>
          </td>

          <!-- Category -->
          <td class="py-4 px-3">
            <span class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 capitalize">${tour.category || 'lakes'}</span>
          </td>

          <!-- Price -->
          <td class="py-4 px-3 font-bold text-emerald-400">${priceFormatted}</td>

          <!-- Duration -->
          <td class="py-4 px-3 text-slate-300">${tour.duration_days} дн.</td>

          <!-- Featured Toggle Button -->
          <td class="py-4 px-3 text-center">
            <button 
              type="button" 
              class="btn-toggle-featured p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer inline-flex items-center gap-1"
              data-id="${tour.id}"
              data-featured="${tour.featured}"
              title="Переключить показ на главной">
              <i data-lucide="star" class="w-5 h-5 ${starIconColor}"></i>
              <span class="text-[10px] font-bold text-amber-400/80">${featuredOrderText}</span>
            </button>
          </td>

          <!-- Status -->
          <td class="py-4 px-3">${statusBadge}</td>

          <!-- Actions -->
          <td class="py-4 px-4 text-right">
            <div class="flex items-center justify-end gap-2">
              <a href="tour-edit.html?id=${tour.id}" class="p-2 rounded-xl bg-slate-800 hover:bg-emerald-600/30 text-slate-300 hover:text-emerald-300 transition-colors border border-slate-700" title="Редактировать тур">
                <i data-lucide="edit-3" class="w-4 h-4"></i>
              </a>
              <button 
                type="button" 
                class="btn-delete-tour p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors border border-slate-700 cursor-pointer" 
                data-id="${tour.id}" 
                data-name="${tourName}"
                title="Удалить тур">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </td>

        </tr>`;
    }).join('');

    // Bind featured toggle buttons
    document.querySelectorAll('.btn-toggle-featured').forEach(btn => {
      btn.onclick = async function () {
        const id = this.getAttribute('data-id');
        const isCurrentFeatured = this.getAttribute('data-featured') === 'true';
        const newFeatured = !isCurrentFeatured;

        try {
          await window.adminApi.updateTourFeatured(id, newFeatured, newFeatured ? 1 : 0);
          showAdminToast(newFeatured ? 'Тур добавлен на главную страницу ⭐' : 'Тур убран с главной страницы');
          await loadAndRenderAdminTours();
        } catch (err) {
          showAdminToast(err.message || 'Ошибка обновления', true);
        }
      };
    });

    // Bind delete buttons
    document.querySelectorAll('.btn-delete-tour').forEach(btn => {
      btn.onclick = function () {
        const id = this.getAttribute('data-id');
        const name = this.getAttribute('data-name');
        openDeleteModal(id, name);
      };
    });

    if (window.lucide) {
      try { lucide.createIcons(); } catch (e) {}
    }
  }

  function initDeleteModal() {
    const modal = document.getElementById('deleteConfirmModal');
    const btnCancel = document.getElementById('btnCancelDelete');
    const btnConfirm = document.getElementById('btnConfirmDelete');

    if (btnCancel) {
      btnCancel.onclick = closeDeleteModal;
    }

    if (btnConfirm) {
      btnConfirm.onclick = async () => {
        if (!tourToDeleteId) return;
        btnConfirm.disabled = true;
        btnConfirm.textContent = 'Удаляем...';

        try {
          await window.adminApi.deleteTour(tourToDeleteId);
          showAdminToast('Тур успешно удалён из базы');
          closeDeleteModal();
          await loadAndRenderAdminTours();
        } catch (err) {
          showAdminToast(err.message || 'Ошибка удаления', true);
        } finally {
          btnConfirm.disabled = false;
          btnConfirm.textContent = 'Да, удалить';
        }
      };
    }
  }

  function openDeleteModal(id, name) {
    tourToDeleteId = id;
    const nameEl = document.getElementById('deleteTourName');
    const modal = document.getElementById('deleteConfirmModal');
    if (nameEl) nameEl.textContent = `«${name}»`;
    if (modal) {
      modal.classList.remove('hidden');
      requestAnimationFrame(() => modal.classList.remove('opacity-0'));
    }
  }

  function closeDeleteModal() {
    tourToDeleteId = null;
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
      modal.classList.add('opacity-0');
      setTimeout(() => modal.classList.add('hidden'), 200);
    }
  }

  // ==========================================================================
  // PAGE 2: TOUR CREATE / EDIT (admin/tour-edit.html)
  // ==========================================================================

  async function initTourEditPage() {
    const form = document.getElementById('tourEditForm');
    if (!form) return;

    const urlParams = new URLSearchParams(window.location.search);
    const tourId = urlParams.get('id') || 'new';
    const isNew = tourId === 'new';

    // Update Header
    const pageTitle = document.getElementById('pageTitle');
    const pageSubTitle = document.getElementById('pageSubTitle');
    if (pageTitle) pageTitle.textContent = isNew ? 'Новый тур K.K. Tour' : 'Редактирование тура';
    if (pageSubTitle) pageSubTitle.textContent = isNew ? 'Создание записи в Supabase PostgreSQL' : `ID: ${tourId}`;

    // Language Tab Switching
    const langTabs = document.querySelectorAll('.lang-tab');
    const tabContents = document.querySelectorAll('.lang-tab-content');

    langTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const lang = tab.getAttribute('data-lang');
        langTabs.forEach(t => {
          t.classList.remove('active', 'bg-emerald-600', 'text-white');
          t.classList.add('text-slate-400');
        });
        tab.classList.add('active', 'bg-emerald-600', 'text-white');
        tab.classList.remove('text-slate-400');

        tabContents.forEach(content => {
          if (content.id === `tab-${lang}`) {
            content.classList.remove('hidden');
          } else {
            content.classList.add('hidden');
          }
        });
      });
    });

    // Image Upload to Supabase Storage
    const photoFileInput = document.getElementById('photoFileInput');
    const photoUrlInput = document.getElementById('tourPhotoUrl');
    const photoPreview = document.getElementById('photoPreview');
    const uploadStatus = document.getElementById('uploadStatusText');

    if (photoFileInput) {
      photoFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (uploadStatus) {
          uploadStatus.classList.remove('hidden');
          uploadStatus.textContent = '⏳ Загружаем фото в Supabase Storage...';
        }

        try {
          const publicUrl = await window.adminApi.uploadTourPhoto(file);
          if (photoUrlInput) photoUrlInput.value = publicUrl;
          if (photoPreview) photoPreview.src = publicUrl;
          if (uploadStatus) {
            uploadStatus.textContent = '✓ Фото успешно загружено!';
          }
        } catch (err) {
          if (uploadStatus) {
            uploadStatus.textContent = '❌ Ошибка загрузки: ' + err.message;
          }
        }
      });
    }

    if (photoUrlInput) {
      photoUrlInput.addEventListener('input', (e) => {
        if (photoPreview) photoPreview.src = e.target.value.trim() || '../assets/images/album_lake.jpg';
      });
    }

    // Dynamic Includes Builder
    const addIncludeBtn = document.getElementById('btnAddIncludeRow');
    if (addIncludeBtn) {
      addIncludeBtn.addEventListener('click', () => {
        addIncludeRow('', '', '');
      });
    }

    // If Editing existing tour, fetch data and populate form
    if (!isNew) {
      try {
        const tourData = await window.adminApi.fetchTourForAdmin(tourId);
        if (tourData) {
          populateFormWithTourData(tourData);
        }
      } catch (err) {
        showAdminToast('Ошибка загрузки данных тура: ' + err.message, true);
      }
    } else {
      // Add initial default include rows
      addIncludeRow('Комфортабельный трансфер', 'Ыңғайлы трансфер', 'Comfortable round-trip transport');
      addIncludeRow('Услуги профессионального гида', 'Кәсіби гид қызметі', 'Professional tour guide service');
      addIncludeRow('Все эко-сборы нацпарка', 'Ұлттық парктің эко-алымдары', 'National park entrance fees');
    }

    // Form Save Actions
    const btnDraftTop = document.getElementById('btnSaveDraft');
    const btnDraftBottom = document.getElementById('btnSaveDraftBottom');

    if (btnDraftTop) {
      btnDraftTop.addEventListener('click', () => submitTourForm('draft', tourId));
    }
    if (btnDraftBottom) {
      btnDraftBottom.addEventListener('click', () => submitTourForm('draft', tourId));
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const status = document.getElementById('tourStatus').value || 'published';
      submitTourForm(status, tourId);
    });
  }

  function addIncludeRow(ru = '', kz = '', en = '') {
    const container = document.getElementById('includesRowsContainer');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'include-row grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-slate-800/80 rounded-2xl border border-slate-700 relative';
    row.innerHTML = `
      <div>
        <label class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">🇷🇺 RU</label>
        <input type="text" class="include-ru w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500" value="${escapeHtml(ru)}" placeholder="Трансфер туда и обратно">
      </div>
      <div>
        <label class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">🇰🇿 KZ</label>
        <input type="text" class="include-kz w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500" value="${escapeHtml(kz)}" placeholder="Екі жаққа трансфер">
      </div>
      <div class="flex items-center gap-2">
        <div class="flex-1">
          <label class="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">🇬🇧 EN</label>
          <input type="text" class="include-en w-full bg-slate-900 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-emerald-500" value="${escapeHtml(en)}" placeholder="Round-trip transport">
        </div>
        <button type="button" class="btn-remove-include self-end mb-0.5 p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer" title="Удалить пункт">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>`;

    row.querySelector('.btn-remove-include').onclick = () => row.remove();
    container.appendChild(row);

    if (window.lucide) {
      try { lucide.createIcons(); } catch (e) {}
    }
  }

  function populateFormWithTourData(tour) {
    document.getElementById('tourSlug').value = tour.slug || '';
    document.getElementById('tourPrice').value = tour.price || 0;
    document.getElementById('tourRating').value = tour.rating || 5.0;
    document.getElementById('tourDurationDays').value = tour.duration_days || 1;
    document.getElementById('tourCategory').value = tour.category || 'lakes';
    document.getElementById('tourStatus').value = tour.status || 'published';
    document.getElementById('tourFeatured').checked = Boolean(tour.featured);
    document.getElementById('tourFeaturedOrder').value = tour.featured_order || 1;

    if (tour.photo) {
      document.getElementById('tourPhotoUrl').value = tour.photo;
      document.getElementById('photoPreview').src = tour.photo;
    }

    // Translations lookup
    const ru = (tour.tour_translations || []).find(t => t.language === 'ru') || {};
    const kz = (tour.tour_translations || []).find(t => t.language === 'kz') || {};
    const en = (tour.tour_translations || []).find(t => t.language === 'en') || {};

    document.getElementById('name_ru').value = ru.name || '';
    document.getElementById('desc_ru').value = ru.description || '';
    document.getElementById('fulldesc_ru').value = ru.full_description || '';
    document.getElementById('duration_ru').value = ru.duration_label || '';
    document.getElementById('days_ru').value = ru.days_label || '';
    document.getElementById('badge_ru').value = ru.badge || '';

    document.getElementById('name_kz').value = kz.name || '';
    document.getElementById('desc_kz').value = kz.description || '';
    document.getElementById('fulldesc_kz').value = kz.full_description || '';
    document.getElementById('duration_kz').value = kz.duration_label || '';
    document.getElementById('days_kz').value = kz.days_label || '';
    document.getElementById('badge_kz').value = kz.badge || '';

    document.getElementById('name_en').value = en.name || '';
    document.getElementById('desc_en').value = en.description || '';
    document.getElementById('fulldesc_en').value = en.full_description || '';
    document.getElementById('duration_en').value = en.duration_label || '';
    document.getElementById('days_en').value = en.days_label || '';
    document.getElementById('badge_en').value = en.badge || '';

    // Includes
    const container = document.getElementById('includesRowsContainer');
    if (container) container.innerHTML = '';

    const ruInc = (tour.tour_includes || []).filter(i => i.language === 'ru').sort((a, b) => a.sort_order - b.sort_order);
    const kzInc = (tour.tour_includes || []).filter(i => i.language === 'kz').sort((a, b) => a.sort_order - b.sort_order);
    const enInc = (tour.tour_includes || []).filter(i => i.language === 'en').sort((a, b) => a.sort_order - b.sort_order);

    const maxCount = Math.max(ruInc.length, kzInc.length, enInc.length);
    for (let i = 0; i < maxCount; i++) {
      addIncludeRow(
        ruInc[i] ? ruInc[i].text : '',
        kzInc[i] ? kzInc[i].text : '',
        enInc[i] ? enInc[i].text : ''
      );
    }
  }

  async function submitTourForm(statusOverride, tourId) {
    const slug = document.getElementById('tourSlug').value.trim();
    if (!slug) {
      showAdminToast('Укажите уникальный slug тура', true);
      return;
    }

    const payload = {
      id: tourId,
      slug: slug,
      price: parseInt(document.getElementById('tourPrice').value, 10) || 0,
      rating: parseFloat(document.getElementById('tourRating').value) || 5.0,
      duration_days: parseInt(document.getElementById('tourDurationDays').value, 10) || 1,
      category: document.getElementById('tourCategory').value || 'lakes',
      photo: document.getElementById('tourPhotoUrl').value.trim() || 'assets/images/album_lake.jpg',
      status: statusOverride || document.getElementById('tourStatus').value || 'published',
      featured: document.getElementById('tourFeatured').checked,
      featured_order: parseInt(document.getElementById('tourFeaturedOrder').value, 10) || 1,

      translations: {
        ru: {
          name: document.getElementById('name_ru').value,
          description: document.getElementById('desc_ru').value,
          full_description: document.getElementById('fulldesc_ru').value,
          duration_label: document.getElementById('duration_ru').value,
          days_label: document.getElementById('days_ru').value,
          badge: document.getElementById('badge_ru').value
        },
        kz: {
          name: document.getElementById('name_kz').value,
          description: document.getElementById('desc_kz').value,
          full_description: document.getElementById('fulldesc_kz').value,
          duration_label: document.getElementById('duration_kz').value,
          days_label: document.getElementById('days_kz').value,
          badge: document.getElementById('badge_kz').value
        },
        en: {
          name: document.getElementById('name_en').value,
          description: document.getElementById('desc_en').value,
          full_description: document.getElementById('fulldesc_en').value,
          duration_label: document.getElementById('duration_en').value,
          days_label: document.getElementById('days_en').value,
          badge: document.getElementById('badge_en').value
        }
      },

      includes: {
        ru: Array.from(document.querySelectorAll('.include-row .include-ru')).map(i => i.value),
        kz: Array.from(document.querySelectorAll('.include-row .include-kz')).map(i => i.value),
        en: Array.from(document.querySelectorAll('.include-row .include-en')).map(i => i.value)
      }
    };

    try {
      await window.adminApi.saveTour(payload);
      showAdminToast('✓ Тур успешно сохранён в Supabase!');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 800);
    } catch (err) {
      showAdminToast('Ошибка сохранения: ' + err.message, true);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/"/g, '&quot;');
  }

  // Auto-init on page load
  document.addEventListener('DOMContentLoaded', async () => {
    if (window.lucide) {
      try { lucide.createIcons(); } catch (e) {}
    }

    const isAuthed = await checkAuthGuard();
    if (!isAuthed) return;

    if (document.getElementById('adminToursTableBody')) {
      await initDashboardPage();
    } else if (document.getElementById('tourEditForm')) {
      await initTourEditPage();
    }
  });

  window.showAdminToast = showAdminToast;
})();
