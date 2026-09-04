/**
 * Cloudflare Worker: K.K. Tour Admin Security & Clean URL Router
 *
 * Установка в Cloudflare:
 * 1. Cloudflare Dashboard -> Workers & Pages -> Create Application -> Create Worker
 * 2. Вставьте этот код в редактор Worker и нажмите "Deploy"
 * 3. Перейдите в Triggers / Custom Domains:
 *    - Добавьте Custom Domain: admin.kktour.kz
 *    - Добавьте Route: kktour.kz/admin* (Zone: kktour.kz)
 *    - Добавьте Route: www.kktour.kz/admin* (Zone: kktour.kz)
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname;
    const search = url.search;

    // -------------------------------------------------------------------------
    // 1. admin.kktour.kz — Основной рабочий адрес админ-панели (чистые URL)
    // -------------------------------------------------------------------------
    if (hostname === 'admin.kktour.kz') {
      // Исключаем /admin в строке адреса
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

      // Редирект с .html на чистые пути
      if (pathname === '/dashboard.html') {
        return Response.redirect(`${url.origin}/dashboard${search}`, 301);
      }
      if (pathname === '/login.html' || pathname === '/login') {
        return Response.redirect(`${url.origin}/${search}`, 301);
      }
      if (pathname === '/tour-edit.html') {
        return Response.redirect(`${url.origin}/tour-edit${search}`, 301);
      }

      // Статические файлы отдаются напрямую
      if (
        pathname.startsWith('/assets/') ||
        pathname.startsWith('/supabase/') ||
        pathname === '/favicon.ico' ||
        pathname === '/robots.txt'
      ) {
        return fetchAsset(request, env);
      }

      // Внутренний rewrite путей
      let targetPath;
      if (pathname === '/' || pathname === '') {
        targetPath = '/admin/login.html';
      } else if (pathname === '/dashboard') {
        targetPath = '/admin/index.html';
      } else if (pathname === '/tour-edit') {
        targetPath = '/admin/tour-edit.html';
      } else {
        targetPath = pathname.endsWith('.html') ? `/admin${pathname}` : `/admin${pathname}.html`;
      }

      const rewrittenUrl = new URL(url);
      rewrittenUrl.pathname = targetPath;
      const rewrittenRequest = new Request(rewrittenUrl.toString(), request);
      const response = await fetchAsset(rewrittenRequest, env);

      if (response.status === 404 && !pathname.endsWith('.html')) {
        const fallbackUrl = new URL(url);
        fallbackUrl.pathname = `/admin${pathname}`;
        return fetchAsset(new Request(fallbackUrl.toString(), request), env);
      }

      return response;
    }

    // -------------------------------------------------------------------------
    // 2. kktour.kz и www.kktour.kz — Редирект 302 на главную (/) при попытке входа в /admin
    // -------------------------------------------------------------------------
    const isMainDomain = hostname === 'kktour.kz' || hostname === 'www.kktour.kz';
    if (isMainDomain) {
      if (pathname === '/admin' || pathname.startsWith('/admin/')) {
        return Response.redirect(`https://${hostname}/`, 302);
      }
      return fetchAsset(request, env);
    }

    // -------------------------------------------------------------------------
    // 3. *.workers.dev и любые другие домены/поддомены — 403 Forbidden
    // -------------------------------------------------------------------------
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      return new Response(
        `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>403 Access Denied</title>
  <style>
    body { background: #0b0f19; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 20px; padding: 40px 32px; max-width: 460px; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); }
    .badge { display: inline-block; background: rgba(244, 63, 94, 0.15); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.3); padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
    h1 { color: #ffffff; font-size: 26px; font-weight: 800; margin: 0 0 12px; }
    p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
    .btn { display: inline-block; background: #1f8087; color: #ffffff; padding: 12px 24px; border-radius: 12px; font-size: 13px; font-weight: 700; text-decoration: none; transition: background 0.2s; }
    .btn:hover { background: #166267; }
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

    return fetchAsset(request, env);
  }
};

async function fetchAsset(request, env) {
  if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
    return env.ASSETS.fetch(request);
  }
  return fetch(request);
}
