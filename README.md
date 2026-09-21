# Uscite in Edicola

App per tenere traccia delle uscite in edicola (fumetti, libri a fascicoli, modellini,
action figure, collezionabili), con dati aggiornati automaticamente da PrimaEdicola.it.

## Struttura

- `scraper/` — scraper Node/TypeScript che legge PrimaEdicola.it e genera `data/*.json`
- `data/` — dati generati (committati automaticamente dalla GitHub Action)
- `app/` — app Expo (React Native). Le route vivono in `app/src/app/`
- `.github/workflows/update-data.yml` — Action schedulata che rilancia lo scraper ogni giorno

## Scraper — uso locale

```bash
cd scraper
npm install
npm run scrape:dry   # veloce, poche collane per categoria, per test
npm run scrape        # run completo (qualche minuto)
```

## App — sviluppo locale

```bash
cd app
npm install
npm run web       # anteprima veloce nel browser
npm run start      # per Expo Go su telefono (scansiona il QR code)
```

L'app prova a scaricare `releases.json`/`series.json` da GitHub (vedi sotto); se non
disponibili usa una cache locale, e in ultima istanza i dati di esempio inclusi
nell'app (`app/assets/data/`).

## Collegare i dati live da GitHub

1. Crea un repository GitHub pubblico e pusha questo progetto.
2. In `app/app.json`, sostituisci `extra.dataBaseUrl` con:
   `https://raw.githubusercontent.com/<tuo-utente>/<nome-repo>/main/data`
3. La Action in `.github/workflows/update-data.yml` aggiorna `data/*.json` ogni giorno
   alle 05:00 UTC (puoi anche lanciarla a mano da GitHub, tab Actions → "Aggiorna dati
   uscite" → "Run workflow").

## Build dell'APK con EAS

```bash
cd app
npx eas-cli login          # se non hai già fatto login
npx eas-cli build -p android --profile preview
```

Il profilo `preview` in `app/eas.json` genera un APK installabile direttamente
(anziché un AAB per il Play Store). Al termine, EAS fornisce un link per scaricare
l'APK e installarlo sul telefono.

## Notifiche

Quando segui una collana (bottone "Segui" nella pagina di dettaglio), l'app pianifica
notifiche locali sul dispositivo per le sue prossime uscite. Non serve un server per
l'invio: tutto avviene sul telefono in base ai dati scaricati.
