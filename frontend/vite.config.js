import fs from "fs";
import path from "path";

import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import suidPlugin from "@suid/vite-plugin";

/** @see https://stackoverflow.com/a/78658715 */
function get_paths_from_tsconfig() {
  const tsconfig_s = fs
    .readFileSync("./frontend/tsconfig.json", "utf-8");
  // .replace(/\/\/.*$/gm, ""); // Removing comments (.json, not .jsonc)
  const tsconfig = JSON.parse(tsconfig_s);
  const aliases = {};
  for (const [key, value] of Object.entries(tsconfig.compilerOptions.paths)) {
    aliases[key.replace(/\/\*$/, "")] = path.resolve(
      __dirname,
      tsconfig.compilerOptions.baseUrl,
      /** @type {string} */ (value[0]).replace(/\/\*$/, ""),
    );
  }
  console.log(aliases);
  return aliases;
}

/** @type {import("vite").UserConfig} */
export default {
  plugins: [solid(), tailwindcss(), suidPlugin()],
  base: "/public",
  publicDir: "../public",
  build: {
    minify: false, // Disable minification
    sourcemap: true, // Enable source maps for easier debugging
  },
  resolve: {
    alias: get_paths_from_tsconfig(),
  },
};
