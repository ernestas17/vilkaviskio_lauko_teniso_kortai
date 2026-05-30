import logoUrl from "@/assets/images/Vilkaviškio_rajono_savivaldybė.svg";

export function AppHeader() {
  return (
    <header className="relative mb-4 overflow-hidden rounded-2xl bg-linear-to-br from-[#0a66c2] via-[#0054a4] to-[#063d76] px-6 py-4 text-center shadow-lg ring-1 ring-black/5">
      {/* subtle decorative glow */}
      <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 size-48 rounded-full bg-white/5 blur-2xl" />

      <div className="relative flex flex-col items-center gap-2">
        <img
          src={logoUrl}
          alt="Vilkaviškio rajono savivaldybė"
          className="h-[50px] w-auto drop-shadow-sm"
        />
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white">
            🎾 Vilkaviškio lauko teniso kortai
          </h1>
          <p className="mt-0.5 text-sm text-white/75">
            Rezervuokite kortą Vilkaviškyje greitai ir patogiai.
          </p>
        </div>
      </div>
    </header>
  );
}
