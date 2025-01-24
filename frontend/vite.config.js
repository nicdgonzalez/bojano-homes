import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import suidPlugin from "@suid/vite-plugin";

/** @type {import("vite").UserConfig} */
export default {
  plugins: [solid(), tailwindcss(), suidPlugin()],
  base: "/public",
  publicDir: "../public",
};
