import { ParentProps } from "solid-js";
import { Sidebar } from "./_components/Sidebar";
import { useParams } from "@solidjs/router";

import NotFound from "../[...404]";

export default function Layout({ children }: ParentProps) {
  const params = useParams();
  const index = params.index === undefined ? 0 : parseInt(params.index, 10);

  if (isNaN(index) || index < 0 /* || i >= properties.length */) {
    return <NotFound />;
  }

  return (
    <main class="mt-16 flex min-h-screen w-full">
      <Sidebar index={index} />
      <div class="mx-auto w-full flex-1 overflow-auto px-5 py-8 text-[16px] font-medium leading-[140%] text-dark-400 md:px-10 lg:py-10">
        {children}
      </div>
    </main>
  );
}
