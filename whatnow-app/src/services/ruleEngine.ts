import { ACTIVITY_CATALOG, ActivityTemplate } from '../data/activityCatalog';
import { FOOD_CATALOG, FoodTemplate } from '../data/foodCatalog';
import { DecisionContext, DecisionResult, ENERGY_ORDER, Suggestion } from '../types';
import { Domain, ParsedText } from './textParser';

function isBadOutdoorWeather(condition: DecisionContext['weather']): boolean {
  const c = condition?.condition;
  return c === 'pioggia' || c === 'temporale' || c === 'neve';
}

function scoreActivity(item: ActivityTemplate, ctx: DecisionContext, parsed: ParsedText): number {
  const budget = ctx.timeBudgetMinutes;
  if (budget != null && budget < item.minMinutes) return -Infinity;

  let score = 0;
  if (budget != null) {
    const idealCenter = (item.minMinutes + item.maxMinutes) / 2;
    score -= Math.abs(budget - idealCenter) / 60;
  }

  const userEnergy = ctx.energy ? ENERGY_ORDER[ctx.energy] : 1;
  const itemEnergy = ENERGY_ORDER[item.minEnergy];
  if (userEnergy < itemEnergy) score -= 5;
  else if (userEnergy === itemEnergy) score += 1;

  const badWeather = isBadOutdoorWeather(ctx.weather);
  if (!item.indoor && badWeather) score -= 6;
  if (!item.indoor && ctx.weather?.condition === 'sereno') score += 1;

  if (parsed.wantsIndoor === true && !item.indoor) score -= 4;
  if (parsed.wantsIndoor === false && item.indoor) score -= 1;
  if (parsed.wantsSocial === true && item.category !== 'sociale') score -= 0.5;
  if (parsed.wantsSocial === false && item.category === 'sociale') score -= 3;

  if ((ctx.timeOfDay === 'sera' || ctx.timeOfDay === 'notte') && !item.eveningFriendly) score -= 2;

  score += ctx.habits.categoryScores[item.category] ?? 0;

  return score;
}

function scoreFood(item: FoodTemplate, ctx: DecisionContext): number {
  const budget = ctx.timeBudgetMinutes;
  if (budget != null && budget < item.minMinutes) return -Infinity;

  let score = 0;
  if (budget != null) {
    const idealCenter = (item.minMinutes + item.maxMinutes) / 2;
    score -= Math.abs(budget - idealCenter) / 60;
  }

  const userEnergy = ctx.energy ? ENERGY_ORDER[ctx.energy] : 1;
  const itemEnergy = ENERGY_ORDER[item.minEnergy];
  if (userEnergy < itemEnergy) score -= 5;
  else if (userEnergy === itemEnergy) score += 1;

  const temp = ctx.weather?.temperatureC;
  const cold = (temp != null && temp < 12) || isBadOutdoorWeather(ctx.weather);
  const hot = temp != null && temp > 24;
  if (cold && item.fitsCold) score += 2;
  if (hot && item.fitsHot) score += 2;

  score += ctx.habits.categoryScores.cibo ?? 0;

  return score;
}

function topTwo<T>(items: T[], score: (item: T) => number): [T, T] | null {
  const scored = items.map((item) => ({ item, score: score(item) })).filter((s) => s.score > -Infinity);
  if (scored.length === 0) return null;
  scored.sort((a, b) => b.score - a.score);
  const first = scored[0].item;
  const second = scored.find((s) => s.item !== first)?.item ?? scored[0].item;
  return [first, second];
}

function buildDoNothing(ctx: DecisionContext): Suggestion {
  const parts: string[] = [];
  if (ctx.energy === 'stanco') {
    parts.push('Sei stanco: va benissimo non fare nulla di produttivo adesso.');
  } else {
    parts.push('Va bene anche non fare nulla: non ogni momento libero va riempito per forza.');
  }
  if (isBadOutdoorWeather(ctx.weather)) {
    parts.push('Fuori non è una bella giornata: ottima scusa per restare comodo dove sei.');
  }
  parts.push('Concediti qualche minuto senza obiettivi, senza sensi di colpa.');
  return { kind: 'niente', title: 'Non fare niente', description: parts.join(' ') };
}

function generateActivityDecision(ctx: DecisionContext, parsed: ParsedText): DecisionResult {
  const picked = topTwo(ACTIVITY_CATALOG, (item) => scoreActivity(item, ctx, parsed));
  const [recommendedItem, alternativeItem] = picked ?? [ACTIVITY_CATALOG[0], ACTIVITY_CATALOG[1]];

  return {
    recommended: {
      kind: 'consigliata',
      title: recommendedItem.title,
      description: recommendedItem.description,
      category: recommendedItem.category,
    },
    alternative: {
      kind: 'alternativa',
      title: alternativeItem.title,
      description: alternativeItem.description,
      category: alternativeItem.category,
    },
    doNothing: buildDoNothing(ctx),
    source: 'regole',
    createdAt: Date.now(),
  };
}

function generateFoodDecision(ctx: DecisionContext): DecisionResult {
  const picked = topTwo(FOOD_CATALOG, (item) => scoreFood(item, ctx));
  const [recommendedItem, alternativeItem] = picked ?? [FOOD_CATALOG[0], FOOD_CATALOG[1]];

  return {
    recommended: {
      kind: 'consigliata',
      title: recommendedItem.title,
      description: recommendedItem.description,
      category: 'cibo',
    },
    alternative: {
      kind: 'alternativa',
      title: alternativeItem.title,
      description: alternativeItem.description,
      category: 'cibo',
    },
    doNothing: {
      kind: 'niente',
      title: 'Salta il pasto strutturato',
      description: 'Se non hai davvero fame, va bene anche non mangiare nulla di elaborato ora: uno spuntino quando arriva la fame vera basta e avanza.',
    },
    source: 'regole',
    createdAt: Date.now(),
  };
}

function generateAcquistoDecision(ctx: DecisionContext): DecisionResult {
  const tired = ctx.energy === 'stanco';
  return {
    recommended: {
      kind: 'consigliata',
      title: 'Aspetta 24 ore prima di decidere',
      description: tired
        ? 'Sei stanco: non è il momento migliore per valutare una spesa. Dormici sopra e decidi domani mattina con la testa più lucida.'
        : 'Metti l’oggetto in un carrello o in una lista e ripensaci domani: se lo desideri ancora, probabilmente ne vale la pena.',
    },
    alternative: {
      kind: 'alternativa',
      title: 'Fallo ora, ma solo se è una piccola spesa già valutata',
      description: 'Se ci pensi da tempo, il costo è sostenibile e non è un acquisto d’impulso, puoi anche procedere subito.',
    },
    doNothing: {
      kind: 'niente',
      title: 'Non comprare nulla oggi',
      description: 'Aggiungilo a una lista desideri e rivedila tra una settimana: se sparisce la voglia, hai risparmiato senza sforzo.',
    },
    source: 'regole',
    createdAt: Date.now(),
  };
}

function generateRispostaDecision(ctx: DecisionContext): DecisionResult {
  const tired = ctx.energy === 'stanco';
  const hasTime = (ctx.timeBudgetMinutes ?? 0) >= 15;
  const respondNow = !tired && hasTime;
  return {
    recommended: {
      kind: 'consigliata',
      title: respondNow ? 'Rispondi ora' : 'Rimanda a domani mattina',
      description: respondNow
        ? 'Hai lucidità e tempo: meglio togliertelo dai pensieri ora che rimandarlo.'
        : 'Sei stanco o hai poco tempo: una risposta scritta ora rischia di essere peggiore di una scritta con calma più tardi.',
    },
    alternative: {
      kind: 'alternativa',
      title: 'Manda un messaggio breve per dire che risponderai con calma',
      description: 'Bastano due righe per far sapere che hai visto e che tornerai sull’argomento a mente fresca.',
    },
    doNothing: {
      kind: 'niente',
      title: 'Silenzia la notifica per un’ora',
      description: 'Se non è un’emergenza, puoi anche non rispondere subito: stacca e torna quando ti va.',
    },
    source: 'regole',
    createdAt: Date.now(),
  };
}

export function generateWithRules(ctx: DecisionContext, parsed: ParsedText): DecisionResult {
  const domain: Domain = parsed.domain;
  if (domain === 'cibo') return generateFoodDecision(ctx);
  if (domain === 'acquisto') return generateAcquistoDecision(ctx);
  if (domain === 'risposta') return generateRispostaDecision(ctx);
  return generateActivityDecision(ctx, parsed);
}
