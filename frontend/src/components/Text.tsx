import { JSX, ParentProps, splitProps } from "solid-js";
import { cn } from "~/lib/utils";

interface HeadingProps extends JSX.HTMLAttributes<HTMLHeadingElement> {}

export function H3(props: HeadingProps) {
  const [local, others] = splitProps(props as HeadingProps, [
    "class",
    "children",
  ]);

  return (
    <h3
      class={cn(
        "text-lg font-semibold text-gray-900 dark:text-gray-50 w-full",
        local.class,
      )}
      {...others}
    >
      {local.children}
    </h3>
  );
}

export function Paragraph(props: ParentProps) {
  return (
    <p class="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
      {props.children}
    </p>
  );
}
