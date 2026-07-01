# ParkFree

App mobile (Expo / React Native) per trovare parcheggi a pagamento liberi in
città. Gli utenti vedono sulla mappa lo stato dei parcheggi (occupato /
libero / da verificare) e, quando lasciano un posto, lo segnalano per farlo
comparire come libero a tutti gli altri, guadagnando **Punti Park**.

## Come funziona

- **Mappa** (OpenStreetMap, nessuna API key): marker verdi = liberi, rossi =
  occupati, gialli = da verificare. Tap su un marker per aprire il dettaglio.
- **Segnalazione**: dal dettaglio di un posto puoi segnalare "Ho lasciato il
  posto" (libero) o "È occupato". Per segnalare devi essere fisicamente
  entro ~60 metri dal parcheggio (verifica GPS), per limitare segnalazioni
  false o da remoto.
- **Punti Park**: guadagni 1 punto ogni volta che liberi un posto che
  risultava effettivamente occupato (non segnalando ripetutamente lo stesso
  posto: c'è un cooldown di 30 minuti per posto/utente). Ogni 10 punti sblocchi
  un'ora di parcheggio gratuito. **Il riscatto reale dell'ora gratis richiede
  un accordo con il Comune**, non ancora implementato: la UI mostra chiaramente
  questo stato come "in arrivo".
- **Scadenza automatica**: uno stato "libero" non confermato da nessuno torna
  "da verificare" dopo 8 minuti, per evitare che la mappa mostri dati non più
  affidabili.

## Stack

- Expo (React Native) + TypeScript
- Mappa: Leaflet + tile OpenStreetMap in una WebView (nessuna API key richiesta)
- Backend: Firestore + Firebase Auth anonima, con **fallback automatico a un
  backend locale su AsyncStorage** se non configuri Firebase — utile per
  provare l'app subito, senza setup.

## Avvio rapido (modalità demo, senza Firebase)

```bash
npm install
npm run start   # poi premi "i" (iOS), "a" (Android) o "w" (web, mappa non disponibile)
```

L'app parte subito con un set dimostrativo di parcheggi nel centro di
Bologna e salva punti/segnalazioni sul dispositivo.

## Attivare il backend Firebase (multiutente in tempo reale)

1. Crea un progetto su [Firebase Console](https://console.firebase.google.com),
   abilita **Firestore** e **Authentication > Anonimo**.
2. Copia `.env.example` in `.env` e valorizzalo con le credenziali della tua
   web app Firebase.
3. Pubblica le regole di sicurezza in `firebase/firestore.rules`.
4. Popola i parcheggi di partenza (dataset dimostrativo di Bologna):
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=/percorso/service-account.json npm run seed:firebase
   ```
   In produzione questo dataset andrebbe sostituito con i dati reali forniti
   dal Comune (es. open data delle strisce blu).
5. Riavvia `npm run start`: l'app rileverà automaticamente `.env` e userà
   Firestore invece del backend locale.

## Struttura del progetto

```
src/
  types/        Modelli dati e costanti (soglie GPS, cooldown, punti)
  utils/        Calcolo distanze, formattazione, scadenza stato "libero"
  data/         Repository dati: interfaccia + implementazione mock e Firebase
  hooks/        useParkingSpots, useUserProfile, useUserLocation
  context/      AuthContext (identità utente, nickname, onboarding)
  components/   Mappa (WebView+Leaflet), scheda dettaglio posto, badge stato
  screens/      Mappa, Punti Park, Onboarding
  navigation/   Tab bar principale
firebase/       Regole Firestore, script e dataset di seed
```

## Edge case gestiti

- **Ri-occupazione di un posto**: chiunque può segnalare "è occupato" su un
  posto che risultava libero, e comunque lo stato "libero" scade da solo
  dopo 8 minuti se nessuno lo conferma.
- **Farming di punti**: i punti si guadagnano solo passando da "occupato" a
  "libero", mai marcando semplicemente "occupato", e solo una volta ogni 30
  minuti per lo stesso posto/utente.
- **Segnalazioni da remoto**: bloccate lato client richiedendo prossimità
  GPS; lato Firestore le regole verificano solo la coerenza dei dati, non la
  posizione reale (per un controllo anti-spoofing robusto servirebbe una
  Cloud Function server-side, vedi commenti in `firebaseRepository.ts`).
- **Permessi posizione negati**: l'app resta utilizzabile (mappa e liste
  visibili), ma i pulsanti di segnalazione restano disabilitati con un
  messaggio esplicito.
- **Utente senza Firebase configurato**: fallback trasparente a un profilo
  locale persistito sul dispositivo, così l'app è sempre dimostrabile.

## Cosa manca (fuori scope di questa prima versione)

- Riscatto reale dell'ora di parcheggio gratis: da definire con il Comune
  (integrazione con il loro sistema di pagamento/permessi).
- Dataset ufficiale dei parcheggi a pagamento (qui è un mock per Bologna).
- Moderazione/anti-abuso avanzata lato server (rate limiting robusto,
  verifica posizione server-side).
