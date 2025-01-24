import {
  createEffect,
  createResource,
  createSignal,
  For,
  onMount,
  Show,
  Suspense,
} from "solid-js";
import { getProperties, getReservations, Property } from "../lib/properties";
import { DateRangeWithInputs } from "./DateRangeWithInput";
import { Box } from "@suid/material";

export function Overview() {
  const [properties, setProperties] = createSignal<Property[]>([]);
  const [index, setIndex] = createSignal<number>(0);
  const property = () => properties()[index()];

  // const now = new Date();
  const selectedMonth = 4; // now.getMonth() + 1;  // +1 for 1-based indexing.
  const selectedYear = 2024; // now.getFullYear();

  const user = window.Clerk.user;

  onMount(async () => {
    const data = await getProperties(user.id);
    setProperties(data);
  });

  const [getNightsOccupied, setNightsOccupied] = createSignal<number>(-1);

  const [reservations] = createResource(index, async () => {
    try {
      const data = await getReservations(
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
      // const data = await getExpenses();
    } catch (err) {
      // ...
    }
  });

  createEffect(() => {
    if (typeof reservations() === "undefined") {
      console.debug(`Reservations are still undefined`);
      return;
    }

    console.debug(`Calculating nights occupied...`);

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

      <Box>
        <DateRangeWithInputs />
      </Box>

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
    </>
  );
}
