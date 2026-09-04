/**
 * K.K. Tour (Алматы, Панфилов көшесі, 52) — Main JavaScript
 * 100% Comprehensive Multilingual Engine + Interactive Motion & 3D Physics
 */

let currentLang = (typeof window.getCurrentLang === 'function') ? window.getCurrentLang() : (localStorage.getItem('kktour_lang') || 'ru');

// Actual K.K. Tour Pricing Map in Kazakhstan Tenge (₸)
window.tourPrices = window.tourPrices || {
  'kolsay-2days': 28500,     // 2 дня 6 локаций: Кольсай-Чарын-Каинды
  'assy-sunset': 16500,      // Плато Асы + Медвежий водопад
  'kolsay-1day': 14000,      // 1 день 6 локаций: Жемчужины Семиречья
  'turkestan-2days': 38000,  // Исторический юг: Туркестан
  'assy-camping': 28000,     // Ночевка на Плато Асы + Водопад
  'issyk-lake': 12500,       // Озеро Иссык + Форелевое хозяйство
  'bao-trek': 10500,         // БАО Большое Алматинское Озеро
  'horse-tour': 18000,       // Конный тур на закате
  'kyrgyzstan': 35000,       // Кыргызстан: Чункурчак
  'custom': 25000
};
const tourPrices = window.tourPrices;

document.addEventListener('DOMContentLoaded', () => {
  initLanguage();
  initScrollReveal();
  initNavbarScroll();
  initMobileMenu();
  initBookingModal();
  initLightbox();
  initAdventureQuiz();
  initContactForm();
  initNewsletterForm();
  initTourFilters();
  initStatsCounter();
  initCard3DTilt();
  initQuickSearch();
  initHeroVideos();
});

// 1. Full Language Switcher (RU, KZ, EN)
function initLanguage() {
  setLanguage(currentLang);

  const langButtons = document.querySelectorAll('[data-set-lang]');
  langButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const lang = btn.getAttribute('data-set-lang');
      setLanguage(lang);
    });
  });
}

function setLanguage(lang) {
  if (!translations || !translations[lang]) lang = 'ru';
  currentLang = lang;
  localStorage.setItem('kktour_lang', lang);

  const dict = translations[lang] || translations['ru'];

  // Update text content for data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key] !== undefined) {
      el.textContent = dict[key];
    }
  });

  // Update HTML content for data-i18n-html elements
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    if (dict[key] !== undefined) {
      el.innerHTML = dict[key];
    }
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key] !== undefined) {
      el.placeholder = dict[key];
    }
  });

  // Update image alt attributes
  document.querySelectorAll('[data-i18n-alt]').forEach(el => {
    const key = el.getAttribute('data-i18n-alt');
    if (dict[key] !== undefined) {
      el.alt = dict[key];
    }
  });

  // Update aria-labels
  document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria-label');
    if (dict[key] !== undefined) {
      el.setAttribute('aria-label', dict[key]);
    }
  });

  // Update active state in switcher UI (both desktop and mobile)
  document.querySelectorAll('[data-set-lang]').forEach(btn => {
    const bLang = btn.getAttribute('data-set-lang');
    const isMobile = btn.closest('#mobileMenuDrawer') || btn.classList.contains('flex-1');

    if (bLang === lang) {
      if (isMobile) {
        btn.className = 'flex-1 py-2.5 rounded-xl transition-all bg-emerald-600 text-white font-bold shadow-sm text-center cursor-pointer';
      } else {
        btn.className = 'px-2.5 py-1 rounded-lg transition-all bg-emerald-600 text-white font-bold text-center cursor-pointer';
      }
    } else {
      if (isMobile) {
        btn.className = 'flex-1 py-2.5 rounded-xl transition-all text-slate-600 hover:bg-slate-200 font-medium text-center cursor-pointer';
      } else {
        btn.className = 'px-2.5 py-1 rounded-lg transition-all text-slate-600 hover:bg-slate-200 text-center cursor-pointer';
      }
    }
  });

  // Refresh dynamic tour cards and booking modal
  if (typeof window.refreshTourCardsLanguage === 'function') {
    window.refreshTourCardsLanguage();
  }

  if (typeof window.updateBookingPrice === 'function') {
    window.updateBookingPrice();
  }
}

// 2. Intersection Observer for Scroll Animations
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  if (!revealElements.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -30px 0px'
  });

  revealElements.forEach(el => observer.observe(el));
}

// 3. Navbar Scroll Dynamic Effects
function initNavbarScroll() {
  const navbar = document.getElementById('mainNavbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      navbar.classList.add('shadow-lg', 'bg-white/95');
      navbar.classList.remove('bg-white/80');
    } else {
      navbar.classList.remove('shadow-lg', 'bg-white/95');
      navbar.classList.add('bg-white/80');
    }
  });
}

// 4. Mobile Hamburger Menu
function initMobileMenu() {
  const menuBtn = document.getElementById('mobileMenuBtn');
  const closeBtn = document.getElementById('closeMobileMenuBtn') || document.getElementById('closeMobileMenu');
  const mobileMenu = document.getElementById('mobileMenuDrawer') || document.getElementById('mobileDrawer');
  const backdrop = document.getElementById('mobileMenuBackdrop') || document.getElementById('mobileDrawerBackdrop');

  if (!menuBtn || !mobileMenu) return;

  function openMenu() {
    mobileMenu.classList.remove('translate-x-full');
    if (backdrop) {
      backdrop.classList.remove('hidden');
      setTimeout(() => backdrop.classList.remove('opacity-0'), 10);
    }
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mobileMenu.classList.add('translate-x-full');
    if (backdrop) {
      backdrop.classList.add('opacity-0');
      setTimeout(() => {
        backdrop.classList.add('hidden');
        document.body.style.overflow = '';
      }, 300);
    } else {
      document.body.style.overflow = '';
    }
  }

  menuBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (backdrop) backdrop.addEventListener('click', closeMenu);

  // Close drawer on clicking internal navigation links
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !mobileMenu.classList.contains('translate-x-full')) {
      closeMenu();
    }
  });
}

// 5. Booking Modal with Dynamic Supabase Tour Info, Live Pricing & WhatsApp Integration
window.toursCatalog = window.toursCatalog || {};

function initBookingModal() {
  const modal = document.getElementById('bookingModal');
  const openButtons = document.querySelectorAll('[data-open-booking]');
  const closeBtn = document.getElementById('closeBookingModal');
  const form = document.getElementById('bookingForm');
  const tourSelect = document.getElementById('bookTourSelect');
  const guestsInput = document.getElementById('bookGuestsInput');
  const totalPriceEl = document.getElementById('bookTotalPrice');
  const perPersonEl = document.getElementById('bookPerPersonPrice');
  const guestsCountEl = document.getElementById('bookGuestsCount');
  const btnMinus = document.getElementById('btnMinusGuest');
  const btnPlus = document.getElementById('btnPlusGuest');

  // Preview elements inside modal
  const modalImg = document.getElementById('modalTourImg');
  const modalTitle = document.getElementById('modalTourTitle');
  const modalDesc = document.getElementById('modalTourDesc');
  const modalDuration = document.getElementById('modalTourDuration');
  const modalDays = document.getElementById('modalTourDays');
  const modalRating = document.getElementById('modalTourRating');
  const modalBadge = document.getElementById('modalTourBadge');
  const modalIncludesWrap = document.getElementById('modalTourIncludesWrap');
  const modalIncludesList = document.getElementById('modalTourIncludesList');

  if (!modal) return;

  const DEFAULT_TOURS = [
    { slug: 'kolsay-2days', id: 'kolsay-2days', name: '2 дня / 6 локаций: Кольсай, Каинды, Чарын', price: 28500, duration: '2 дня', days: 'Сб – Вс', badge: 'ТОП Выбор', photo: 'assets/images/album_lake.jpg' },
    { slug: 'assy-sunset', id: 'assy-sunset', name: 'Плато Асы + Медвежий водопад (Закат)', price: 16500, duration: '1 день', days: 'Сб, Вс', badge: 'Эко-тур', photo: 'assets/images/album_mountains.jpg' },
    { slug: 'kolsay-1day', id: 'kolsay-1day', name: 'Жемчужины Семиречья: Кольсай, Каинды, Чарын (1 день)', price: 14000, duration: '1 день', days: 'Сб, Вс', badge: 'Хит', photo: 'assets/images/album_waterfall.jpg' },
    { slug: 'turkestan-2days', id: 'turkestan-2days', name: 'Исторический юг: Туркестан (2 дня)', price: 38000, duration: '2 дня', days: 'По графику', badge: 'Культура', photo: 'assets/images/album_camp.jpg' },
    { slug: 'issyk-lake', id: 'issyk-lake', name: 'Озеро Иссык + Форель', price: 12500, duration: '1 день', days: 'Сб, Вс', badge: 'Релакс', photo: 'assets/images/album_lake.jpg' },
    { slug: 'bao-trek', id: 'bao-trek', name: 'БАО & Пик Турист', price: 10500, duration: '1 день', days: 'Сб, Вс', badge: 'Треккинг', photo: 'assets/images/album_mountains.jpg' }
  ];

  // Populate fallback catalog if empty
  DEFAULT_TOURS.forEach(t => {
    if (!window.toursCatalog[t.slug]) window.toursCatalog[t.slug] = t;
    if (!window.toursCatalog[t.id]) window.toursCatalog[t.id] = t;
  });

  // Populate select options if empty (e.g. on about.html, contact.html or before Supabase loads)
  if (tourSelect && tourSelect.options.length === 0) {
    const translate = window.t || ((k, f) => f || k);
    const currencySymbol = translate('currency_symbol', '₸');
    DEFAULT_TOURS.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.slug;
      const p = t.price || 0;
      opt.textContent = `${t.name} (${p.toLocaleString('ru-RU')} ${currencySymbol})`;
      tourSelect.appendChild(opt);
    });
  }

  // --- Update modal content from selected tour data ---
  function updateModalTourDetails(tourId) {
    const tour = window.toursCatalog[tourId] || { id: tourId };
    const getField = window.getTourField || ((t, f) => t[f] || '');
    const translate = window.t || ((k, f) => f || k);

    const localizedTitle = getField(tour, 'name') || tour.name || 'Тур по Казахстану';
    const localizedDesc = getField(tour, 'full_description') || getField(tour, 'description') || tour.description || 'Комфортабельный тур с опытным гидом, трансфером и всеми эко-сборами.';
    const localizedDuration = getField(tour, 'duration') || tour.duration || '';
    const localizedDays = getField(tour, 'days') || tour.days || '';
    const localizedBadge = getField(tour, 'badge') || tour.badge || '';
    const ratingVal = tour.rating || '4.98';
    const photo = tour.photo || 'assets/images/album_lake.jpg';

    if (modalTitle) modalTitle.textContent = localizedTitle;
    if (modalDesc) modalDesc.textContent = localizedDesc;
    if (modalImg) {
      modalImg.src = photo;
      modalImg.alt = localizedTitle;
    }
    
    if (modalDuration) {
      modalDuration.innerHTML = `<i data-lucide="clock" class="w-3.5 h-3.5"></i> ${localizedDuration || translate('diff_1day', '1 день')}`;
    }
    if (modalDays) {
      modalDays.innerHTML = `<i data-lucide="calendar" class="w-3.5 h-3.5"></i> ${localizedDays || translate('season_weekend', 'По графику')}`;
    }
    if (modalRating) {
      modalRating.innerHTML = `★ ${ratingVal}`;
    }
    if (modalBadge) {
      if (localizedBadge) {
        modalBadge.textContent = localizedBadge;
        modalBadge.classList.remove('hidden');
      } else {
        modalBadge.classList.add('hidden');
      }
    }

    // Render "What's included" section if available
    let includes = getField(tour, 'includes');
    if (!includes && tour.includes) includes = tour.includes;

    if (modalIncludesWrap && modalIncludesList) {
      if (Array.isArray(includes) && includes.length > 0) {
        modalIncludesList.innerHTML = includes.map(item => `
          <div class="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
            <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"></i>
            <span>${item}</span>
          </div>
        `).join('');
        modalIncludesWrap.classList.remove('hidden');
      } else if (typeof includes === 'string' && includes.trim().length > 0) {
        const items = includes.split(/[;\n•]/).map(s => s.trim()).filter(s => s.length > 0);
        if (items.length > 0) {
          modalIncludesList.innerHTML = items.map(item => `
            <div class="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 font-medium">
              <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5"></i>
              <span>${item}</span>
            </div>
          `).join('');
          modalIncludesWrap.classList.remove('hidden');
        } else {
          modalIncludesWrap.classList.add('hidden');
        }
      } else {
        modalIncludesWrap.classList.add('hidden');
      }
    }

    if (window.lucide) {
      try { lucide.createIcons(); } catch (e) {}
    }
  }

  // --- Live price recalculation ---
  window.updateBookingPrice = function() {
    if (!tourSelect || !guestsInput || !totalPriceEl) return;

    const tourId = tourSelect.value || 'kolsay-2days';
    updateModalTourDetails(tourId);

    const translate = window.t || ((k, f) => f || k);
    const currency = translate('currency_symbol', '₸');
    const guestsUnit = translate('guests_unit', 'чел.');

    const guests = Math.max(1, parseInt(guestsInput.value, 10) || 1);
    const basePrice = window.tourPrices[tourId] || (window.toursCatalog[tourId]?.price) || 28500;
    const total = basePrice * guests;

    // Per-person price
    if (perPersonEl) perPersonEl.textContent = `${basePrice.toLocaleString('ru-RU')} ${currency}`;
    // Guests count
    if (guestsCountEl) guestsCountEl.textContent = `${guests} ${guestsUnit}`;
    // Total
    totalPriceEl.textContent = `${total.toLocaleString('ru-RU')} ${currency}`;
  };

  // Tour select & guests input events
  if (tourSelect) tourSelect.addEventListener('change', () => window.updateBookingPrice());
  if (guestsInput) guestsInput.addEventListener('input', () => window.updateBookingPrice());

  // +/− counter buttons
  if (btnMinus) {
    btnMinus.addEventListener('click', () => {
      const current = parseInt(guestsInput.value, 10) || 1;
      if (current > 1) { guestsInput.value = current - 1; window.updateBookingPrice(); }
    });
  }
  if (btnPlus) {
    btnPlus.addEventListener('click', () => {
      const current = parseInt(guestsInput.value, 10) || 1;
      if (current < 50) { guestsInput.value = current + 1; window.updateBookingPrice(); }
    });
  }

  // --- Open modal ---
  window.openBookingModal = function(preferredTour) {
    if (preferredTour && tourSelect) {
      if (tourSelect.querySelector(`option[value="${preferredTour}"]`)) {
        tourSelect.value = preferredTour;
      }
    }
    if (guestsInput) guestsInput.value = 1;
    window.updateBookingPrice();
    modal.classList.remove('hidden');
    setTimeout(() => {
      modal.classList.remove('opacity-0');
      modal.querySelector('.modal-card')?.classList.remove('scale-95');
    }, 10);
    document.body.style.overflow = 'hidden';
  };

  // --- Close modal ---
  function closeModal() {
    modal.classList.add('opacity-0');
    modal.querySelector('.modal-card')?.classList.add('scale-95');
    setTimeout(() => {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }, 300);
  }

  openButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tour = btn.getAttribute('data-tour') || 'kolsay-2days';
      window.openBookingModal(tour);
    });
  });

  // Global delegation for dynamic cards
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-open-booking]');
    if (btn) {
      e.preventDefault();
      const tour = btn.getAttribute('data-tour') || 'kolsay-2days';
      window.openBookingModal(tour);
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  // Escape key handler for booking modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal();
    }
  });

  // --- Form submit → WhatsApp ---
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const getField = window.getTourField || ((t, f) => t[f] || '');
      const translate = window.t || ((k, f) => f || k);

      const name    = document.getElementById('bookNameInput')?.value.trim() || '';
      const comment = document.getElementById('bookCommentInput')?.value.trim() || '';
      const tourId  = tourSelect?.value || 'kolsay-2days';
      const tourObj = window.toursCatalog[tourId] || { id: tourId };

      const localizedTourName = getField(tourObj, 'name') || tourObj.name || tourSelect?.options[tourSelect.selectedIndex]?.text?.replace(/\s*\(.*\)$/, '').trim() || 'Тур по Казахстану';
      const localizedDuration = getField(tourObj, 'duration') || tourObj.duration || '';
      const localizedDays = getField(tourObj, 'days') || tourObj.days || '';

      const guests   = guestsInput?.value || '1';
      const basePrice = window.tourPrices[tourId] || tourObj.price || 28500;
      const total    = (basePrice * parseInt(guests)).toLocaleString('ru-RU') + ' ' + translate('currency_symbol', '₸');

      // Build localized WhatsApp message
      const greeting = translate('wa_greeting', 'Здравствуйте, K.K. Tour!');
      const heading  = translate('wa_heading', 'Хочу забронировать тур:');
      const lblTour  = translate('wa_tour', 'Тур:');
      const lblDur   = translate('wa_duration', 'Длительность:');
      const lblDays  = translate('wa_days', 'Выезд:');
      const lblGuests= translate('wa_guests', 'Количество человек:');
      const lblTotal = translate('wa_total', 'Итоговая стоимость:');
      const lblName  = translate('wa_name', 'Имя:');
      const lblComm  = translate('wa_comment', 'Вопросы / пожелания:');

      let lines = [
        greeting,
        heading,
        '',
        `${lblTour} ${localizedTourName}`
      ];

      if (localizedDuration) lines.push(`${lblDur} ${localizedDuration}`);
      if (localizedDays)     lines.push(`${lblDays} ${localizedDays}`);

      lines.push(`${lblGuests} ${guests}`);
      lines.push(`${lblTotal} ${total}`);

      if (name)    lines.push(`${lblName} ${name}`);
      if (comment) lines.push(`${lblComm} ${comment}`);

      const msgText = lines.join('\n');
      const waUrl = `https://wa.me/77472801671?text=${encodeURIComponent(msgText)}`;

      closeModal();

      const toastMsg = translate('toast_wa_redirect', 'Спасибо! Открываем WhatsApp K.K. Tour с вашей заявкой...');
      showToast(toastMsg, 'success');

      setTimeout(() => { window.open(waUrl, '_blank'); }, 850);

      form.reset();
      if (guestsInput) guestsInput.value = 1;
      window.updateBookingPrice();
    });
  }
}

// 6. Lightbox for Photo Album (destinations.html)
function initLightbox() {
  const lightbox = document.getElementById('lightboxModal');
  const lightboxImg = document.getElementById('lightboxImage');
  const lightboxTitle = document.getElementById('lightboxCaption');
  const lightboxTag = document.getElementById('lightboxTag');
  const closeBtn = document.getElementById('closeLightbox');
  const photoCards = document.querySelectorAll('[data-lightbox-trigger]');

  if (!lightbox || !lightboxImg) return;

  function openLightbox(src, title, tag) {
    lightboxImg.src = src;
    if (lightboxTitle) lightboxTitle.textContent = title || '';
    if (lightboxTag) lightboxTag.textContent = tag || '';
    lightbox.classList.remove('hidden');
    setTimeout(() => {
      lightbox.classList.remove('opacity-0');
      lightbox.classList.add('active');
    }, 10);
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.classList.add('opacity-0');
    setTimeout(() => {
      lightbox.classList.add('hidden');
      document.body.style.overflow = '';
    }, 250);
  }

  photoCards.forEach(card => {
    card.addEventListener('click', () => {
      const src = card.getAttribute('data-img');
      const titleEl = card.querySelector('[data-i18n*="title"], h3, h4');
      const tagEl = card.querySelector('[data-i18n*="tag"], [data-i18n*="badge"]');
      const title = titleEl ? titleEl.textContent : card.getAttribute('data-title');
      const tag = tagEl ? tagEl.textContent : card.getAttribute('data-tag');
      openLightbox(src, title, tag);
    });
  });

  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.id === 'lightboxBackdrop') closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lightbox.classList.contains('hidden')) {
      closeLightbox();
    }
  });
}

// 7. Photo Album Filter Buttons
function initTourFilters() {
  const filterBtns = document.querySelectorAll('.album-filter-btn');
  const items = document.querySelectorAll('.album-item');

  if (!filterBtns.length || !items.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('bg-emerald-600', 'text-white', 'shadow-md');
        b.classList.add('bg-white', 'text-slate-700', 'hover:bg-emerald-50');
      });
      btn.classList.remove('bg-white', 'text-slate-700', 'hover:bg-emerald-50');
      btn.classList.add('bg-emerald-600', 'text-white', 'shadow-md');

      const filter = btn.getAttribute('data-filter');

      items.forEach(item => {
        const category = item.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          item.style.display = 'block';
          setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'scale(1)';
          }, 10);
        } else {
          item.style.opacity = '0';
          item.style.transform = 'scale(0.95)';
          setTimeout(() => {
            item.style.display = 'none';
          }, 250);
        }
      });
    });
  });
}

// 8. Interactive Adventure Matcher Quiz for K.K. Tour
function initAdventureQuiz() {
  const quizForm = document.getElementById('adventureQuizForm');
  const resultCard = document.getElementById('quizResultCard');
  const resultTourTitle = document.getElementById('quizResultTourTitle');
  const resultTourDesc = document.getElementById('quizResultTourDesc');
  const resultTourPrice = document.getElementById('quizResultTourPrice');
  const resultTourBookBtn = document.getElementById('quizResultBookBtn');

  if (!quizForm || !resultCard) return;

  quizForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const terrain = quizForm.querySelector('input[name="terrain"]:checked')?.value || 'kolsay';
    const duration = quizForm.querySelector('input[name="duration"]:checked')?.value || '2days';
    const translate = window.t || ((k, f) => f || k);
    const getField = window.getTourField || ((t, f) => t[f] || '');

    let chosenId = 'kolsay-2days';
    if (duration === '1day' && terrain === 'kolsay') {
      chosenId = 'kolsay-1day';
    } else if (terrain === 'assy') {
      chosenId = 'assy-sunset';
    } else if (terrain === 'turkestan') {
      chosenId = 'turkestan-2days';
    }

    const tourObj = window.toursCatalog[chosenId] || { id: chosenId };
    const locTitle = getField(tourObj, 'name');
    const locDesc = getField(tourObj, 'description');
    const price = window.tourPrices[chosenId] || 28500;
    const currency = translate('currency_symbol', '₸');

    if (resultTourTitle) resultTourTitle.textContent = locTitle;
    if (resultTourDesc) resultTourDesc.textContent = locDesc;
    if (resultTourPrice) resultTourPrice.textContent = `${price.toLocaleString('ru-RU')} ${currency}`;
    if (resultTourBookBtn) resultTourBookBtn.setAttribute('data-tour', chosenId);

    resultCard.classList.remove('hidden');
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

    let toastMsg = 'Маршрут от K.K. Tour подобран!';
    if (currentLang === 'kz') toastMsg = 'K.K. Tour-дың ұсынылған маршруты дайын!';
    if (currentLang === 'en') toastMsg = 'K.K. Tour recommended itinerary is ready!';
    showToast(toastMsg, 'success');
  });
}

// 9. Contact & Inquiry Form
function initContactForm() {
  const form = document.getElementById('contactPageForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('[name="name"]')?.value || 'Гость';
    const phone = form.querySelector('[name="phone"]')?.value || '';
    const route = form.querySelector('select[name="route"], select')?.value || '';
    const question = form.querySelector('textarea')?.value || 'Консультация по турам K.K. Tour';
    
    let toastMsg = `Спасибо, ${name}! Открываем диалог с менеджером K.K. Tour в WhatsApp...`;
    if (currentLang === 'kz') toastMsg = `Рақмет, ${name}! K.K. Tour WhatsApp менеджеріне бағытталудасыз...`;
    if (currentLang === 'en') toastMsg = `Thank you, ${name}! Opening chat with K.K. Tour manager on WhatsApp...`;
    
    showToast(toastMsg, 'success');
    
    setTimeout(() => {
      let waMsg = `Здравствуйте, K.K. Tour! Меня зовут ${name} (${phone}).`;
      if (route) waMsg += `\nМаршрут: ${route}`;
      waMsg += `\nВопрос / дата: ${question}`;
      window.open(`https://wa.me/77472801671?text=${encodeURIComponent(waMsg)}`, '_blank');
    }, 1000);

    form.reset();
  });
}

// 9.1 Quick Search Widget on Homepage
function initQuickSearch() {
  const form = document.getElementById('quickSearchForm');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const loc = document.getElementById('searchLocation')?.value || 'all';
    const fmt = document.getElementById('searchFormat')?.value || 'all';

    const params = new URLSearchParams();
    if (loc && loc !== 'all') {
      params.set('search', loc);
    }
    if (fmt === 'daily') {
      params.set('filter', '1day');
    } else if (fmt === 'weekend') {
      params.set('filter', '2day');
    }

    const queryStr = params.toString();
    window.location.href = `destinations.html${queryStr ? '?' + queryStr : ''}`;
  });
}

// 10. Newsletter Signup
function initNewsletterForm() {
  const forms = document.querySelectorAll('.newsletter-form');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = form.querySelector('input[type="email"], input[type="text"]');
      if (input && input.value) {
        let msg = 'Спасибо! Расписание туров K.K. Tour отправлено.';
        if (currentLang === 'kz') msg = 'Рақмет! K.K. Tour кестесі жіберілді.';
        if (currentLang === 'en') msg = 'Thank you! K.K. Tour schedule has been sent.';
        showToast(msg, 'success');
        input.value = '';
      }
    });
  });
}

// 11. Interactive 3D Card Tilt Physics
function initCard3DTilt() {
  const cards = document.querySelectorAll('.interactive-card, .album-item');
  if (!cards.length) return;

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.015)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// 12. Animated Count-Up Numbers for Statistics
function initStatsCounter() {
  const statsElements = document.querySelectorAll('[data-counter-target]');
  if (!statsElements.length) return;

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.getAttribute('data-counter-target'));
        const prefix = el.getAttribute('data-counter-prefix') || '';
        const suffix = el.getAttribute('data-counter-suffix') || '';
        const isDecimal = target % 1 !== 0;

        let start = 0;
        const duration = 1800;
        const startTime = performance.now();

        function updateCounter(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          const currentVal = start + (target - start) * easeOut;

          if (isDecimal) {
            el.textContent = `${prefix}${currentVal.toFixed(1)}${suffix}`;
          } else {
            el.textContent = `${prefix}${Math.floor(currentVal).toLocaleString('ru-RU')}${suffix}`;
          }

          if (progress < 1) {
            requestAnimationFrame(updateCounter);
          } else {
            if (isDecimal) {
              el.textContent = `${prefix}${target.toFixed(1)}${suffix}`;
            } else {
              el.textContent = `${prefix}${target.toLocaleString('ru-RU')}${suffix}`;
            }
          }
        }

        requestAnimationFrame(updateCounter);
        obs.unobserve(el);
      }
    });
  }, { threshold: 0.3 });

  statsElements.forEach(el => observer.observe(el));
}

// 13. Toast Notification System
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'fixed bottom-6 left-6 z-50 flex flex-col gap-3 max-w-sm pointer-events-none';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  const bgClass = type === 'success' ? 'bg-emerald-800 text-white border-emerald-600' : 'bg-slate-900 text-white border-slate-700';
  const icon = `<svg class="w-5 h-5 text-emerald-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`;

  toast.className = `${bgClass} border rounded-2xl p-4 shadow-2xl flex items-start gap-3 pointer-events-auto transform translate-y-8 opacity-0 transition-all duration-300 backdrop-blur-md`;
  toast.innerHTML = `
    ${icon}
    <div class="text-sm font-medium leading-snug">${message}</div>
    <button class="ml-auto text-slate-400 hover:text-white shrink-0 text-xs" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove('translate-y-8', 'opacity-0');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// 14. Ensure Hero Videos autoplay smoothly on all mobile devices (iOS Safari, Android Chrome)
function initHeroVideos() {
  const videos = document.querySelectorAll('video');
  videos.forEach(video => {
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    
    const tryPlay = () => {
      const p = video.play();
      if (p !== undefined) {
        p.catch(() => {
          const playOnInteraction = () => {
            video.play().catch(() => {});
            ['touchstart', 'touchend', 'click', 'scroll'].forEach(evt => {
              document.removeEventListener(evt, playOnInteraction);
            });
          };
          ['touchstart', 'touchend', 'click', 'scroll'].forEach(evt => {
            document.addEventListener(evt, playOnInteraction, { once: true, passive: true });
          });
        });
      }
    };

    tryPlay();
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) tryPlay();
    });
  });
}
