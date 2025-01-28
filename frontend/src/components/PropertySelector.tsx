import { Property } from "../lib/properties";
import { SelectChangeEvent } from "@suid/material/Select";
import { House } from "lucide-solid";
import { For, Setter } from "solid-js";

interface PropertySelectorProps {
  properties: Property[];
  property: Property;
  index: number;
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
    <div class="flex flex-col self-end">
      <label for="property-select">Viewing:</label>
      <div class="flex flex-row gap-x-4">
        <House height={16} width={16} />
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
  );
}
