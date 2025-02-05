import {
  ClerkLoaded,
  RedirectToSignIn,
  SignedIn,
  SignedOut,
  UserButton,
} from "clerk-solidjs";

export function Top() {
  return (
    <div class="sticky top-0 z-50 flex h-16 w-screen items-center justify-between backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200 dark:border-gray-800">
      <a href="/">
        <img
          src="/public/assets/images/logo-white.png"
          alt="Bojano Homes logo"
          width="100"
          height="28"
          class="px-4 py-2 brightness-0 dark:brightness-100"
        />
      </a>
      <ClerkLoaded>
        <SignedIn>
          <div class="align-center flex flex-row px-4 md:px-10">
            <UserButton showName={true} />
          </div>
        </SignedIn>
        <SignedOut>
          <RedirectToSignIn />
        </SignedOut>
      </ClerkLoaded>
    </div>
  );
}
