"use client";

import { CalendarDays, X } from "lucide-react";
import { DateUtil } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

/**
 * Tappable date field showing "Thu 15 Oct"; opens the app's calendar (no native picker).
 * Optional fields: an empty value shows `placeholder`, and `onClear` adds an × to empty it.
 */
export function DateBox({
  label,
  value,
  lang,
  active,
  onClick,
  required,
  placeholder,
  onClear,
  clearLabel,
}: {
  label: string;
  value: string;
  lang: "en" | "kh";
  active: boolean;
  onClick: () => void;
  required?: boolean;
  placeholder?: string;
  onClear?: () => void;
  clearLabel?: string;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        aria-expanded={active}
        className={cn(
          "relative flex h-12 w-full min-w-0 items-center justify-between gap-2 rounded-xl border bg-card pl-3 pr-2.5 pt-3.5 text-left transition-[border-color,box-shadow]",
          active
            ? "border-primary ring-[3px] ring-primary/15"
            : "border-input hover:border-primary/40",
        )}
      >
        <span className="absolute left-3 top-1.5 text-[10.5px] font-medium text-muted-foreground">
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </span>
        {value ? (
          <span
            className={cn(
              "min-w-0 truncate text-[13.5px] font-semibold",
              onClear && "pr-7",
            )}
          >
            {DateUtil.longDate(value, lang).replace(/^.*, /, "")}
          </span>
        ) : (
          <span className="min-w-0 truncate text-[13.5px] text-muted-foreground">
            {placeholder}
          </span>
        )}
        <CalendarDays
          className={cn(
            "-mt-3.5 size-4 shrink-0",
            active ? "text-primary" : "text-muted-foreground",
          )}
        />
      </button>
      {onClear && value && (
        <button
          type="button"
          onClick={onClear}
          aria-label={clearLabel}
          className="absolute right-8 top-1/2 mt-1.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
