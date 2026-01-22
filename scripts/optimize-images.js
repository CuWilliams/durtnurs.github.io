/**
 * Image Optimization Script
 *
 * Generates WebP versions of all PNG/JPG images for better compression.
 * Original files are kept as fallbacks for browsers without WebP support.
 *
 * Run: npm run optimize-images
 *
 * Uses sharp for image processing.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuration
const IMAGES_DIR = 'assets/images';
const SUPPORTED_FORMATS = ['.png', '.jpg', '.jpeg'];
const WEBP_QUALITY = 80; // Good balance of quality and compression

// Track statistics
const stats = {
  processed: 0,
  skipped: 0,
  totalOriginal: 0,
  totalWebP: 0,
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
 * Recursively find all image files
 */
function findImages(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      findImages(fullPath, files);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_FORMATS.includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Convert a single image to WebP
 */
async function convertToWebP(imagePath) {
  const ext = path.extname(imagePath);
  const webpPath = imagePath.replace(ext, '.webp');

  // Skip if WebP already exists and is newer than source
  if (fs.existsSync(webpPath)) {
    const srcStat = fs.statSync(imagePath);
    const webpStat = fs.statSync(webpPath);
    if (webpStat.mtime >= srcStat.mtime) {
      stats.skipped++;
      return null;
    }
  }

  try {
    const originalSize = fs.statSync(imagePath).size;

    await sharp(imagePath)
      .webp({ quality: WEBP_QUALITY })
      .toFile(webpPath);

    const webpSize = fs.statSync(webpPath).size;

    stats.processed++;
    stats.totalOriginal += originalSize;
    stats.totalWebP += webpSize;

    const relativePath = path.relative(process.cwd(), imagePath);
    console.log(`  ${relativePath} (${formatBytes(originalSize)} -> ${formatBytes(webpSize)})`);

    return { original: originalSize, webp: webpSize };
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
  console.log('\nGenerating WebP images...\n');

  // Check if images directory exists
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`Error: ${IMAGES_DIR} directory not found.`);
    process.exit(1);
  }

  // Find all images
  const images = findImages(IMAGES_DIR);
  console.log(`Found ${images.length} images to process\n`);

  // Process each image
  for (const imagePath of images) {
    await convertToWebP(imagePath);
  }

  // Print summary
  console.log('\n--- WebP Conversion Summary ---');
  console.log(`Processed: ${stats.processed} files`);
  console.log(`Skipped (up-to-date): ${stats.skipped} files`);

  if (stats.processed > 0) {
    console.log(`\nSize reduction:`);
    console.log(`  Original: ${formatBytes(stats.totalOriginal)}`);
    console.log(`  WebP: ${formatBytes(stats.totalWebP)}`);
    console.log(`  Saved: ${formatBytes(stats.totalOriginal - stats.totalWebP)} (${percentReduction(stats.totalOriginal, stats.totalWebP)})`);
  }

  if (stats.errors.length > 0) {
    console.log(`\nErrors: ${stats.errors.length}`);
    stats.errors.forEach(e => console.log(`  - ${e.path}: ${e.error}`));
  }

  console.log('');
}

main().catch(error => {
  console.error('Image optimization failed:', error);
  process.exit(1);
});
