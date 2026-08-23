saya sudah membuat tabel baru didatabase yaitu dengan nama mhsLp3i dengan kolom id, nama, nim, wa. dan saya sudah menjalankan sql ini ;
```sql
create table mhsLp3i (
    id UUID primary key DEFAULT uuid_generate_v4(),
    nama varchar(50) not null,
    nim varchar(12) not null,
    wa varchar(15) not null,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE POLICY "auth all pricing" ON public.mhsLp3i FOR ALL TO authenticated USING (true) WITH CHECK (true);
```
