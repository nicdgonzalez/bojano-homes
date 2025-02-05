import { For, Setter } from "solid-js";

import { SelectChangeEvent } from "@suid/material/Select";
import { House } from "lucide-solid";

import { Property } from "../_lib/properties";

interface PropertySelectorProps {
  properties: Property[];
  property: Property;
  setIndex: Setter<number>;
}

export function PropertySelector(props: PropertySelectorProps) {
  function selectHandler(event: SelectChangeEvent) {
    const propertyId = event.target.value;
    const index = props.properties.findIndex((p) => propertyId === p.id);

    if (index === -1) {
      console.error("Failed to update property index");
      return;
    }

    props.setIndex(index);
  }

  return (
    <>
      <div class="flex flex-row w-full rounded-md gap-x-4 px-4 py-2">
        <House height={24} width={24} class="self-center" />
        <select
          class="w-full"
          name="property"
          id="property-select"
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
    </>
  );
}
