import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import legacy from '@vitejs/plugin-legacy';
import Components from 'unplugin-vue-components/vite';
import AutoImport from 'unplugin-auto-import/vite';
import { VantResolver } from '@vant/auto-import-resolver';
import { execSync } from 'child_process';
import path from 'path';
import pkg from './package.json';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [
      vue(),
      legacy({
        targets: ['iOS >= 12', 'Chrome >= 69'],
        additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
        renderLegacyChunks: true,
        modernPolyfills: true,
      }),
      Components({
        resolvers: [VantResolver()],
      }),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
        dts: 'src/auto-imports.d.ts',
      }),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },

    css: {
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: '[local]_[hash:base64:5]',
      },
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          modifyVars: {
            '@primary-color': '#1677ff',
            '@bg-color': '#f5f5f5',
          },
          additionalData: `@import "@/styles/variables.less";\n@import "@/styles/mixins.less";\n`,
        },
      },
    },

    build: {
      target: ['es2020', 'safari12', 'chrome69', 'firefox68'],
      cssTarget: 'safari12',
      sourcemap: env.VITE_APP_ENV === 'product' ? 'hidden' : true,

      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'vendor-vue',
                test: /node_modules[\\/]vue(-router|-dom)?/,
                priority: 20,
              },
              {
                name: 'vendor-pinia',
                test: /node_modules[\\/]pinia/,
                priority: 15,
              },
              {
                name: 'vendor-vant',
                test: /node_modules[\\/]vant/,
                priority: 15,
              },
              {
                name: 'vendor-other',
                test: /node_modules/,
                priority: 10,
              },
            ],
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
      chunkSizeWarningLimit: 1000,
    },

    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __GIT_HASH__: JSON.stringify(
        (() => {
          try {
            return execSync('git rev-parse --short HEAD').toString().trim();
          } catch {
            return 'unknown';
          }
        })(),
      ),
    },

    server: {
      host: '0.0.0.0',
      port: 3000,
    },
  };
});
