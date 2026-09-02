/**
 * K.K. Tour — Supabase Client Initialization
 * Connects to Supabase via official @supabase/supabase-js CDN using anon/public key only.
 * NEVER use service_role keys on client-side! Security is enforced by Row Level Security (RLS).
 */

(function () {
  // Public Configuration
  // In production, these can be overridden via window.SUPABASE_CONFIG or an env-injected object.
  const DEFAULT_SUPABASE_URL = 'https://vkuppzmlnoqzuwujtiqq.supabase.co';
  const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_86YUyokdt9cl_6Zv1LFgaQ_iouwFELl';

  const config = (window.SUPABASE_CONFIG && typeof window.SUPABASE_CONFIG === 'object')
    ? window.SUPABASE_CONFIG
    : {
      url: localStorage.getItem('kktour_supabase_url') || DEFAULT_SUPABASE_URL,
      anonKey: localStorage.getItem('kktour_supabase_anon_key') || DEFAULT_SUPABASE_ANON_KEY
    };

  let client = null;

  function initClient() {
    if (typeof window.supabase === 'undefined' || typeof window.supabase.createClient !== 'function') {
      console.warn('[K.K. Tour] Supabase JS SDK not loaded yet. Waiting...');
      return null;
    }

    if (!client) {
      try {
        client = window.supabase.createClient(config.url, config.anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: window.localStorage
          }
        });
      } catch (err) {
        console.error('[K.K. Tour] Error initializing Supabase client:', err);
      }
    }
    return client;
  }

  // Define getter on window
  Object.defineProperty(window, 'supabaseClient', {
    get: function () {
      if (!client) {
        initClient();
      }
      return client;
    },
    configurable: true
  });

  window.initSupabaseClient = initClient;
  window.getSupabaseConfig = () => ({ ...config });
})();
