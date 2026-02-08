/**
 * Hero Image Preparation Script
 *
 * Resizes source PNGs for the hero kaleidoscope animation and generates
 * a JSON manifest file listing all available hero objects.
 *
 * Usage:
 *   npm run prepare-hero                                    # Default source: ~/Desktop/kaleidoscope-images/
 *   npm run prepare-hero -- --source /path/to/images        # Custom source directory
 *
 * What it does:
 *   1. Reads all PNGs from the source directory
 *   2. Resizes each to max 200px (longest side), preserving alpha
 *   3. Saves to assets/images/hero-objects/ with clean names (hero-obj-01.png, etc.)
 *   4. Generates assets/data/hero-objects.json manifest
 *
 * After running this, run `npm run optimize-images` to generate WebP versions.
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const os = require('os');

// Configuration
const DEFAULT_SOURCE = path.join(os.homedir(), 'Desktop', 'kaleidoscope-images');
const OUTPUT_DIR = path.join('assets', 'images', 'hero-objects');
const MANIFEST_PATH = path.join('assets', 'data', 'hero-objects.json');
const MAX_DIMENSION = 200; // Max width or height in pixels

/**
 * Parse --source argument from CLI
 */
function getSourceDir() {
  const args = process.argv.slice(2);
  const sourceIdx = args.indexOf('--source');
  if (sourceIdx !== -1 && args[sourceIdx + 1]) {
    return args[sourceIdx + 1];
  }
  return DEFAULT_SOURCE;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  const kb = bytes / 1024;
  if (kb < 1024) return kb.toFixed(1) + ' KB';
  const mb = kb / 1024;
  return mb.toFixed(1) + ' MB';
}

/**
 * Main function
 */
async function main() {
  const sourceDir = getSourceDir();

  console.log('\nPreparing hero kaleidoscope images...');
  console.log(`  Source: ${sourceDir}`);
  console.log(`  Output: ${OUTPUT_DIR}`);
  console.log(`  Max dimension: ${MAX_DIMENSION}px\n`);

  // Validate source directory
  if (!fs.existsSync(sourceDir)) {
    console.error(`Error: Source directory not found: ${sourceDir}`);
    console.error('Use --source /path/to/images to specify a different directory.');
    process.exit(1);
  }

  // Find all PNGs in source
  const files = fs.readdirSync(sourceDir)
    .filter(f => path.extname(f).toLowerCase() === '.png')
    .sort();

  if (files.length === 0) {
    console.error('Error: No PNG files found in source directory.');
    process.exit(1);
  }

  console.log(`Found ${files.length} PNG files\n`);

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Process each image
  const manifest = { objects: [] };
  let totalOriginal = 0;
  let totalOutput = 0;

  for (let i = 0; i < files.length; i++) {
    const sourcePath = path.join(sourceDir, files[i]);
    const paddedIndex = String(i + 1).padStart(2, '0');
    const outputName = `hero-obj-${paddedIndex}.png`;
    const outputPath = path.join(OUTPUT_DIR, outputName);

    try {
      const originalSize = fs.statSync(sourcePath).size;
      totalOriginal += originalSize;

      // Resize preserving aspect ratio, max 200px on longest side
      const result = await sharp(sourcePath)
        .resize(MAX_DIMENSION, MAX_DIMENSION, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .png({ compressionLevel: 9 })
        .toFile(outputPath);

      const outputSize = fs.statSync(outputPath).size;
      totalOutput += outputSize;

      manifest.objects.push({
        id: `hero-obj-${paddedIndex}`,
        src: `/assets/images/hero-objects/${outputName}`,
        width: result.width,
        height: result.height
      });

      console.log(`  ${files[i]}`);
      console.log(`    → ${outputName} (${result.width}x${result.height}, ${formatBytes(outputSize)})`);
    } catch (error) {
      console.error(`  Error processing ${files[i]}: ${error.message}`);
    }
  }

  // Write manifest
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');

  // Summary
  console.log('\n--- Hero Image Preparation Summary ---');
  console.log(`  Images processed: ${manifest.objects.length}`);
  console.log(`  Original total: ${formatBytes(totalOriginal)}`);
  console.log(`  Output total: ${formatBytes(totalOutput)}`);
  console.log(`  Manifest: ${MANIFEST_PATH}`);
  console.log(`\nRun 'npm run optimize-images' to generate WebP versions.\n`);
}

main().catch(error => {
  console.error('Hero image preparation failed:', error);
  process.exit(1);
});
