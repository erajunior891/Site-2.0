/**
 * K.K. Tour (Алматы, Панфилов көшесі, 52) — Main JavaScript
 * 100% Comprehensive Multilingual Engine + Interactive Motion & 3D Physics
 */

let currentLang = localStorage.getItem('kktour_lang') || 'ru';

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
  if (!translations[lang]) lang = 'ru';
  currentLang = lang;
  localStorage.setItem('kktour_lang', lang);

  const dict = translations[lang];

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

  // Update image alt or title attributes
  document.querySelectorAll('[data-i18n-alt]').forEach(el => {
    const key = el.getAttribute('data-i18n-alt');
    if (dict[key] !== undefined) {
      el.alt = dict[key];
    }
  });

  // Update active state in switcher UI
  document.querySelectorAll('[data-set-lang]').forEach(btn => {
    const bLang = btn.getAttribute('data-set-lang');
    if (bLang === lang) {
      btn.classList.add('bg-emerald-600', 'text-white', 'font-bold');
      btn.classList.remove('text-slate-600', 'hover:bg-slate-200');
    } else {
      btn.classList.remove('bg-emerald-600', 'text-white', 'font-bold');
      btn.classList.add('text-slate-600', 'hover:bg-slate-200');
    }
  });

  if (typeof updateBookingPrice === 'function') {
    updateBookingPrice();
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
  const closeBtn = document.getElementById('closeMobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenuDrawer');
  const backdrop = document.getElementById('mobileMenuBackdrop');

  if (!menuBtn || !mobileMenu) return;

  function openMenu() {
    mobileMenu.classList.remove('translate-x-full');
    backdrop.classList.remove('hidden');
    setTimeout(() => backdrop.classList.remove('opacity-0'), 10);
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    mobileMenu.classList.add('translate-x-full');
    backdrop.classList.add('opacity-0');
    setTimeout(() => {
      backdrop.classList.add('hidden');
      document.body.style.overflow = '';
    }, 300);
  }

  menuBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (backdrop) backdrop.addEventListener('click', closeMenu);
}

// 5. Booking Modal with Dynamic Google Sheets Info, Live Pricing & WhatsApp Integration
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

  if (!modal) return;

  // --- Update modal content from selected tour data ---
  function updateModalTourDetails(tourId) {
    const tour = window.toursCatalog[tourId] || {};
    
    if (modalTitle && tour.name) modalTitle.textContent = tour.name;
    if (modalDesc) modalDesc.textContent = tour.description || 'Комфортабельный тур с опытным гидом, трансфером и всеми эко-сборами.';
    if (modalImg && tour.photo) modalImg.src = tour.photo;
    if (modalDuration) modalDuration.textContent = tour.duration || 'Тур выходного дня';
    if (modalDays) modalDays.textContent = tour.days || 'По графику';
    if (modalRating) modalRating.textContent = (tour.rating ? tour.rating + ' ★' : '5.0 ★');
    if (modalBadge) {
      if (tour.badge) {
        modalBadge.textContent = tour.badge;
        modalBadge.classList.remove('hidden');
      } else {
        modalBadge.classList.add('hidden');
      }
    }
  }

  // --- Live price recalculation ---
  window.updateBookingPrice = function() {
    if (!tourSelect || !guestsInput || !totalPriceEl) return;

    const tourId = tourSelect.value || 'kolsay-2days';
    updateModalTourDetails(tourId);

    const guests = Math.max(1, parseInt(guestsInput.value, 10) || 1);
    const basePrice = window.tourPrices[tourId] || (window.toursCatalog[tourId]?.price) || 28500;
    const total = basePrice * guests;

    // Per-person price
    if (perPersonEl) perPersonEl.textContent = basePrice.toLocaleString('ru-RU') + ' ₸';
    // Guests count
    if (guestsCountEl) guestsCountEl.textContent = guests + ' чел.';
    // Total
    totalPriceEl.textContent = total.toLocaleString('ru-RU') + ' ₸';
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
    if (preferredTour && tourSelect) tourSelect.value = preferredTour;
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

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  // --- Form submit → WhatsApp ---
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const name    = document.getElementById('bookNameInput')?.value.trim() || '';
      const comment = document.getElementById('bookCommentInput')?.value.trim() || '';
      const tourId  = tourSelect?.value || '';
      const tourObj = window.toursCatalog[tourId] || {};
      const tourName = tourObj.name || tourSelect?.options[tourSelect.selectedIndex]?.text?.replace(/\s*\(.*\)$/, '').trim() || 'Тур по Казахстану';
      const guests   = guestsInput?.value || '1';
      const basePrice = window.tourPrices[tourId] || tourObj.price || 28500;
      const total    = (basePrice * parseInt(guests)).toLocaleString('ru-RU') + ' ₸';

      // Build WhatsApp message — plain clean format
      let lines = [
        'Здравствуйте, K.K. Tour!',
        'Хочу забронировать тур:',
        '',
        'Тур: ' + tourName,
      ];

      if (tourObj.duration) lines.push('Длительность: ' + tourObj.duration);
      if (tourObj.days)     lines.push('Выезд: ' + tourObj.days);

      lines.push('Количество человек: ' + guests);
      lines.push('Итоговая стоимость: ' + total);

      if (name)    lines.push('Имя: ' + name);
      if (comment) lines.push('Вопросы / комментарии: ' + comment);

      const msgText = lines.join('\n');
      const waUrl = `https://wa.me/77472801671?text=${encodeURIComponent(msgText)}`;

      closeModal();

      let toastMsg = 'Спасибо! Открываем WhatsApp K.K. Tour с вашей заявкой...';
      if (currentLang === 'kz') toastMsg = 'Рақмет! K.K. Tour WhatsApp-қа бағытталудасыз...';
      if (currentLang === 'en') toastMsg = 'Thank you! Opening K.K. Tour WhatsApp with your request...';

      showToast(toastMsg, 'success');

      setTimeout(() => { window.open(waUrl, '_blank'); }, 900);

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

    let tour = {
      id: 'kolsay-2days',
      price: '28 500 ₸',
      ru: {
        title: '2 дня / 6 локаций: Кольсай, Каинды, Чарынский Каньон',
        desc: 'Главный хит K.K. Tour! Ночёвка в гостевых домах в Саты, Черный и Лунный каньоны, река Шарын и урочище Куртогай.'
      },
      kz: {
        title: '2 күн / 6 локация: Көлсай, Қайыңды, Шарын Шатқалы',
        desc: 'K.K. Tour-дың басты хиті! Саты ауылындағы қонақ үйлер, Қара және Ай шатқалдары, Шарын өзені және Құртоғай.'
      },
      en: {
        title: '2 Days / 6 Locations: Kolsay, Kaindy, Charyn Canyon',
        desc: 'Our #1 signature tour! Saty guesthouse overnight, Black & Moon Canyons, Charyn River, and Kurty Gorge.'
      }
    };

    if (duration === '1day' && terrain === 'kolsay') {
      tour = {
        id: 'kolsay-1day',
        price: '14 000 ₸',
        ru: {
          title: 'Жемчужины Семиречья: 1 день / 6 локаций',
          desc: 'Экспресс-тур на озеро Кольсай, Чарынский каньон Долина Замков и видовые площадки.'
        },
        kz: {
          title: 'Жетісу жауһарлары: 1 күн / 6 локация',
          desc: 'Көлсай көлі, Шарын шатқалы Қамалдар аңғары және панорамалық нүктелерге 1 күндік тур.'
        },
        en: {
          title: 'Jewels of Semirechye: 1 Day / 6 Locations',
          desc: 'Full-day express trip to Lake Kolsay, Charyn Canyon, and breathtaking viewpoints.'
        }
      };
    } else if (terrain === 'assy') {
      tour = {
        id: 'assy-sunset',
        price: '16 500 ₸',
        ru: {
          title: 'Плато Асы + Медвежий Водопад (Закат в горах)',
          desc: 'Высокогорное плато Асы, древняя астрономическая обсерватория и свежесть водопада.'
        },
        kz: {
          title: 'Асы үстірті + Аюлы Сарқырамасы (Күн батуы)',
          desc: 'Биік таулы Асы үстірті, астрономиялық обсерватория және көрікті сарқырама.'
        },
        en: {
          title: 'Assy Plateau + Bear Waterfall (Sunset)',
          desc: 'Alpine plateau vistas, astronomical observatory, and crisp mountain waterfall.'
        }
      };
    } else if (terrain === 'turkestan') {
      tour = {
        id: 'turkestan-2days',
        price: '38 000 ₸',
        ru: {
          title: 'Исторический юг: Туркестан (2 дня)',
          desc: 'Мавзолей Ходжа Ахмеда Ясави, древний Отырар, Арыстан Баб и вечерний комплекс Керуен-Сарай.'
        },
        kz: {
          title: 'Тарихи оңтүстік: Түркістан (2 күн)',
          desc: 'Қожа Ахмет Ясауи кесенесі, көне Отырар, Арыстан Баб және Керуен-Сарай кешені.'
        },
        en: {
          title: 'Historic South: Turkestan (2 Days)',
          desc: 'Khoja Ahmed Yasawi Mausoleum, ancient Otrar, Arystan Bab, and magical Karavan Saray.'
        }
      };
    }

    const tContent = tour[currentLang] || tour.ru;
    resultTourTitle.textContent = tContent.title;
    resultTourDesc.textContent = tContent.desc;
    resultTourPrice.textContent = tour.price;
    resultTourBookBtn.setAttribute('data-tour', tour.id);

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
    const question = form.querySelector('textarea')?.value || 'Консультация по турам K.K. Tour';
    
    let toastMsg = `Спасибо, ${name}! Открываем диалог с менеджером K.K. Tour в WhatsApp...`;
    if (currentLang === 'kz') toastMsg = `Рақмет, ${name}! K.K. Tour WhatsApp менеджеріне бағытталудасыз...`;
    if (currentLang === 'en') toastMsg = `Thank you, ${name}! Opening chat with K.K. Tour manager on WhatsApp...`;
    
    showToast(toastMsg, 'success');
    
    setTimeout(() => {
      const waMsg = `Здравствуйте, K.K. Tour! Меня зовут ${encodeURIComponent(name)} (${phone}). Вопрос: ${encodeURIComponent(question)}`;
      window.open(`https://wa.me/77472801671?text=${waMsg}`, '_blank');
    }, 1000);

    form.reset();
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
          // Ease out expo
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
