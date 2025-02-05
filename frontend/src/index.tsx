/**
 * The main entry point to the application.
 */

import { RouteDefinition, Router } from "@solidjs/router";
import { lazy } from "solid-js";
import { render } from "solid-js/web";

import { Clerk } from "@clerk/clerk-js";

import { RootLayout } from "./routes/layout";

declare global {
  interface Window {
    Clerk?: Clerk;
  }
}

/**
 * An array of route definitions for the application.
 *
 * Our application is a Single Page Application (SPA) with client-side routing
 * that is compiled and served from the backend server. Each route includes a
 * `path` and dynamically imported `component` associated with that path.
 * The components are loaded lazily to optimize the app's performance.
 *
 * For the `routes` directory, we follow a file-based routing approach.
 * Each subdirectory may include:
 *
 *    layout.tsx: A component that wraps the content of every child component.
 *      page.tsx: A component that will be displayed to the end user.
 *   _components: A private directory for any route-specific components.
 *          _lib: A private directory for any route-specific service code.
 *
 * Any subdirectories within the `routes` directory should match the name of
 * the route they are defining. For example, the implementation for
 * `/settings/profile` should be in `./routes/settings/profile/page.tsx`.
 *
 * For dynamic routes, which are defined using colons (:), we will instead
 * wrap those in square brackets since colons are not valid in directory names.
 * e.g., the implementation for `/posts/:id` should be in
 * `./routes/posts/[id]/page.tsx` instead of `./routes/posts/:id/page.tsx`.
 *
 * For documentation regarding routes definitions:
 * @see https://docs.solidjs.com/solid-router/getting-started/config
 */
const routes: RouteDefinition[] = [
  {
    path: "/",
    component: lazy(() => import("./routes/page")),
  },
];

/**
 * Get the HTML element with the ID 'root' from the document.
 *
 * This function looks for an element with the ID 'root' in the DOM
 * and returns it. If no such element is found, an error is thrown.
 *
 * @returns The element with the ID 'root'.
 * @throws {Error} If no element with the ID 'root' is found.
 */
function getEntryPoint(): HTMLElement {
  const entryPoint = document.getElementById("root");

  if (entryPoint === null) {
    throw new Error("expected an element with id 'root' in `index.html`");
  }

  return entryPoint;
}

render(() => <Router root={RootLayout}>{routes}</Router>, getEntryPoint());
