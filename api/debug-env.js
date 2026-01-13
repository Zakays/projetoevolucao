export default function handler(_req, res) {
  try {
    res.json({
      supabase_url_present: !!process.env.SUPABASE_URL,
      supabase_service_role_present: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      vite_supabase_url_present: !!process.env.VITE_SUPABASE_URL,
      vite_anon_present: !!process.env.VITE_SUPABASE_ANON_KEY,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('debug-env error', err);
    res.status(500).json({ ok: false });
  }
}
