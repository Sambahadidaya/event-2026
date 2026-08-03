'use server';

import { supabaseAdmin } from '@/lib/supabase';

// Helper for type
const isValidSiteType = (type) => ['pose', 'pkkmb'].includes(type);

// ================= PUBLIC READ =================

export const getTeams = async (siteType) => {
    try {
        if (!isValidSiteType(siteType)) throw new Error('Invalid site type');

        const { data, error } = await supabaseAdmin
            .from('team')
            .select('id, title, content, type, gambar, jenis_lomba, nama_lomba, verivikasi, created_at, team_members(id, team_id, nama, jabatan, kode, created_at)')
            .eq('type', siteType)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching teams:", error);
        return [];
    }
};

export const getVerifiedPoseTeams = async () => {
    try {
        const { data, error } = await supabaseAdmin
            .from('team')
            .select('id, title, content, type, gambar, jenis_lomba, nama_lomba, verivikasi, created_at, team_members(id, team_id, nama, jabatan, kode, created_at)')
            .eq('type', 'pose')
            .eq('verivikasi', true);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching verified pose teams:", error);
        return [];
    }
};

export const getUserTeams = async (token) => {
    try {
        if (!token) throw new Error('Token is required');

        const { data, error } = await supabaseAdmin
            .from('team')
            .select('*, team_members(count)')
            .eq('user_token', token)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Internal Log - Error fetching user teams:", error);
        return [];
    }
};

// ================= PUBLIC REGISTRATION =================

export const insertTeamPublic = async (teamPayload) => {
    try {
        if (!teamPayload) throw new Error('Team payload is required');

        // Sanitize payload
        const allowedKeys = ['title', 'content', 'type', 'jenis_lomba', 'nama_lomba', 'bukti_bayar', 'gambar', 'user_token', 'kode_form'];
        const sanitized = {};
        for (const key of allowedKeys) {
            if (teamPayload[key] !== undefined) {
                sanitized[key] = teamPayload[key];
            }
        }

        const { data, error } = await supabaseAdmin
            .from('team')
            .insert([sanitized])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Internal Log - Error inserting team (public):", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

export const insertTeamMembers = async (membersArray) => {
    try {
        if (!membersArray || !Array.isArray(membersArray)) throw new Error('Members array is required');

        // Sanitize each member
        const allowedKeys = ['team_id', 'nama', 'jabatan', 'kode'];
        const sanitized = membersArray.map(m => {
            const obj = {};
            for (const key of allowedKeys) {
                if (m[key] !== undefined) obj[key] = m[key];
            }
            return obj;
        });

        const { error } = await supabaseAdmin
            .from('team_members')
            .insert(sanitized);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error inserting team members:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};
