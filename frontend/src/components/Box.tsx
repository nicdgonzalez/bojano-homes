import { ParentProps } from "solid-js";

interface BoxProps extends ParentProps {
}

export function Box(props: BoxProps) {
  return (
    <div class="mx-auto w-full rounded-md border border-gray-200 bg-white dark:bg-gray-900/50 dark:border-gray-800 p-6 sm:p-10 mt-8">
      {props.children}
    </div>
  );
}
