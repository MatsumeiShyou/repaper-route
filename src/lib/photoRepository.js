import { supabase } from './supabase';
import { ImageOptimizer } from './imageOptimizer';

/**
 * Repository for Photo Handling.
 * Enforces compression and handles upload destination.
 */
export const PhotoRepository = {
    /**
     * Uploads a photo to storage.
     * @param {File} file - The photo file
     * @param {string} jobId - Associated Job ID
     * @returns {Promise<{ path: string, url: string }>}
     */
    async uploadPhoto(file, jobId) {
        try {
            // 1. Enforce Client-Side Compression (Zero-Cost: Compute on Client)
            const compressedBlob = await ImageOptimizer.compress(file);

            // 2. Generate Path
            // Partition by Date/JobId for organized storage (Hot data easier to browse)
            const date = new Date().toISOString().split('T')[0];
            const fileName = `${date}/${jobId}/${crypto.randomUUID()}.jpg`;

            // 3. Upload to Supabase Storage (Bucket: 'photos')
            // Note: R2 implementation would go here (fetch to Pre-signed URL)
            const { data, error } = await supabase.storage
                .from('photos')
                .upload(fileName, compressedBlob, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            console.log(`[PhotoRepo] Uploaded to ${data.path}`);
            return {
                path: data.path,
                // Construct public URL if bucket is public, or signed URL if private
                // For MVP Free Tier, assume Public Bucket for read access
                url: supabase.storage.from('photos').getPublicUrl(data.path).data.publicUrl
            };

        } catch (error) {
            console.error('[PhotoRepo] Upload failed:', error);
            throw error;
        }
    }
};
