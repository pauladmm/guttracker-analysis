// Edge Function: extract-ingredients
//
// Recibe la ruta de una foto de comida en el bucket privado `meal-photos`,
// la envía a Claude (visión) y devuelve la lista de ingredientes detectados.
//
// La API key de Anthropic vive aquí como secreto del servidor — NUNCA en el
// frontend. El usuario se autentica con su JWT de Supabase; se verifica que la
// foto pertenece a su carpeta antes de procesarla.
//
// Desliegue:
//   supabase functions deploy extract-ingredients
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

import Anthropic from 'npm:@anthropic-ai/sdk@^0.40'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const MODEL = 'claude-sonnet-4-6' // visión, según el briefing del proyecto
const BUCKET = 'meal-photos'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

// Esquema de salida estructurada: una lista de strings.
const INGREDIENTS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    ingredients: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['ingredients'],
}

const EXTRACTION_PROMPT = `Eres un asistente que analiza una foto para un diario de síntomas digestivos.
La foto puede ser: la etiqueta de un producto, un plato de comida, o un ticket de restaurante.

Extrae la lista de INGREDIENTES alimentarios que puedas identificar. Reglas:
- Devuelve ingredientes individuales y concretos (no frases ni el nombre del plato entero).
- Normaliza los nombres en español, en minúscula y singular cuando aplique (p. ej. "tomate", "harina de trigo", "leche").
- Incluye aditivos y E-números si aparecen en la etiqueta (p. ej. "e621", "glutamato monosódico").
- No inventes ingredientes que no se vean o no se deduzcan razonablemente.
- Si no puedes identificar ninguno, devuelve una lista vacía.`

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405)

  try {
    const { path } = await req.json()
    if (!path || typeof path !== 'string') {
      return json({ error: 'Falta la ruta de la foto (path).' }, 400)
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_API_KEY) {
      return json({ error: 'ANTHROPIC_API_KEY no configurada en el servidor.' }, 500)
    }

    // 1. Verifica la sesión del usuario a partir de su JWT.
    const authHeader = req.headers.get('Authorization') ?? ''
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser()
    if (userError || !user) return json({ error: 'No autenticado.' }, 401)

    // 2. Comprueba que la foto está en la carpeta del propio usuario.
    if (path.split('/')[0] !== user.id) {
      return json({ error: 'No tienes acceso a esa foto.' }, 403)
    }

    // 3. Genera una URL firmada temporal para que Claude pueda leer la imagen.
    const admin = createClient(SUPABASE_URL, SERVICE_KEY)
    const { data: signed, error: signError } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(path, 300)
    if (signError || !signed) {
      return json({ error: 'No se pudo acceder a la foto.' }, 500)
    }

    // 4. Llama a Claude con visión + salida estructurada.
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })
    const message = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: signed.signedUrl } },
            { type: 'text', text: EXTRACTION_PROMPT },
          ],
        },
      ],
      output_config: { format: { type: 'json_schema', schema: INGREDIENTS_SCHEMA } },
    })

    const textBlock = message.content.find((b: { type: string }) => b.type === 'text')
    const parsed = JSON.parse((textBlock as { text: string })?.text ?? '{"ingredients":[]}')
    const ingredients: string[] = Array.isArray(parsed.ingredients)
      ? parsed.ingredients.filter((s: unknown) => typeof s === 'string' && s.trim())
      : []

    return json({ ingredients })
  } catch (err) {
    console.error('extract-ingredients error:', err)
    return json({ error: 'Error procesando la foto.' }, 500)
  }
})
