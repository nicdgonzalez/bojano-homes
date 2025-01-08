/** @refresh reload */

import { lazy } from "solid-js";
import { render } from "solid-js/web";
import { RouteDefinition, Router } from "@solidjs/router";

import { RootLayout } from "./routes/layout";

const root = (() => {
  const entryPoint = document.getElementById("root");

  if (entryPoint === null) {
    throw new Error("expected an element with id 'root' in `index.html`");
  }

  return entryPoint;
})();

/**
 * @see https://docs.solidjs.com/solid-router/getting-started/config
 */
const routes: RouteDefinition[] = [
  {
    path: "*404",
    component: lazy(() => import("./routes/[...404]")),
  },
  {
    path: "/",
    component: lazy(() => import("./routes/page")),
  },
  {
    path: "/properties",
    component: lazy(() => import("./routes/properties/layout")),
    children: [
      {
        path: "/",
        component: lazy(() => import("./routes/properties/page")),
      },
      {
        path: "/:index",
        component: lazy(() => import("./routes/properties/[index]/page")),
      },
      {
        path: "/:index/summary",
        component: lazy(() =>
          import("./routes/properties/[index]/summary/page")
        ),
      },
    ],
  },
];

// The main entry point to the application.
render(() => <Router root={RootLayout}>{routes}</Router>, root);
