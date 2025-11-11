import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Plugin to handle SPA routing - rewrite non-API routes to index.html
function spaFallbackPlugin() {
  return {
    name: 'spa-fallback',
    configureServer(server) {
      return () => {
        server.middlewares.use((req, res, next) => {
          // Skip only API proxy endpoints; SPA routes must fall back to index.html
          if (req.url === '/api' || req.url.startsWith('/api/')) {
            return next();
          }
          
          // Skip static files and resources
          if (/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json)$/i.test(req.url) ||
              req.url === '/index.html' ||
              req.url.includes('node_modules')) {
            return next();
          }
          
          // Rewrite SPA routes to index.html
          if (req.method === 'GET' && req.url.startsWith('/')) {
            req.url = '/index.html';
          }
          
          next();
        });
      };
    }
  };
}

export default defineConfig({
  plugins: [react(), spaFallbackPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      }
    }
  },
  build: {
    outDir: 'dist',
    index: 'index.html'
  }
});
