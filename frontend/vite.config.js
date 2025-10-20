import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Plugin to handle SPA routing - rewrite non-API routes to index.html
function spaFallbackPlugin() {
  return {
    name: 'spa-fallback',
    configureServer(server) {
      return () => {
        server.middlewares.use((req, res, next) => {
          // Skip API endpoints
          if (req.url.startsWith('/auth/') ||
              req.url.startsWith('/admin/') ||
              req.url.startsWith('/slides/') ||
              req.url.startsWith('/user/')) {
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
      '/auth/': 'http://127.0.0.1:8000',
      '/admin/': 'http://127.0.0.1:8000',
      '/slides/': 'http://127.0.0.1:8000',
      '/user/': 'http://127.0.0.1:8000',
    }
  },
  build: {
    outDir: 'dist',
    index: 'index.html'
  }
});
