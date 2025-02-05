import { Table, TableData, TableRow } from "@components/Table";
import { Reservation } from "../_lib/properties";
import { For } from "solid-js";

interface ReservationsProps {
  reservations: Reservation[];
}

export function Reservations(props: ReservationsProps) {
  const headers = [
    "Platform",
    "Check-in",
    "Check-out",
    "Revenue",
    "Management Fee",
    "Net Profit",
  ];

  return (
    <div class="w-full overflow-auto whitespace-nowrap mt-4">
      <Table
        headers={headers}
        caption={`Displaying ${props.reservations.length} results`}
      >
        <For each={props.reservations}>
          {(reservation) => <ReservationRow data={reservation} />}
        </For>
      </Table>
    </div>
  );
}

interface ReservationRowProps {
  data: Reservation;
}

function ReservationRow({ data }: ReservationRowProps) {
  const checkIn = data.checkIn.toISOString().split("T").at(0);
  const checkOut = data.checkOut.toISOString().split("T").at(0);
  const revenue = (() => {
    const amount = Math.abs(data.revenue).toFixed(2);
    return `${data.revenue < 0 ? "-" : ""}$${amount}`;
  })();

  const managementFee = (() => {
    const amount = Math.abs(data.managementFee).toFixed(2);
    return `${
      data.managementFee == 0 ? "" : (data.managementFee < 0 ? "-" : "+")
    }$${amount}`;
  })();
  const netProfit = (() => {
    const amount = Math.abs(data.netProfit).toFixed(2);
    return `${data.netProfit < 0 ? "-" : ""}$${amount}`;
  })();

  return (
    <TableRow>
      <TableData>{data.platform}</TableData>
      <TableData>{checkIn}</TableData>
      <TableData>{checkOut}</TableData>
      <TableData>{revenue}</TableData>
      <TableData>
        {/* deno-fmt-ignore */}
        <span class={data.managementFee > 0 ? "text-green-700 dark:text-green-300" : ""}>
          {managementFee}
        </span>
      </TableData>
      <TableData>
        <span
          class={data.netProfit < 0 ? "text-red-700 dark:text-red-300" : ""}
        >
          {netProfit}
        </span>
      </TableData>
    </TableRow>
  );
}
