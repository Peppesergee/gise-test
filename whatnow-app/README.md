# WhatNow? 🧠

App per la "decision fatigue" quotidiana: descrivi in una riga come stai e cosa hai a disposizione
("ho 2 ore libere, sono stanco, piove") e l'app ti risponde con:

- ⭐ **1 opzione consigliata**
- 🔁 **1 alternativa**
- 🌿 **1 "non fare niente"** (con permesso esplicito a non fare nulla, senza sensi di colpa)

Oltre al testo libero, riconosce anche altri tipi di micro-decisioni ricorrenti: cosa mangiare,
se rispondere ora o dopo a un messaggio, se comprare qualcosa o aspettare.

## Come tiene conto del contesto

- **Meteo e posizione**: con il permesso di geolocalizzazione, l'app legge il meteo attuale da
  [Open-Meteo](https://open-meteo.com/) (nessuna API key richiesta) ed evita di proporre attività
  all'aperto se piove, nevica o c'è temporale.
- **Tempo disponibile ed energia**: tramite chip rapide oppure scritti nel testo libero
  ("ho 2 ore", "sono stanco").
- **Abitudini**: ogni volta che dai un feedback (✅ Fatto / 👎 Non fa per me) su un suggerimento,
  l'app aggiorna un punteggio locale per categoria di attività, così nel tempo propone sempre
  meno cose che scarti e sempre più cose che segui davvero. Tutto resta sul dispositivo
  (AsyncStorage), nessun account, nessuna sincronizzazione.

## Motore dei suggerimenti

L'app funziona **a zero setup**: senza alcuna configurazione usa un motore a regole locale che
combina meteo, energia, tempo disponibile e abitudini per scegliere tra un catalogo di attività
(o di idee per mangiare) e generare i tre suggerimenti.

Se imposti `EXPO_PUBLIC_ANTHROPIC_API_KEY` (vedi `.env.example`), l'app chiama invece direttamente
l'API di Claude per generare suggerimenti più naturali e su misura, con fallback automatico al
motore a regole in caso di errore o rete assente.

⚠️ **Nota di sicurezza**: in questo prototipo la chiave AI viene usata direttamente dal
client (telefono o browser). È comodo per una demo, ma **non adatto alla produzione**: chiunque
analizzi il traffico o decompili l'app può leggere la chiave. Per un rilascio reale, sposta la
chiamata a Claude dietro un backend/proxy che tenga la chiave lato server.

## Sviluppo

```bash
npm install
npm run start   # oppure npm run ios / npm run android / npm run web
npm run typecheck
```

Copia `.env.example` in `.env` solo se vuoi abilitare l'AI; altrimenti l'app funziona subito
così com'è.

## Struttura

- `src/services/decisionEngine.ts` — orchestratore: analizza il testo libero, prova l'AI (se
  configurata) e ricade sul motore a regole.
- `src/services/ruleEngine.ts` — motore a regole locale (attività, cibo, acquisti, risposte).
- `src/services/aiEngine.ts` — chiamata opzionale a Claude.
- `src/services/textParser.ts` — riconoscimento leggero di dominio/energia/tempo/meteo dal testo.
- `src/data/habitsStore.ts` — persistenza locale di abitudini e storico (AsyncStorage).
- `src/hooks/useUserLocation.ts`, `src/hooks/useWeather.ts` — posizione e meteo.
- `src/screens/` — Ora (input + suggerimenti), Storico, Impostazioni.
