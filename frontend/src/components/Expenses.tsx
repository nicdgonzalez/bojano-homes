/**
 * Implementation for expense-related components.
 */

import { For, Show } from "solid-js";
import { Table, TableData, TableRow } from "./Table";
import { Expense } from "../lib/properties";
import { ExternalLink } from "./ExternalLink";

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
    <div class="mx-auto w-full rounded-md border border-gray-200 p-6 sm:p-10 mt-8">
      <div>
        <h3 class="font-semibold text-gray-900">Expenses</h3>
        <p class="mt-1 text-sm leading-6 text-gray-600">
          Overview of this property's expenses this month.
        </p>
      </div>
      <div>
        <div class="w-full overflow-auto whitespace-nowrap mt-8">
          <Table headers={headers} caption="End of results">
            <For each={props.expenses}>
              {(expense) => <ExpenseRow expense={expense} />}
            </For>
          </Table>
        </div>
      </div>
    </div>
  );
}

interface ExpenseRowProps {
  expense: Expense;
}

function ExpenseRow({ expense }: ExpenseRowProps) {
  const date = expense.timestamp.toISOString().split("T").at(0);
  const amount = (() => {
    const sign = expense.amount < 0 ? "-" : "+";
    const amount = Math.abs(expense.amount).toFixed(2);

    return `${sign}$${amount}`;
  })();

  return (
    <TableRow>
      <TableData>{date}</TableData>
      <TableData>{amount}</TableData>
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
