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
    minify: false, // Disable minification to prevent syntax errors
    // terserOptions: {
    //   compress: {
    //     drop_console: false, // Keep console logs for debugging
    //     drop_debugger: true,
    //   },
    // },
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
    // Enable source maps for debugging
    sourcemap: false,
    // Optimize for static serving
    target: 'es2020',
    cssCodeSplit: true,
    reportCompressedSize: false,
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
