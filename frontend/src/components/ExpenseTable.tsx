import { For, Show } from "solid-js";
import { Table, TableData, TableRow } from "./Table";
import { Expense } from "../lib/properties";
import { ExternalLink } from "./ExternalLink";
import { Skeleton } from "./ui/skeleton";
import { Box } from "./Box";
import { H3, Paragraph } from "./Text";

interface ExpenseTableProps {
  expenses: Expense[];
  month: number;
  year: number;
}

function getMonthName(month: number) {
  const months = [
    "", // Used to offset the array so months can start from index 1.
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months.at(month);
}

export function ExpenseTable(props: ExpenseTableProps) {
  const headers = [
    "Date",
    "Amount",
    "Description",
    "Receipt Link",
    "Purchased By",
  ];
  const monthName = () => getMonthName(props.month);

  return (
    <Box>
      <div>
        <H3>Expenses</H3>
        <Paragraph>
          Overview of this property's expenses for {monthName()} {props.year}.
        </Paragraph>
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
  month: number;
  year: number;
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
  const monthName = () => getMonthName(props.month);

  return (
    <div class="mx-auto w-full rounded-md border border-gray-200 bg-white dark:bg-gray-900/50 dark:border-gray-800 p-6 sm:p-10 mt-8">
      <div>
        <H3>Expenses</H3>
        <Paragraph>
          Overview of this property's expenses for {monthName()} {props.year}.
        </Paragraph>
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
