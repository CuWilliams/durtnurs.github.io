/**
 * Minification Script
 *
 * Post-build script that minifies CSS and JavaScript files in _site/assets/
 * Run after 11ty build: npm run build && node scripts/minify.js
 *
 * Uses:
 * - clean-css for CSS minification
 * - terser for JavaScript minification
 */

const fs = require('fs');
const path = require('path');
const CleanCSS = require('clean-css');
const { minify } = require('terser');

// Configuration
const SITE_DIR = '_site';
const ASSETS_DIR = path.join(SITE_DIR, 'assets');
const CSS_DIR = path.join(ASSETS_DIR, 'css');
const JS_DIR = path.join(ASSETS_DIR, 'js');

// Track statistics
const stats = {
  css: { original: 0, minified: 0, files: 0 },
  js: { original: 0, minified: 0, files: 0 }
};

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  const kb = bytes / 1024;
  return kb.toFixed(2) + ' KB';
}

/**
 * Calculate percentage reduction
 */
function percentReduction(original, minified) {
  if (original === 0) return '0%';
  const reduction = ((original - minified) / original) * 100;
  return reduction.toFixed(1) + '%';
}

/**
 * Minify all CSS files in a directory
 */
function minifyCSS(directory) {
  if (!fs.existsSync(directory)) {
    console.log(`CSS directory not found: ${directory}`);
    return;
  }

  const cleanCSS = new CleanCSS({
    level: 2, // Advanced optimizations
    sourceMap: false
  });

  const files = fs.readdirSync(directory).filter(f => f.endsWith('.css'));

  for (const file of files) {
    const filePath = path.join(directory, file);
    const original = fs.readFileSync(filePath, 'utf8');
    const originalSize = Buffer.byteLength(original, 'utf8');

    const result = cleanCSS.minify(original);

    if (result.errors.length > 0) {
      console.error(`Error minifying ${file}:`, result.errors);
      continue;
    }

    fs.writeFileSync(filePath, result.styles);
    const minifiedSize = Buffer.byteLength(result.styles, 'utf8');

    stats.css.original += originalSize;
    stats.css.minified += minifiedSize;
    stats.css.files++;

    console.log(`  CSS: ${file} (${formatBytes(originalSize)} -> ${formatBytes(minifiedSize)})`);
  }
}

/**
 * Minify all JS files in a directory
 */
async function minifyJS(directory) {
  if (!fs.existsSync(directory)) {
    console.log(`JS directory not found: ${directory}`);
    return;
  }

  const files = fs.readdirSync(directory).filter(f => f.endsWith('.js'));

  for (const file of files) {
    const filePath = path.join(directory, file);
    const original = fs.readFileSync(filePath, 'utf8');
    const originalSize = Buffer.byteLength(original, 'utf8');

    try {
      const result = await minify(original, {
        compress: {
          drop_console: false, // Keep console logs for debugging
          passes: 2
        },
        mangle: true,
        format: {
          comments: false
        }
      });

      if (result.code) {
        fs.writeFileSync(filePath, result.code);
        const minifiedSize = Buffer.byteLength(result.code, 'utf8');

        stats.js.original += originalSize;
        stats.js.minified += minifiedSize;
        stats.js.files++;

        console.log(`  JS:  ${file} (${formatBytes(originalSize)} -> ${formatBytes(minifiedSize)})`);
      }
    } catch (error) {
      console.error(`Error minifying ${file}:`, error.message);
    }
  }
}

/**
 * Main function
 */
async function main() {
  console.log('\nMinifying assets...\n');

  // Check if build output exists
  if (!fs.existsSync(SITE_DIR)) {
    console.error(`Error: ${SITE_DIR} directory not found. Run 'npm run build' first.`);
    process.exit(1);
  }

  // Minify CSS
  minifyCSS(CSS_DIR);

  // Minify JS
  await minifyJS(JS_DIR);

  // Print summary
  console.log('\n--- Minification Summary ---');
  console.log(`CSS: ${stats.css.files} files`);
  console.log(`     ${formatBytes(stats.css.original)} -> ${formatBytes(stats.css.minified)} (${percentReduction(stats.css.original, stats.css.minified)} reduction)`);
  console.log(`JS:  ${stats.js.files} files`);
  console.log(`     ${formatBytes(stats.js.original)} -> ${formatBytes(stats.js.minified)} (${percentReduction(stats.js.original, stats.js.minified)} reduction)`);
  console.log(`\nTotal: ${formatBytes(stats.css.original + stats.js.original)} -> ${formatBytes(stats.css.minified + stats.js.minified)} (${percentReduction(stats.css.original + stats.js.original, stats.css.minified + stats.js.minified)} reduction)`);
  console.log('');
}

main().catch(error => {
  console.error('Minification failed:', error);
  process.exit(1);
});
