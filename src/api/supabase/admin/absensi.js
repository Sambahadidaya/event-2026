'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';

// TAHAP 1.1: getFormAbsen
export const getFormAbsen = async (site) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!site) throw new Error('Site is required');

        const { data, error } = await supabaseAdmin
            .from('form_absen_panitia')
            .select('id, site, judul_absen, created_at')
            .eq('site', site)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Error in getFormAbsen:", error);
        return { success: false, error: error.message || 'Gagal mengambil data form absensi.' };
    }
};

// TAHAP 1.2: createFormAbsen
export const createFormAbsen = async ({ site, judul_absen }) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!site || !judul_absen) throw new Error('Site and judul_absen are required');

        const { data, error } = await supabaseAdmin
            .from('form_absen_panitia')
            .insert([{ site, judul_absen }])
            .select('id, site, judul_absen, created_at')
            .single();

        if (error) throw error;

        await insertAuditLog(user.email, 'CREATE_FORM_ABSEN', data.id, `Form absen "${judul_absen}" dibuat`, adminNama);
        return { success: true, data };
    } catch (error) {
        console.error("Error in createFormAbsen:", error);
        return { success: false, error: error.message || 'Gagal membuat form absensi.' };
    }
};

// TAHAP 1.3: updateFormAbsen
export const updateFormAbsen = async (id, { judul_absen }) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id || !judul_absen) throw new Error('ID and judul_absen are required');

        const { data, error } = await supabaseAdmin
            .from('form_absen_panitia')
            .update({ judul_absen })
            .eq('id', id)
            .select('id, site, judul_absen, created_at')
            .single();

        if (error) throw error;

        await insertAuditLog(user.email, 'UPDATE_FORM_ABSEN', id, `Form absen diupdate menjadi "${judul_absen}"`, adminNama);
        return { success: true, data };
    } catch (error) {
        console.error("Error in updateFormAbsen:", error);
        return { success: false, error: error.message || 'Gagal mengubah form absensi.' };
    }
};

// TAHAP 1.4: deleteFormAbsen
export const deleteFormAbsen = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID is required');

        // Fetch judul first for logging
        const { data: formInfo } = await supabaseAdmin
            .from('form_absen_panitia')
            .select('judul_absen')
            .eq('id', id)
            .single();

        const { error } = await supabaseAdmin
            .from('form_absen_panitia')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await insertAuditLog(user.email, 'DELETE_FORM_ABSEN', id, `Form absen "${formInfo?.judul_absen || 'Tidak Diketahui'}" dihapus`, adminNama);
        return { success: true };
    } catch (error) {
        console.error("Error in deleteFormAbsen:", error);
        return { success: false, error: error.message || 'Gagal menghapus form absensi.' };
    }
};

// TAHAP 1.5: getDataAbsen
export const getDataAbsen = async (formId) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!formId) throw new Error('Form ID is required');

        const { data, error } = await supabaseAdmin
            .from('data_absen_panitia')
            .select('id, form_id, nama_panitia, type_absen, keterangan_absen, create_by, created_at, updated_at')
            .eq('form_id', formId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Error in getDataAbsen:", error);
        return { success: false, error: error.message || 'Gagal mengambil data riwayat absensi.' };
    }
};

// TAHAP 1.6: createDataAbsen
export const createDataAbsen = async ({ form_id, nama_panitia, type_absen, keterangan_absen, create_by }) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!form_id || !nama_panitia || !type_absen) {
            throw new Error('Form ID, Nama Panitia, and Type Absen are required');
        }

        // Insert into data_absen_panitia
        const { data, error } = await supabaseAdmin
            .from('data_absen_panitia')
            .insert([{ form_id, nama_panitia, type_absen, keterangan_absen, create_by }])
            .select('id, form_id, nama_panitia, type_absen, keterangan_absen, create_by, created_at')
            .single();

        if (error) throw error;

        // TAHAP 1.6+: Hubungkan ke total_absen_panitia jika nama_panitia cocok dengan admins.nama
        const { data: adminMatch } = await supabaseAdmin
            .from('admins')
            .select('id')
            .eq('nama', nama_panitia)
            .limit(1)
            .maybeSingle();

        if (adminMatch) {
            await supabaseAdmin
                .from('total_absen_panitia')
                .insert([{ panitia_id: adminMatch.id, data_absen_id: data.id }]);
        }

        await insertAuditLog(user.email, 'CREATE_DATA_ABSEN', data.id, `Absen ${type_absen} untuk panitia "${nama_panitia}" dibuat`, adminNama);
        return { success: true, data };
    } catch (error) {
        console.error("Error in createDataAbsen:", error);
        return { success: false, error: error.message || 'Gagal memasukkan data absensi.' };
    }
};

// TAHAP 1.7: updateDataAbsen
export const updateDataAbsen = async (id, { type_absen, keterangan_absen }) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id || !type_absen) throw new Error('ID and type_absen are required');

        const { data, error } = await supabaseAdmin
            .from('data_absen_panitia')
            .update({ type_absen, keterangan_absen, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('id, form_id, nama_panitia, type_absen, keterangan_absen, create_by, created_at')
            .single();

        if (error) throw error;

        await insertAuditLog(user.email, 'UPDATE_DATA_ABSEN', id, `Absen diupdate menjadi ${type_absen} untuk "${data.nama_panitia}"`, adminNama);
        return { success: true, data };
    } catch (error) {
        console.error("Error in updateDataAbsen:", error);
        return { success: false, error: error.message || 'Gagal mengupdate data absensi.' };
    }
};

// TAHAP 1.8: deleteDataAbsen
export const deleteDataAbsen = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID is required');

        // Fetch info for logging
        const { data: absenInfo } = await supabaseAdmin
            .from('data_absen_panitia')
            .select('nama_panitia, type_absen')
            .eq('id', id)
            .single();

        const { error } = await supabaseAdmin
            .from('data_absen_panitia')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await insertAuditLog(user.email, 'DELETE_DATA_ABSEN', id, `Absen ${absenInfo?.type_absen || ''} untuk "${absenInfo?.nama_panitia || ''}" dihapus`, adminNama);
        return { success: true };
    } catch (error) {
        console.error("Error in deleteDataAbsen:", error);
        return { success: false, error: error.message || 'Gagal menghapus data absensi.' };
    }
};

// TAHAP 1.9: getAdminsBySite
export const getAdminsBySite = async (site) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!site) throw new Error('Site is required');

        const { data, error } = await supabaseAdmin
            .from('admins')
            .select('id, nama')
            .eq('type', site)
            .order('nama', { ascending: true });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Error in getAdminsBySite:", error);
        return { success: false, error: error.message || 'Gagal mengambil data list panitia.' };
    }
};

// TAHAP 1.10: getDashboardStats
export const getDashboardStats = async (site) => {
    try {
        const { error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!site) throw new Error('Site is required');

        // Fetch admins of this site
        const { data: admins, error: adminError } = await supabaseAdmin
            .from('admins')
            .select('id, nama')
            .eq('type', site)
            .order('nama', { ascending: true });

        if (adminError) throw adminError;

        // Fetch all form ids of this site
        const { data: forms, error: formError } = await supabaseAdmin
            .from('form_absen_panitia')
            .select('id')
            .eq('site', site);

        if (formError) throw formError;

        const formIds = forms.map(f => f.id);

        let dataAbsen = [];
        if (formIds.length > 0) {
            const { data: dAbsen, error: dAbsenError } = await supabaseAdmin
                .from('data_absen_panitia')
                .select(`
                    id,
                    form_id,
                    nama_panitia,
                    type_absen,
                    keterangan_absen,
                    created_at,
                    form_absen_panitia!inner (
                        judul_absen
                    )
                `)
                .in('form_id', formIds);

            if (dAbsenError) throw dAbsenError;
            dataAbsen = dAbsen || [];
        }

        // Aggregate stats
        const statsMap = {};
        admins.forEach(adm => {
            statsMap[adm.nama] = {
                nama: adm.nama,
                hadir: 0,
                izin: 0,
                sakit: 0,
                alpha: 0,
                detail: []
            };
        });

        dataAbsen.forEach(rec => {
            const name = rec.nama_panitia;
            if (!statsMap[name]) {
                // If it's a legacy admin or external name not in admins list
                statsMap[name] = {
                    nama: name,
                    hadir: 0,
                    izin: 0,
                    sakit: 0,
                    alpha: 0,
                    detail: []
                };
            }

            const type = rec.type_absen.toLowerCase();
            if (type === 'hadir') statsMap[name].hadir++;
            else if (type === 'izin') statsMap[name].izin++;
            else if (type === 'sakit') statsMap[name].sakit++;
            else if (type === 'alpha') statsMap[name].alpha++;

            statsMap[name].detail.push({
                id: rec.id,
                judul_absen: rec.form_absen_panitia?.judul_absen || 'Absensi',
                type_absen: rec.type_absen,
                keterangan_absen: rec.keterangan_absen || '-',
                created_at: rec.created_at
            });
        });

        // Convert stats map to array
        const statsArray = Object.values(statsMap);

        // Sort by name
        statsArray.sort((a, b) => a.nama.localeCompare(b.nama));

        return { success: true, data: { stats: statsArray, dataAbsen, forms } };
    } catch (error) {
        console.error("Error in getDashboardStats:", error);
        return { success: false, error: error.message || 'Gagal mengambil data statistik dashboard.' };
    }
};
