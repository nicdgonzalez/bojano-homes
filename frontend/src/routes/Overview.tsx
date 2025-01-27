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
import { House } from "lucide-solid";
import { ExpenseTable } from "../components/Expenses";

export function Overview() {
  // <ClerkLoaded> at root layout guarantees Clerk is defined by this point.
  // A user must be signed in at all times to view the site (redirected by the
  // <Top> component on every page).
  const user = window.Clerk!.user!;

  const [properties] = createResource(async () => await getProperties(user.id));
  const [index, setIndex] = createSignal<number>(0);
  const [property, setProperty] = createSignal<Property | undefined>();

  createEffect(() => {
    if (typeof properties() === "undefined") {
      return;
    }

    setProperty(properties()![index()]);
  });

  const now = new Date();
  // Use 1-based indexing for months (i.e., 1 = January).
  // NOTE: I am using April (month 4) for testing because I know
  // most properties have data for this month.
  const selectedMonth = 4 || now.getMonth() + 1;
  // NOTE: Subtracting 1 from the current year (2025 -> 2024) because I was not
  // given the data for 2025 yet.
  const selectedYear = now.getFullYear() - 1;

  const [getNightsOccupied, setNightsOccupied] = createSignal<number>(-1);

  const [reservations] = createResource(property, async () => {
    try {
      const data = await getMonthlyReservations(
        user.id,
        property()!.id,
        selectedYear,
        selectedMonth,
      );

      return data;
    } catch (err) {
      console.error(`Failed to get reservations: ${err}`);
      return [];
    }
  });

  const [expenses] = createResource(property, async () => {
    try {
      const data = await getMonthlyExpenses(
        user.id,
        property()!.id,
        selectedYear,
        selectedMonth,
      );

      return data.sort((a, b) => +a.timestamp - +b.timestamp);
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

  // TODO: Refactor the property selector.
  // TODO: Switch to <SuspenseList>.

  return (
    <Show
      when={typeof property() !== "undefined"}
      fallback={<div>Loading...</div>}
    >
      <div class="flex flex-col self-end">
        <label for="property-select">Viewing Property:</label>
        <div class="flex flex-row gap-x-4">
          <House height={16} width={16} />
          <select
            name="property"
            id="property-select"
            onChange={(event) => {
              const newPropertyId = event.target.value;
              // I don't think this value can be changed until properties are done loading.
              const newIndex = properties()!.findIndex((p) =>
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
                <option value={p.id} selected={p.id === property()!.id}>
                  {p.name}
                </option>
              )}
            </For>
          </select>
        </div>
      </div>

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

      <Suspense fallback={<div>Loading...</div>}>
        <ExpenseTable expenses={expenses()!} />
      </Suspense>
    </Show>
  );
}
