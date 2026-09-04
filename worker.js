/**
 * Безопасный Worker для Cloudflare Pages / Cloudflare Worker
 * - Не ломает основной сайт
 * - Реализует чистые URL на admin.kktour.kz
 * - Блокирует /admin на основном домене и workers.dev
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname;

    // ====================== 1. АДМИНКА: admin.kktour.kz ======================
    if (hostname === 'admin.kktour.kz') {
      // Редирект со старых путей /admin/*
      if (pathname === '/admin' || pathname === '/admin/' || pathname === '/admin/login.html' || pathname === '/admin/login') {
        return Response.redirect(url.origin + '/', 302);
      }
      if (pathname === '/admin/index.html' || pathname === '/admin/index') {
        return Response.redirect(url.origin + '/dashboard', 302);
      }
      if (pathname === '/admin/tour-edit.html' || pathname === '/admin/tour-edit') {
        return Response.redirect(url.origin + '/tour-edit' + url.search, 302);
      }
      if (pathname.startsWith('/admin/')) {
        const clean = pathname.replace(/^\/admin/, '') || '/';
        return Response.redirect(url.origin + clean + url.search, 302);
      }

      // Статика отдаём как есть
      if (pathname.startsWith('/assets/') || pathname.startsWith('/supabase/') || pathname === '/favicon.ico') {
        return env.ASSETS.fetch(request);
      }

      // Чистые URL → реальные файлы
      let target = pathname;
      if (pathname === '/' || pathname === '') {
        target = '/admin/login.html';
      } else if (pathname === '/dashboard') {
        target = '/admin/index.html';
      } else if (pathname === '/tour-edit') {
        target = '/admin/tour-edit.html';
      } else if (!pathname.endsWith('.html') && !pathname.includes('.')) {
        target = `/admin${pathname}.html`;
      } else {
        target = `/admin${pathname}`;
      }

      const newUrl = new URL(request.url);
      newUrl.pathname = target;
      return env.ASSETS.fetch(new Request(newUrl.toString(), request));
    }

    // ====================== 2. ОСНОВНОЙ САЙТ ======================
    // Блокируем /admin на kktour.kz и www
    if ((hostname === 'kktour.kz' || hostname === 'www.kktour.kz') &&
        (pathname === '/admin' || pathname.startsWith('/admin/'))) {
      return Response.redirect('https://kktour.kz/', 302);
    }

    // ====================== 3. ВСЕ ОСТАЛЬНЫЕ ДОМЕНЫ ======================
    // Запрет /admin на workers.dev и любых других доменах
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      return new Response('403 Access Denied', {
        status: 403,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    // Обычные страницы сайта — просто отдаём ассеты
    return env.ASSETS.fetch(request);
  }
};
