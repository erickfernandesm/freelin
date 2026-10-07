"use client";

import { useMemo, useState } from "react";
import type { AvailabilitySlotInput } from "@/lib/validation";
import { cn } from "@/lib/format";
import { inputClass } from "@/components/ui/field";

const DAYS = [
  { n: 1, label: "Segunda" },
  { n: 2, label: "Terça" },
  { n: 3, label: "Quarta" },
  { n: 4, label: "Quinta" },
  { n: 5, label: "Sexta" },
  { n: 6, label: "Sábado" },
  { n: 0, label: "Domingo" },
];

type Day = { on: boolean; allDay: boolean; start: string; end: string };
function fromSlots(slots: AvailabilitySlotInput[]) {
  const week: Record<number, Day> = {};
  for (const d of DAYS) week[d.n] = { on: false, allDay: false, start: "18:00", end: "02:00" };
  for (const s of slots) {
    if (s.weekday != null && s.kind === "AVAILABLE") {
      week[s.weekday] = {
        on: true,
        allDay: !s.startTime,
        start: s.startTime ?? "08:00",
        end: s.endTime ?? "18:00",
      };
    }
  }
  return { week };
}

/**
 * Agenda semanal do freelancer. Serve para destacar oportunidades compatíveis,
 * nunca para impedir candidatura. Turnos que viram a noite são aceitos (18h às 02h).
 */
export function AvailabilityEditor({ name, initial }: { name: string; initial: AvailabilitySlotInput[] }) {
  const start = useMemo(() => fromSlots(initial), [initial]);
  const [week, setWeek] = useState(start.week);

  const slots: AvailabilitySlotInput[] = [
    ...DAYS.filter((d) => week[d.n].on).map((d) => ({
      kind: "AVAILABLE" as const,
      weekday: d.n,
      date: null,
      startTime: week[d.n].allDay ? null : week[d.n].start,
      endTime: week[d.n].allDay ? null : week[d.n].end,
    })),
  ];

  const set = (n: number, patch: Partial<Day>) => setWeek((w) => ({ ...w, [n]: { ...w[n], ...patch } }));
  const preset = (days: number[], s: string | null, e: string | null) =>
    setWeek((w) => {
      const next = { ...w };
      for (const d of DAYS) next[d.n] = { ...w[d.n], on: days.includes(d.n) };
      for (const d of days) next[d] = { on: true, allDay: s === null, start: s ?? "08:00", end: e ?? "18:00" };
      return next;
    });

  return (
    <div className="space-y-6">
      <input type="hidden" name={name} value={JSON.stringify(slots)} />

      <div className="flex flex-wrap gap-2">
        <span className="py-1.5 text-sm font-medium text-ink-3">Preencher rápido:</span>
        {[
          { label: "Noites de fim de semana", run: () => preset([5, 6], "18:00", "02:00") },
          { label: "Fins de semana, dia todo", run: () => preset([6, 0], null, null) },
          { label: "Qualquer dia e horário", run: () => preset([0, 1, 2, 3, 4, 5, 6], null, null) },
        ].map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={p.run}
            className="rounded-full bg-mist px-3 py-1.5 text-sm font-semibold text-ink-2 ring-1 ring-inset ring-line hover:bg-brand-50 hover:text-brand-700"
          >
            {p.label}
          </button>
        ))}
      </div>

      <ul className="divide-y divide-line overflow-hidden rounded-2xl ring-1 ring-line">
        {DAYS.map((d) => {
          const day = week[d.n];
          return (
            <li key={d.n} className={cn("flex flex-wrap items-center gap-3 px-4 py-3", day.on ? "bg-paper" : "bg-mist/60")}>
              <label className="flex min-w-[8.5rem] cursor-pointer items-center gap-3">
                <span
                  className={cn(
                    "relative h-6 w-10 shrink-0 rounded-full transition-colors",
                    day.on ? "bg-brand" : "bg-ink/15",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={day.on}
                    onChange={(e) => set(d.n, { on: e.target.checked })}
                    className="absolute inset-0 cursor-pointer opacity-0"
                    aria-label={`Disponível ${d.label}`}
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform",
                      day.on ? "translate-x-[18px]" : "translate-x-0.5",
                    )}
                  />
                </span>
                <span className={cn("font-semibold", !day.on && "text-ink-3")}>{d.label}</span>
              </label>
              {day.on && (
                <div className="flex flex-1 flex-wrap items-center gap-2">
                  {!day.allDay && (
                    <>
                      <input
                        type="time"
                        value={day.start}
                        onChange={(e) => set(d.n, { start: e.target.value })}
                        className={cn(inputClass, "w-[8.75rem]! py-2")}
                        aria-label={`${d.label}, início`}
                      />
                      <span className="text-sm text-ink-3">às</span>
                      <input
                        type="time"
                        value={day.end}
                        onChange={(e) => set(d.n, { end: e.target.value })}
                        className={cn(inputClass, "w-[8.75rem]! py-2")}
                        aria-label={`${d.label}, término`}
                      />
                    </>
                  )}
                  <label className="ml-auto inline-flex items-center gap-2 text-sm font-medium text-ink-2">
                    <input
                      type="checkbox"
                      checked={day.allDay}
                      onChange={(e) => set(d.n, { allDay: e.target.checked })}
                      className="size-4 accent-[var(--color-brand)]"
                    />
                    Dia todo
                  </label>
                </div>
              )}
            </li>
          );
        })}
      </ul>

    </div>
  );
}
