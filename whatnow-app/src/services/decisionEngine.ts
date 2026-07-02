import { DecisionContext, DecisionResult } from '../types';
import { generateWithAI } from './aiEngine';
import { generateWithRules } from './ruleEngine';
import { parseFreeText } from './textParser';

/**
 * Il testo libero, quando presente, è più specifico delle chip selezionate
 * a mano: se la persona scrive "piove" o "ho 2 ore", quello vince.
 */
function applyParsedOverrides(ctx: DecisionContext, parsed: ReturnType<typeof parseFreeText>): DecisionContext {
  const weather = parsed.forcedWeather
    ? { ...(ctx.weather ?? { temperatureC: null, isDaytime: true, locationLabel: null }), condition: parsed.forcedWeather }
    : ctx.weather;

  return {
    ...ctx,
    energy: parsed.energy ?? ctx.energy,
    timeBudgetMinutes: parsed.timeBudgetMinutes ?? ctx.timeBudgetMinutes,
    weather,
  };
}

export async function generateDecision(context: DecisionContext): Promise<DecisionResult> {
  const parsed = parseFreeText(context.freeText);
  const effectiveContext = applyParsedOverrides(context, parsed);

  const aiResult = await generateWithAI(effectiveContext, parsed.domain).catch(() => null);
  if (aiResult) return aiResult;

  return generateWithRules(effectiveContext, parsed);
}
