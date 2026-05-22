import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      target: 'es2020',
      minify: 'esbuild',
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            charts: ['recharts'],
            excel: ['xlsx'],
          },
        },
      },
    },
    define: {
      __APP_API_URL__: JSON.stringify(env.VITE_API_BASE_URL || ''),
    },
  };
});
