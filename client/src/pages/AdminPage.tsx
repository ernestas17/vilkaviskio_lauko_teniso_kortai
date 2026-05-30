import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Pencil, Search, Trash2, X } from "lucide-react";

import { adminApi, HttpError } from "@/api";
import type { AdminReservation } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AdminReservationDialog } from "@/components/AdminReservationDialog";
import Calendar from "@/components/Calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const pad = (h: number): string => `${String(h).padStart(2, "0")}:00`;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("lt-LT", { timeZone: "UTC" });
}

// Local YYYY-MM-DD key, matching how reservation dates are stored (UTC midnight).
function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const PAGE_SIZE = 10;

function StatusBadge({ r }: { r: AdminReservation }) {
  const { label, cls } = r.cancelled
    ? { label: "Atšaukta", cls: "bg-red-100 text-red-700" }
    : r.confirmed
      ? { label: "Patvirtinta", cls: "bg-green-100 text-green-700" }
      : { label: "Laukiama", cls: "bg-amber-100 text-amber-700" };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminReservation | null>(null);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reservations.filter((r) => {
      if (filterDate && r.date.slice(0, 10) !== dateKey(filterDate)) return false;
      if (q) {
        const haystack =
          `${r.customerName} ${r.customerSurname} ${r.email} ${r.phone}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [reservations, filterDate, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Jump back to page 1 whenever the filters change.
  useEffect(() => {
    setPage(1);
  }, [search, filterDate]);

  // Keep the current page within range (e.g. after deleting the last row).
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const load = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      const data = await adminApi.list();
      setReservations(data);
    } catch (err) {
      if (err instanceof HttpError && err.status === 401) {
        navigate("/admin/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Nepavyko įkelti.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  function openEdit(r: AdminReservation): void {
    setEditing(r);
    setDialogOpen(true);
  }

  async function handleDelete(r: AdminReservation): Promise<void> {
    if (!confirm(`Ištrinti ${r.customerName} ${r.customerSurname} rezervaciją?`)) {
      return;
    }
    try {
      await adminApi.remove(r.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepavyko ištrinti.");
    }
  }

  async function handleLogout(): Promise<void> {
    await adminApi.logout().catch(() => {});
    navigate("/admin/login");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Vilkaviškio lauko teniso kortų rezervacijų administravimas
          </h1>
          <p className="text-sm text-muted-foreground">
            Peržiūrėkite, redaguokite ir trinkite rezervacijas.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleLogout}>
            Atsijungti
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ieškoti: klientas, el. paštas, telefonas"
            className="pl-8"
          />
        </div>
        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <CalendarDays />
              {filterDate
                ? filterDate.toLocaleDateString("lt-LT")
                : "Filtruoti pagal datą"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <Calendar
              selected={filterDate}
              onSelect={(d) => {
                setFilterDate(d);
                setFilterOpen(false);
              }}
              allowAnyDate
            />
          </PopoverContent>
        </Popover>
        {filterDate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterDate(null)}
          >
            <X />
            Išvalyti
          </Button>
        )}
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "rezervacija" : "rezervacijos"}
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50 text-left text-muted-foreground">
              <th className="px-3 py-2 font-medium">Data</th>
              <th className="px-3 py-2 font-medium">Laikas</th>
              <th className="px-3 py-2 font-medium">Klientas</th>
              <th className="px-3 py-2 font-medium">El. paštas</th>
              <th className="px-3 py-2 font-medium">Telefonas</th>
              <th className="px-3 py-2 font-medium">Būsena</th>
              <th className="px-3 py-2 text-right font-medium">Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  Kraunama…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  {filterDate || search.trim()
                    ? "Pagal filtrus rezervacijų nerasta."
                    : "Rezervacijų nėra."}
                </td>
              </tr>
            ) : (
              paged.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-3 py-2 whitespace-nowrap">{formatDate(r.date)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {pad(r.startHour)}–{pad(r.endHour)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.customerName} {r.customerSurname}
                  </td>
                  <td className="px-3 py-2">{r.email}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{r.phone}</td>
                  <td className="px-3 py-2">
                    <StatusBadge r={r} />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEdit(r)}
                        aria-label="Redaguoti"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(r)}
                        aria-label="Ištrinti"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Puslapis {page} iš {totalPages}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Ankstesnis
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Kitas
            </Button>
          </div>
        </div>
      )}

      <AdminReservationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        reservation={editing}
        onSaved={() => {
          setDialogOpen(false);
          void load();
        }}
      />
    </div>
  );
}
