/**
 * tours-loader.js — K.K. Tour
 * Умный многоязычный загрузчик туров из Google Sheets и каталога по умолчанию.
 * Поддерживает i18n-колонки, локализованную отрисовку карточек и обновление без перезагрузки.
 */

// Ссылка на Google Таблицу (поддерживает как опубликованный CSV, так и прямую ссылку на таблицу /edit)
const GOOGLE_SHEET_SOURCE = 'https://docs.google.com/spreadsheets/d/1Gz0vvGLeBLSbDADPX50TZprgk_JKl_kjfTR34p8xCL8/edit?usp=sharing';

// Базовый каталог на случай пустой таблицы или сетевой ошибки
const DEFAULT_FALLBACK_TOURS = [
  {
    id: 'kolsay-2days',
    name: '2 дня / 6 локаций: Кольсай, Каинды, Чарын',
    description: 'Хит сезона! Озёра Кольсай и Каинды с затонувшим лесом, Чёрный и Лунный каньоны, река Шарын и урочище Куртогай.',
    price: 28500,
    duration: '2 дня / 1 ночь',
    badge: 'ТОП Выбор',
    rating: '4.99',
    photo: 'assets/images/album_lake.jpg',
    days: 'Суббота – Воскресенье'
  },
  {
    id: 'assy-sunset',
    name: 'Плато Асы + Медвежий водопад (Закат)',
    description: 'Панорамы высокогорного плато Асы, древняя астрофизическая обсерватория, чистейший воздух и живописный Медвежий водопад.',
    price: 16500,
    duration: '1 день (Джип-тур)',
    badge: 'Эко-тур',
    rating: '5.0',
    photo: 'assets/images/album_mountains.jpg',
    days: 'Каждую субботу и воскресенье'
  },
  {
    id: 'kolsay-1day',
    name: 'Жемчужины Семиречья: 1 день / 6 локаций',
    description: 'Озеро Кольсай, величественный Чарынский каньон (Долина Замков), Чёрный каньон и панорамные точки.',
    price: 14000,
    duration: '1 день (Экспресс)',
    badge: 'Экспресс',
    rating: '4.96',
    photo: 'assets/images/album_waterfall.jpg',
    days: 'Выезды каждую неделю'
  },
  {
    id: 'turkestan-2days',
    name: 'Исторический Юг: Туркестан и Отырар',
    description: 'Мавзолей Ходжи Ахмеда Ясави, городище Отырар, древний Сауран и комплекс Керуен-Сарай.',
    price: 38000,
    duration: '2 дня / 1 ночь',
    badge: 'История',
    rating: '4.95',
    photo: 'assets/images/album_camp.jpg',
    days: 'По графику'
  },
  {
    id: 'issyk-lake',
    name: 'Озеро Иссык + Форелевое хозяйство',
    description: 'Изумрудное озеро Иссык, музей Золотого Человека, водопад и свежая форель на гриле.',
    price: 12500,
    duration: '1 день',
    badge: 'Семейный',
    rating: '4.92',
    photo: 'assets/images/album_lake.jpg',
    days: 'Каждую субботу'
  },
  {
    id: 'bao-trek',
    name: 'БАО (Большое Алматинское Озеро)',
    description: 'Бирюзовое высокогорное зеркало в окружении пиков Заилийского Алатау и ущелье Алма-Арасан.',
    price: 10500,
    duration: '1 день',
    badge: 'Хит',
    rating: '4.97',
    photo: 'assets/images/album_mountains.jpg',
    days: 'Вторник, Четверг, Суббота'
  }
];

// Хранилище загруженных туров
window.currentLoadedTours = window.currentLoadedTours || DEFAULT_FALLBACK_TOURS;
window.toursCatalog = window.toursCatalog || {};
window.tourPrices = window.tourPrices || {};

/** Формирует URL для моментального получения свежих данных без кэша */
function getFreshSheetUrl(source) {
  let url = source.trim();
  const timestamp = Date.now();

  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && !url.includes('/pub') && !url.includes('/e/2PACX-')) {
    const sheetId = match[1];
    return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&t=${timestamp}`;
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}_nocache=${timestamp}`;
}

/** Разбирает строку CSV с учётом кавычек и запятых */
function parseCSVLine(line) {
  const values = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQ = !inQ; }
    } else if (ch === ',' && !inQ) {
      values.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  values.push(cur.trim());
  return values;
}

/** Разбирает список фич/услуг из строки (разделение через ; или переносы строк) */
function parseIncludesList(str) {
  if (!str) return null;
  if (Array.isArray(str)) return str;
  const items = str.split(/[;\n•]/).map(s => s.trim()).filter(s => s.length > 0);
  return items.length ? items : null;
}

/** Умный парсер таблицы: поддерживает заголовки и мультиязычные колонки */
function parseToursCSV(text) {
  const lines = text.trim().split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (!lines.length) return [];

  const firstRowCols = parseCSVLine(lines[0]);
  const hasHeaders = firstRowCols.some(c => /^(id|name|title|price|название|цена|описание)$/i.test(c.toLowerCase()));

  const dataRows = hasHeaders ? lines.slice(1) : lines;
  const headers = hasHeaders ? firstRowCols.map(h => h.toLowerCase().trim()) : null;

  const tours = [];

  dataRows.forEach((line, index) => {
    const cols = parseCSVLine(line);
    if (!cols.length || !cols.some(c => c.length > 0)) return;

    let tour = {};

    if (hasHeaders && headers) {
      headers.forEach((h, i) => {
        const val = cols[i] || '';
        // Multilingual & standard columns parsing
        if (h === 'id') tour.id = val;
        else if (h === 'name_kz' || h === 'title_kz' || h === 'аты_kz' || h === 'атауы_kz') tour.name_kz = val;
        else if (h === 'name_en' || h === 'title_en') tour.name_en = val;
        else if (h === 'name_ru' || h === 'title_ru') tour.name_ru = val;
        else if (/^name|title|название|тур$/i.test(h)) tour.name = val;
        
        else if (h === 'description_kz' || h === 'desc_kz' || h === 'сипаттама_kz') tour.description_kz = val;
        else if (h === 'description_en' || h === 'desc_en') tour.description_en = val;
        else if (h === 'description_ru' || h === 'desc_ru') tour.description_ru = val;
        else if (/^desc|description|описание$/i.test(h)) tour.description = val;

        else if (h === 'full_description_kz' || h === 'full_desc_kz') tour.full_description_kz = val;
        else if (h === 'full_description_en' || h === 'full_desc_en') tour.full_description_en = val;
        else if (h === 'full_description_ru' || h === 'full_desc_ru') tour.full_description_ru = val;
        else if (/full_desc|full_description|толық_сипаттама|полное_описание/i.test(h)) tour.full_description = val;

        else if (h === 'duration_kz' || h === 'уақыты_kz' || h === 'ұзақтығы_kz') tour.duration_kz = val;
        else if (h === 'duration_en') tour.duration_en = val;
        else if (h === 'duration_ru') tour.duration_ru = val;
        else if (/duration|длительность|время|ұзақтығы/i.test(h)) tour.duration = val;

        else if (h === 'days_kz' || h === 'күндері_kz' || h === 'шығу_kz') tour.days_kz = val;
        else if (h === 'days_en') tour.days_en = val;
        else if (h === 'days_ru') tour.days_ru = val;
        else if (/days|дни|выезд|күндері/i.test(h)) tour.days = val;

        else if (h === 'badge_kz') tour.badge_kz = val;
        else if (h === 'badge_en') tour.badge_en = val;
        else if (h === 'badge_ru') tour.badge_ru = val;
        else if (/badge|метка|тег/i.test(h)) tour.badge = val;

        else if (h === 'includes_kz' || h === 'кіреді_kz') tour.includes_kz = parseIncludesList(val);
        else if (h === 'includes_en') tour.includes_en = parseIncludesList(val);
        else if (h === 'includes_ru') tour.includes_ru = parseIncludesList(val);
        else if (/includes|включено|кіреді/i.test(h)) tour.includes = parseIncludesList(val);

        else if (/price|цена|стоимость|бағасы/i.test(h)) tour.price = parseInt(val.replace(/\D/g, ''), 10) || 0;
        else if (/rating|рейтинг|оценка/i.test(h)) tour.rating = val;
        else if (/photo|image|фото|картинка|сурет/i.test(h)) tour.photo = val;
      });
    }

    // Если нет явных заголовков или поле пустое — определяем позиционно:
    if (!tour.name) {
      tour.id = cols[0] || `tour-${index + 1}`;
      tour.name = cols[1] || cols[0] || 'Тур по Казахстану';
      tour.description = cols[2] || '';

      for (let i = 3; i < cols.length; i++) {
        const val = cols[i];
        if (!val) continue;

        if (/^https?:\/\//i.test(val) && !tour.photo) {
          tour.photo = val;
        } else if (/^\d(\.\d+)?$/.test(val) && parseFloat(val) <= 5.0 && !tour.rating) {
          tour.rating = val;
        } else if (/^\d+$/.test(val.replace(/[\s\u00A0.,]/g, '')) && !tour.price && parseFloat(val) > 5.0) {
          tour.price = parseInt(val.replace(/\D/g, ''), 10);
        } else if (/день|дня|дней|ночь|ночи|час|экспресс|джип|күн/i.test(val) && !tour.duration) {
          tour.duration = val;
        } else if (/суббота|воскресенье|сб|вс|ежедневно|вторник|четверг|недел|сенбі|жексенбі/i.test(val) && !tour.days) {
          tour.days = val;
        } else if (!tour.badge && val.length < 20 && !/^\d+$/.test(val)) {
          tour.badge = val;
        }
      }
    }

    if (!tour.id) tour.id = `tour-${index + 1}`;
    if (!tour.price) tour.price = 25000;
    if (!tour.photo) tour.photo = 'assets/images/album_lake.jpg';

    tours.push(tour);
  });

  return tours;
}

/** Создаёт полностью локализованную HTML-карточку тура */
function createTourCard(tour, index) {
  const getField = window.getTourField || ((t, f) => t[f] || '');
  const translate = window.t || ((k, f) => f || k);

  const localizedName = getField(tour, 'name') || tour.name || 'Тур по Казахстану';
  const localizedDesc = getField(tour, 'description') || tour.description || '';
  const localizedDuration = getField(tour, 'duration') || tour.duration || '';
  const localizedDays = getField(tour, 'days') || tour.days || '';
  const localizedBadge = getField(tour, 'badge') || tour.badge || '';

  const price = parseInt(tour.price, 10) || 0;
  const currencySymbol = translate('currency_symbol', '₸');
  const priceStr = price ? `${price.toLocaleString('ru-RU')} ${currencySymbol}` : translate('price_on_request', 'Уточняйте');

  const delays = ['', 'delay-100', 'delay-200'];
  const delay = delays[index % 3];
  const photoSrc = tour.photo || 'assets/images/album_lake.jpg';
  const tourId = tour.id || `tour-${index + 1}`;

  const badgeHTML = localizedBadge
    ? `<div class="tour-badge">${localizedBadge}</div>`
    : '';

  const ratingVal = parseFloat(tour.rating) || 4.98;
  const ratingHTML = `<div class="tour-rating-badge"><span class="star">★</span> ${ratingVal}</div>`;

  const daysHTML = localizedDays
    ? `<div class="tour-days-label">${localizedDays}</div>`
    : '';

  const durationHTML = localizedDuration
    ? `<div class="tour-duration"><span class="clock-icon">⏱</span> ${localizedDuration}</div>`
    : '';

  const priceLabel = translate('tour_price_label', 'Стоимость:');
  const bookBtnText = translate('btn_book_card', 'Забронировать');

  return `
    <div class="tour-card reveal-on-scroll ${delay}" id="card-${tourId}">
      <div class="tour-card__img-wrap">
        <img
          src="${photoSrc}"
          alt="${localizedName}"
          loading="lazy"
          class="tour-card__img"
          onerror="this.src='assets/images/album_lake.jpg'">
        ${badgeHTML}
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

/** Синхронизирует туры с ценами и списком в модалке */
function syncWithBookingModal(tours) {
  window.tourPrices = window.tourPrices || {};
  window.toursCatalog = window.toursCatalog || {};
  const getField = window.getTourField || ((t, f) => t[f] || '');
  const translate = window.t || ((k, f) => f || k);
  const currencySymbol = translate('currency_symbol', '₸');

  // Сохраняем все туры в глобальный каталог
  tours.forEach(t => {
    const id = t.id || t.name;
    window.toursCatalog[id] = t;
    if (t.price) window.tourPrices[id] = parseInt(t.price, 10) || 0;
  });

  // Заполняем select локализованными именами
  const select = document.getElementById('bookTourSelect');
  if (select) {
    const currentVal = select.value;
    select.innerHTML = '';
    
    // Сначала добавляем туры из текущего списка
    const addedIds = new Set();
    tours.forEach(t => {
      const id = t.id || t.name;
      addedIds.add(id);
      const opt = document.createElement('option');
      opt.value = id;
      const p = parseInt(t.price, 10) || 0;
      const locName = getField(t, 'name') || t.name;
      opt.textContent = `${locName} (${p.toLocaleString('ru-RU')} ${currencySymbol})`;
      select.appendChild(opt);
    });

    // Добавляем остальные туры из каталога (например custom, kygyzstan, assy-camping, horse-tour), если их еще нет в select
    const extraTourIds = ['assy-camping', 'horse-tour', 'kyrgyzstan', 'custom'];
    extraTourIds.forEach(id => {
      if (!addedIds.has(id)) {
        const dummyTour = { id };
        const locName = getField(dummyTour, 'name');
        if (locName) {
          const opt = document.createElement('option');
          opt.value = id;
          const p = window.tourPrices[id] || 25000;
          opt.textContent = `${locName} (${p.toLocaleString('ru-RU')} ${currencySymbol})`;
          select.appendChild(opt);
        }
      }
    });

    if (currentVal && select.querySelector(`option[value="${currentVal}"]`)) {
      select.value = currentVal;
    }
  }

  // Навешиваем клики на кнопки карточек
  document.querySelectorAll('#tours-container [data-open-booking]').forEach(btn => {
    btn.onclick = function(e) {
      e.preventDefault();
      const tourId = this.getAttribute('data-tour');
      if (typeof window.openBookingModal === 'function') {
        window.openBookingModal(tourId);
      }
    };
  });
}

/**
 * Перерисовывает карточки и селект модалки на текущем выбранном языке
 */
window.refreshTourCardsLanguage = function () {
  const container = document.getElementById('tours-container');
  const tours = window.currentLoadedTours && window.currentLoadedTours.length > 0
    ? window.currentLoadedTours
    : DEFAULT_FALLBACK_TOURS;

  if (container) {
    container.innerHTML = tours.map((t, i) => createTourCard(t, i)).join('');
    
    // Сделать карточки видимыми
    requestAnimationFrame(() => {
      container.querySelectorAll('.reveal-on-scroll').forEach(el => {
        el.classList.add('is-revealed');
      });
    });
  }

  // Обновляем select в модалке
  syncWithBookingModal(tours);

  // Обновляем иконки lucide
  if (window.lucide) {
    try { lucide.createIcons(); } catch (e) {}
  }
};

/** Загрузка туров и отрисовка */
window.loadToursFromSheets = async function () {
  const container = document.getElementById('tours-container');
  let toursToDisplay = [];

  try {
    const finalUrl = getFreshSheetUrl(GOOGLE_SHEET_SOURCE);
    const res = await fetch(finalUrl, { cache: 'no-store' });
    if (res.ok) {
      const text = await res.text();
      const sheetTours = parseToursCSV(text);
      if (sheetTours && sheetTours.length > 0) {
        toursToDisplay = sheetTours;
        
        // Если в таблице пока мало туров, дополняем остальными из дефолтного каталога
        if (toursToDisplay.length < 3) {
          const existingIds = new Set(toursToDisplay.map(t => t.id));
          DEFAULT_FALLBACK_TOURS.forEach(ft => {
            if (!existingIds.has(ft.id) && toursToDisplay.length < 6) {
              toursToDisplay.push(ft);
            }
          });
        }
      }
    }
  } catch (err) {
    console.warn('[K.K. Tour] Ошибка загрузки из Google Sheets, используем каталог по умолчанию:', err);
  }

  // Если из таблицы ничего не пришло — берем дефолтный каталог
  if (!toursToDisplay.length) {
    toursToDisplay = DEFAULT_FALLBACK_TOURS;
  }

  window.currentLoadedTours = toursToDisplay;

  if (container) {
    container.innerHTML = toursToDisplay.map((t, i) => createTourCard(t, i)).join('');
    
    requestAnimationFrame(() => {
      container.querySelectorAll('.reveal-on-scroll').forEach(el => {
        el.classList.add('is-revealed');
      });
    });
  }

  syncWithBookingModal(toursToDisplay);

  if (window.lucide) {
    try { lucide.createIcons(); } catch (e) {}
  }
};

// Запуск сразу
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.loadToursFromSheets());
} else {
  window.loadToursFromSheets();
}
