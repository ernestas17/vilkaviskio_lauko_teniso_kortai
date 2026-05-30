import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CourtRulesDialog() {
  return (
    <Dialog>
      <DialogTrigger className="cursor-pointer font-medium text-primary underline-offset-4 hover:underline">
        Bendros lauko teniso kortų taisyklės
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bendros lauko teniso kortų taisyklės</DialogTitle>
          <DialogDescription>
            Prašome susipažinti su naudojimosi taisyklėmis.
          </DialogDescription>
        </DialogHeader>

        <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-foreground">
          <li>
            Naudotis aikštele gali visi norintys iš anksto užsiregistravę
            internetu ir gavę patvirtinimo žinutę (
            <a
              href="https://vilkaviskiolaukotenisokortai.lt/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-4 hover:underline"
            >
              vilkaviskiolaukotenisokortai.lt
            </a>
            ).
          </li>
          <li>Teniso kortą galima rezervuoti einamojo mėnesio dienomis.</li>
          <li>
            Tas pats asmuo teniso kortą gali rezervuoti ne daugiau kaip 2 kartus
            per savaitę ir ne ilgiau kaip 2 valandoms tą pačią dieną. Pažeidus
            šią taisyklę, rezervacijos bus automatiškai atšaukiamos.
          </li>
          <li>Teniso korte galima žaisti nuo 08:00 val. iki 22:00 val.</li>
          <li>
            Žaidėjai gali naudotis aikštele tik jiems rezervuotu laiku. Atvykus
            prie teniso kortų be išankstinės rezervacijos ir pastebėjus, kad
            kortai yra laisvi, būtina rezervuoti laiką internetinėje rezervacijos
            sistemoje (jei laikas dar neužimtas), kad kiti asmenys matytų, jog
            aikštelė yra rezervuota.
          </li>
          <li>
            Būtina atšaukti rezervaciją bent 1 val. prieš žaidimo pradžią, jeigu
            planuojate neatvykti. Jei nespėjate atšaukti rezervacijos bent 1 val.
            iki žaidimo pradžios, prašome ją atšaukti kuo greičiau, kad jūsų
            rezervuotu laiku galėtų pasinaudoti kiti asmenys. Neatšaukus
            rezervacijos, gali būti apribota galimybė rezervuoti ir žaisti teniso
            kortuose.
          </li>
          <li>
            Rezervaciją galite atšaukti parašę el. laišką adresu{" "}
            <a
              href="mailto:renata.nausediene@vilkaviskis.lt"
              className="text-primary underline-offset-4 hover:underline"
            >
              renata.nausediene@vilkaviskis.lt
            </a>
            , nurodydami rezervacijos dieną, laiką ir el. pašto adresą, kuriuo
            buvo atlikta rezervacija.
          </li>
          <li>
            Iki treniruotės pabaigos likus 5 min privalote baigti žaidimą ir
            palikti tvarkingą aikštelę.
          </li>
        </ol>
      </DialogContent>
    </Dialog>
  );
}
