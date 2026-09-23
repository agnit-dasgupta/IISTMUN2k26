import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

function viteUploadPlugin(): Plugin {
  const handleUpload = (req: any, res: any, next: any) => {
    if (req.url === '/api/upload' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const { fileName, fileData } = JSON.parse(body);
          if (!fileName || !fileData) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ status: 'error', message: 'Missing fileName or fileData' }));
            return;
          }

          const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }

          const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          const buffer = Buffer.from(matches && matches.length === 3 ? matches[2] : fileData, 'base64');

          const ext = path.extname(fileName) || '.dat';
          const baseName = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
          const uniqueFileName = `${Date.now()}_${baseName}${ext}`;
          const destinationPath = path.join(uploadsDir, uniqueFileName);

          fs.writeFileSync(destinationPath, buffer);

          const fileUrl = `/uploads/${uniqueFileName}`;
          console.log(`[VITE UPLOAD] Saved ${fileName} -> ${fileUrl} (${buffer.length} bytes)`);

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            status: 'success',
            url: fileUrl,
            fileName: uniqueFileName,
            originalName: fileName,
            size: buffer.length
          }));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'error', message: err.message || 'Upload failed' }));
        }
      });
    } else {
      next();
    }
  };

  return {
    name: 'vite-upload-plugin',
    configureServer(server) {
      server.middlewares.use(handleUpload);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleUpload);
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), viteUploadPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
