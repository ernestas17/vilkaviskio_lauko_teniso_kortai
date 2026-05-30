import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const MONTHS = [
  "Sausis",
  "Vasaris",
  "Kovas",
  "Balandis",
  "Gegužė",
  "Birželis",
  "Liepa",
  "Rugpjūtis",
  "Rugsėjis",
  "Spalis",
  "Lapkritis",
  "Gruodis",
];

// Monday-first weekday labels, matching the Lithuanian calendar.
const WEEKDAYS = ["PR", "AN", "TR", "KE", "PE", "ŠE", "SE"];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface CalendarProps {
  selected: Date | null;
  onSelect: (date: Date) => void;
  // Returns true for days that are fully booked and must not be selectable.
  isDateUnavailable?: (date: Date) => boolean;
  // When true, every day is selectable (no past/current-month restrictions).
  // Used by the admin date filter.
  allowAnyDate?: boolean;
  // When true, only the current month's days are selectable. Set false to allow
  // booking in future months.
  restrictToCurrentMonth?: boolean;
}

export default function Calendar({
  selected,
  onSelect,
  isDateUnavailable,
  allowAnyDate = false,
  restrictToCurrentMonth = true,
}: CalendarProps) {
  const today = startOfDay(new Date());
  const [view, setView] = useState(() => {
    const base = selected ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const year = view.getFullYear();
  const month = view.getMonth();

  // JS getDay(): 0=Sun..6=Sat — shift so Monday is the first column.
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  function changeMonth(delta: number): void {
    setView(new Date(year, month + delta, 1));
  }

  // Reservations are only allowed in the current calendar month. Other months
  // can be browsed, but none of their days are selectable.
  const inCurrentMonth =
    year === today.getFullYear() && month === today.getMonth();

  return (
    <div className="w-[268px] max-w-full rounded-2xl border bg-card p-2.5 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <strong className="text-sm font-semibold">
          {MONTHS[month]} {year}
        </strong>
        <div className="flex gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => changeMonth(-1)}
            aria-label="Ankstesnis mėnuo"
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => changeMonth(1)}
            aria-label="Kitas mėnuo"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="py-1 text-center text-xs font-semibold text-muted-foreground"
          >
            {w}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;
          const isPast = date < today;
          const isBooked =
            !allowAnyDate && !isPast && (isDateUnavailable?.(date) ?? false);
          const monthBlocked = restrictToCurrentMonth && !inCurrentMonth;
          const muted = !allowAnyDate && (isPast || monthBlocked);
          const disabled = muted || isBooked;
          const isToday = isSameDay(date, today);
          const isSelected = selected != null && isSameDay(date, selected);
          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(date)}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-lg text-sm transition-colors",
                !disabled && !isSelected && "hover:bg-accent",
                muted && "text-muted-foreground/40",
                isBooked && "bg-red-50 text-red-600 line-through",
                isToday && !isSelected && "bg-primary/10 font-medium text-primary",
                isSelected && "bg-primary font-medium text-primary-foreground shadow-sm",
              )}
            >
              {date.getDate()}
              {isToday && (
                <span
                  className={cn(
                    "absolute top-1.5 size-1 rounded-full",
                    isSelected ? "bg-primary-foreground" : "bg-primary",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
