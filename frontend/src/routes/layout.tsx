import { ParentProps, Suspense } from "solid-js";
import { Top } from "./_components/Top";

/** A component that wraps the content of every route. */
export function RootLayout({ children }: ParentProps) {
  return (
    <Suspense>
      <Top />
      <div class="mt-16">
        {children}
      </div>
    </Suspense>
  );
}
