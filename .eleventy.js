/**
 * 11ty (Eleventy) Configuration
 *
 * This configuration sets up 11ty for the dURT nURS website.
 * - Uses Nunjucks as the primary templating language
 * - Passes through static assets unchanged
 * - Outputs to _site directory for deployment
 */

module.exports = function(eleventyConfig) {
  // Pass through static assets without processing
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy("robots.txt");
  eleventyConfig.addPassthroughCopy("sitemap.xml");

  // Watch for changes in assets during development
  eleventyConfig.addWatchTarget("assets/");

  return {
    // Use Nunjucks for HTML files and layouts
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",

    // Directory configuration
    dir: {
      input: "src",           // Source files
      includes: "_includes",  // Partials (relative to input)
      layouts: "_layouts",    // Layouts (relative to input)
      output: "_site"         // Build output
    }
  };
};
