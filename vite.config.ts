import { getPluginsList } from "./build/plugins";
import { include, exclude } from "./build/optimize";
import { type UserConfigExport, type ConfigEnv, loadEnv } from "vite";
import {
  root,
  alias,
  wrapperEnv,
  pathResolve,
  __APP_INFO__
} from "./build/utils";
import createDevtools from "./build/devtools";

export default ({ mode }: ConfigEnv): UserConfigExport => {
  const ENV = wrapperEnv(loadEnv(mode, root));
  const {
    VITE_CDN,
    VITE_PORT,
    VITE_COMPRESSION,
    VITE_PUBLIC_PATH,
    VITE_API_PROXY_TARGET,
    VITE_API_PROXY_RULE,
    VITE_API_PROXY_REWRITE
  } = ENV;
  const proxyTarget = VITE_API_PROXY_TARGET?.trim();
  const proxyRule = VITE_API_PROXY_RULE?.trim() || "/api";
  const rewritePattern = VITE_API_PROXY_REWRITE?.trim();
  const rewriteFn =
    rewritePattern && rewritePattern.length
      ? (path: string) => path.replace(new RegExp(rewritePattern), "")
      : undefined;
  return {
    base: VITE_PUBLIC_PATH,
    root,
    resolve: {
      alias
    },
    // 服务端渲染
    server: {
      // 端口号
      port: VITE_PORT,
      host: "0.0.0.0",
      // 本地跨域代理 https://cn.vitejs.dev/config/server-options.html#server-proxy
      proxy:
        proxyTarget && proxyRule
          ? {
              [proxyRule]: {
                target: proxyTarget,
                changeOrigin: true,
                secure: false,
                ...(rewriteFn ? { rewrite: rewriteFn } : {})
              }
            }
          : {},
      // 预热文件以提前转换和缓存结果，降低启动期间的初始页面加载时长并防止转换瀑布
      warmup: {
        clientFiles: ["./index.html", "./src/{views,components}/*"]
      }
    },
    plugins: [
      ...getPluginsList(VITE_CDN, VITE_COMPRESSION),
      createDevtools(ENV)
    ],
    // https://cn.vitejs.dev/config/dep-optimization-options.html#dep-optimization-options
    optimizeDeps: {
      include,
      exclude
    },
    build: {
      // https://cn.vitejs.dev/guide/build.html#browser-compatibility
      target: "es2015",
      sourcemap: false,
      // 消除打包大小超过500kb警告
      chunkSizeWarningLimit: 4000,
      rollupOptions: {
        input: {
          index: pathResolve("./index.html", import.meta.url)
        },
        // 静态资源分类打包
        output: {
          chunkFileNames: "static/js/[name]-[hash].js",
          entryFileNames: "static/js/[name]-[hash].js",
          assetFileNames: "static/[ext]/[name]-[hash].[ext]"
        }
      }
    },
    define: {
      __INTLIFY_PROD_DEVTOOLS__: false,
      __APP_INFO__: JSON.stringify(__APP_INFO__)
    }
  };
};
