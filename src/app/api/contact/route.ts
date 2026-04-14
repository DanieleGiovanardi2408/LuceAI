import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

function validate(payload: Partial<ContactPayload>): string | null {
  if (!payload.name || payload.name.trim().length < 2) return 'Nome non valido';
  if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return 'Email non valida';
  if (!payload.message || payload.message.trim().length < 10) return 'Messaggio troppo corto';
  return null;
}

export async function POST(req: NextRequest) {
  let body: Partial<ContactPayload>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }

  const validationError = validate(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 422 });
  }

  const { name, email, message } = body as ContactPayload;
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_EMAIL ?? 'info@luceai.it';

  if (apiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: 'Luce AI <noreply@luceai.it>',
          to: [toEmail],
          reply_to: email,
          subject: `[Luce AI] Nuovo messaggio da ${name}`,
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1a1a1a">
              <h2 style="color:#00b8cc">Nuovo messaggio dal sito</h2>
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px 0;color:#666;width:100px"><strong>Nome</strong></td><td style="padding:8px 0">${name}</td></tr>
                <tr><td style="padding:8px 0;color:#666"><strong>Email</strong></td><td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td></tr>
              </table>
              <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
              <p style="white-space:pre-wrap;line-height:1.6">${message}</p>
              <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
              <p style="font-size:12px;color:#999">Inviato dal form contatti di luceai.it</p>
            </div>
          `,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('Resend error:', err);
        return NextResponse.json({ error: "Errore nell'invio email" }, { status: 500 });
      }
    } catch (err) {
      console.error('Fetch error:', err);
      return NextResponse.json({ error: 'Errore di rete' }, { status: 500 });
    }
  } else {
    // No API key configured — log and return success anyway (dev/demo mode)
    console.log('[ContactForm] No RESEND_API_KEY set. Message received:', { name, email, message });
  }

  return NextResponse.json({ success: true });
}
