/**
 * K.K. Tour — Tours Loader & Card Renderer
 * Loads normalized tour data exclusively from Supabase PostgreSQL (via tours-api.js).
 * Zero dependencies on Google Sheets / CSV.
 */

// Global State
window.currentLoadedTours = window.currentLoadedTours || [];
window.toursCatalog = window.toursCatalog || {};
window.tourPrices = window.tourPrices || {};

/**
 * Creates a fully localized HTML card for a tour.
 */
function createTourCard(tour, index) {
  const translate = window.t || ((k, f) => f || k);
  const lang = typeof window.getCurrentLang === 'function' ? window.getCurrentLang() : 'ru';

  const localizedName = tour.name || 'Тур K.K. Tour';
  const localizedDesc = tour.description || '';
  const localizedDuration = tour.duration || '';
  const localizedDays = tour.days || '';
  const localizedBadge = tour.badge || '';

  const price = parseInt(tour.price, 10) || 0;
  const currencySymbol = translate('currency_symbol', '₸');
  const priceStr = price ? `${price.toLocaleString('ru-RU')} ${currencySymbol}` : translate('price_on_request', 'Уточняйте');

  const delays = ['', 'delay-100', 'delay-200'];
  const delay = delays[index % 3];
  const photoSrc = tour.photo || 'assets/images/album_lake.jpg';
  const tourId = tour.slug || tour.id;

  // Badges: Featured Star Badge + Custom Badge
  const featuredBadgeHTML = tour.featured
    ? `<div class="tour-featured-badge"><span class="star">★</span> ${translate('badge_featured', 'Популярный')}</div>`
    : '';

  const badgeHTML = localizedBadge
    ? `<div class="tour-badge">${localizedBadge}</div>`
    : '';

  const ratingVal = parseFloat(tour.rating) || 4.99;
  const ratingHTML = `<div class="tour-rating-badge"><span class="star">★</span> ${ratingVal.toFixed(2)}</div>`;

  const daysHTML = localizedDays
    ? `<div class="tour-days-label">${localizedDays}</div>`
    : '';

  const durationHTML = localizedDuration
    ? `<div class="tour-duration"><span class="clock-icon">⏱</span> ${localizedDuration}</div>`
    : '';

  const priceLabel = translate('tour_price_label', 'Стоимость:');
  const bookBtnText = translate('btn_book_card', 'Забронировать');

  return `
    <div class="tour-card reveal-on-scroll ${delay}" id="card-${tourId}" data-tour-id="${tourId}" data-category="${tour.category || 'all'}">
      <div class="tour-card__img-wrap">
        <img
          src="${photoSrc}"
          alt="${localizedName}"
          loading="lazy"
          class="tour-card__img"
          onerror="this.src='assets/images/album_lake.jpg'">
        ${badgeHTML}
        ${featuredBadgeHTML}
        ${ratingHTML}
        ${daysHTML}
      </div>
      <div class="tour-card__body">
        <div>
          <div class="tour-card__meta">
            ${durationHTML}
          </div>
          <h3 class="tour-card__title">${localizedName}</h3>
          <p class="tour-card__desc">${localizedDesc}</p>
        </div>
        <div class="tour-card__footer">
          <div class="tour-card__price-wrap">
            <span class="tour-card__price-label">${priceLabel}</span>
            <span class="tour-card__price">${priceStr}</span>
          </div>
          <button
            type="button"
            data-open-booking
            data-tour="${tourId}"
            data-tour-name="${localizedName}"
            data-tour-price="${price}"
            class="btn-book-card">
            ${bookBtnText}
          </button>
        </div>
      </div>
    </div>`;
}

/**
 * Synchronizes tours with global catalog, price cache, and booking modal dropdown.
 */
function syncWithBookingModal(tours) {
  window.tourPrices = window.tourPrices || {};
  window.toursCatalog = window.toursCatalog || {};
  const translate = window.t || ((k, f) => f || k);
  const currencySymbol = translate('currency_symbol', '₸');

  // Populate global catalog cache
  tours.forEach(t => {
    const key = t.slug || t.id;
    window.toursCatalog[key] = t;
    if (t.id) window.toursCatalog[t.id] = t;
    if (t.price) window.tourPrices[key] = parseInt(t.price, 10);
  });

  // Re-populate select dropdown in modal
  const select = document.getElementById('bookTourSelect');
  if (select) {
    const currentVal = select.value;
    select.innerHTML = '';

    tours.forEach(t => {
      const key = t.slug || t.id;
      const opt = document.createElement('option');
      opt.value = key;
      const p = parseInt(t.price, 10) || 0;
      const locName = t.name || key;
      opt.textContent = `${locName} (${p.toLocaleString('ru-RU')} ${currencySymbol})`;
      select.appendChild(opt);
    });

    if (currentVal && select.querySelector(`option[value="${currentVal}"]`)) {
      select.value = currentVal;
    }
  }

  // Bind booking button clicks on card elements
  document.querySelectorAll('[data-open-booking]').forEach(btn => {
    btn.onclick = function (e) {
      e.preventDefault();
      const tourId = this.getAttribute('data-tour');
      if (typeof window.openBookingModal === 'function') {
        window.openBookingModal(tourId);
      }
    };
  });
}

/**
 * Re-renders all tour cards and updates the booking modal in the active language.
 */
window.refreshTourCardsLanguage = async function () {
  const lang = typeof window.getCurrentLang === 'function' ? window.getCurrentLang() : 'ru';
  const container = document.getElementById('tours-container');

  // Re-normalize loaded tours with active language
  if (Array.isArray(window.currentLoadedTours) && window.currentLoadedTours.length > 0) {
    const normalized = window.currentLoadedTours.map(t => {
      if (window.toursApi && typeof window.toursApi.normalizeTour === 'function' && t.translations) {
        return window.toursApi.normalizeTour(t, lang);
      }
      return t;
    });

    window.currentLoadedTours = normalized;

    if (container) {
      container.innerHTML = normalized.map((t, i) => createTourCard(t, i)).join('');
      requestAnimationFrame(() => {
        container.querySelectorAll('.reveal-on-scroll').forEach(el => el.classList.add('is-revealed'));
      });
    }

    syncWithBookingModal(normalized);
  }

  if (window.lucide) {
    try { lucide.createIcons(); } catch (e) {}
  }
};

/**
 * Loads published tours from Supabase and renders them into the target container.
 * @param {Object} options
 * @param {boolean} [options.featuredOnly=false]
 * @param {string} [options.category='all']
 * @param {string} [options.containerId='tours-container']
 */
window.loadTours = async function ({ featuredOnly = false, category = 'all', containerId = 'tours-container' } = {}) {
  const container = document.getElementById(containerId);
  const translate = window.t || ((k, f) => f || k);
  const currentLang = typeof window.getCurrentLang === 'function' ? window.getCurrentLang() : 'ru';

  if (container) {
    container.innerHTML = `
      <div class="col-span-full flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
        <div class="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <p class="text-sm font-medium">${translate('loading_tours', 'Загружаем актуальные туры...')}</p>
      </div>`;
  }

  try {
    if (!window.toursApi) {
      throw new Error('tours-api.js is not loaded.');
    }

    const tours = await window.toursApi.fetchPublishedTours({
      featuredOnly,
      category: category === 'all' ? null : category,
      language: currentLang
    });

    if (Array.isArray(tours) && tours.length > 0) {
      window.currentLoadedTours = tours;

      if (container) {
        container.innerHTML = tours.map((t, i) => createTourCard(t, i)).join('');
        requestAnimationFrame(() => {
          container.querySelectorAll('.reveal-on-scroll').forEach(el => el.classList.add('is-revealed'));
        });
      }

      syncWithBookingModal(tours);
    } else {
      // Empty state
      if (container) {
        container.innerHTML = `
          <div class="col-span-full py-16 text-center text-slate-500">
            <p class="text-base font-semibold">${translate('tours_empty_state', 'Туры по выбранным параметрам не найдены.')}</p>
          </div>`;
      }
    }
  } catch (err) {
    console.error('[K.K. Tour] Error in loadTours:', err);
    if (container) {
      container.innerHTML = `
        <div class="col-span-full py-12 text-center text-slate-400">
          <p class="text-sm">${translate('error_loading_tours', 'Не удалось загрузить туры. Пожалуйста, попробуйте позже.')}</p>
        </div>`;
    }
  }

  if (window.lucide) {
    try { lucide.createIcons(); } catch (e) {}
  }
};
