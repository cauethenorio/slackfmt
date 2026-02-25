import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { gtmPlugin } from "./src/vite-plugins/gtm";

export default defineConfig({
  plugins: [gtmPlugin(), react()],
});
