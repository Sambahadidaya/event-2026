bagaimana kalau gini aja, pakai tabel admins tapi akses
```sql
-- Hapus policy SELECT yang lama (jika ada)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.admins;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.admins;

-- Buat policy SELECT baru yang mengizinkan publik
CREATE POLICY "Enable read access for public on admins"
ON public.admins
FOR SELECT
TO public
USING (true);
```