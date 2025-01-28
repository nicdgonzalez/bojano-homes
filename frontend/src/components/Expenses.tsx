import { For, Show } from "solid-js";
import { Table, TableData, TableRow } from "./Table";
import { Expense } from "../lib/properties";
import { ExternalLink } from "./ExternalLink";
import { Skeleton } from "./ui/skeleton";
import { Box } from "./Box";

interface ExpenseTableProps {
  expenses: Expense[];
}

export function ExpenseTable(props: ExpenseTableProps) {
  const headers = [
    "Date",
    "Amount",
    "Description",
    "Receipt Link",
    "Purchased By",
  ];

  return (
    <Box>
      <div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-50 w-full">
          Expenses
        </h3>
        <p class="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
          Overview of this property's expenses this month.
        </p>
      </div>
      <div>
        <div class="w-full overflow-auto whitespace-nowrap mt-4">
          <Table headers={headers} caption="End of results">
            <For each={props.expenses}>
              {(expense) => <ExpenseRow expense={expense} />}
            </For>
          </Table>
        </div>
      </div>
    </Box>
  );
}

interface ExpenseRowProps {
  expense: Expense;
}

function ExpenseRow({ expense }: ExpenseRowProps) {
  const date = expense.timestamp.toISOString().split("T").at(0);
  const amount = (() => {
    const amount = Math.abs(expense.amount).toFixed(2);

    return `${expense.amount > 0 ? "+" : ""}$${amount}`;
  })();

  return (
    <TableRow>
      <TableData>{date}</TableData>
      <TableData>
        <span
          class={expense.amount > 0 ? "text-green-700 dark:text-green-300" : ""}
        >
          {amount}
        </span>
      </TableData>
      <TableData>{expense.description}</TableData>
      <TableData>
        <Show when={expense.receiptLink.length > 0} fallback={<>None</>}>
          <ExternalLink link={expense.receiptLink}>Receipt</ExternalLink>
        </Show>
      </TableData>
      <TableData>{expense.buyersName}</TableData>
    </TableRow>
  );
}

interface ExpenseTableSkeletonProps {
  count?: number;
}

// TODO: Refactor <ExpenseTable> so I can reuse the parts for the skeleton.
export function ExpenseTableSkeleton(props: ExpenseTableSkeletonProps) {
  const headers = [
    "Date",
    "Amount",
    "Description",
    "Receipt Link",
    "Purchased By",
  ];
  const count = props.count ?? 3;

  return (
    <div class="mx-auto w-full rounded-md border border-gray-200 bg-white dark:bg-gray-900/50 dark:border-gray-800 p-6 sm:p-10 mt-8">
      <div>
        <h3 class="font-semibold text-gray-900 dark:text-gray-50 w-full">
          Expenses
        </h3>
        <p class="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
          Overview of this property's expenses this month.
        </p>
      </div>
      <div>
        <div class="w-full overflow-auto whitespace-nowrap mt-4">
          <Table headers={headers} caption="End of results">
            {Array(count).fill(<ExpenseRowSkeleton />)}
          </Table>
        </div>
      </div>
    </div>
  );
}

function ExpenseRowSkeleton() {
  return (
    <TableRow>
      <TableData>
        <Skeleton
          height={16}
          class="rounded-full w-full max-w-24 bg-gray-300 dark:bg-gray-700"
        />
      </TableData>
      <TableData>
        <Skeleton
          height={16}
          class="rounded-full w-full max-w-24 bg-gray-300 dark:bg-gray-700"
        />
      </TableData>
      <TableData>
        <Skeleton
          height={16}
          class="rounded-full w-full max-w-96 bg-gray-300 dark:bg-gray-700"
        />
      </TableData>
      <TableData>
        <Skeleton
          height={16}
          class="rounded-full w-full max-w-32 bg-gray-300 dark:bg-gray-700"
        />
      </TableData>
      <TableData>
        <Skeleton
          height={16}
          class="rounded-full w-full max-w-32 bg-gray-300 dark:bg-gray-700"
        />
      </TableData>
    </TableRow>
  );
}
