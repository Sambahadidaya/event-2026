'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';
import { nanoid } from 'nanoid';


// ============================================================================
// 6. DOCUMENTS TABLE & MANUAL INCOME
// ============================================================================

export const createDocument = async ({
    site = 'pose',
    document_type = 'invoice',
    document_code = null,
    reference_id = null,
    reference_table = null,
    printed_by = null
}) => {
    try {
        const { user } = await checkAdminAuth();
        let adminName = printed_by;
        if (!adminName && user?.id) {
            const { data: adminRow } = await supabaseAdmin
                .from('admins')
                .select('nama')
                .eq('user_id', user.id)
                .single();
            if (adminRow?.nama) {
                adminName = adminRow.nama;
            }
        }
        if (!adminName) {
            adminName = user?.email || 'Panitia Keuangan';
        }

        // Auto-generate code if not provided
        if (!document_code) {
            const prefix = document_type === 'invoice' ? 'INV' : document_type === 'receipt' ? 'KWT' : document_type === 'certificate' ? 'CERT' : 'RPT';
            const year = new Date().getFullYear();
            const randomNum = Math.floor(100000 + Math.random() * 900000);
            document_code = `${prefix}-${year}-${randomNum}`;
        }

        const { data, error } = await supabaseAdmin
            .from('documents')
            .insert([{
                site,
                document_type,
                document_code,
                reference_id,
                reference_table,
                printed_by: adminName
            }])
            .select()
            .single();

        if (error) throw error;

        await insertAuditLog(user?.email || 'system', 'CREATE_DOCUMENT', data.id, `Created document ${document_code}`, adminName);
        return { success: true, data };
    } catch (error) {
        console.error("Internal Log - Error creating document:", error);
        return { success: false, error: error.message };
    }
};