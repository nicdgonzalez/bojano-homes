import { ParentProps, Suspense } from "solid-js";
import { MetaProvider, Title } from "@solidjs/meta";
import { ClerkLoaded, ClerkProvider } from "clerk-solidjs";

import { Top } from "~/components/Top";

/**
 * A component that wraps the content of every page.
 */
export function RootLayout(props: ParentProps) {
  return (
    <>
      <MetaProvider>
        <Title>Overview | Bojano Homes</Title>
      </MetaProvider>

      <ClerkProvider
        publishableKey={"pk_test_d2VsY29tZS1zYXR5ci0yMy5jbGVyay5hY2NvdW50cy5kZXYk"}
      >
        <Suspense fallback={<div>Loading...</div>}>
          <div class="bg-amber-200 text-amber-900 text-sm p-1 text-center font-semibold">
            This site is under active development!
          </div>
          <Top />
          <div class="flex flex-col items-center">
            <div class="mx-auto w-full container px-4 lg:px-8 relative flex-1 overflow-hidden">
              <ClerkLoaded>
                {props.children}
              </ClerkLoaded>
            </div>
          </div>
        </Suspense>
      </ClerkProvider>
    </>
  );
}
