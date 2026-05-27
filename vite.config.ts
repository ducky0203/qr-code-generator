import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  preview: {
    host: true,
    allowedHosts: ["qrgen.tre360.vn"],
  },
  server: {
    host: true,
    allowedHosts: ["qrgen.tre360.vn"],
  },
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    tailwindcss(),
  ],
});
