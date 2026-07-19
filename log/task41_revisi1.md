lihatlah ada error waktu checkauthnya, contoh log errornya gini ;
```log
Auth Check Error: Error: Your project's URL and Key are required to create a Supabase client!

Check your Supabase project's API settings to find these values

https://supabase.com/dashboard/project/_/settings/api
    at <unknown> (https://supabase.com/dashboard/project/_/settings/api)
    at checkAdminAuth (src\api\supabase\admin\audit.js:14:44)
    at getRiwayatPertanyaan (src\api\supabase\admin\admin.js:225:64)
  12 |     try {
  13 |         const cookieStore = cookies();
> 14 |         const supabase = createServerClient(
     |                                            ^
  15 |             process.env.SUPABASE_URL,
  16 |             process.env.SUPABASE_ANON_KEY,
  17 |             {
Internal Log - Error fetching riwayat pertanyaan: Error: Internal server error during auth check
    at getRiwayatPertanyaan (src\api\supabase\admin\admin.js:226:30)
  224 |     try {
  225 |         const { user, error: authError } = await checkAdminAuth();
> 226 |         if (authError) throw new Error(authError);
      |                              ^
  227 |
  228 |         const { data, error } = await supabaseAdmin
  229 |             .from('riwayat_pertanyaan')
```
jadi baca difile audit.jsnya