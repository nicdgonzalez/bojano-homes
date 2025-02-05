import { For, Show } from "solid-js";

import { Table, TableData, TableRow } from "@components/Table";
import { ExternalLink } from "@components/ExternalLink";
import { Expense } from "../_lib/properties";

interface ExpensesProps {
  expenses: Expense[];
  month: number;
  year: number;
}

export function Expenses(props: ExpensesProps) {
  const headers = [
    "Date",
    "Amount",
    "Description",
    "Receipt Link",
    "Purchased By",
  ];

  return (
    <div class="w-full overflow-auto whitespace-nowrap mt-4">
      <Table
        headers={headers}
        caption={`Displaying ${props.expenses.length} results`}
      >
        <For each={props.expenses}>
          {(expense) => <ExpenseRow data={expense} />}
        </For>
      </Table>
    </div>
  );
}

interface ExpenseRowProps {
  data: Expense;
}

function ExpenseRow({ data }: ExpenseRowProps) {
  const date = data.timestamp.toISOString().split("T").at(0);
  const amount = (() => {
    const amount = Math.abs(data.amount).toFixed(2);

    return `${data.amount > 0 ? "+" : ""}$${amount}`;
  })();

  return (
    <TableRow>
      <TableData>{date}</TableData>
      <TableData>
        <span
          class={data.amount > 0 ? "text-green-700 dark:text-green-300" : ""}
        >
          {amount}
        </span>
      </TableData>
      <TableData>{data.description}</TableData>
      <TableData>
        <Show when={data.receiptLink.length > 0} fallback={<>None</>}>
          <ExternalLink link={data.receiptLink}>Receipt</ExternalLink>
        </Show>
      </TableData>
      <TableData>{data.buyersName}</TableData>
    </TableRow>
  );
}
