/**
 * Безопасный Worker — не падает при отсутствии env.ASSETS
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname;

    // Вспомогательная функция — никогда не падает
    async function serve(req) {
      try {
        if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
          return await env.ASSETS.fetch(req);
        }
      } catch (e) {
        console.error('ASSETS fetch error:', e);
      }
      // Если ASSETS нет — возвращаем простую ошибку вместо падения
      return new Response('Asset serving is not configured', { status: 500 });
    }

    // ====================== 1. АДМИНКА ======================
    if (hostname === 'admin.kktour.kz') {
      if (pathname === '/admin' || pathname === '/admin/' || 
          pathname === '/admin/login.html' || pathname === '/admin/login') {
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

      // Статика
      if (pathname.startsWith('/assets/') || pathname.startsWith('/supabase/') || pathname === '/favicon.ico') {
        return serve(request);
      }

      // Чистые URL
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
      return serve(new Request(newUrl.toString(), request));
    }

    // ====================== 2. ОСНОВНОЙ САЙТ ======================
    if ((hostname === 'kktour.kz' || hostname === 'www.kktour.kz') &&
        (pathname === '/admin' || pathname.startsWith('/admin/'))) {
      return Response.redirect('https://kktour.kz/', 302);
    }

    // ====================== 3. ДРУГИЕ ДОМЕНЫ ======================
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      return new Response('403 Access Denied', {
        status: 403,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    // Обычные страницы
    return serve(request);
  }
};
