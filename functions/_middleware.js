/**
 * Cloudflare Pages Functions Middleware
 * K.K. Tour (kktour.kz & admin.kktour.kz)
 */

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const hostname = url.hostname.toLowerCase();
  const pathname = url.pathname;
  const search = url.search;

  // 1. ADMIN DOMAIN: admin.kktour.kz
  if (hostname === 'admin.kktour.kz') {
    // 1.1 Redirect any /admin or /admin/* to clean URLs
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

    // 1.2 Clean extensionless URLs
    if (pathname === '/dashboard.html') {
      return Response.redirect(`${url.origin}/dashboard${search}`, 301);
    }
    if (pathname === '/login.html' || pathname === '/login') {
      return Response.redirect(`${url.origin}/${search}`, 301);
    }
    if (pathname === '/tour-edit.html') {
      return Response.redirect(`${url.origin}/tour-edit${search}`, 301);
    }

    // 1.3 Static assets
    if (
      pathname.startsWith('/assets/') ||
      pathname.startsWith('/supabase/') ||
      pathname === '/favicon.ico' ||
      pathname === '/robots.txt'
    ) {
      return next();
    }

    // 1.4 Internal path rewrites for clean URLs:
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
    return env.ASSETS ? env.ASSETS.fetch(new Request(rewrittenUrl.toString(), request)) : next(new Request(rewrittenUrl.toString(), request));
  }

  // 2. MAIN DOMAINS: kktour.kz & www.kktour.kz
  const isMainDomain = hostname === 'kktour.kz' || hostname === 'www.kktour.kz';
  if (isMainDomain) {
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      return Response.redirect(`https://${hostname}/`, 302);
    }
    return next();
  }

  // 3. *.workers.dev & OTHER DOMAINS (Blocked)
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return new Response(
      `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>403 Access Denied</title>
  <style>
    body { background: #0b0f19; color: #f1f5f9; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 440px; text-align: center; }
    h1 { color: #f43f5e; font-size: 24px; margin: 0 0 12px; }
    p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin: 0 0 20px; }
    a { color: #10b981; text-decoration: none; font-weight: 600; font-size: 13px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>403 Forbidden</h1>
    <p>Доступ к панели управления через данный домен запрещён.</p>
    <a href="https://kktour.kz/">Перейти на kktour.kz</a>
  </div>
</body>
</html>`,
      {
        status: 403,
        statusText: 'Forbidden',
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Frame-Options': 'DENY',
          'Cache-Control': 'no-store'
        }
      }
    );
  }

  return next();
}
