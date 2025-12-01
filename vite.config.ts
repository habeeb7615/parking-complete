import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: '/', // Ensure proper base URL
  server: {
    host: "::",
    port: 8080,
    // Vite automatically handles client-side routing
    proxy: {
      '/apitest': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Keep the /apitest path as-is
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Build configuration for production - optimized for static loading
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: mode === 'production' ? 'terser' : false, // Use terser for better compatibility
    terserOptions: mode === 'production' ? {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // Remove specific console methods
      },
      format: {
        comments: false, // Remove comments
      },
    } : undefined,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-toast'],
          utils: ['clsx', 'tailwind-merge', 'class-variance-authority'],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Enable source maps for debugging (disabled for production)
    sourcemap: mode === 'development',
    // Optimize for static serving
    target: 'es2020',
    cssCodeSplit: true,
    reportCompressedSize: false,
    // Fix preload crossorigin issues
    modulePreload: {
      polyfill: false, // Disable polyfill to avoid crossorigin issues
      resolveDependencies: (filename, deps) => {
        // Only preload critical dependencies to reduce warnings
        return deps.filter(dep => {
          // Preload only vendor, router, and main entry chunks
          return dep.includes('vendor') || dep.includes('router') || dep.includes('index');
        });
      },
    },
  },
  // Ensure proper handling of client-side routing
  preview: {
    port: 8080,
    host: "::",
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
    ],
  },
}));
