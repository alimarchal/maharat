import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Separate vendor chunks for better caching
                    'react-vendor': ['react', 'react-dom'],
                    'inertia-vendor': ['@inertiajs/react'],
                    'pdf-vendor': ['jspdf', 'jspdf-autotable'],
                    'excel-vendor': ['exceljs'],
                    'dnd-vendor': ['@hello-pangea/dnd'],
                    'mui-vendor': ['@mui/material', '@mui/icons-material'],
                },
            },
        },
        chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
    },
});
