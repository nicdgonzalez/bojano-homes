import { createSignal } from "solid-js";
import { Box } from "@suid/material";
import { DateRange, DateRangeCalendar } from "solid-date-pickers";

export function DateRangeWithInputs() {
  const [range, setRange] = createSignal<DateRange>([null, null]);

  return (
    <Box>
      <DateRangeCalendar calendars={2} onChange={setRange} value={range()} />
    </Box>
  );
}
