export interface Env {
  AI: Ai;
}

interface SuggestionPayload {
  title: string;
  description: string;
}

interface DecisionPayload {
  recommended: SuggestionPayload;
  alternative: SuggestionPayload;
  doNothing: SuggestionPayload;
}

interface RequestBody {
  freeText: string;
  domain: 'attivita' | 'cibo' | 'acquisto' | 'risposta';
  energy: 'stanco' | 'normale' | 'energico' | null;
  timeBudgetMinutes: number | null;
  timeOfDay: 'mattina' | 'pomeriggio' | 'sera' | 'notte';
  weather: { condition: string; temperatureC: number | null; locationLabel: string | null } | null;
  likedCategories: string[];
  dislikedCategories: string[];
}

const MODEL = '@cf/meta/llama-3.1-8b-instruct';

const SYSTEM_PROMPT = `Sei "WhatNow?", un assistente che aiuta le persone a superare la fatica decisionale
su micro-decisioni quotidiane (cosa fare, cosa mangiare, se rispondere ora, se comprare qualcosa).
Ricevi il contesto della persona (testo libero, energia, tempo disponibile, meteo, abitudini) e devi
rispondere SOLO con un oggetto JSON valido, senza testo prima o dopo, con questa forma esatta:
{
  "recommended": { "title": string, "description": string },
  "alternative": { "title": string, "description": string },
  "doNothing": { "title": string, "description": string }
}
Regole di stile: italiano, tono caldo e diretto, massimo due frasi brevi per "description",
titoli concreti e specifici (non generici tipo "fai qualcosa di rilassante"). "doNothing" deve
proporre di non fare nulla di impegnativo, in modo che la persona si senta autorizzata a farlo,
non colpevolizzata. Tieni conto del meteo e dell'energia dichiarata: non proporre attività
all'aperto se piove o nevica, non proporre attività faticose se la persona è stanca.`;

function buildPrompt(body: RequestBody): string {
  const lines: string[] = [];
  lines.push(`Messaggio della persona: "${body.freeText}"`);
  lines.push(`Tipo di decisione stimato: ${body.domain}`);
  lines.push(`Energia dichiarata: ${body.energy ?? 'non specificata'}`);
  lines.push(`Tempo disponibile (minuti): ${body.timeBudgetMinutes ?? 'non specificato'}`);
  lines.push(`Momento della giornata: ${body.timeOfDay}`);

  if (body.weather) {
    lines.push(
      `Meteo attuale: ${body.weather.condition}${
        body.weather.temperatureC != null ? `, ${body.weather.temperatureC}°C` : ''
      }${body.weather.locationLabel ? `, zona: ${body.weather.locationLabel}` : ''}`
    );
  } else {
    lines.push('Meteo attuale: non disponibile');
  }

  if (body.likedCategories.length) {
    lines.push(`In passato ha apprezzato attività di tipo: ${body.likedCategories.join(', ')}`);
  }
  if (body.dislikedCategories.length) {
    lines.push(`In passato ha scartato spesso attività di tipo: ${body.dislikedCategories.join(', ')}`);
  }

  return lines.join('\n');
}

function parseModelOutput(text: string): DecisionPayload | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);

    const toSuggestion = (raw: unknown): SuggestionPayload | null => {
      if (!raw || typeof raw !== 'object') return null;
      const { title, description } = raw as { title?: unknown; description?: unknown };
      if (typeof title !== 'string' || typeof description !== 'string') return null;
      return { title, description };
    };

    const recommended = toSuggestion(parsed.recommended);
    const alternative = toSuggestion(parsed.alternative);
    const doNothing = toSuggestion(parsed.doNothing);
    if (!recommended || !alternative || !doNothing) return null;

    return { recommended, alternative, doNothing };
  } catch {
    return null;
  }
}

function isValidBody(body: unknown): body is RequestBody {
  if (!body || typeof body !== 'object') return false;
  const b = body as Record<string, unknown>;
  return typeof b.freeText === 'string' && typeof b.domain === 'string' && typeof b.timeOfDay === 'string';
}

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...corsHeaders() },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }
    if (request.method !== 'POST') {
      return json({ error: 'method_not_allowed' }, 405);
    }

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return json({ error: 'invalid_json' }, 400);
    }

    if (!isValidBody(rawBody)) {
      return json({ error: 'invalid_body' }, 400);
    }

    // Limita la lunghezza del testo libero per contenere costo/tempo di inferenza e abusi banali.
    if (rawBody.freeText.length > 500) {
      return json({ error: 'free_text_too_long' }, 400);
    }

    try {
      const result = await env.AI.run(MODEL, {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: buildPrompt(rawBody) },
        ],
        max_tokens: 600,
      });

      const text = typeof result === 'object' && result !== null && 'response' in result ? String((result as { response: unknown }).response) : '';

      const parsed = parseModelOutput(text);
      if (!parsed) return json({ error: 'unparseable_response' }, 502);

      return json(parsed);
    } catch {
      return json({ error: 'ai_error' }, 502);
    }
  },
};
