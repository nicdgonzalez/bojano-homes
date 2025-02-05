import { Index, Setter } from "solid-js";

import {
  DatePicker,
  DatePickerContent,
  DatePickerContext,
  DatePickerNextTrigger,
  DatePickerPrevTrigger,
  DatePickerRangeText,
  DatePickerTable,
  DatePickerTableBody,
  DatePickerTableCell,
  DatePickerTableCellTrigger,
  DatePickerTableHead,
  DatePickerTableHeader,
  DatePickerTableRow,
  DatePickerView,
  DatePickerViewControl,
  DatePickerViewTrigger,
} from "~/components/ui/date-picker";

interface CalendarProps {
  month: number;
  setMonth: Setter<number>;
  year: number;
  setYear: Setter<number>;
}

export function Calendar(props: CalendarProps) {
  return (
    <div class="max-h-96 max-w-fit mx-auto">
      <DatePicker open>
        <DatePickerContent class="shadow-none border-none md:border-solid md:border-gray-200 dark:border-gray-800">
          <DatePickerView view="day">
            <DatePickerContext>
              {(api) => (
                <>
                  <DatePickerViewControl>
                    <DatePickerPrevTrigger
                      onClick={(_) => {
                        if (props.month - 1 < 1) {
                          props.setMonth(12);
                          props.setYear((y) => y - 1);
                        } else {
                          props.setMonth((m) => m - 1);
                        }
                      }}
                    />
                    <DatePickerViewTrigger>
                      <DatePickerRangeText />
                    </DatePickerViewTrigger>
                    <DatePickerNextTrigger
                      onClick={(_) => {
                        if (props.month + 1 > 12) {
                          props.setMonth(1);
                          props.setYear((y) => y + 1);
                        } else {
                          props.setMonth((m) => m + 1);
                        }
                      }}
                    />
                  </DatePickerViewControl>
                  <DatePickerTable>
                    <DatePickerTableHead>
                      <DatePickerTableRow>
                        <Index each={api().weekDays}>
                          {(weekDay) => (
                            <DatePickerTableHeader>
                              {weekDay().short}
                            </DatePickerTableHeader>
                          )}
                        </Index>
                      </DatePickerTableRow>
                    </DatePickerTableHead>
                    <DatePickerTableBody>
                      <Index each={api().weeks}>
                        {(week) => (
                          <DatePickerTableRow>
                            <Index each={week()}>
                              {(day) => (
                                <DatePickerTableCell value={day()}>
                                  <DatePickerTableCellTrigger>
                                    {day().day}
                                  </DatePickerTableCellTrigger>
                                </DatePickerTableCell>
                              )}
                            </Index>
                          </DatePickerTableRow>
                        )}
                      </Index>
                    </DatePickerTableBody>
                  </DatePickerTable>
                </>
              )}
            </DatePickerContext>
          </DatePickerView>
          <DatePickerView view="month">
            <DatePickerContext>
              {(api) => (
                <>
                  <DatePickerViewControl>
                    <DatePickerPrevTrigger
                      onClick={(_) => props.setYear((y) => y - 1)}
                    />
                    <DatePickerRangeText />
                    <DatePickerNextTrigger
                      onClick={(_) => props.setYear((y) => y + 1)}
                    />
                  </DatePickerViewControl>
                  <DatePickerTable>
                    <DatePickerTableBody>
                      <Index
                        each={api().getMonthsGrid({
                          columns: 4,
                          format: "short",
                        })}
                      >
                        {(months) => (
                          <DatePickerTableRow>
                            <Index each={months()}>
                              {(month) => (
                                <DatePickerTableCell
                                  value={month().value}
                                  onClick={(_) => {
                                    const monthNumber: number = month().value;
                                    console.debug(
                                      `Updating month to: ${monthNumber}`,
                                    );
                                    props.setMonth(monthNumber);
                                  }}
                                >
                                  <DatePickerTableCellTrigger>
                                    {month().label}
                                  </DatePickerTableCellTrigger>
                                </DatePickerTableCell>
                              )}
                            </Index>
                          </DatePickerTableRow>
                        )}
                      </Index>
                    </DatePickerTableBody>
                  </DatePickerTable>
                </>
              )}
            </DatePickerContext>
          </DatePickerView>
        </DatePickerContent>
      </DatePicker>
    </div>
  );
}
