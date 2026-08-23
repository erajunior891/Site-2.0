/**
 * tours-loader.js — K.K. Tour
 * Умный загрузчик туров из Google Sheets.
 * Автоматически считывает данные из опубликованной таблицы и создаёт стильные карточки.
 */

// Ссылка на Google Таблицу (поддерживает как опубликованный CSV, так и прямую ссылку на таблицу /edit)
const GOOGLE_SHEET_SOURCE = 'https://docs.google.com/spreadsheets/d/1Gz0vvGLeBLSbDADPX50TZprgk_JKl_kjfTR34p8xCL8/edit?usp=sharing';

/** Формирует URL для моментального получения свежих данных без кэша */
function getFreshSheetUrl(source) {
  let url = source.trim();
  const timestamp = Date.now();

  // Если вставлена обычная ссылка на таблицу (https://docs.google.com/spreadsheets/d/ID/edit)
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && !url.includes('/pub') && !url.includes('/e/2PACX-')) {
    const sheetId = match[1];
    return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&t=${timestamp}`;
  }

  // Если это опубликованная ссылка /pub?output=csv
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

/** Умный парсер таблицы: работает с заголовками и без них */
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
        if (/id/i.test(h)) tour.id = val;
        else if (/name|title|название|тур/i.test(h)) tour.name = val;
        else if (/desc|описание/i.test(h)) tour.description = val;
        else if (/price|цена|стоимость/i.test(h)) tour.price = parseInt(val.replace(/\D/g, ''), 10) || 0;
        else if (/duration|длительность|время/i.test(h)) tour.duration = val;
        else if (/badge|метка|тег/i.test(h)) tour.badge = val;
        else if (/rating|рейтинг|оценка/i.test(h)) tour.rating = val;
        else if (/photo|image|фото|картинка/i.test(h)) tour.photo = val;
        else if (/days|дни|выезд/i.test(h)) tour.days = val;
      });
    }

    // Если нет явных заголовков или поле пустое — определяем позиционно и по содержанию:
    if (!tour.name) {
      tour.id = cols[0] || `tour-${index + 1}`;
      tour.name = cols[1] || cols[0] || 'Тур по Казахстану';
      tour.description = cols[2] || '';

      // Ищем среди колонок цену, фото, рейтинг, длительность
      for (let i = 3; i < cols.length; i++) {
        const val = cols[i];
        if (!val) continue;

        // Фото (ссылка)
        if (/^https?:\/\//i.test(val) && !tour.photo) {
          tour.photo = val;
        }
        // Рейтинг (например: 4.9, 5.0)
        else if (/^\d(\.\d+)?$/.test(val) && parseFloat(val) <= 5.0 && !tour.rating) {
          tour.rating = val;
        }
        // Цена (любое число больше 5, не являющееся рейтингом)
        else if (/^\d+$/.test(val.replace(/[\s\u00A0.,]/g, '')) && !tour.price && parseFloat(val) > 5.0) {
          tour.price = parseInt(val.replace(/\D/g, ''), 10);
        }
        // Длительность
        else if (/день|дня|дней|ночь|ночи|час|экспресс|джип/i.test(val) && !tour.duration) {
          tour.duration = val;
        }
        // Дни выезда
        else if (/суббота|воскресенье|сб|вс|ежедневно|вторник|четверг|недел/i.test(val) && !tour.days) {
          tour.days = val;
        }
        // Бейдж
        else if (!tour.badge && val.length < 20 && !/^\d+$/.test(val)) {
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

/** Создаёт HTML-карточку тура */
function createTourCard(tour, index) {
  const price = parseInt(tour.price, 10) || 0;
  const priceStr = price ? price.toLocaleString('ru-RU') + ' ₸' : 'Уточняйте';
  const badge = tour.badge || '';
  const rating = parseFloat(tour.rating) || null;
  const delays = ['', 'delay-100', 'delay-200'];
  const delay = delays[index % 3];

  const photoSrc = tour.photo || 'assets/images/album_lake.jpg';

  const badgeHTML = badge
    ? `<div class="tour-badge">${badge}</div>`
    : '';

  const ratingHTML = rating
    ? `<div class="tour-rating-badge"><span class="star">★</span> ${rating}</div>`
    : '';

  const daysHTML = tour.days
    ? `<div class="tour-days-label">${tour.days}</div>`
    : '';

  const durationHTML = tour.duration
    ? `<div class="tour-duration"><span class="clock-icon">⏱</span> ${tour.duration}</div>`
    : '';

  const tourId = tour.id || `tour-${index + 1}`;

  return `
    <div class="tour-card reveal-on-scroll ${delay}" id="card-${tourId}">
      <div class="tour-card__img-wrap">
        <img
          src="${photoSrc}"
          alt="${tour.name}"
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
          <h3 class="tour-card__title">${tour.name}</h3>
          <p class="tour-card__desc">${tour.description || ''}</p>
        </div>
        <div class="tour-card__footer">
          <div class="tour-card__price-wrap">
            <span class="tour-card__price-label">Стоимость:</span>
            <span class="tour-card__price">${priceStr}</span>
          </div>
          <button
            type="button"
            data-open-booking
            data-tour="${tourId}"
            data-tour-name="${tour.name}"
            data-tour-price="${price}"
            class="btn-book-card">
            Забронировать
          </button>
        </div>
      </div>
    </div>`;
}

/** Синхронизирует туры с ценами и списком в модалке */
function syncWithBookingModal(tours) {
  window.tourPrices = window.tourPrices || {};
  window.toursCatalog = window.toursCatalog || {};

  // Сохраняем все данные туров в глобальный каталог
  tours.forEach(t => {
    const id = t.id || t.name;
    window.toursCatalog[id] = t;
    if (t.price) window.tourPrices[id] = parseInt(t.price, 10) || 0;
  });

  const select = document.getElementById('bookTourSelect');
  if (select) {
    select.innerHTML = '';
    tours.forEach(t => {
      const id = t.id || t.name;
      const opt = document.createElement('option');
      opt.value = id;
      const p = parseInt(t.price, 10) || 0;
      opt.textContent = `${t.name} (${p.toLocaleString('ru-RU')} ₸)`;
      select.appendChild(opt);
    });
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

/** Загрузка туров и отрисовка */
window.loadToursFromSheets = async function () {
  const container = document.getElementById('tours-container');
  if (!container) return;

  let toursToDisplay = [];

  try {
    const finalUrl = getFreshSheetUrl(GOOGLE_SHEET_SOURCE);
    const res = await fetch(finalUrl, { cache: 'no-store' });
    if (res.ok) {
      const text = await res.text();
      const sheetTours = parseToursCSV(text);
      if (sheetTours && sheetTours.length > 0) {
        toursToDisplay = sheetTours;
        
        // Если в таблице пока мало туров (например 1), дополняем остальными из каталога
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

  // Рендерим карточки
  container.innerHTML = toursToDisplay.map((t, i) => createTourCard(t, i)).join('');
  syncWithBookingModal(toursToDisplay);

  if (window.lucide) {
    try { lucide.createIcons(); } catch(e) {}
  }

  // Делаем карточки сразу видимыми
  requestAnimationFrame(() => {
    container.querySelectorAll('.reveal-on-scroll').forEach(el => {
      el.classList.add('is-revealed');
    });
  });
};

// Запуск сразу
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.loadToursFromSheets());
} else {
  window.loadToursFromSheets();
}
