import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    publicDir: 'public',
    server: {
        port: 3000,
        strictPort: false,
        open: '/views/index.html',
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: '/views/index.html',
                home: '/views/home.html',
                notFound: '/views/404.html'
            }
        }
    }
}); 