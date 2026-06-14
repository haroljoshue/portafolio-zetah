"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseYoutubeUrl = parseYoutubeUrl;
exports.parseGoogleDriveUrl = parseGoogleDriveUrl;
/**
 * Extracts YouTube video ID and generates clean embed and thumbnail URLs.
 * Handles formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 */
function parseYoutubeUrl(url) {
    if (!url)
        return null;
    // Regex to extract video ID (11 characters)
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
        const videoId = match[2];
        return {
            youtubeId: videoId,
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        };
    }
    // If direct 11-char ID is passed
    if (url.trim().length === 11 && !url.includes('/') && !url.includes('.')) {
        const videoId = url.trim();
        return {
            youtubeId: videoId,
            embedUrl: `https://www.youtube.com/embed/${videoId}`,
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        };
    }
    return null;
}
/**
 * Extracts Google Drive File ID and generates direct URL for <img> tags.
 * Handles formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://docs.google.com/uc?id=FILE_ID
 */
function parseGoogleDriveUrl(url) {
    if (!url)
        return null;
    let fileId = null;
    // 1. Check if it is a lh3.googleusercontent.com link: https://lh3.googleusercontent.com/d/FILE_ID(=s800)
    const lh3Match = url.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
    if (lh3Match) {
        fileId = lh3Match[1];
    }
    // 2. Format /file/d/FILE_ID
    if (!fileId) {
        const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (fileDMatch) {
            fileId = fileDMatch[1];
        }
    }
    // 3. Format ?id=FILE_ID
    if (!fileId) {
        const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (idMatch) {
            fileId = idMatch[1];
        }
    }
    if (fileId) {
        return {
            driveId: fileId,
            directUrl: `https://lh3.googleusercontent.com/d/${fileId}=s800`
        };
    }
    // If it's a direct ID without URL structure
    if (url.trim().length >= 25 && !url.includes('/') && !url.includes('.')) {
        const driveId = url.trim();
        return {
            driveId,
            directUrl: `https://lh3.googleusercontent.com/d/${driveId}=s800`
        };
    }
    return null;
}
