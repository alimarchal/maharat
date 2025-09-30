<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Intervention\Image\Facades\Image;
use Illuminate\Http\UploadedFile;

class FileOptimizationService
{
    /**
     * Compress image files
     */
    public static function compressImage($file, $quality = 80, $maxWidth = 1920, $maxHeight = 1080)
    {
        if (!$file instanceof UploadedFile) {
            return false;
        }

        $image = Image::make($file);
        
        // Resize if too large
        if ($image->width() > $maxWidth || $image->height() > $maxHeight) {
            $image->resize($maxWidth, $maxHeight, function ($constraint) {
                $constraint->aspectRatio();
                $constraint->upsize();
            });
        }

        // Compress
        $image->encode('jpg', $quality);
        
        return $image;
    }

    /**
     * Optimize PDF files
     */
    public static function optimizePdf($filePath)
    {
        // This would require additional PDF optimization libraries
        // For now, we'll return the original file
        return $filePath;
    }

    /**
     * Generate optimized file paths
     */
    public static function generateOptimizedPath($originalPath, $type = 'image')
    {
        $pathInfo = pathinfo($originalPath);
        $optimizedPath = $pathInfo['dirname'] . '/' . $pathInfo['filename'] . '_optimized.' . $pathInfo['extension'];
        
        return $optimizedPath;
    }

    /**
     * Upload to CDN
     */
    public static function uploadToCdn($file, $path = null)
    {
        // This would integrate with CDN services like CloudFlare, AWS CloudFront, etc.
        // For now, we'll use local storage
        $path = $path ?? 'uploads/' . date('Y/m/d');
        return Storage::disk('public')->putFile($path, $file);
    }

    /**
     * Get CDN URL
     */
    public static function getCdnUrl($path)
    {
        $cdnUrl = config('app.cdn_url', '');
        return $cdnUrl ? $cdnUrl . '/' . $path : Storage::url($path);
    }

    /**
     * Clean up old files
     */
    public static function cleanupOldFiles($directory, $daysOld = 30)
    {
        $files = Storage::files($directory);
        $cutoffDate = now()->subDays($daysOld);
        
        foreach ($files as $file) {
            $lastModified = Storage::lastModified($file);
            if ($lastModified < $cutoffDate->timestamp) {
                Storage::delete($file);
            }
        }
    }

    /**
     * Generate thumbnails
     */
    public static function generateThumbnail($imagePath, $width = 300, $height = 300)
    {
        $image = Image::make($imagePath);
        $image->fit($width, $height);
        
        $thumbnailPath = str_replace('.', '_thumb.', $imagePath);
        $image->save($thumbnailPath);
        
        return $thumbnailPath;
    }

    /**
     * Optimize file storage
     */
    public static function optimizeStorage()
    {
        // Implement storage optimization logic
        // This could include:
        // - Compressing files
        // - Moving old files to cold storage
        // - Cleaning up temporary files
    }
}
