# whatnow-ai (Cloudflare Worker)

Backend minimo per i suggerimenti AI di [WhatNow?](../whatnow-app). Riceve il contesto della
decisione dall'app, genera il prompt e chiama **Cloudflare Workers AI** (modello open source,
`@cf/meta/llama-3.1-8b-instruct`) usando il *binding* `AI` — non una chiave API in chiaro.

## Perché questo design

- **Nessuna chiave nel client**: l'app mobile chiama solo l'URL pubblico di questo Worker (che
  non è un segreto, è solo un endpoint). Il Worker parla con Workers AI tramite il binding `AI`,
  autenticato a livello di account Cloudflare: quel binding non è mai raggiungibile dal client.
- **Gratuito**: Cloudflare Workers e Workers AI hanno un piano gratuito (rispettivamente ~100.000
  richieste/giorno e una quota giornaliera di "Neuron" per l'inferenza) sufficiente per un uso
  personale o per validare l'app prima di scalare.
- **Indipendente da account Anthropic/Claude**: usa un modello open (Llama 3.1) ospitato da
  Cloudflare, non l'API di Anthropic.

## Deploy (una tantum)

```bash
cd whatnow-worker
npm install
npx wrangler login        # apre il browser per collegare il tuo account Cloudflare (gratuito)
npm run deploy
```

Al termine, `wrangler` stampa l'URL pubblico del Worker, del tipo:
`https://whatnow-ai.<tuo-subdominio>.workers.dev`

Copia quell'URL in `whatnow-app/.env` come:
```
EXPO_PUBLIC_WHATNOW_API_URL=https://whatnow-ai.<tuo-subdominio>.workers.dev
```

## Sviluppo locale

```bash
npm run dev
```

Espone il Worker su `http://localhost:8787` con accesso reale a Workers AI (serve comunque un
account Cloudflare collegato).

## Nota su abusi e costi

Il piano gratuito ha comunque un tetto giornaliero: se pubblichi l'app su uno store e ricevi
traffico serio, valuta di aggiungere in `src/index.ts`:
- una regola di **Rate Limiting** dal pannello Cloudflare (Security → Rate limiting rules),
  gratuita entro certe soglie, legata al percorso `/`;
- eventualmente **Cloudflare Turnstile** o un controllo applicativo più stringente se noti abusi.

Nessuna di queste protezioni è necessaria per iniziare: senza di esse, nel caso peggiore qualcuno
esaurisce la quota gratuita giornaliera (l'app ricade automaticamente sul motore a regole locale),
non c'è comunque nessuna chiave a pagamento da proteggere.
