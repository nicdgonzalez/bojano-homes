import { JSX, ParentProps, splitProps } from "solid-js";

import { cn } from "@lib/utils";

interface ContainerProps
  extends ParentProps, JSX.HTMLAttributes<HTMLDivElement> {}

export function Container(props: ContainerProps) {
  const [local, others] = splitProps(props as ContainerProps, [
    "class",
    "children",
  ]);

  return (
    <div
      class={cn(
        "mx-auto w-full h-full rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 p-6 sm:p-10 mt-8",
        local.class,
      )}
      {...others}
    >
      {local.children}
    </div>
  );
}
