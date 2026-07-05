import { EnergyLevel, TimeBudgetMinutes, WeatherCondition } from '../types';

export type Domain = 'attivita' | 'cibo' | 'acquisto' | 'risposta';

export interface ParsedText {
  domain: Domain;
  energy: EnergyLevel | null;
  timeBudgetMinutes: TimeBudgetMinutes | null;
  forcedWeather: WeatherCondition | null;
  wantsIndoor: boolean | null;
  wantsSocial: boolean | null;
}

const TIME_BUCKETS: { max: number; value: TimeBudgetMinutes }[] = [
  { max: 20, value: 15 },
  { max: 45, value: 30 },
  { max: 90, value: 60 },
  { max: 180, value: 120 },
  { max: Infinity, value: 240 },
];

function bucketMinutes(rawMinutes: number): TimeBudgetMinutes {
  return TIME_BUCKETS.find((bucket) => rawMinutes <= bucket.max)!.value;
}

/**
 * Analisi leggera per keyword del testo libero (italiano), usata dal motore
 * a regole locale (zero setup) per capire dominio, energia, tempo e meteo
 * anche quando l'utente non usa le chip rapide.
 */
export function parseFreeText(text: string): ParsedText {
  const t = text.toLowerCase();

  let domain: Domain = 'attivita';
  if (/\b(mangi|cena|pranz|fame|cucinare|cucino)\w*/.test(t)) domain = 'cibo';
  else if (/\b(compr|acquist|spend)\w*/.test(t)) domain = 'acquisto';
  else if (/\b(rispond|messaggio|email|mail|chiamare|chiamata)\w*/.test(t)) domain = 'risposta';

  let energy: EnergyLevel | null = null;
  if (/\bstanc\w*/.test(t)) energy = 'stanco';
  else if (/\b(caric\w*|energic\w*)/.test(t)) energy = 'energico';
  else if (/\bnormale\b/.test(t)) energy = 'normale';

  let timeBudgetMinutes: TimeBudgetMinutes | null = null;
  const hourMatch = t.match(/(\d+(?:[.,]\d+)?)\s*(?:ore|ora|h)\b/);
  const minMatch = t.match(/(\d+)\s*min/);
  if (hourMatch) {
    const hours = parseFloat(hourMatch[1].replace(',', '.'));
    timeBudgetMinutes = bucketMinutes(hours * 60);
  } else if (minMatch) {
    timeBudgetMinutes = bucketMinutes(parseInt(minMatch[1], 10));
  } else if (/tutta la serata|serata libera/.test(t)) {
    timeBudgetMinutes = 240;
  }

  let forcedWeather: WeatherCondition | null = null;
  if (/piov\w*|pioggia|temporale/.test(t)) forcedWeather = 'pioggia';
  else if (/\bneve\b|nevica/.test(t)) forcedWeather = 'neve';
  else if (/\bsole\b|sereno|bel tempo/.test(t)) forcedWeather = 'sereno';

  let wantsIndoor: boolean | null = null;
  if (/non voglio uscire|resto a casa|rimango a casa/.test(t)) wantsIndoor = true;
  else if (/voglio uscire|uscita|voglio andare fuori/.test(t)) wantsIndoor = false;

  let wantsSocial: boolean | null = null;
  if (/da sol[oa]\b/.test(t)) wantsSocial = false;
  else if (/con (gli )?amici|in compagnia/.test(t)) wantsSocial = true;

  return { domain, energy, timeBudgetMinutes, forcedWeather, wantsIndoor, wantsSocial };
}
