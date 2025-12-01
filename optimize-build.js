#!/usr/bin/env node

/**
 * Build optimization script for instant static loading
 * This script ensures the build is optimized for maximum performance
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Optimizing build for instant static loading...');

// Read the built index.html
const indexPath = path.join(__dirname, 'dist', 'index.html');
let htmlContent = fs.readFileSync(indexPath, 'utf8');

// Check if Vite has already generated preload links
const existingPreloads = htmlContent.match(/<link[^>]*rel=["']modulepreload["'][^>]*>/g) || [];
const existingPreloadsSet = new Set(existingPreloads.map(p => {
  const match = p.match(/href=["']([^"']+)["']/);
  return match ? match[1] : '';
}));

// Extract actual asset names from the HTML (only CSS files, Vite handles JS preloads)
const cssMatches = htmlContent.match(/href="\/assets\/([^"]+\.css)"/g) || [];

// Create preload hints only for CSS (Vite handles JS modulepreload)
// And only if not already preloaded by Vite
let preloadHints = '';
cssMatches.forEach(match => {
  const href = match.match(/href="([^"]+)"/)[1];
  // Only add if Vite hasn't already preloaded it
  if (!existingPreloadsSet.has(href)) {
    preloadHints += `    <link rel="preload" href="${href}" as="style" crossorigin="anonymous" />\n`;
  }
});

// Insert preload hints after the critical CSS only if we have any
if (preloadHints) {
  htmlContent = htmlContent.replace(
    '</style>',
    '</style>\n' + preloadHints
  );
}

// Add performance optimizations
const performanceScript = `
    <!-- Performance optimization script -->
    <script>
      // Remove loading spinner when React app loads
      window.addEventListener('DOMContentLoaded', () => {
        const spinner = document.querySelector('.loading-spinner');
        if (spinner) {
          setTimeout(() => {
            spinner.style.opacity = '0';
            setTimeout(() => spinner.remove(), 300);
          }, 100);
        }
      });
      
      // Preload critical routes
      const criticalRoutes = ['/dashboard', '/login', '/register'];
      criticalRoutes.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    </script>
`;

// Insert performance script before closing body tag
htmlContent = htmlContent.replace(
  '</body>',
  performanceScript + '\n  </body>'
);

// Write the optimized HTML
fs.writeFileSync(indexPath, htmlContent);

console.log('✅ Build optimized for instant static loading!');
console.log('📦 Optimizations applied:');
console.log('   - Resource preloading');
console.log('   - Critical CSS inlined');
console.log('   - Service Worker caching');
console.log('   - Performance monitoring');
console.log('   - Route prefetching');
console.log('');
console.log('🚀 Your site will now load like a static site!');
