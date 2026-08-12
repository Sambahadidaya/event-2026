'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';
import { autoCreateTransactionFromPeserta, autoDeleteTransactionFromPeserta } from './finance';

export const getPeserta = async (siteType) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('peserta')
            .select('*')
            .eq('site_type', siteType)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching peserta:", error);
        return [];
    }
};

export const getPesertaKeuangan = async (siteType) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        let query = supabaseAdmin
            .from('peserta')
            .select('*')
            .order('created_at', { ascending: false });

        if (siteType && siteType !== 'all') {
            query = query.eq('site_type', siteType);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching peserta keuangan:", error);
        return [];
    }
};



export const updateStatusPembayaranPeserta = async (id, status) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id || !status) throw new Error('ID and Status are required');

        // Fetch existing participant data first
        const { data: peserta, error: fetchErr } = await supabaseAdmin
            .from('peserta')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchErr || !peserta) throw new Error('Participant not found');

        const { error } = await supabaseAdmin
            .from('peserta')
            .update({ status_pembayaran: status })
            .eq('id', id);

        if (error) throw error;

        // Auto-Trigger Accounting Integration
        const updatedPeserta = { ...peserta, status_pembayaran: status };
        if (status.toLowerCase() === 'lunas') {
            await autoCreateTransactionFromPeserta(updatedPeserta, user.email);
        } else {
            await autoDeleteTransactionFromPeserta(updatedPeserta);
        }

        await insertAuditLog(user.email, 'UPDATE_STATUS_PEMBAYARAN_PESERTA', id, `Status updated to ${status}`, adminNama);

        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error updating peserta:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server' };
    }
};

export const deletePeserta = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID is required');

        // Fetch peserta data before deleting to clean up finance records if any
        const { data: peserta } = await supabaseAdmin
            .from('peserta')
            .select('*')
            .eq('id', id)
            .single();

        if (peserta) {
            await autoDeleteTransactionFromPeserta(peserta);
        }

        const { error } = await supabaseAdmin
            .from('peserta')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await insertAuditLog(user.email, 'DELETE_PESERTA', id, `Peserta deleted`, adminNama);

        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting peserta:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server' };
    }
};

export const deleteMultiplePeserta = async (ids) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!ids || !Array.isArray(ids)) throw new Error('IDs array is required');

        // Fetch participants before deleting to clean finance
        const { data: pesertas } = await supabaseAdmin
            .from('peserta')
            .select('*')
            .in('id', ids);

        if (pesertas && pesertas.length > 0) {
            for (const p of pesertas) {
                await autoDeleteTransactionFromPeserta(p);
            }
        }

        const { error } = await supabaseAdmin
            .from('peserta')
            .delete()
            .in('id', ids);

        if (error) throw error;

        await insertAuditLog(user.email, 'DELETE_MULTIPLE_PESERTA', null, `Deleted IDs: ${ids.join(', ')}`, adminNama);

        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting multiple peserta:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server' };
    }
};



export const upsertFormWajib = async (payload, id = null) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!payload) throw new Error('Payload is required');

        if (id) {
            const { data, error } = await supabaseAdmin
                .from('form_wajib')
                .update(payload)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            await insertAuditLog(user.email, 'UPSERT_FORM_WAJIB', id, `Updated form wajib`, adminNama);
            return { success: true, data };
        } else {
            const { data, error } = await supabaseAdmin
                .from('form_wajib')
                .insert([payload])
                .select()
                .single();
            if (error) throw error;
            await insertAuditLog(user.email, 'UPSERT_FORM_WAJIB', data.id, `Created new form wajib`, adminNama);
            return { success: true, data };
        }
    } catch (error) {
        console.error("Internal Log - Error upserting form wajib:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server' };
    }
};

export const deleteFormWajib = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('form_wajib')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_FORM_WAJIB', id, `Deleted form wajib`, adminNama);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting form wajib:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server' };
    }
};



export const upsertFormRegister = async (payload, id = null) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!payload) throw new Error('Payload is required');

        if (id) {
            const { data, error } = await supabaseAdmin
                .from('form_register')
                .update(payload)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            await insertAuditLog(user.email, 'UPSERT_FORM_REGISTER', id, `Updated form register`, adminNama);
            return { success: true, data };
        } else {
            const { data, error } = await supabaseAdmin
                .from('form_register')
                .insert([payload])
                .select()
                .single();
            if (error) throw error;
            await insertAuditLog(user.email, 'UPSERT_FORM_REGISTER', data.id, `Created new form register`, adminNama);
            return { success: true, data };
        }
    } catch (error) {
        console.error("Internal Log - Error upserting form register:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server' };
    }
};

export const deleteFormRegister = async (id) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('ID is required');

        const { error } = await supabaseAdmin
            .from('form_register')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_FORM_REGISTER', id, `Deleted form register`, adminNama);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting form register:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server' };
    }
};

// insertPesertaBatch moved to public API

export const getPesertaLunas = async (siteType) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        let query = supabaseAdmin
            .from('peserta')
            .select('*')
            .in('status_pembayaran', ['Lunas', 'lunas'])
            .order('created_at', { ascending: false });

        if (siteType && siteType !== 'all') {
            query = query.eq('site_type', siteType);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching peserta lunas:", error);
        return [];
    }
};

export const getFormWajibAll = async () => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        const { data, error } = await supabaseAdmin
            .from('form_wajib')
            .select('*');

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching form wajib all:", error);
        return [];
    }
};

export const getFormRegisterAll = async (siteType) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        let query = supabaseAdmin
            .from('form_register')
            .select('id, jenis_lomba, nama_lomba, link_id, butuh_bukti, nominal, kategori_pendaftar, kode_form, site, created_at, gambar, keterangan')
            .order('created_at', { ascending: false });

        if (siteType && siteType !== 'all') {
            query = query.eq('site', siteType);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching form register all:", error);
        return [];
    }
};

export const getPesertaWajibLombaData = async () => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        // Check if role is allowed
        const { data: adminData } = await supabaseAdmin
            .from('admins')
            .select('role')
            .eq('user_id', user.id)
            .single();

        if (!adminData || (adminData.role !== 'admin_pose' && adminData.role !== 'super_admin')) {
            throw new Error('Forbidden. Hanya admin_pose atau super_admin yang dapat mengakses data ini.');
        }

        // 1. Get all peserta wajib (Mahasiswa LP3I, site_type pose, jenis_form wajib)
        const { data: wajibPeserta, error: wajibError } = await supabaseAdmin
            .from('peserta')
            .select('nim, nama, kampus, prodi, status_pembayaran')
            .eq('jenis_form', 'wajib')
            .eq('site_type', 'pose')
            .eq('kategori', 'Mahasiswa LP3I');

        if (wajibError) throw wajibError;
        
        if (!wajibPeserta || wajibPeserta.length === 0) {
            return { success: true, data: [] };
        }

        // 2. Get all team_members with their teams for lomba (pose)
        const { data: teamMembers, error: teamMemberError } = await supabaseAdmin
            .from('team_members')
            .select('kode, team!inner(nama_lomba, verivikasi, type)')
            .eq('team.type', 'pose');

        if (teamMemberError) throw teamMemberError;

        // Create a mapping from nim (kode) to active lombas
        const nimToLomba = {};
        
        if (teamMembers) {
            // First we need to filter for lomba without butuh_bukti=true
            const lombaNames = [...new Set(teamMembers.map(tm => tm.team.nama_lomba).filter(Boolean))];
            
            let lombaMap = new Set();
            if (lombaNames.length > 0) {
                const { data: formData, error: formError } = await supabaseAdmin
                    .from('form_register')
                    .select('nama_lomba')
                    .in('nama_lomba', lombaNames)
                    .eq('butuh_bukti', false)
                    .eq('site', 'pose');
                    
                if (!formError && formData) {
                    lombaMap = new Set(formData.map(f => f.nama_lomba));
                }
            }

            for (const member of teamMembers) {
                const kode = member.kode;
                if (!kode) continue;
                
                const team = member.team;
                if (!team || team.verivikasi === false) continue; // Skip rejected teams
                
                if (lombaMap.has(team.nama_lomba)) {
                    if (!nimToLomba[kode]) {
                        nimToLomba[kode] = new Set();
                    }
                    nimToLomba[kode].add(team.nama_lomba);
                }
            }
        }

        // 3. Map wajib peserta to their lombas
        const finalData = wajibPeserta.map(p => {
            const nim = p.nim;
            const lombas = nimToLomba[nim] ? Array.from(nimToLomba[nim]) : [];
            return {
                nim: p.nim,
                nama: p.nama,
                kampus: p.kampus,
                prodi: p.prodi,
                status_pembayaran: p.status_pembayaran,
                lomba_diikuti: lombas,
                total_lomba: lombas.length
            };
        });

        return { 
            success: true, 
            data: finalData,
            total: finalData.length 
        };
    } catch (error) {
        console.error("Internal Log - Error in getPesertaWajibLombaData server action:", error);
        return { success: false, error: error.message || 'Terjadi kesalahan internal pada server' };
    }
};
