import { useId, type ReactNode } from "react";
import { MdInfoOutline } from "react-icons/md";

interface TooltipProps {
  content: string;
  children?: ReactNode;
  position?: "top" | "bottom";
}

export const Tooltip = ({ content, children, position = "top" }: TooltipProps) => {
  const tooltipId = useId();
  return (
    <span className="relative group inline-flex items-center">
      <span
        tabIndex={0}
        role="button"
        aria-describedby={tooltipId}
        className="cursor-help focus:outline-none"
      >
        {children ?? (
          <MdInfoOutline className="text-slate-400 hover:text-slate-600 focus:text-slate-600 text-sm" />
        )}
      </span>
      <span
        id={tooltipId}
        role="tooltip"
        className={`absolute ${
          position === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5"
        } left-1/2 -translate-x-1/2 w-56 bg-slate-800 text-white text-[11px] leading-relaxed rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl whitespace-normal`}
      >
        {content}
        <span
          className={`absolute ${
            position === "top" ? "top-full border-t-slate-800" : "bottom-full border-b-slate-800"
          } left-1/2 -translate-x-1/2 border-4 border-transparent`}
        />
      </span>
    </span>
  );
};
