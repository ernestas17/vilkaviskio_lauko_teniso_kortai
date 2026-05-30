import nodemailer, { type Transporter } from 'nodemailer';

// Single shared transporter, built from the SMTP_* values in .env.
let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      'Missing SMTP configuration: set SMTP_HOST, SMTP_USER and SMTP_PASS in server/.env',
    );
  }

  const port = Number(SMTP_PORT ?? 587);
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465, // implicit TLS on 465, STARTTLS otherwise
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return transporter;
}

export interface ConfirmationRequest {
  to: string;
  customerName: string;
  customerSurname: string;
  date: Date;
  startHour: number;
  endHour: number;
  confirmUrl: string;
  cancelUrl: string;
}

const hour = (h: number): string => `${String(h).padStart(2, '0')}:00`;

// Sends the "please confirm your reservation" email. The reservation is only
// booked once the recipient clicks the confirmUrl link.
export async function sendConfirmationRequest(
  data: ConfirmationRequest,
): Promise<void> {
  const transporter = getTransporter();
  const from =
    process.env.MAIL_FROM ??
    'Vilkaviškio lauko teniso kortai <no-reply@tenisas.lt>';
  const dateStr = data.date.toLocaleDateString('lt-LT', { timeZone: 'UTC' });
  const time = `${hour(data.startHour)} – ${hour(data.endHour)}`;

  await transporter.sendMail({
    from,
    to: data.to,
    subject: 'Patvirtinkite savo rezervaciją 🎾',
    text: [
      `Sveiki, ${data.customerName} ${data.customerSurname}!`,
      '',
      'Gavome jūsų Vilkaviškio lauko teniso korto rezervacijos užklausą:',
      `  Data: ${dateStr}`,
      `  Laikas: ${time}`,
      '',
      'Kad rezervacija įsigaliotų, patvirtinkite ją:',
      data.confirmUrl,
      '',
      'Rezervaciją bet kada galite atšaukti:',
      data.cancelUrl,
      '',
      'Jei rezervacijos neužsakėte, šį laišką ignoruokite.',
    ].join('\n'),
    html: `
      <div style="font-family: system-ui, sans-serif; color: #1a1a1a;">
        <h2>🎾 Jūsų rezervacija</h2>
        <p>Sveiki, <strong>${data.customerName} ${data.customerSurname}</strong>!</p>
        <p>Gavome jūsų Vilkaviškio lauko teniso korto rezervacijos užklausą:</p>
        <ul>
          <li><strong>Data:</strong> ${dateStr}</li>
          <li><strong>Laikas:</strong> ${time}</li>
        </ul>
        <p>Kad rezervacija įsigaliotų, paspauskite <strong>Patvirtinti</strong>.
           Rezervaciją bet kada galite <strong>atšaukti</strong>.</p>
        <p>
          <a href="${data.confirmUrl}"
             style="display:inline-block;padding:12px 20px;margin:4px 8px 4px 0;background:#6741d9;color:#fff;
                    text-decoration:none;border-radius:8px;font-weight:600;">
            Patvirtinti rezervaciją
          </a>
          <a href="${data.cancelUrl}"
             style="display:inline-block;padding:12px 20px;margin:4px 0;background:#fff;color:#c0392b;
                    border:1px solid #c0392b;text-decoration:none;border-radius:8px;font-weight:600;">
            Atšaukti rezervaciją
          </a>
        </p>
        <p style="color:#666;font-size:0.9em;">
          Jei mygtukai neveikia, nukopijuokite nuorodas į naršyklę:<br />
          Patvirtinti: <a href="${data.confirmUrl}">${data.confirmUrl}</a><br />
          Atšaukti: <a href="${data.cancelUrl}">${data.cancelUrl}</a>
        </p>
        <p style="color:#666;font-size:0.9em;">
          Jei rezervacijos neužsakėte, šį laišką ignoruokite.
        </p>
      </div>
    `,
  });
}

export interface ReservationConfirmed {
  to: string;
  customerName: string;
  customerSurname: string;
  date: Date;
  startHour: number;
  endHour: number;
  cancelUrl: string;
}

// Sent after the customer clicks the confirmation link — the booking is now active.
export async function sendReservationConfirmed(
  data: ReservationConfirmed,
): Promise<void> {
  const transporter = getTransporter();
  const from =
    process.env.MAIL_FROM ??
    'Vilkaviškio lauko teniso kortai <no-reply@tenisas.lt>';
  const dateStr = data.date.toLocaleDateString('lt-LT', { timeZone: 'UTC' });
  const time = `${hour(data.startHour)} – ${hour(data.endHour)}`;

  await transporter.sendMail({
    from,
    to: data.to,
    subject: 'Jūsų rezervacija patvirtinta ✅',
    text: [
      `Sveiki, ${data.customerName} ${data.customerSurname}!`,
      '',
      'Jūsų Vilkaviškio lauko teniso korto rezervacija patvirtinta:',
      `  Data: ${dateStr}`,
      `  Laikas: ${time}`,
      '',
      'Jei planai pasikeitė, rezervaciją bet kada galite atšaukti:',
      data.cancelUrl,
      '',
      'Ačiū, kad rezervavote kortą Vilkaviškyje!',
    ].join('\n'),
    html: `
      <div style="font-family: system-ui, sans-serif; color: #1a1a1a;">
        <h2>✅ Rezervacija patvirtinta</h2>
        <p>Sveiki, <strong>${data.customerName} ${data.customerSurname}</strong>!</p>
        <p>Jūsų Vilkaviškio lauko teniso korto rezervacija patvirtinta:</p>
        <ul>
          <li><strong>Data:</strong> ${dateStr}</li>
          <li><strong>Laikas:</strong> ${time}</li>
        </ul>
        <p>Jei planai pasikeitė, rezervaciją bet kada galite atšaukti:</p>
        <p>
          <a href="${data.cancelUrl}"
             style="display:inline-block;padding:12px 20px;background:#fff;color:#c0392b;
                    border:1px solid #c0392b;text-decoration:none;border-radius:8px;font-weight:600;">
            Atšaukti rezervaciją
          </a>
        </p>
        <p style="color:#666;font-size:0.9em;">
          Arba nukopijuokite nuorodą į naršyklę:<br />
          <a href="${data.cancelUrl}">${data.cancelUrl}</a>
        </p>
        <p>Ačiū, kad rezervavote kortą Vilkaviškyje!</p>
      </div>
    `,
  });
}
