/**
 * Cloudflare Worker / Cloudflare Pages Advanced Mode
 * K.K. Tour (kktour.kz & admin.kktour.kz)
 * 
 * Реализует техническое задание:
 * 1. admin.kktour.kz -> чистые URL без /admin (/, /dashboard, /tour-edit)
 * 2. kktour.kz/admin и /admin/* -> 302 Redirect на /
 * 3. www.kktour.kz/admin и /admin/* -> 302 Redirect на /
 * 4. *.workers.dev/admin и /* -> 403 Access Denied
 * 5. Любые другие домены/поддомены при запросе к /admin* -> 403 Access Denied
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname;
    const search = url.search;

    // =========================================================================
    // 1. ДОМЕН АДМИН-ПАНЕЛИ: admin.kktour.kz
    // =========================================================================
    if (hostname === 'admin.kktour.kz') {
      // 1.1 Защита от дублирования /admin в строке адреса на admin.kktour.kz
      // Если кто-то пытается открыть admin.kktour.kz/admin/... -> редиректим на чистый URL
      if (pathname === '/admin' || pathname === '/admin/') {
        return Response.redirect(`${url.origin}/${search}`, 302);
      }
      if (pathname === '/admin/login' || pathname === '/admin/login.html') {
        return Response.redirect(`${url.origin}/${search}`, 302);
      }
      if (pathname === '/admin/index' || pathname === '/admin/index.html') {
        return Response.redirect(`${url.origin}/dashboard${search}`, 302);
      }
      if (pathname === '/admin/tour-edit' || pathname === '/admin/tour-edit.html') {
        return Response.redirect(`${url.origin}/tour-edit${search}`, 302);
      }
      if (pathname.startsWith('/admin/')) {
        const cleanPath = pathname.replace(/^\/admin/, '') || '/';
        return Response.redirect(`${url.origin}${cleanPath}${search}`, 302);
      }

      // 1.2 Нормализация расширений .html для чистого URL
      // /dashboard.html -> /dashboard
      if (pathname === '/dashboard.html') {
        return Response.redirect(`${url.origin}/dashboard${search}`, 301);
      }
      // /login.html -> /
      if (pathname === '/login.html' || pathname === '/login') {
        return Response.redirect(`${url.origin}/${search}`, 301);
      }
      // /tour-edit.html -> /tour-edit
      if (pathname === '/tour-edit.html') {
        return Response.redirect(`${url.origin}/tour-edit${search}`, 301);
      }

      // 1.3 Статические ресурсы (стили, скрипты, шрифты, медиа)
      // Доступны напрямую без rewrite в /admin/
      if (
        pathname.startsWith('/assets/') ||
        pathname.startsWith('/supabase/') ||
        pathname === '/favicon.ico' ||
        pathname === '/robots.txt'
      ) {
        return fetchAsset(request, env);
      }

      // 1.4 Внутренний rewrite путей для админ-панели (пользователь видит чистый URL):
      let targetPath;
      if (pathname === '/' || pathname === '') {
        // admin.kktour.kz/ -> /admin/login.html (страница входа)
        targetPath = '/admin/login.html';
      } else if (pathname === '/dashboard') {
        // admin.kktour.kz/dashboard -> /admin/index.html (главная страница админки)
        targetPath = '/admin/index.html';
      } else if (pathname === '/tour-edit') {
        // admin.kktour.kz/tour-edit -> /admin/tour-edit.html (страница редактирования)
        targetPath = '/admin/tour-edit.html';
      } else {
        // Любой другой путь: admin.kktour.kz/любой-путь -> /admin/любой-путь.html
        targetPath = pathname.endsWith('.html') ? `/admin${pathname}` : `/admin${pathname}.html`;
      }

      // Формируем запрос с перезаписанным путем, сохраняя все query-параметры (?id=new и т.д.)
      const rewrittenUrl = new URL(url);
      rewrittenUrl.pathname = targetPath;
      const rewrittenRequest = new Request(rewrittenUrl.toString(), request);

      const response = await fetchAsset(rewrittenRequest, env);

      // Если запрашиваемый файл не найден с .html, пробуем без .html
      if (response.status === 404 && !pathname.endsWith('.html')) {
        const fallbackUrl = new URL(url);
        fallbackUrl.pathname = `/admin${pathname}`;
        return fetchAsset(new Request(fallbackUrl.toString(), request), env);
      }

      return response;
    }

    // =========================================================================
    // 2. ОСНОВНЫЕ ДОМЕНЫ: kktour.kz и www.kktour.kz
    // =========================================================================
    const isMainDomain = hostname === 'kktour.kz' || hostname === 'www.kktour.kz';
    if (isMainDomain) {
      // kktour.kz/admin и kktour.kz/admin/* -> Редирект 302 на главную страницу (/)
      if (pathname === '/admin' || pathname.startsWith('/admin/')) {
        return Response.redirect(`https://${hostname}/`, 302);
      }
      // Все остальные страницы сайта работают штатно
      return fetchAsset(request, env);
    }

    // =========================================================================
    // 3. *.workers.dev И ДРУГИЕ ДОМЕНЫ / ПОДДОМЕНЫ
    // =========================================================================
    // Запрет доступа к админке со всех сторонних хостов:
    // *.workers.dev/admin*, localhost, preview-домены и т.д.
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      return new Response(
        `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>403 Access Denied</title>
  <style>
    body {
      background: #0b0f19;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 20px;
      padding: 40px 32px;
      max-width: 460px;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6);
    }
    .badge {
      display: inline-block;
      background: rgba(244, 63, 94, 0.15);
      color: #fb7185;
      border: 1px solid rgba(244, 63, 94, 0.3);
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
    }
    h1 {
      color: #ffffff;
      font-size: 26px;
      font-weight: 800;
      margin: 0 0 12px;
    }
    p {
      color: #94a3b8;
      font-size: 14px;
      line-height: 1.6;
      margin: 0 0 24px;
    }
    .btn {
      display: inline-block;
      background: #1f8087;
      color: #ffffff;
      padding: 12px 24px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #166267;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">403 Forbidden</div>
    <h1>Access Denied</h1>
    <p>Прямой доступ к панели управления через данный адрес запрещён. Доступ разрешён только через авторизованный рабочий домен.</p>
    <a href="https://kktour.kz/" class="btn">Вернуться на kktour.kz</a>
  </div>
</body>
</html>`,
        {
          status: 403,
          statusText: 'Forbidden',
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'X-Frame-Options': 'DENY',
            'X-Content-Type-Options': 'nosniff',
            'Cache-Control': 'no-store'
          }
        }
      );
    }

    // Все остальные запросы на любых других доменах отдаются как обычно
    return fetchAsset(request, env);
  }
};

/**
 * Вспомогательная функция загрузки статических ассетов
 * Поддерживает как Cloudflare Pages (env.ASSETS), так и Cloudflare Worker (fetch)
 */
async function fetchAsset(request, env) {
  if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
    return env.ASSETS.fetch(request);
  }
  return fetch(request);
}
