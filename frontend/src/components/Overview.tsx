// TODO: Refactor. There is too much code here; it makes it hard to read.

import {
  createEffect,
  createResource,
  createSignal,
  For,
  Match,
  onMount,
  ParentProps,
  Show,
  Suspense,
  Switch,
} from "solid-js";
import {
  Expense,
  getMonthlyExpenses,
  getMonthlyReservations,
  getProperties,
  Property,
} from "../lib/properties";
import { DateRangeWithInputs } from "./DateRangeWithInput";
import { Box } from "@suid/material";
import { SquareArrowOutUpRight } from "lucide-solid";

export function Overview() {
  const [properties, setProperties] = createSignal<Property[]>([]);
  const [index, setIndex] = createSignal<number>(0);
  const property = () => properties()[index()];

  // const now = new Date();
  const selectedMonth = 4; // now.getMonth() + 1;  // +1 for 1-based indexing.
  const selectedYear = 2024; // now.getFullYear();

  // <ClerkLoaded> at root layout guarantees Clerk is defined by this point.
  // A user must be signed in at all times to view the site (redirected by the
  // <Top> component on every page).
  const user = window.Clerk!.user!;

  onMount(async () => {
    const data = await getProperties(user.id);
    setProperties(data);
  });

  const [getNightsOccupied, setNightsOccupied] = createSignal<number>(-1);

  const [reservations] = createResource(index, async () => {
    try {
      const data = await getMonthlyReservations(
        user.id,
        property().id,
        selectedYear,
        selectedMonth,
      );

      return data;
    } catch (err) {
      console.error(`Failed to get reservations: ${err}`);
      return [];
    }
  });

  const [expenses] = createResource(index, async () => {
    try {
      const data = await getMonthlyExpenses(
        user.id,
        property().id,
        selectedYear,
        selectedMonth,
      );

      return data.reverse();
    } catch (err) {
      console.error(`Failed to get expenses: ${err}`);
      return [];
    }
  });

  createEffect(() => {
    if (typeof reservations() === "undefined") {
      return;
    }

    // TODO: Flatten data first so duplicate entries are not counted twice.
    const nightsOccupied = reservations()!
      .reduce<number>((total, r) => {
        const checkOutMs = Number(r.checkOut);
        const checkInMs = Number(r.checkIn);
        const days = Math.abs(checkOutMs - checkInMs) / (1000 * 60 * 60 * 24);

        return total + days;
      }, 0);

    setNightsOccupied(nightsOccupied);
  });

  return (
    <>
      <div class="flex flex-col self-end">
        <label for="property-select">Viewing:</label>
        <select
          name="property"
          id="property-select"
          onChange={(event) => {
            const newPropertyId = event.target.value;
            const newIndex = properties().findIndex((p) =>
              p.id === newPropertyId
            );

            if (newIndex === -1) {
              console.error(`failed to change properties`);
            }

            setIndex(newIndex);
          }}
        >
          <For each={properties()} fallback={<div>Loading...</div>}>
            {(p) => (
              <option value={p.id} selected={p.id === property().id}>
                {p.name}
              </option>
            )}
          </For>
        </select>
      </div>

      {
        /*
      <Box>
        <DateRangeWithInputs />
      </Box>
      */
      }

      <Suspense fallback={<div>Loading...</div>}>
        <Show when={typeof reservations() !== "undefined"}>
          <div>
            <h2>Nights Occupied: {getNightsOccupied()}</h2>
            <For each={reservations()}>
              {(r) => (
                <>
                  <p>{JSON.stringify(r)}</p>
                  <p></p>
                </>
              )}
            </For>
          </div>
        </Show>
      </Suspense>

      <Suspense fallback={<div>Loading...</div>}>
        <Show when={typeof expenses() !== "undefined"}>
          <ExpenseTable caption={`End of results`}>
            <For each={expenses()}>
              {(e) => <ExpenseRow expense={e} />}
            </For>
          </ExpenseTable>
        </Show>
      </Suspense>
    </>
  );
}

function ExpenseTable(
  { children, caption }: ParentProps & { caption: string },
) {
  return (
    <div class="mx-auto rounded-md border border-gray-200 p-6 sm:p-10 mt-8">
      <div>
        <h3 class="font-semibold text-gray-900">Expenses</h3>
        <p class="mt-1 text-sm leading-6 text-gray-600">
          Overview of this property's expenses this month.
        </p>
      </div>
      <div>
        <div class="w-full overflow-auto whitespace-nowrap mt-8">
          <table class="w-full caption-bottom border-b border-gray-200">
            <caption class="mt-2 text-sm leading-6 text-gray-600">
              {caption}
            </caption>
            <thead>
              <tr class="[&_td:last-child]:pr-4 [&_th:last-child]:pr-4 [&_td:first-child]:pl-4 [&_th:first-child]:pl-4">
                <TableHeader text="Date" />
                <TableHeader text="Amount" />
                <TableHeader text="Description" />
                <TableHeader text="Merchant" />
                <TableHeader text="Receipt Link" />
                <TableHeader text="Purchased by" />
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {children}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface TableHeaderProps {
  text: string;
}

function TableHeader({ text }: TableHeaderProps) {
  return (
    <th class="border-b px-4 py-2 text-left text-sm font-semibold text-gray-900 border-gray-200">
      {text}
    </th>
  );
}

function TableData({ children }: ParentProps) {
  return (
    <td class="p-4 text-sm text-gray-600">
      {children}
    </td>
  );
}

interface ExpenseProps {
  expense: Expense;
}

function ExpenseRow({ expense }: ExpenseProps) {
  const t = expense.timestamp;
  return (
    <tr class="[&_td:last-child]:pr-4 [&_th:last-child]:pr-4 [&_td:first-child]:pl-4 [&_th:first-child]:pl-4 odd:bg-gray-50">
      <TableData>{t.getFullYear()}-{t.getMonth()}-{t.getDay()}</TableData>
      <TableData>
        {expense.amount < 0 ? "-$" : "$"}
        {Math.abs(expense.amount).toFixed(2)}
      </TableData>
      <TableData>{expense.description}</TableData>
      <TableData>{expense.merchant ? "N/A" : expense.merchant}</TableData>
      <TableData>
        <Switch>
          <Match when={expense.receiptLink}>
            <a
              class="flex flex-row gap-x-1 text-blue-700 underline"
              href={expense.receiptLink}
            >
              Receipt
              <SquareArrowOutUpRight
                width={16}
                height={16}
                class="self-center"
              />
            </a>
          </Match>
          <Match when={!expense.receiptLink}>
            None
          </Match>
        </Switch>
      </TableData>
      <TableData>{expense.buyersName}</TableData>
    </tr>
  );
}
