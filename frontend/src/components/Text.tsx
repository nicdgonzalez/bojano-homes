import { ParentProps } from "solid-js";

export function H3(props: ParentProps) {
  return (
    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-50 w-full">
      {props.children}
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
