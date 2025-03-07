import { defineConfig } from 'vite';
import custom404Plugin from './vite-404-plugin';
import { resolve } from 'path';

export default defineConfig({
    root: '.',
    publicDir: 'public',
    server: {
        port: 3000,
        strictPort: false,
        open: '/views/index.html',
    },
    plugins: [
        custom404Plugin()
    ],
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'views', 'index.html'),
                home: resolve(__dirname, 'views', 'home.html'),
                notFound: resolve(__dirname, 'views', '404.html')
            }
        }
    }
}); 