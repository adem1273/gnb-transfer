import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Gzip compression for production builds
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // Only compress files larger than 10KB
      deleteOriginFile: false,
    }),
    // Brotli compression for production builds (better compression than gzip)
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
      deleteOriginFile: false,
    }),
  ],
  server: {
    port: 5173,
    // Enable HMR for faster development
    hmr: {
      overlay: true,
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    outDir: 'src/build',
    emptyOutDir: true,
    // Enable production optimizations
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    // Optimize chunk size
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunk for React libraries
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // i18n chunk
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'i18n-vendor';
            }
            // Animation libraries
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            // API and utilities
            if (id.includes('axios')) {
              return 'api-vendor';
            }
            // Stripe libraries
            if (id.includes('stripe')) {
              return 'stripe-vendor';
            }
            // All other node_modules
            return 'vendor';
          }
        },
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          let extType = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'images';
          } else if (/woff|woff2/.test(extType)) {
            extType = 'fonts';
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable source maps for debugging (disable in production if not needed)
    sourcemap: false,
    // Optimize CSS
    cssCodeSplit: true,
    // Target modern browsers for better optimization
    target: 'es2020',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'axios',
      'i18next',
      'react-i18next',
    ],
    exclude: ['@stripe/stripe-js', '@stripe/react-stripe-js'], // Load on demand
  },
  // Preview server configuration
  preview: {
    port: 4173,
    strictPort: true,
  },
});