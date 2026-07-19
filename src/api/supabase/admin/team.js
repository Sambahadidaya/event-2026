'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { checkAdminAuth, insertAuditLog } from './audit';

export const upsertTeam = async (teamPayload, membersPayload, editingId = null) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

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
            await supabaseAdmin.from('team_members').delete().eq('team_id', currentTeamId);

            const validMembers = membersPayload.map(m => ({ ...m, team_id: currentTeamId }));
            const { error: memberError } = await supabaseAdmin.from('team_members').insert(validMembers);
            if (memberError) throw memberError;
        }

        await insertAuditLog(user.email, editingId ? 'UPDATE_TEAM' : 'CREATE_TEAM', currentTeamId, `Team ${editingId ? 'updated' : 'created'}`);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error upserting team:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

export const deleteTeam = async (id) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!id) throw new Error('Team ID is required');

        const { error } = await supabaseAdmin
            .from('team')
            .delete()
            .eq('id', id);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_TEAM', id, `Team deleted`);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting team:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};

export const deleteMultipleTeams = async (ids) => {
    try {
        const { user, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!ids || !Array.isArray(ids)) throw new Error('Team IDs array is required');

        const { error } = await supabaseAdmin
            .from('team')
            .delete()
            .in('id', ids);

        if (error) throw error;
        await insertAuditLog(user.email, 'DELETE_MULTIPLE_TEAMS', null, `Deleted ${ids.length} teams`);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Error deleting multiple teams:", error);
        return { success: false, error: 'Terjadi kesalahan internal pada server.' };
    }
};
