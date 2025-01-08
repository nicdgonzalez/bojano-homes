import solid from "vite-plugin-solid";

/** @type {import("vite").UserConfig} */
export default {
  plugins: [solid()],
  base: "/public",
  publicDir: "../public",
};
