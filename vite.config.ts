import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},      // SPA routing middleware - redirect all non-file requests to index.html
      middlewareMode: false,
      // Custom middleware to handle SPA routing
      middleware: [
        (req, res, next) => {
          // Allow static assets and API calls to pass through
          if (/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico)$/.test(req.url)) {
            return next();
          }
          // Redirect all other requests to index.html for SPA routing
          if (!req.url.match(/^\/api|^\/v1/)) {
            req.url = '/index.html';
          }
          next();
        }
      ]    },
  };
});
