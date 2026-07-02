import { Platform } from 'react-native';
import { DecisionContext, DecisionResult, Suggestion } from '../types';
import { Domain } from './textParser';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-5';

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

function buildPrompt(ctx: DecisionContext, domain: Domain): string {
  const lines: string[] = [];
  lines.push(`Messaggio della persona: "${ctx.freeText}"`);
  lines.push(`Tipo di decisione stimato: ${domain}`);
  lines.push(`Energia dichiarata: ${ctx.energy ?? 'non specificata'}`);
  lines.push(`Tempo disponibile (minuti): ${ctx.timeBudgetMinutes ?? 'non specificato'}`);
  lines.push(`Momento della giornata: ${ctx.timeOfDay}`);
  if (ctx.weather) {
    lines.push(
      `Meteo attuale: ${ctx.weather.condition}${
        ctx.weather.temperatureC != null ? `, ${ctx.weather.temperatureC}°C` : ''
      }${ctx.weather.locationLabel ? `, zona: ${ctx.weather.locationLabel}` : ''}`
    );
  } else {
    lines.push('Meteo attuale: non disponibile');
  }

  const categoryEntries = Object.entries(ctx.habits.categoryScores).filter(([, score]) => score !== 0);
  if (categoryEntries.length > 0) {
    const liked = categoryEntries.filter(([, s]) => (s as number) > 0).map(([c]) => c);
    const disliked = categoryEntries.filter(([, s]) => (s as number) < 0).map(([c]) => c);
    if (liked.length) lines.push(`In passato ha apprezzato attività di tipo: ${liked.join(', ')}`);
    if (disliked.length) lines.push(`In passato ha scartato spesso attività di tipo: ${disliked.join(', ')}`);
  }

  return lines.join('\n');
}

function parseAIResponse(text: string): DecisionResult | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);

    const toSuggestion = (kind: Suggestion['kind'], raw: unknown): Suggestion | null => {
      if (!raw || typeof raw !== 'object') return null;
      const { title, description } = raw as { title?: unknown; description?: unknown };
      if (typeof title !== 'string' || typeof description !== 'string') return null;
      return { kind, title, description };
    };

    const recommended = toSuggestion('consigliata', parsed.recommended);
    const alternative = toSuggestion('alternativa', parsed.alternative);
    const doNothing = toSuggestion('niente', parsed.doNothing);
    if (!recommended || !alternative || !doNothing) return null;

    return { recommended, alternative, doNothing, source: 'ai', createdAt: Date.now() };
  } catch {
    return null;
  }
}

/**
 * Chiamata diretta a Claude dal client, con la chiave letta da
 * EXPO_PUBLIC_ANTHROPIC_API_KEY. Va bene per un prototipo locale come
 * questo; in produzione la chiave andrebbe instradata tramite un backend
 * che non la esponga mai al dispositivo dell'utente.
 */
export async function generateWithAI(ctx: DecisionContext, domain: Domain): Promise<DecisionResult | null> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const model = process.env.EXPO_PUBLIC_ANTHROPIC_MODEL || DEFAULT_MODEL;

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        // Richiesto solo per chiamate effettuate direttamente dal browser (Platform web).
        ...(Platform.OS === 'web' ? { 'anthropic-dangerous-direct-browser-access': 'true' } : {}),
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: buildPrompt(ctx, domain) }],
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    const text = data?.content?.find((block: { type: string }) => block.type === 'text')?.text ?? '';
    return parseAIResponse(text);
  } catch {
    return null;
  }
}
