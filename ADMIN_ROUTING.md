# Настройка доступа к админ-панели (Cloudflare + Чистые URL)

Данный документ описывает реализованную логику и шаги по настройке Cloudflare для соблюдения всех требований технического задания.

---

## 1. Сводная таблица маршрутизации

| Запрашиваемый адрес | Поведение | Код ответа | Что видит пользователь |
| :--- | :--- | :---: | :--- |
| `https://admin.kktour.kz` или `/` | Внутренний rewrite в `/admin/login.html` | 200 OK | Страница входа. URL чистый: `admin.kktour.kz/` |
| `https://admin.kktour.kz/dashboard` | Внутренний rewrite в `/admin/index.html` | 200 OK | Главная админки. URL чистый: `admin.kktour.kz/dashboard` |
| `https://admin.kktour.kz/tour-edit` | Внутренний rewrite в `/admin/tour-edit.html` | 200 OK | Редактор туров. URL чистый: `admin.kktour.kz/tour-edit` |
| `https://admin.kktour.kz/admin/*` | Редирект на соответствующий чистый путь | 302 Redirect | Убирает `/admin` из адресной строки |
| `https://kktour.kz/admin` | Редирект на главную страницу сайта | 302 Redirect | Перенаправляет на `https://kktour.kz/` |
| `https://kktour.kz/admin/*` | Редирект на главную страницу сайта | 302 Redirect | Перенаправляет на `https://kktour.kz/` |
| `https://www.kktour.kz/admin*` | Редирект на главную страницу сайта | 302 Redirect | Перенаправляет на `https://www.kktour.kz/` |
| `*.workers.dev/admin*` | Полная блокировка доступа | 403 Forbidden | Страница с сообщением «Access Denied» |
| Любые другие домены/поддомены к `/admin*` | Полная блокировка доступа | 403 Forbidden | Страница с сообщением «Access Denied» |

---

## 2. Подготовленные файлы в проекте

1. **`_worker.js`** — Корневой скрипт для **Cloudflare Pages (Advanced Mode)**. Срабатывает автоматически при деплое репозитория в Cloudflare Pages.
2. **`functions/_middleware.js`** — Middleware для **Cloudflare Pages Functions**.
3. **`worker.js`** — Скрипт для создания отдельного **Cloudflare Worker** вручную.
4. **`wrangler.toml`** — Файл конфигурации для развертывания через CLI (`npx wrangler deploy`).
5. **Файлы админки (`admin/login.html`, `admin/index.html`, `admin/tour-edit.html`, `assets/js/admin.js`, `assets/js/admin-api.js`)** — Все переходы, ссылки авторизации и сохранения переведены на чистые относительные пути без `/admin` и без `.html`.

---

## 3. Инструкция по настройке в Cloudflare

### Вариант А: Если проект работает через Cloudflare Pages
1. В панели Cloudflare перейдите в **Workers & Pages** → выберите ваш проект Pages.
2. Перейдите во вкладку **Custom domains**:
   - Добавьте домен: `kktour.kz`
   - Добавьте домен: `www.kktour.kz`
   - Добавьте поддомен: `admin.kktour.kz`
3. Cloudflare автоматически создаст CNAME-записи в DNS и выпустит SSL-сертификаты.
4. Благодаря файлам `_worker.js` / `functions/_middleware.js`, все правила маршрутизации, редиректы и 403 ошибки активируются сразу же при деплое.

---

### Вариант Б: Если проект работает через Cloudflare Worker (или reverse proxy)
1. В панели Cloudflare перейдите в **Workers & Pages** → **Create Application** → **Create Worker**.
2. Вставьте содержимое файла [`worker.js`](worker.js) и нажмите **Deploy**.
3. Перейдите в настройки созданного воркера: **Settings** → **Domains & Routes**:
   - Нажмите **Add** → **Custom Domain**: укажите `admin.kktour.kz`
   - Нажмите **Add** → **Route**:
     - Route: `kktour.kz/admin*` (Zone: `kktour.kz`)
     - Route: `www.kktour.kz/admin*` (Zone: `kktour.kz`)

---

## 4. Настройка DNS в Cloudflare
В разделе **DNS** зоны `kktour.kz` убедитесь, что поддомен `admin` проксируется через Cloudflare (оранжевое облако ☁️ **Proxied**):

- **Type**: `CNAME`
- **Name**: `admin`
- **Target**: имя вашего Pages проекта (например, `site-2-0.pages.dev`) или основного домена `kktour.kz`
- **Proxy status**: `Proxied` (Включено)
