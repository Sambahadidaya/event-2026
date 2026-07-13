'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { nanoid } from 'nanoid';

/**
 * Uploads a file to Supabase Storage.
 * @param {FormData} formData - The form data containing the file under key 'file'.
 * @param {string} bucket - The name of the Supabase storage bucket (e.g. 'team-images').
 * @param {string} pathPrefix - Optional path prefix (e.g. 'form-headers/').
 * @returns {Promise<{ success: boolean, url?: string, error?: string }>}
 */
export const uploadFile = async (formData, bucket, pathPrefix = '') => {
    try {
        const file = formData.get('file');
        
        if (!file || !(file instanceof File)) {
            throw new Error('No valid file provided in FormData');
        }

        // Generate a random file name to avoid collisions
        const fileExt = file.name.split('.').pop();
        const fileName = `${nanoid(16)}.${fileExt}`;
        const filePath = `${pathPrefix}${fileName}`;

        // Convert the web File into an ArrayBuffer and then to a Buffer for Supabase
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const { error: uploadError } = await supabaseAdmin.storage
            .from(bucket)
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return { success: true, url: publicUrl };
    } catch (error) {
        console.error("Storage upload error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Deletes a file from Supabase Storage.
 * @param {string} bucket - The name of the Supabase storage bucket.
 * @param {string} filePath - The path to the file in the bucket.
 */
export const deleteFile = async (bucket, filePath) => {
    try {
        if (!filePath) return { success: true }; // Nothing to delete
        
        const { error } = await supabaseAdmin.storage
            .from(bucket)
            .remove([filePath]);
            
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
         console.error("Storage delete error:", error);
         return { success: false, error: error.message };
    }
};
