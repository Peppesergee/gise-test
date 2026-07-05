import { DecisionContext, DecisionResult, Suggestion } from '../types';
import { Domain } from './textParser';

function parseAIResponse(data: unknown): DecisionResult | null {
  try {
    const toSuggestion = (kind: Suggestion['kind'], raw: unknown): Suggestion | null => {
      if (!raw || typeof raw !== 'object') return null;
      const { title, description } = raw as { title?: unknown; description?: unknown };
      if (typeof title !== 'string' || typeof description !== 'string') return null;
      return { kind, title, description };
    };

    const parsed = data as { recommended?: unknown; alternative?: unknown; doNothing?: unknown };
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
 * L'app non parla mai direttamente con un provider AI: chiama il backend
 * "whatnow-worker" (Cloudflare Worker), che tiene qualunque credenziale
 * lato server e usa un modello open source (Cloudflare Workers AI), non
 * legato a un account Anthropic/Claude. Se l'endpoint non è configurato,
 * l'app funziona comunque con il motore a regole locale.
 */
export async function generateWithAI(ctx: DecisionContext, domain: Domain): Promise<DecisionResult | null> {
  const apiUrl = process.env.EXPO_PUBLIC_WHATNOW_API_URL;
  if (!apiUrl) return null;

  const categoryEntries = Object.entries(ctx.habits.categoryScores).filter(([, score]) => score !== 0);
  const likedCategories = categoryEntries.filter(([, s]) => (s as number) > 0).map(([c]) => c);
  const dislikedCategories = categoryEntries.filter(([, s]) => (s as number) < 0).map(([c]) => c);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        freeText: ctx.freeText,
        domain,
        energy: ctx.energy,
        timeBudgetMinutes: ctx.timeBudgetMinutes,
        timeOfDay: ctx.timeOfDay,
        weather: ctx.weather
          ? {
              condition: ctx.weather.condition,
              temperatureC: ctx.weather.temperatureC,
              locationLabel: ctx.weather.locationLabel,
            }
          : null,
        likedCategories,
        dislikedCategories,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return parseAIResponse(data);
  } catch {
    return null;
  }
}
