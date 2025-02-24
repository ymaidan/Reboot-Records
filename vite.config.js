import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    publicDir: 'public',
    server: {
        port: 5173,
        open: '/views/index.html'
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: '/views/index.html',
                home: '/views/home.html'
            }
        }
    }
}); 