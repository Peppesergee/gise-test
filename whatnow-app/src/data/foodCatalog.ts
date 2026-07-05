import { EnergyLevel } from '../types';

export interface FoodTemplate {
  id: string;
  title: string;
  description: string;
  minMinutes: number;
  maxMinutes: number;
  minEnergy: EnergyLevel;
  fitsCold: boolean;
  fitsHot: boolean;
}

export const FOOD_CATALOG: FoodTemplate[] = [
  {
    id: 'frigo-veloce',
    title: 'Un piatto veloce con quello che hai in frigo',
    description: 'Niente spesa, niente pensieri: metti insieme quello che c’è già.',
    minMinutes: 5,
    maxMinutes: 15,
    minEnergy: 'stanco',
    fitsCold: true,
    fitsHot: true,
  },
  {
    id: 'insalatona',
    title: 'Un’insalatona fresca e colorata',
    description: 'Leggera, veloce, perfetta per una giornata calda.',
    minMinutes: 10,
    maxMinutes: 20,
    minEnergy: 'stanco',
    fitsCold: false,
    fitsHot: true,
  },
  {
    id: 'zuppa-calda',
    title: 'Una zuppa o minestra calda',
    description: 'Il comfort food giusto per una giornata fredda o di pioggia.',
    minMinutes: 20,
    maxMinutes: 40,
    minEnergy: 'normale',
    fitsCold: true,
    fitsHot: false,
  },
  {
    id: 'asporto',
    title: 'Ordina da asporto o a domicilio',
    description: 'Zero energie richieste: oggi te lo puoi concedere senza sensi di colpa.',
    minMinutes: 0,
    maxMinutes: 10,
    minEnergy: 'stanco',
    fitsCold: true,
    fitsHot: true,
  },
  {
    id: 'pasta-veloce',
    title: 'Pasta veloce aglio, olio o pomodoro',
    description: 'Il classico che non delude mai, pronto in poco tempo.',
    minMinutes: 15,
    maxMinutes: 25,
    minEnergy: 'normale',
    fitsCold: true,
    fitsHot: false,
  },
  {
    id: 'toast',
    title: 'Un toast o panino fatto bene',
    description: 'Rapido e soddisfacente, con quel che trovi in dispensa.',
    minMinutes: 5,
    maxMinutes: 15,
    minEnergy: 'stanco',
    fitsCold: true,
    fitsHot: true,
  },
  {
    id: 'ricetta-nuova-cibo',
    title: 'Una ricetta nuova da provare con calma',
    description: 'Hai tempo ed energia: oggi è il giorno giusto per sperimentare in cucina.',
    minMinutes: 40,
    maxMinutes: 90,
    minEnergy: 'energico',
    fitsCold: true,
    fitsHot: true,
  },
  {
    id: 'buddha-bowl',
    title: 'Una ciotola con verdure, cereali e proteine',
    description: 'Un pasto completo ed equilibrato, senza troppa fatica.',
    minMinutes: 20,
    maxMinutes: 30,
    minEnergy: 'normale',
    fitsCold: true,
    fitsHot: true,
  },
  {
    id: 'ristorante',
    title: 'Uscire a mangiare fuori',
    description: 'Se hai tempo e voglia, delegare la cena a qualcun altro è una signora idea.',
    minMinutes: 60,
    maxMinutes: 120,
    minEnergy: 'normale',
    fitsCold: true,
    fitsHot: true,
  },
  {
    id: 'spuntino',
    title: 'Uno spuntino leggero',
    description: 'Se la fame è poca e il tempo pure, non serve un pasto completo.',
    minMinutes: 5,
    maxMinutes: 10,
    minEnergy: 'stanco',
    fitsCold: true,
    fitsHot: true,
  },
];
