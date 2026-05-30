import { useEffect, useState, type FormEvent } from "react";

import { adminApi } from "@/api";
import type { AdminReservation } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FormState {
  customerName: string;
  customerSurname: string;
  email: string;
  phone: string;
  date: string;
  startHour: string;
  endHour: string;
  confirmed: boolean;
  cancelled: boolean;
}

const BLANK: FormState = {
  customerName: "",
  customerSurname: "",
  email: "",
  phone: "",
  date: "",
  startHour: "10",
  endHour: "12",
  confirmed: true,
  cancelled: false,
};

function fromReservation(r: AdminReservation): FormState {
  return {
    customerName: r.customerName,
    customerSurname: r.customerSurname,
    email: r.email,
    phone: r.phone,
    date: r.date.slice(0, 10),
    startHour: String(r.startHour),
    endHour: String(r.endHour),
    confirmed: r.confirmed,
    cancelled: r.cancelled,
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: AdminReservation | null;
  onSaved: () => void;
}

export function AdminReservationDialog({
  open,
  onOpenChange,
  reservation,
  onSaved,
}: Props) {
  const editing = reservation != null;
  const [form, setForm] = useState<FormState>(BLANK);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      setForm(reservation ? fromReservation(reservation) : BLANK);
    }
  }, [open, reservation]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]): void {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    if (!reservation) return;
    setError(null);
    setSaving(true);
    try {
      // Only the status flags are editable; all other fields are read-only.
      await adminApi.update(reservation.id, {
        confirmed: form.confirmed,
        cancelled: form.cancelled,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepavyko išsaugoti.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editing ? "Redaguoti rezervaciją" : "Nauja rezervacija"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Reservation details are read-only — only the status below is editable. */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="a-name">Vardas</Label>
              <Input id="a-name" value={form.customerName} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="a-surname">Pavardė</Label>
              <Input id="a-surname" value={form.customerSurname} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="a-email">El. paštas</Label>
              <Input id="a-email" type="email" value={form.email} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="a-phone">Telefonas</Label>
              <Input id="a-phone" value={form.phone} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="a-date">Data</Label>
              <Input id="a-date" type="date" value={form.date} disabled />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="a-start">Nuo (val.)</Label>
                <Input id="a-start" type="number" value={form.startHour} disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="a-end">Iki (val.)</Label>
                <Input id="a-end" type="number" value={form.endHour} disabled />
              </div>
            </div>
          </div>

          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-[#0054a4]"
                checked={form.confirmed}
                onChange={(e) => set("confirmed", e.target.checked)}
              />
              Patvirtinta
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-[#0054a4]"
                checked={form.cancelled}
                onChange={(e) => set("cancelled", e.target.checked)}
              />
              Atšaukta
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Atšaukti
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saugoma…" : "Išsaugoti"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
