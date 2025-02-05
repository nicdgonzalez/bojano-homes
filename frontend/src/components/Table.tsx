import { For, ParentProps, Show } from "solid-js";

export interface TableProps extends ParentProps {
  headers: string[];
  caption?: string;
}

/**
 * Represents a table of data.
 */
export function Table(props: TableProps) {
  return (
    <div class="w-full overflow-auto whitespace-nowrap mt-8">
      <table class="w-full caption-bottom border-b border-gray-200 dark:border-gray-800">
        <Show when={typeof props.caption !== "undefined"}>
          <caption class="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
            {props.caption}
          </caption>
        </Show>
        <thead>
          <tr class="[&_td:last-child]:pr-4 [&_th:last-child]:pr-4 [&_td:first-child]:pl-4 [&_th:first-child]:pl-4">
            <For each={props.headers}>
              {(header) => <TableHeader name={header} />}
            </For>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-800">
          {props.children}
        </tbody>
      </table>
    </div>
  );
}

export interface TableHeaderProps {
  name: string;
}

/**
 * Represents a column label in a table.
 */
export function TableHeader({ name }: TableHeaderProps) {
  return (
    <th class="border-b px-4 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-50 border-gray-200 dark:border-gray-800">
      {name}
    </th>
  );
}

/**
 * Represents a row of data in a table.
 */
export function TableRow({ children }: ParentProps) {
  return (
    <tr class="[&_td:last-child]:pr-4 [&_th:last-child]:pr-4 [&_td:first-child]:pl-4 [&_th:first-child]:pl-4 odd:bg-gray-50 dark:odd:bg-gray-900">
      {children}
    </tr>
  );
}

/**
 * Represents cell of data in a table row.
 */
export function TableData({ children }: ParentProps) {
  return (
    <td class="p-4 text-sm text-gray-600 dark:text-gray-400">
      {children}
    </td>
  );
}
