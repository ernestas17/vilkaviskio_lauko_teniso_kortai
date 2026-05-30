import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api } from "@/api";
import type { ReservationActionResult } from "@/types";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const pad = (h: number): string => `${String(h).padStart(2, "0")}:00`;

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("lt-LT", { timeZone: "UTC" });
}

interface View {
  variant: "success" | "info" | "destructive";
  title: string;
  body: string;
}

function viewFor(mode: "confirm" | "cancel", r: ReservationActionResult): View {
  const when =
    r.date != null && r.startHour != null && r.endHour != null
      ? `${formatDate(r.date)}, ${pad(r.startHour)} – ${pad(r.endHour)}`
      : "";

  switch (r.status) {
    case "confirmed":
      return {
        variant: "success",
        title: "Rezervacija patvirtinta! 🎾",
        body: `Ačiū, ${r.customerName ?? ""}! Jūsų rezervacija ${when} sėkmingai užsakyta.`,
      };
    case "already":
      return {
        variant: "info",
        title: "Rezervacija jau patvirtinta",
        body: `Jūsų rezervacija ${when} jau buvo patvirtinta anksčiau.`,
      };
    case "cancelled":
      return mode === "cancel"
        ? {
            variant: "success",
            title: "Rezervacija atšaukta",
            body: `Jūsų rezervacija ${when} atšaukta. Laikas vėl laisvas kitiems.`,
          }
        : {
            variant: "destructive",
            title: "Rezervacija atšaukta",
            body: `Ši rezervacija ${when} buvo atšaukta, todėl jos patvirtinti nebegalima.`,
          };
    case "conflict":
      return {
        variant: "destructive",
        title: "Laikas jau užimtas",
        body: `Deja, laikas ${when} jau buvo užimtas. Pabandykite pasirinkti kitą laiką.`,
      };
    case "notfound":
      return {
        variant: "destructive",
        title: "Nuoroda negalioja",
        body: "Tokios rezervacijos nėra arba nuoroda pasenusi.",
      };
    default:
      return {
        variant: "destructive",
        title: "Įvyko klaida",
        body: "Nepavyko įvykdyti veiksmo. Bandykite vėliau.",
      };
  }
}

interface Props {
  mode: "confirm" | "cancel";
}

export default function ReservationActionPage({ mode }: Props) {
  const { token } = useParams<{ token: string }>();
  const [result, setResult] = useState<ReservationActionResult | null>(null);
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current || !token) return;
    requested.current = true; // guard against React StrictMode double-invoke
    const run =
      mode === "confirm" ? api.confirmReservation : api.cancelReservation;
    run(token)
      .then(setResult)
      .catch(() => setResult({ status: "error" }));
  }, [mode, token]);

  const loadingLabel = mode === "confirm" ? "Patvirtinama…" : "Atšaukiama…";

  return (
    <div className="mx-auto max-w-[720px] px-4 py-8">
      <AppHeader />

      <Card className="rounded-2xl border-black/5 shadow-md">
        <CardContent className="py-10 text-center">
          {result == null ? (
            <div className="flex flex-col items-center gap-3">
              <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
              <p className="text-muted-foreground">{loadingLabel}</p>
            </div>
          ) : (
            (() => {
              const v = viewFor(mode, result);
              return (
                <div className="flex flex-col items-center gap-4">
                  <Alert variant={v.variant} className="text-left">
                    <AlertTitle>{v.title}</AlertTitle>
                    <AlertDescription>{v.body}</AlertDescription>
                  </Alert>
                  <Button asChild>
                    <Link to="/">Grįžti į pradžią</Link>
                  </Button>
                </div>
              );
            })()
          )}
        </CardContent>
      </Card>
    </div>
  );
}
