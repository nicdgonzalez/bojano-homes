import { SquareArrowOutUpRight } from "lucide-solid";
import { ParentProps } from "solid-js";

export interface ExternalLinkProps extends ParentProps {
  link: string;
}

export function ExternalLink({ link, children }: ExternalLinkProps) {
  return (
    <a
      target="_blank"
      href={link}
      class="flex flex-row gap-x-1 text-blue-700 underline"
    >
      {children}
      <SquareArrowOutUpRight width={16} height={16} class="self-center" />
    </a>
  );
}
