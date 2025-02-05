import {
  createEffect,
  createResource,
  createSignal,
  Match,
  Show,
  Switch,
} from "solid-js";

import { RedirectToSignIn } from "clerk-solidjs";

import { Container } from "@components/Container";

import { PropertySelector } from "./_components/PropertySelector";
import { Calendar } from "./_components/Calendar";
import { Revenue } from "./_components/Revenue";
import { Reservations } from "./_components/Reservations";
import { Expenses } from "./_components/Expenses";
import {
  getAnnualReservations,
  getMonthlyExpenses,
  getProperties,
  Property,
  Reservation,
} from "./_lib/properties";
import { H3, Paragraph } from "~/components/Text";

function getLoggedInUser() {
  const user = window.Clerk?.user;

  if (user === undefined || user === null) {
    return null;
  }

  return user;
}

/**
 * Get the previously selected index from the client's localStorage.
 *
 * This function checks in the browser's localStorage for an entry named
 * `propertyIndex`. If not found, it is created with the default value of `0`.
 */
function getIndexFromStorage(): number {
  const value = window.localStorage.getItem("propertyIndex") || "0";
  const index = parseInt(value, 10);

  if (isNaN(index)) {
    window.localStorage.setItem("propertyIndex", "0");
    return 0;
  }

  return index;
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

// TODO: See if I can move the user/property logic into a context provider
// so I can refactor some of this code into their own components and tidy up.
export default function Page() {
  const user = getLoggedInUser();

  if (user === null) {
    return <RedirectToSignIn />;
  }

  const [properties] = createResource(
    () => ({ userId: user.id }),
    async ({ userId }) => await getProperties(userId),
  );
  const [getIndex, setIndex] = createSignal<number>(getIndexFromStorage());

  // Every time the user changes which property they are viewing,
  // save the new index so we can open to that property again next time.
  createEffect(() => {
    const index = getIndex();
    window.localStorage.setItem("propertyIndex", index.toString());
  });

  const [getProperty, setProperty] = createSignal<Property | undefined>();

  // When properties or index are updated, update the selected property too.
  createEffect(() => {
    const property = properties()?.at(getIndex());
    setProperty(property);
  });

  const today = new Date();
  // Add +1 to make the months 1 based (e.g., 1 = January).
  const [getMonth, setMonth] = createSignal<number>(today.getMonth() + 1);
  const [getYear, setYear] = createSignal<number>(today.getFullYear());

  const [getRevenue, setRevenue] = createSignal<number[] | undefined>();
  const [isRevenueLoaded, setRevenueLoaded] = createSignal(false);

  const [getAllReservations] = createResource(
    () => {
      const property = getProperty();

      if (property === undefined) {
        return;
      }

      return { userId: user.id, propertyId: property.id, year: getYear() };
    },
    async ({ userId, propertyId, year }) => {
      console.debug("Getting reservations");
      setRevenueLoaded(false);
      const data = await getAnnualReservations(userId, propertyId, year);

      if (data === undefined) {
        console.error("Failed to get property reservations");
        return [];
      }

      console.debug(`Reservations: ${JSON.stringify(data)}`);
      return data;
    },
  );

  // deno-fmt-ignore
  const [getReservations, setReservations] = createSignal<Reservation[] | undefined>();

  createEffect(() => {
    const reservationsAnnual = getAllReservations();

    // -1 because arrays are 0-based and months are 1-based.
    const reservations = reservationsAnnual?.at(getMonth() - 1);
    console.debug(
      `Monthly reservations updated: ${JSON.stringify(reservations)}`,
    );
    setReservations(reservations);

    const revenue = reservationsAnnual?.flatMap(
      (month) => month.map((r) => r.revenue).reduce((total, r) => total + r, 0),
    );
    console.debug(`Revenue updated: ${revenue}`);
    setRevenue(revenue);
    setRevenueLoaded(true);
  });

  // Wrap it in a lambda function so it keeps its reactivity.
  const monthName = () => getMonthName(getMonth());

  const [getExpenses] = createResource(
    () => {
      const property = getProperty();

      if (property === undefined) {
        return;
      }

      return {
        userId: user.id,
        propertyId: property.id,
        year: getYear(),
        month: getMonth(),
      };
    },
    async ({ userId, propertyId, year, month }) => {
      console.debug(`Getting expenses for ${year}/${month}`);
      const data = await getMonthlyExpenses(userId, propertyId, year, month);

      if (data === undefined) {
        console.error(
          `Failed to get expenses for property with ID: ${propertyId}`,
        );
        return [];
      }

      console.debug(`Expenses: ${JSON.stringify(data)}`);
      return data;
    },
  );

  return (
    <Show when={getProperty() !== undefined} fallback={<div>Loading...</div>}>
      <Container class="w-full md:w-fit p-0 sm:p-0 md:mr-0">
        <PropertySelector
          properties={properties()!}
          property={getProperty()!}
          setIndex={setIndex}
        />
      </Container>

      <Container class="flex flex-col">
        {
          /**
           * TODO: Move calendar triggers up next to property selector
           * and leave only the calendar(s) in the reservation container.
           */
        }
        <Calendar
          month={getMonth()}
          setMonth={setMonth}
          year={getYear()}
          setYear={setYear}
        />
        <div class="flex flex-col mt-8">
          <H3>Reservations</H3>
          <Paragraph>
            Details of this property's reservations for {monthName()}{" "}
            {getYear()}.
          </Paragraph>
          <Switch>
            <Match when={getAllReservations.loading}>
              <div>Loading...</div>
            </Match>
            <Match when={getAllReservations.error}>
              <div>An error occurred while getting reservations.</div>
            </Match>
            <Match when={getReservations() !== undefined}>
              <Reservations
                reservations={getReservations()!}
              />
            </Match>
          </Switch>
        </div>
      </Container>

      <Container>
        <H3>Revenue</H3>
        <Paragraph>
          Overview of this property's annual revenue for {getYear()}.
        </Paragraph>
        <Switch>
          <Match when={getAllReservations.loading && !isRevenueLoaded()}>
            <Revenue revenue={[]} year={getYear()} />
          </Match>
          <Match when={getAllReservations.error}>
            <div>An error occurred while calculating revenue.</div>
          </Match>
          <Match when={isRevenueLoaded()}>
            <Revenue revenue={getRevenue()!} year={getYear()} />
          </Match>
        </Switch>
      </Container>

      <Container>
        <H3>Expenses</H3>
        <Paragraph>
          Overview of this property's expenses for {monthName()} {getYear()}.
        </Paragraph>
        <Switch>
          <Match when={getExpenses.loading}>
            <div>Loading...</div>
          </Match>
          <Match when={getExpenses.error}>
            <div>An error occurred while getting expenses.</div>
          </Match>
          <Match when={getExpenses() !== undefined}>
            <Expenses
              expenses={getExpenses()!}
              month={getMonth()}
              year={getYear()}
            />
          </Match>
        </Switch>
      </Container>
    </Show>
  );
}
