# NICE vs. ÖGU — „am selben Tag"

Die Grafik ist **14 s** lang, in 1920×1080 und ohne Ton. Sie ist bewusst ruhig und inhaltsgetrieben statt hyperdynamisch.

| Datei | |
|---|---|
| `nice-oegu_14s_1080p25.mp4` | 25 fps (350 Frames) |
| `nice-oegu_14s_1080p60.mp4` | 60 fps (840 Frames) |

## Ablauf

| Zeit | Gesprochen | Bild |
|---|---|---|
| 0–4 s | „Das ist eine Methode, die gibt es, die funktioniert, die ist sicher." | Das **echte NICE-Dokument** (HTG469, Seite 4, Empfehlung 1.1). Die Textmarker liegen wortgenau auf der Fundstelle: „gibt es" → *adequate to support the use of this procedure*, „funktioniert" → *efficacy*, „sicher" → *safety*. Rechts hakt sich eine Checkliste mit Verbindungslinien ab. |
| 4–10 s | „Und am selben Tag, wo diese Guidelines erschienen sind, ist auf der Homepage der Österreichischen Gesellschaft für Urologie ein Statement erschienen," | Das NICE-Deckblatt mit markiertem *Published: 25 April 2018*. Das Datum wandert in einen Chip „AM SELBEN TAG · 25. April 2018", von dort führt eine Linie zu einem Browserfenster **uro.at**. Darunter stehen der Name der Gesellschaft und ein Statement-Block. |
| 10–14 s | „wie schrecklich und wie gefährlich und wie fürchterlich die Prostata-Arterienembolisation ist." | Die drei Adjektive erscheinen rot über dem abgedunkelten Statement. Bei „Prostata-Arterienembolisation" markiert sich der Titel des NICE-Dokuments. Im Endbild stehen beide Aussagen zum selben Datum nebeneinander. |

## Echtheit
- Die NICE-Seiten sind direkt aus dem PDF gerendert ([`nice-htg469.pdf`](nice-htg469.pdf), *Published: 25 April 2018*). Die Positionen der Markierungen stammen aus den Wort-Koordinaten des PDFs (`pdftotext -bbox`).
- **Das ÖGU-Statement ist nicht mehr online und konnte nicht abgerufen werden.** uro.at und das Webarchiv sind aus der Render-Umgebung nicht erreichbar. Deshalb wird kein Text erfunden:
  - Das Browserfenster ist schematisch, mit neutralen Platzhalterzeilen, ohne ÖGU-Logo und ohne Datum auf der Seite.
  - Die drei Adjektive sind als Sprecherworte gesetzt, ohne Anführungszeichen und nicht als Zitat.
  - Die Zeile „uro.at · Statement heute nicht mehr online" kann in `drawBrowser` entfernt werden.
- Falls ein Screenshot oder Archivlink des Original-Statements existiert, lässt sich der echte Text an dieser Stelle einsetzen.

## Timing anpassen
Die Wort-Einsätze sind geschätzt (4 s / 6 s / 4 s). Sie stehen gebündelt im Objekt `T` am Anfang von [`vergleich.js`](vergleich.js).

```sh
node render.mjs --page "nice-oegu/index.html?fps=25" --name nice-oegu_14s_1080p25.mp4
```
