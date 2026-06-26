// Reconocimiento de flyers de partido con IA (OpenAI visión).
// Recibe una imagen (data URL base64) y extrae rival, local/visitante, fecha,
// lugar y horarios por categoría. Corre server-side (la API key NO llega al browser).
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const MODEL = 'gpt-5.4-mini'

const SYSTEM = `Sos un asistente que lee flyers de partidos de fútbol infantil/juvenil de clubes argentinos y extrae datos estructurados.
El club propio es "Banfield" (Filial Banfield Ramos Mejía). El RIVAL es el otro equipo del flyer.
Devolvé EXCLUSIVAMENTE un objeto JSON válido (sin texto extra, sin markdown) con esta forma:
{
  "rival": string,                       // nombre del equipo rival (no Banfield)
  "is_home": true | false | null,        // true si Banfield juega de local; false visitante; null si no se puede inferir
  "home_away_reason": string,            // breve justificación de is_home
  "date_text": string,                   // fecha tal como figura (ej "Domingo 28/6")
  "date_iso": string | null,             // fecha en formato YYYY-MM-DD si se puede inferir (asumí el año en curso si falta), si no null
  "venue": string | null,                // dirección/lugar del partido si figura
  "entry_value": number | null,          // valor de entrada en pesos si figura
  "categories": [ { "label": string, "time": string } ]  // una por categoría; label = año/categoría (ej "2010"); time = "HH:MM" 24hs
}
Reglas: normalizá horarios a "HH:MM" 24hs (ej "8:20hs" -> "08:20"). Si una dirección sugiere que no es la sede de Banfield (Ramos Mejía/La Brea), is_home suele ser false. Ante la duda, is_home=null.`

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ ok: false, error: 'Falta OPENAI_API_KEY en el servidor.' }, { status: 500 })

  let imageDataUrl: string | undefined
  try {
    const body = await req.json()
    imageDataUrl = body?.imageDataUrl
  } catch {
    return NextResponse.json({ ok: false, error: 'Body inválido.' }, { status: 400 })
  }
  if (!imageDataUrl || !/^data:image\//.test(imageDataUrl)) {
    return NextResponse.json({ ok: false, error: 'Falta la imagen (data URL).' }, { status: 400 })
  }

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Extraé los datos de este flyer de partido en el JSON pedido.' },
              { type: 'image_url', image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    })
    const j = await r.json()
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: j?.error?.message ?? 'Error de OpenAI' }, { status: 502 })
    }
    const raw = j?.choices?.[0]?.message?.content ?? ''
    const cleaned = String(raw).replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
    let data: any
    try {
      data = JSON.parse(cleaned)
    } catch {
      const m = cleaned.match(/\{[\s\S]*\}/)
      if (!m) return NextResponse.json({ ok: false, error: 'La IA no devolvió JSON legible.', raw: cleaned.slice(0, 500) }, { status: 502 })
      data = JSON.parse(m[0])
    }
    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Error inesperado' }, { status: 500 })
  }
}
