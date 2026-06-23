"use client";

import * as React from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/context";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Value format:
 *  - withTime (default): "YYYY-MM-DDTHH:mm"  (same as native datetime-local)
 *  - date-only:          "YYYY-MM-DD"        (same as native date input)
 */
interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  withTime?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
}

function parseValue(value: string): Date | null {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  if (!y || !m || !d) return null;
  let h = 0;
  let min = 0;
  if (timePart) {
    const [hh, mm] = timePart.split(":").map(Number);
    h = hh || 0;
    min = mm || 0;
  }
  return new Date(y, m - 1, d, h, min);
}

export function DateTimePicker({
  value,
  onChange,
  withTime = true,
  placeholder,
  className,
  id,
}: DateTimePickerProps) {
  const { dateLocale, t } = useLanguage();
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(() => parseValue(value), [value]);
  const [view, setView] = React.useState<Date>(() => selected ?? new Date());

  // Keep the visible month in sync with the selected value when reopening.
  React.useEffect(() => {
    if (open && selected) setView(selected);
  }, [open, selected]);

  const weekdays = React.useMemo(() => {
    // 2021-08-01 is a Sunday — generate localized short weekday labels.
    return Array.from({ length: 7 }, (_, i) =>
      new Date(2021, 7, 1 + i).toLocaleDateString(dateLocale, {
        weekday: "short",
      })
    );
  }, [dateLocale]);

  const monthLabel = view.toLocaleDateString(dateLocale, {
    month: "long",
    year: "numeric",
  });

  const cells = React.useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const startWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result: (number | null)[] = [];
    for (let i = 0; i < startWeekday; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [view]);

  const commit = (d: Date) => {
    const base = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    onChange(withTime ? `${base}T${pad(d.getHours())}:${pad(d.getMinutes())}` : base);
  };

  const selectDay = (day: number) => {
    const base = selected ?? new Date();
    const d = new Date(
      view.getFullYear(),
      view.getMonth(),
      day,
      withTime ? base.getHours() : 0,
      withTime ? base.getMinutes() : 0
    );
    commit(d);
    if (!withTime) setOpen(false);
  };

  const changeTime = (hour: number, minute: number) => {
    const base = selected ?? new Date();
    commit(
      new Date(base.getFullYear(), base.getMonth(), base.getDate(), hour, minute)
    );
  };

  const setToNow = () => {
    const now = new Date();
    setView(now);
    commit(now);
  };

  const shiftMonth = (delta: number) =>
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));

  const triggerLabel = selected
    ? selected.toLocaleDateString(dateLocale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) + (withTime ? `, ${pad(selected.getHours())}:${pad(selected.getMinutes())}` : "")
    : placeholder ?? "—";

  const isToday = (day: number) => {
    const now = new Date();
    return (
      day === now.getDate() &&
      view.getMonth() === now.getMonth() &&
      view.getFullYear() === now.getFullYear()
    );
  };

  const isSelected = (day: number) =>
    !!selected &&
    day === selected.getDate() &&
    view.getMonth() === selected.getMonth() &&
    view.getFullYear() === selected.getFullYear();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          className={cn(
            "flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-lg border-2 border-foreground bg-background px-3 py-1 text-left text-base shadow-[3px_3px_0_var(--foreground)] transition-all outline-none md:text-sm",
            "focus-visible:shadow-[4px_4px_0_var(--ring)] focus-visible:border-ring",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{triggerLabel}</span>
          <CalendarIcon className="h-4 w-4 shrink-0 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-[calc(100vw-2rem)] p-3" align="start">
        {/* Month navigation */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="flex h-7 w-7 items-center justify-center rounded-md border-2 border-foreground bg-background shadow-[2px_2px_0_var(--foreground)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold capitalize">{monthLabel}</span>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="flex h-7 w-7 items-center justify-center rounded-md border-2 border-foreground bg-background shadow-[2px_2px_0_var(--foreground)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-0.5">
          {weekdays.map((w) => (
            <div
              key={w}
              className="flex h-7 items-center justify-center text-[11px] font-medium uppercase text-muted-foreground"
            >
              {w.slice(0, 2)}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, i) => (
            <div key={i} className="flex items-center justify-center">
              {day === null ? (
                <span className="h-8 w-8" />
              ) : (
                <button
                  type="button"
                  onClick={() => selectDay(day)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors",
                    isSelected(day)
                      ? "bg-primary text-primary-foreground font-bold border-2 border-foreground"
                      : "hover:bg-muted",
                    !isSelected(day) && isToday(day) && "font-bold text-primary ring-1 ring-primary/50"
                  )}
                >
                  {day}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Time selection */}
        {withTime && (
          <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
            <TimeSelect
              value={selected ? selected.getHours() : new Date().getHours()}
              max={23}
              onChange={(h) =>
                changeTime(h, selected ? selected.getMinutes() : new Date().getMinutes())
              }
            />
            <span className="font-bold text-muted-foreground">:</span>
            <TimeSelect
              value={selected ? selected.getMinutes() : new Date().getMinutes()}
              max={59}
              onChange={(m) =>
                changeTime(selected ? selected.getHours() : new Date().getHours(), m)
              }
            />
            <button
              type="button"
              onClick={setToNow}
              className="ml-auto rounded-md border-2 border-foreground bg-background px-2.5 py-1 text-xs font-medium shadow-[2px_2px_0_var(--foreground)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
            >
              {t.common.now}
            </button>
          </div>
        )}

        {!withTime && (
          <div className="mt-3 flex justify-end border-t border-border pt-3">
            <button
              type="button"
              onClick={setToNow}
              className="rounded-md border-2 border-foreground bg-background px-2.5 py-1 text-xs font-medium shadow-[2px_2px_0_var(--foreground)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
            >
              {t.common.today}
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function TimeSelect({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-9 rounded-md border-2 border-foreground bg-background px-2 text-sm font-medium tabular-nums shadow-[2px_2px_0_var(--foreground)] outline-none focus-visible:border-ring"
    >
      {Array.from({ length: max + 1 }, (_, i) => (
        <option key={i} value={i}>
          {pad(i)}
        </option>
      ))}
    </select>
  );
}
