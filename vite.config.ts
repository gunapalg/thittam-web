import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: import("vite").PluginOption[] = [react()];

  // The lovable component tagger is helpful but should never block the dev server.
  // In some environments it can throw during initialization; fall back gracefully.
  if (mode === "development") {
    try {
      plugins.push(componentTagger() as any);
    } catch (err) {
      console.warn("[vite] componentTagger disabled due to init error:", err);
    }
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@/components": path.resolve(__dirname, "./src/components"),
        "@/components/ui": path.resolve(__dirname, "./src/components/ui"),
        "@/components/doodles": path.resolve(__dirname, "./src/components/doodles"),
        "@/components/doodles/original": path.resolve(__dirname, "./src/components/doodles/original"),
        "@/components/doodles/ligne-claire": path.resolve(__dirname, "./src/components/doodles/ligne-claire"),
        "@/components/doodles/hand-drawn": path.resolve(__dirname, "./src/components/doodles/hand-drawn"),
        "@/components/enhanced": path.resolve(__dirname, "./src/components/enhanced"),
        "@/lib": path.resolve(__dirname, "./src/lib"),
        "@/lib/design-system": path.resolve(__dirname, "./src/lib/design-system"),
        "@/styles": path.resolve(__dirname, "./src/styles"),
        "@/types": path.resolve(__dirname, "./src/types"),
        "@/hooks": path.resolve(__dirname, "./src/hooks"),
        "@/utils": path.resolve(__dirname, "./src/utils"),
      },
    },
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: true,
      },
      proxy: {
        "/api": {
          target: "http://localhost:3000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            "doodle-original": ["./src/components/doodles/original"],
            "doodle-ligne-claire": ["./src/components/doodles/ligne-claire"],
            "doodle-hand-drawn": ["./src/components/doodles/hand-drawn"],
            "design-system": ["./src/lib/design-system"],
            "ui-components": ["./src/components/ui"],
            "enhanced-components": ["./src/components/enhanced"],
            "react-vendor": ["react", "react-dom"],
            "ui-vendor": ["@radix-ui/react-slot", "@radix-ui/react-dialog"],
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      cssCodeSplit: true,
      sourcemap: mode === "development",
      minify: mode === "production" ? "esbuild" : false,
      target: "esnext",
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "tailwind-merge",
        "clsx",
        "lucide-react",
        "@radix-ui/react-slot",
        "@radix-ui/react-dialog",
      ],
      exclude: ["@supabase/supabase-js"],
    },
    css: {
      devSourcemap: mode === "development",
    },
    define: {
      __DEV__: mode === "development",
      __DESIGN_SYSTEM_VERSION__: JSON.stringify(process.env.npm_package_version || "1.0.0"),
    },
  };
});

