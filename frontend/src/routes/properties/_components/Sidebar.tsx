import {
  Calendar,
  ChartNoAxesCombined,
  CircleCheckBig,
  FileText,
  Wrench,
} from "lucide-solid";
import { For, JSX } from "solid-js";

interface NavigationLinks {
  label: string;
  href: string;
  icon: JSX.Element;
}

interface SidebarProps {
  index: number;
}

export function Sidebar({ index }: SidebarProps) {
  const items: NavigationLinks[] = [
    {
      label: "Summary",
      href: `/properties/${index}/summary`,
      icon: <CircleCheckBig />,
    },
    {
      label: "Statements",
      href: `/properties/${index}/statements`,
      icon: <FileText />,
    },
    {
      label: "Performance",
      href: `/properties/${index}/performance`,
      icon: <ChartNoAxesCombined />,
    },
    {
      label: "Calendar",
      href: `/properties/${index}/calendar`,
      icon: <Calendar />,
    },
    {
      label: "Maintenance",
      href: `/properties/${index}/maintenance`,
      icon: <Wrench />,
    },
  ];

  return (
    <aside
      id="sidebar"
      class="fixed hidden h-screen w-screen flex-col gap-y-4 bg-white shadow-md shadow-purple-200/50 md:static md:flex md:w-72"
    >
      <div id="property-selector">
        {/* property selector goes here */}
      </div>
      <div>
        <nav class="flex flex-col justify-between">
          <ul class="flex flex-col">
            <For each={items}>
              {(link) => (
                <li class="flex justify-center items-center w-full whitespace-nowrap bg-cover transition-all hover:bg-purple-50 hover:text-black">
                  <a
                    href={link.href}
                    class="flex size-full gap-x-4 p-4 text-lg"
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </a>
                </li>
              )}
            </For>
          </ul>
        </nav>
      </div>
    </aside>
  );
}
