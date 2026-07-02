import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  // Create Vite server in middleware mode
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });

  // Use vite's connect instance as middleware
  app.use(vite.middlewares);

  // SPA routing: Serve index.html for all non-file requests
  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl;
      // Skip static files and API routes
      if (/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot|ico|map)$/.test(url)) {
        return;
      }
      
      // Load index.html and transform it with vite
      let html = await vite.transformIndexHtml(
        url,
        'vite will replace this'
      );
      
      // Actually read the index.html file
      const indexPath = path.resolve(__dirname, 'index.html');
      const fs = await import('fs');
      let indexHtml = fs.readFileSync(indexPath, 'utf-8');
      
      html = await vite.transformIndexHtml(url, indexHtml);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      console.error(e.stack);
      res.status(500).end(e.stack);
    }
  });

  return { app, vite };
}

createServer().then(({ app, vite }) => {
  const port = process.env.PORT || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`\n✅ Server is running at http://localhost:${port}`);
  });
});
