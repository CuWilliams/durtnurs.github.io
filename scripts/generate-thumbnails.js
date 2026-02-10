/**
 * Gallery Thumbnail Generation Script
 *
 * Generates 400px thumbnails for gallery images that don't have one yet.
 * Thumbnails use the naming convention: [basename]-thumb.jpg
 *
 * Run: npm run generate-thumbnails
 *
 * Uses sharp for image processing.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration
const GALLERY_DIR = 'assets/images/gallery';
const SUPPORTED_FORMATS = ['.png', '.jpg', '.jpeg'];
const THUMB_MAX_DIMENSION = 400;
const THUMB_QUALITY = 80;
const THUMB_SUFFIX = '-thumb.jpg';

// Track statistics
const stats = {
  processed: 0,
  skipped: 0,
  totalOriginal: 0,
  totalThumb: 0,
  errors: []
};

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(2) + ' KB';
  const mb = kb / 1024;
  return mb.toFixed(2) + ' MB';
}

/**
 * Calculate percentage reduction
 */
function percentReduction(original, converted) {
  if (original === 0) return '0%';
  const reduction = ((original - converted) / original) * 100;
  return reduction.toFixed(1) + '%';
}

/**
 * Check if a filename is a source image (not a thumb or webp)
 */
function isSourceImage(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (!SUPPORTED_FORMATS.includes(ext)) return false;
  if (filename.toLowerCase().includes('-thumb.')) return false;
  return true;
}

/**
 * Get the thumbnail path for a source image
 */
function getThumbPath(imagePath) {
  const dir = path.dirname(imagePath);
  const ext = path.extname(imagePath);
  const basename = path.basename(imagePath, ext);
  return path.join(dir, basename + THUMB_SUFFIX);
}

/**
 * Generate a thumbnail for a single image
 */
async function generateThumbnail(imagePath) {
  const thumbPath = getThumbPath(imagePath);

  // Skip if thumbnail already exists and is newer than source
  if (fs.existsSync(thumbPath)) {
    const srcStat = fs.statSync(imagePath);
    const thumbStat = fs.statSync(thumbPath);
    if (thumbStat.mtime >= srcStat.mtime) {
      stats.skipped++;
      return null;
    }
  }

  try {
    const originalSize = fs.statSync(imagePath).size;

    await sharp(imagePath)
      .resize(THUMB_MAX_DIMENSION, THUMB_MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality: THUMB_QUALITY })
      .toFile(thumbPath);

    const thumbSize = fs.statSync(thumbPath).size;

    stats.processed++;
    stats.totalOriginal += originalSize;
    stats.totalThumb += thumbSize;

    const relativePath = path.relative(process.cwd(), imagePath);
    const relativeThumb = path.basename(thumbPath);
    console.log(`  ${relativePath} -> ${relativeThumb} (${formatBytes(originalSize)} -> ${formatBytes(thumbSize)})`);

    return { original: originalSize, thumb: thumbSize };
  } catch (error) {
    stats.errors.push({ path: imagePath, error: error.message });
    console.error(`  Error: ${imagePath} - ${error.message}`);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\nGenerating gallery thumbnails...\n');

  // Check if gallery directory exists
  if (!fs.existsSync(GALLERY_DIR)) {
    console.error(`Error: ${GALLERY_DIR} directory not found.`);
    process.exit(1);
  }

  // Find all source images (not thumbs, not webp)
  const entries = fs.readdirSync(GALLERY_DIR);
  const sourceImages = entries
    .filter(isSourceImage)
    .map(name => path.join(GALLERY_DIR, name));

  console.log(`Found ${sourceImages.length} source images\n`);

  if (sourceImages.length === 0) {
    console.log('No images to process.\n');
    return;
  }

  // Generate thumbnails
  for (const imagePath of sourceImages) {
    await generateThumbnail(imagePath);
  }

  // Print summary
  console.log('\n--- Thumbnail Generation Summary ---');
  console.log(`Generated: ${stats.processed} thumbnails`);
  console.log(`Skipped (up-to-date): ${stats.skipped} files`);

  if (stats.processed > 0) {
    console.log(`\nSize reduction:`);
    console.log(`  Originals: ${formatBytes(stats.totalOriginal)}`);
    console.log(`  Thumbnails: ${formatBytes(stats.totalThumb)}`);
    console.log(`  Saved: ${formatBytes(stats.totalOriginal - stats.totalThumb)} (${percentReduction(stats.totalOriginal, stats.totalThumb)})`);
  }

  if (stats.errors.length > 0) {
    console.log(`\nErrors: ${stats.errors.length}`);
    stats.errors.forEach(e => console.log(`  - ${e.path}: ${e.error}`));
  }

  console.log('');
}

main().catch(error => {
  console.error('Thumbnail generation failed:', error);
  process.exit(1);
});
