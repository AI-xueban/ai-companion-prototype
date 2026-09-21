import fs from 'fs';
import os from 'os';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

function loadBailianConfig(): { api_key?: string; base_url?: string; default_text_model?: string } {
  try {
    const configPath = path.join(os.homedir(), '.bailian', 'config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch {
    return {};
  }
}

export default defineConfig(({ mode }) => {
    const singleFileBuild = mode === 'singlefile';
    const env = loadEnv(mode, '.', '');
    const bailian = loadBailianConfig();
    const dashscopeApiKey = env.DASHSCOPE_API_KEY || bailian.api_key || '';
    const dashscopeBaseUrl =
      env.DASHSCOPE_BASE_URL || bailian.base_url || 'https://token-plan.cn-beijing.maas.aliyuncs.com';
    const dashscopeModel =
      env.DASHSCOPE_MODEL || bailian.default_text_model || 'qwen3.6-plus';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: dashscopeApiKey
          ? {
              '/api/qwen': {
                target: dashscopeBaseUrl,
                changeOrigin: true,
                rewrite: (requestPath) => requestPath.replace(/^\/api\/qwen/, '/compatible-mode/v1'),
                headers: {
                  Authorization: `Bearer ${dashscopeApiKey}`,
                },
              },
            }
          : undefined,
      },
      assetsInclude: ['**/*.mov'],
      plugins: [
        react(),
        ...(singleFileBuild ? [viteSingleFile()] : [])
      ],
      build: {
        // 云端静态托管使用正常的多文件产物，避免单个 HTML 超过平台限制。
        // `npm run build:singlefile` 仍可生成便于离线传阅的单 HTML。
        assetsInlineLimit: singleFileBuild ? 100000000 : 4096,
        chunkSizeWarningLimit: 6000,
        cssCodeSplit: !singleFileBuild,
        rollupOptions: singleFileBuild
          ? {
              output: {
                inlineDynamicImports: true,
              },
            }
          : undefined,
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'import.meta.env.VITE_DASHSCOPE_MODEL': JSON.stringify(dashscopeModel),
        'import.meta.env.VITE_QWEN_ENABLED': JSON.stringify(Boolean(dashscopeApiKey)),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
