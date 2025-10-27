import './bootstrap';
import '../css/app.css';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { Toaster } from 'react-hot-toast';
import DevToolsLock from './Components/DevToolsLock';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => {
        // Use async component loading for better performance
        return resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx', { eager: false }),
        );
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <App {...props} />
                <DevToolsLock />
                <Toaster 
                    position="top-center"
                    toastOptions={{
                        duration: 5000,
                        style: {
                            background: '#363636',
                            color: '#fff',
                            minWidth: '400px',
                            padding: '16px',
                        },
                        success: {
                            duration: 3000,
                            style: {
                                background: '#10B981',
                            },
                        },
                        error: {
                            duration: 8000,
                            style: {
                                background: '#EF4444',
                            },
                        },
                    }}
                />
            </>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
