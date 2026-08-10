'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { nanoid } from 'nanoid';
import { fileTypeFromBuffer } from 'file-type';
import { checkAdminAuth, insertAuditLog } from './admin/audit';

const ALLOWED_MIME_TYPES = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf',
    'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed', 'application/vnd.rar'
];

import sharp from 'sharp';

const compressImage = async (buffer, mime) => {
    try {
        let imagePipeline = sharp(buffer, { animated: mime === 'image/gif' });
        const metadata = await imagePipeline.metadata();

        if (metadata.width && metadata.width > 1920) {
            imagePipeline = imagePipeline.resize({ width: 1920, withoutEnlargement: true });
        }

        if (mime === 'image/jpeg' || mime === 'image/jpg') {
            return await imagePipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
        } else if (mime === 'image/png') {
            return await imagePipeline.png({ quality: 80, compressionLevel: 8 }).toBuffer();
        } else if (mime === 'image/webp') {
            return await imagePipeline.webp({ quality: 80 }).toBuffer();
        }
        return buffer;
    } catch (err) {
        console.warn("Image compression failed, using original buffer:", err);
        return buffer;
    }
};

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

        // Limit file size to 10MB
        if (file.size > 10 * 1024 * 1024) {
            return { success: false, error: 'Ukuran file melebihi batas maksimal (10MB).' };
        }

        const arrayBuffer = await file.arrayBuffer();
        let buffer = Buffer.from(arrayBuffer);

        // Deep File Inspection
        let fileTypeResult = await fileTypeFromBuffer(buffer);
        if (!fileTypeResult || !ALLOWED_MIME_TYPES.includes(fileTypeResult.mime)) {
            return { success: false, error: 'Tipe file tidak valid atau berpotensi berbahaya.' };
        }

        // Compress if file is an image
        if (fileTypeResult.mime.startsWith('image/')) {
            const compressedBuffer = await compressImage(buffer, fileTypeResult.mime);
            const newTypeResult = await fileTypeFromBuffer(compressedBuffer);
            if (newTypeResult && ALLOWED_MIME_TYPES.includes(newTypeResult.mime)) {
                buffer = compressedBuffer;
                fileTypeResult = newTypeResult;
            } else {
                console.warn("Compressed buffer is invalid or has unsupported type, using original buffer");
            }
        }

        // Generate a random file name to avoid collisions
        const fileExt = fileTypeResult.ext; // Use secure extension from file-type
        const fileName = `${nanoid(16)}.${fileExt}`;
        const filePath = `${pathPrefix}${fileName}`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from(bucket)
            .upload(filePath, buffer, {
                contentType: fileTypeResult.mime,
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
        console.error("Internal Log - Storage upload error:", error);
        return { success: false, error: 'Gagal mengupload file.' };
    }
};

/**
 * Deletes a file from Supabase Storage.
 * @param {string} bucket - The name of the Supabase storage bucket.
 * @param {string} filePath - The path to the file in the bucket.
 */
export const deleteFile = async (bucket, filePath) => {
    try {
        const { user, adminNama, error: authError } = await checkAdminAuth();
        if (authError) throw new Error(authError);

        if (!filePath) return { success: true }; // Nothing to delete

        const { error } = await supabaseAdmin.storage
            .from(bucket)
            .remove([filePath]);

        if (error) throw error;

        await insertAuditLog(user.email, 'DELETE_FILE', null, `Deleted ${filePath} from ${bucket}`, adminNama);
        return { success: true };
    } catch (error) {
        console.error("Internal Log - Storage delete error:", error);
        return { success: false, error: 'Gagal menghapus file.' };
    }
};
