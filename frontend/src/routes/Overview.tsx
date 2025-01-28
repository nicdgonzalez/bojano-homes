import {
  createEffect,
  createResource,
  createSignal,
  For,
  Show,
  Suspense,
} from "solid-js";
import {
  getMonthlyExpenses,
  getMonthlyReservations,
  getProperties,
  Property,
} from "../lib/properties";
import { ExpenseTable, ExpenseTableSkeleton } from "../components/Expenses";
import { PropertySelector } from "../components/PropertySelector";

/**
 * Get the index of the last property they were viewing from the browser's
 * `localStorage`.
 *
 * @returns The value converted to a number.
 */
function getInitialIndex(): number {
  const value = window.localStorage.getItem("propertyIndex") || "0";
  const index = parseInt(value, 10);

  if (isNaN(index)) {
    window.localStorage.setItem("propertyIndex", "0");
    return 0;
  }

  return index;
}

export function Overview() {
  // <ClerkLoaded> at root layout guarantees Clerk is defined by this point.
  // A user must be signed in at all times to view the site (redirected by
  // the <Top> component on every page).
  const user = window.Clerk!.user!;

  const [properties] = createResource(async () => await getProperties(user.id));
  const [getIndex, setIndex] = createSignal<number>(getInitialIndex());
  const [getProperty, setProperty] = createSignal<Property | undefined>();

  createEffect(() => {
    window.localStorage.setItem("propertyIndex", getIndex().toString());
  });

  createEffect(() => {
    const property = properties()?.at(getIndex());
    setProperty(property);
  });

  // TODO: Create a selector for the date and year.
  const now = new Date();
  // Use 1-based indexing for months (i.e., 1 = January).
  // NOTE: I am using April (month 4) for testing because I know
  // most properties have data for this month.
  const selectedMonth = 4 || now.getMonth() + 1;
  // NOTE: Subtracting 1 from the current year (2025 -> 2024) because I was not
  // given the data for 2025 yet.
  const selectedYear = now.getFullYear() - 1;

  const [reservations] = createResource(getProperty, async () => {
    try {
      const data = await getMonthlyReservations(
        user.id,
        getProperty()!.id,
        selectedYear,
        selectedMonth,
      );

      return data;
    } catch (err) {
      console.error(`Failed to get reservations: ${err}`);
      return [];
    }
  });

  const [expenses] = createResource(getProperty, async () => {
    try {
      const data = await getMonthlyExpenses(
        user.id,
        getProperty()!.id,
        selectedYear,
        selectedMonth,
      );

      return data.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
    } catch (err) {
      console.error(`Failed to get expenses: ${err}`);
      return [];
    }
  });

  // deno-fmt-ignore
  const [getNightsOccupied, setNightsOccupied] = createSignal<number | undefined>();

  createEffect(() => {
    // TODO: Flatten data first so duplicate entries are not counted twice.
    const nightsOccupied = reservations()?.reduce<number>((total, r) => {
      const checkOutMs = Number(r.checkOut);
      const checkInMs = Number(r.checkIn);
      const days = Math.abs(checkOutMs - checkInMs) / (1000 * 60 * 60 * 24);

      return total + days;
    }, 0);

    setNightsOccupied(nightsOccupied);
  });

  // TODO: Refactor the property selector.
  // TODO: Switch to <SuspenseList>.

  return (
    <Show
      when={typeof getProperty() !== "undefined"}
      fallback={<div>Loading...</div>}
    >
      <PropertySelector
        properties={properties()!}
        property={getProperty()!}
        index={getIndex()}
        setIndex={setIndex}
      />

      <Suspense fallback={<div>Loading...</div>}>
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
      </Suspense>

      <Suspense fallback={<ExpenseTableSkeleton />}>
        <ExpenseTable expenses={expenses()!} />
      </Suspense>
    </Show>
  );
}
