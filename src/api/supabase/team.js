'use server';

import { supabaseAdmin } from '@/lib/supabase';

// Helper for type
const isValidSiteType = (type) => ['pose', 'pkkmb'].includes(type);

export const getTeams = async (siteType) => {
    try {
        if (!isValidSiteType(siteType)) throw new Error('Invalid site type');

        const { data, error } = await supabaseAdmin
            .from('team')
            .select('*, team_members(*)')
            .eq('type', siteType)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching teams:", error);
        return [];
    }
};

export const getVerifiedPoseTeams = async () => {
    try {
        const { data, error } = await supabaseAdmin
            .from('team')
            .select('*')
            .eq('type', 'pose')
            .eq('verivikasi', true);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error fetching verified pose teams:", error);
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
        console.error("Error fetching user teams:", error);
        return [];
    }
};

export const upsertTeam = async (teamPayload, membersPayload, editingId = null) => {
    try {
        if (!teamPayload) throw new Error('Team payload is required');

        let currentTeamId = editingId;

        if (editingId) {
            const { error: updateError } = await supabaseAdmin
                .from('team')
                .update(teamPayload)
                .eq('id', editingId);
            
            if (updateError) throw updateError;
        } else {
            const { data: newTeam, error: insertError } = await supabaseAdmin
                .from('team')
                .insert([teamPayload])
                .select()
                .single();
                
            if (insertError) throw insertError;
            currentTeamId = newTeam.id;
        }

        // Handle members
        if (membersPayload && membersPayload.length > 0) {
            // Hapus anggota lama
            await supabaseAdmin.from('team_members').delete().eq('team_id', currentTeamId);

            // Masukkan anggota baru
            const validMembers = membersPayload.map(m => ({ ...m, team_id: currentTeamId }));
            const { error: memberError } = await supabaseAdmin.from('team_members').insert(validMembers);
            if (memberError) throw memberError;
        }

        return { success: true };
    } catch (error) {
        console.error("Error upserting team:", error);
        return { success: false, error: error.message };
    }
};

export const deleteTeam = async (id) => {
    try {
        if (!id) throw new Error('Team ID is required');

        const { error } = await supabaseAdmin
            .from('team')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting team:", error);
        return { success: false, error: error.message };
    }
};

export const deleteMultipleTeams = async (ids) => {
    try {
        if (!ids || !Array.isArray(ids)) throw new Error('Team IDs array is required');

        const { error } = await supabaseAdmin
            .from('team')
            .delete()
            .in('id', ids);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error deleting multiple teams:", error);
        return { success: false, error: error.message };
    }
};

// ================= PUBLIC REGISTRATION =================

export const insertTeamPublic = async (teamPayload) => {
    try {
        if (!teamPayload) throw new Error('Team payload is required');

        const { data, error } = await supabaseAdmin
            .from('team')
            .insert([teamPayload])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error("Error inserting team (public):", error);
        return { success: false, error: error.message };
    }
};

export const insertTeamMembers = async (membersArray) => {
    try {
        if (!membersArray || !Array.isArray(membersArray)) throw new Error('Members array is required');

        const { error } = await supabaseAdmin
            .from('team_members')
            .insert(membersArray);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error inserting team members:", error);
        return { success: false, error: error.message };
    }
};
