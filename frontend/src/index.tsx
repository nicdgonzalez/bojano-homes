/** @refresh reload */

import { Suspense } from "solid-js";
import { render } from "solid-js/web";

import { ClerkLoaded, ClerkProvider } from "clerk-solidjs";
import { Top } from "./components/Top";
import { Overview } from "./routes/Overview";
import { MetaProvider, Title } from "@solidjs/meta";
import { Clerk } from "@clerk/clerk-js";

// `<ClerkLoaded>` guarantees `window.Clerk` exists for child components.
declare global {
  interface Window {
    Clerk?: Clerk;
  }
}

const root = (() => {
  const entryPoint = document.getElementById("root");

  if (entryPoint === null) {
    throw new Error("expected an element with id 'root' in `index.html`");
  }

  return entryPoint;
})();

function App() {
  return (
    <>
      <MetaProvider>
        <Title>Overview | Bojano Homes</Title>
      </MetaProvider>

      <ClerkProvider
        publishableKey={"pk_test_d2VsY29tZS1zYXR5ci0yMy5jbGVyay5hY2NvdW50cy5kZXYk"}
      >
        <Suspense>
          <div class="bg-amber-200 text-amber-900 p-1 text-center font-semibold">
            The site is under active development!
          </div>
          <Top />
          <div class="flex flex-col items-center">
            <div class="mx-auto max-w-screen px-4 lg:px-8 relative flex-1 overflow-hidden">
              <ClerkLoaded>
                <Overview />
              </ClerkLoaded>
            </div>
          </div>
        </Suspense>
      </ClerkProvider>
    </>
  );
}

// The main entry point to the application.
render(() => <App />, root);
