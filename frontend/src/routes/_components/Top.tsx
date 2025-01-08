import { Clerk } from "@clerk/clerk-js";
import { Show } from "solid-js";
import { createSignal } from "solid-js";

export function Top() {
  const [isLoaded, setIsLoaded] = createSignal(false);
  const [isSignedIn, setIsSignedIn] = createSignal(false);

  // deno-fmt-ignore
  const clerk = new Clerk("pk_test_d2VsY29tZS1zYXR5ci0yMy5jbGVyay5hY2NvdW50cy5kZXYk");

  clerk.load()
    .then(() => {
      setIsLoaded(true);
      setIsSignedIn(!!clerk.user);

      if (clerk.user) {
        // deno-fmt-ignore
        const userButton = document.getElementById("user-button") as HTMLDivElement | null;
        clerk.mountUserButton(userButton!, { showName: true });
      } else {
        clerk.redirectToSignIn();
      }
    })
    .catch((error) => {
      throw new Error(`failed to load Clerk: ${error}`);
    });

  return (
    <div class="fixed top-0 flex h-16 w-screen items-center justify-between bg-[#493857]">
      <a href="/">
        <img
          src="/public/assets/images/logo-white.png"
          alt="Bojano Homes logo"
          width="100"
          height="28"
          class="px-4 py-2"
        />
      </a>
      <Show when={isLoaded() && isSignedIn()}>
        <div
          id="top-user-button"
          class="align-center flex flex-row px-4 md:px-10"
        >
          <div id="user-button"></div>
        </div>
      </Show>
    </div>
  );
}
