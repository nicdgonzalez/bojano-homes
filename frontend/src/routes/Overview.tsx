import {
  createEffect,
  createResource,
  createSignal,
  Show,
  Suspense,
} from "solid-js";
import {
  getAnnualReservations,
  getMonthlyExpenses,
  getProperties,
  Property,
} from "../lib/properties";
import { ExpenseTable, ExpenseTableSkeleton } from "../components/ExpenseTable";
import { PropertySelector } from "../components/PropertySelector";
import { RevenueChart } from "~/components/RevenueChart";
import { Calendar } from "~/components/Calendar";

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
  // deno-fmt-ignore
  const [getMonth, setSelectedMonth] = createSignal<number>(now.getMonth() + 1);
  // deno-fmt-ignore
  const [getYear, setSelectedYear] = createSignal<number>(now.getFullYear());

  const [getRevenueLoaded, setRevenueLoaded] = createSignal(false);

  const [reservations] = createResource(() => {
    const user = window.Clerk?.user;

    if (user === undefined || user === null) {
      return null;
    }

    const property = getProperty();

    if (property === undefined) {
      return null;
    }

    return {
      userId: user.id,
      propertyId: property.id,
      year: getYear(),
    };
  }, async ({ userId, propertyId, year }) => {
    setRevenueLoaded(false);
    try {
      const data = await getAnnualReservations(userId, propertyId, year);
      return data;
    } catch (err) {
      console.error(`Failed to get reservations: ${err}`);
      return [];
    }
  });

  const [expenses] = createResource(() => {
    const user = window.Clerk?.user;

    if (user === undefined || user === null) {
      return null;
    }

    const property = getProperty();

    if (property === undefined) {
      return null;
    }

    return {
      userId: user.id,
      propertyId: property.id,
      year: getYear(),
      month: getMonth(),
    };
  }, async ({ userId, propertyId, year, month }) => {
    try {
      const data = await getMonthlyExpenses(userId, propertyId, year, month);
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
    const nightsOccupied = reservations()
      ?.at(getMonth() - 1)
      ?.reduce<number>((total, r) => {
        const checkOutMs = Number(r.checkOut);
        const checkInMs = Number(r.checkIn);
        const days = Math.abs(checkOutMs - checkInMs) / (1000 * 60 * 60 * 24);

        return total + days;
      }, 0);

    setNightsOccupied(nightsOccupied);
  });

  const [getRevenue, setRevenue] = createSignal<number[] | undefined>();

  createEffect(() => {
    const revenue: number[] | undefined = reservations()?.flatMap(
      (month) => month.map((r) => r.revenue).reduce((total, r) => total + r, 0),
    );
    console.debug(`Revenue: ${revenue}`);
    setRevenue(revenue);
    setRevenueLoaded(true);
  });

  return (
    <Show
      when={getProperty() !== undefined}
      fallback={<div>Loading...</div>}
    >
      <div class="flex flex-row">
        <PropertySelector
          properties={properties()!}
          property={getProperty()!}
          setIndex={setIndex}
        />
      </div>

      <Calendar
        month={getMonth()}
        setMonth={setSelectedMonth}
        year={getYear()}
        setYear={setSelectedYear}
      />

      <Show
        when={getRevenueLoaded() === true}
        fallback={<RevenueChart revenue={[]} year={getYear()} />}
      >
        <RevenueChart revenue={getRevenue()!} year={getYear()} />
      </Show>

      {/* fix column spacing in skeleton */}
      <Suspense fallback={<ExpenseTableSkeleton />}>
        <ExpenseTable
          expenses={expenses()!}
          year={getYear()}
          month={getMonth()}
        />
      </Suspense>
    </Show>
  );
}
