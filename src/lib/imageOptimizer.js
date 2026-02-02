/**
 * Client-Side Image Optimizer.
 * Enforces "Zero-Cost" constraints by compressing images before upload.
 * Target: < 200KB per image.
 */

export const ImageOptimizer = {
    /**
     * Compresses a File/Blob to a target size.
     * @param {File} file - Original file
     * @param {number} maxWidth - Max width (default 1280px)
     * @param {number} quality - JPEG quality (0.1 - 1.0)
     * @returns {Promise<Blob>} - Compressed blob
     */
    async compress(file, maxWidth = 1280, quality = 0.6) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            console.log(`[ImageOptimizer] Compressed: ${(file.size / 1024).toFixed(1)}KB -> ${(blob.size / 1024).toFixed(1)}KB`);
                            resolve(blob);
                        } else {
                            reject(new Error('Canvas to Blob conversion failed'));
                        }
                    }, 'image/jpeg', quality);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    }
};
