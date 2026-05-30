import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { CalendarCheck } from "lucide-react";
import Calendar from "@/components/Calendar";
import { AppHeader } from "@/components/AppHeader";
import { CourtRulesDialog } from "@/components/CourtRulesDialog";
import { CourtLocationDialog } from "@/components/CourtLocationDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/api";
import type { NewReservation } from "@/types";

interface TimeSlot {
  label: string;
  startHour: number;
  endHour: number;
}

const TIME_SLOTS: TimeSlot[] = [
  { label: "08:00 - 10:00", startHour: 8, endHour: 10 },
  { label: "10:00 - 12:00", startHour: 10, endHour: 12 },
  { label: "12:00 - 14:00", startHour: 12, endHour: 14 },
  { label: "14:00 - 16:00", startHour: 14, endHour: 16 },
  { label: "16:00 - 18:00", startHour: 16, endHour: 18 },
  { label: "18:00 - 20:00", startHour: 18, endHour: 20 },
  { label: "20:00 - 22:00", startHour: 20, endHour: 22 },
];

const TOTAL_STEPS = 2;

const STEP_META = [
  {
    title: "Data ir laikas",
    description: "Pasirinkite laisvą dieną ir laiką.",
  },
  {
    title: "Jūsų kontaktai",
    description: "Į šį el. paštą atsiųsime patvirtinimo nuorodą.",
  },
];

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function App() {
  const [step, setStep] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerSurname, setCustomerSurname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState<Date | null>(null);
  const [slotIndex, setSlotIndex] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Map of "YYYY-MM-DD" → set of booked TIME_SLOTS indices for that day.
  const [bookedByDate, setBookedByDate] = useState<Map<string, Set<number>>>(
    new Map(),
  );

  const loadBookedSlots = useCallback(async (): Promise<void> => {
    try {
      const slots = await api.getBookedSlots();
      const map = new Map<string, Set<number>>();
      for (const s of slots) {
        const key = s.date.slice(0, 10); // ISO datetime → calendar day
        const set = map.get(key) ?? new Set<number>();
        TIME_SLOTS.forEach((slot, i) => {
          if (s.startHour < slot.endHour && s.endHour > slot.startHour) {
            set.add(i);
          }
        });
        map.set(key, set);
      }
      setBookedByDate(map);
    } catch {
      // Non-fatal: if availability can't load, the server still rejects clashes.
    }
  }, []);

  useEffect(() => {
    void loadBookedSlots();
  }, [loadBookedSlots]);

  const isDateFullyBooked = useCallback(
    (d: Date): boolean => {
      const set = bookedByDate.get(formatDate(d));
      return set != null && set.size >= TIME_SLOTS.length;
    },
    [bookedByDate],
  );

  const bookedForSelectedDate = useMemo<Set<number>>(
    () => (date ? (bookedByDate.get(formatDate(date)) ?? new Set()) : new Set()),
    [date, bookedByDate],
  );

  const step1Valid =
    date != null &&
    slotIndex !== "" &&
    !bookedForSelectedDate.has(Number(slotIndex));

  function handleSelectDate(d: Date): void {
    setDate(d);
    // If the previously chosen slot is taken on the new day, clear it.
    const set = bookedByDate.get(formatDate(d));
    if (slotIndex !== "" && set?.has(Number(slotIndex))) {
      setSlotIndex("");
    }
  }

  function resetForm(): void {
    setCustomerName("");
    setCustomerSurname("");
    setEmail("");
    setPhone("");
    setDate(null);
    setSlotIndex("");
    setStep(1);
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setError(null);

    if (!date || slotIndex === "") {
      setError("Pasirinkite datą ir laiką.");
      setStep(1);
      return;
    }
    if (bookedForSelectedDate.has(Number(slotIndex))) {
      setError("Šis laikas jau užimtas. Pasirinkite kitą.");
      setStep(1);
      return;
    }

    const slot = TIME_SLOTS[Number(slotIndex)];
    const payload: NewReservation = {
      customerName,
      customerSurname,
      email,
      phone,
      date: formatDate(date),
      startHour: slot.startHour,
      endHour: slot.endHour,
    };

    setSubmitting(true);
    try {
      await api.createReservation(payload);
      resetForm();
      setSuccess(true);
      await loadBookedSlots(); // reflect the new booking immediately
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nepavyko sukurti rezervacijos.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const percent = Math.round((step / TOTAL_STEPS) * 100);
  const meta = STEP_META[step - 1];

  return (
    <div className="mx-auto max-w-[560px] px-4 py-5">
      <AppHeader />

      <Card className="rounded-2xl border-black/5 py-5 shadow-md">
        <CardContent>
          {success ? (
            <div className="space-y-5 py-4 text-center">
              <Alert variant="success" className="text-left">
                <AlertDescription>
                  Beveik baigta! 🎾 Išsiuntėme patvirtinimo nuorodą į jūsų el.
                  paštą — paspauskite ją, kad rezervacija įsigaliotų.
                </AlertDescription>
              </Alert>
              <Button onClick={() => setSuccess(false)}>Nauja rezervacija</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Progress */}
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  Žingsnis {step} iš {TOTAL_STEPS}
                </span>
                <span className="text-muted-foreground">{percent}% užbaigta</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>

              {/* Step heading */}
              <h2 className="mt-4 text-base font-semibold">{meta.title}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {meta.description}
              </p>

              {error && (
                <Alert variant="destructive" className="mt-3">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Step content */}
              <div className="mt-4 min-h-[300px]">
                {step === 1 ? (
                  <div className="mx-auto flex w-[268px] max-w-full flex-col gap-3">
                    <Calendar
                      selected={date}
                      onSelect={handleSelectDate}
                      isDateUnavailable={isDateFullyBooked}
                    />
                    <div className="grid gap-2">
                      <Label htmlFor="time">Laikas</Label>
                      <Select
                        value={slotIndex}
                        onValueChange={setSlotIndex}
                        disabled={!date}
                      >
                        <SelectTrigger id="time">
                          <SelectValue
                            placeholder={
                              date
                                ? "Pasirinkite laiką"
                                : "Pirma pasirinkite datą"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_SLOTS.map((slot, i) => {
                            const taken = bookedForSelectedDate.has(i);
                            return (
                              <SelectItem
                                key={slot.label}
                                value={String(i)}
                                disabled={taken}
                              >
                                {slot.label}
                                {taken ? " — užimta" : ""}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Vardas</Label>
                      <Input
                        id="name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="surname">Pavardė</Label>
                      <Input
                        id="surname"
                        value={customerSurname}
                        onChange={(e) => setCustomerSurname(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">El. paštas</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Telefonas</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                    <div className="sm:col-span-2 rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                      Rezervacija: <strong>{date && formatDate(date)}</strong>
                      {slotIndex !== "" &&
                        `, ${TIME_SLOTS[Number(slotIndex)].label}`}
                    </div>
                    <p className="sm:col-span-2 text-xs text-muted-foreground">
                      Su tuo pačiu el. paštu galima rezervuoti iki 2 kartų per
                      savaitę ir 1 kartą per dieną.
                    </p>
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="mt-5 flex items-center justify-between border-t pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  disabled={step === 1}
                >
                  Atgal
                </Button>

                {step < TOTAL_STEPS ? (
                  <Button
                    type="button"
                    onClick={() => setStep((s) => s + 1)}
                    disabled={!step1Valid}
                  >
                    Tęsti
                  </Button>
                ) : (
                  <Button type="submit" disabled={submitting}>
                    <CalendarCheck />
                    {submitting ? "Rezervuojama…" : "Rezervuoti"}
                  </Button>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="mt-3 text-center text-sm text-muted-foreground">
        <p>Jūsų duomenis saugome atsakingai.</p>
        <p className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <CourtRulesDialog />
          <span aria-hidden="true">·</span>
          <CourtLocationDialog />
          <span aria-hidden="true">·</span>
          <a
            href="https://vilkaviskis.lt/privatumo-politika-ir-slapuku-naudojimo-taisykles/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Privatumo politika
          </a>
        </p>
      </div>
    </div>
  );
}
