import { Property } from "../lib/properties";
import { SelectChangeEvent } from "@suid/material/Select";
import { House } from "lucide-solid";
import { For, Setter } from "solid-js";

interface PropertySelectorProps {
  properties: Property[];
  property: Property;
  setIndex: Setter<number>;
}

export function PropertySelector(props: PropertySelectorProps) {
  function selectHandler(event: SelectChangeEvent) {
    const selectedPropertyId = event.target.value;
    const selectedIndex = props.properties.findIndex((p) =>
      selectedPropertyId === p.id
    );

    if (selectedIndex === -1) {
      console.log("Failed to change to new property");
      return;
    }

    props.setIndex(selectedIndex);
  }

  return (
    <div class="w-fit rounded-md border border-gray-200 bg-white dark:bg-gray-900/50 dark:border-gray-800 p-2 sm:p-4 mt-8 ml-auto">
      <div class="flex flex-col">
        <label for="property-select">Viewing Property:</label>
        <div class="flex flex-row rounded-md gap-x-4 bg-gray-50 dark:bg-gray-900 px-4 py-2 mt-2">
          <House height={16} width={16} class="self-center" />
          <select
            name="property"
            id="select-property"
            onChange={selectHandler}
          >
            <For
              each={props.properties}
              fallback={<div>Loading...</div>}
            >
              {(property) => (
                <option
                  value={property.id}
                  selected={property.id === props.property.id}
                >
                  {property.name}
                </option>
              )}
            </For>
          </select>
        </div>
      </div>
    </div>
  );
}
