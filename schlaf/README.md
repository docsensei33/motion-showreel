# „Ein normaler Schlaf …" — Motion Graphics

> *Ein normaler Schlaf bedeutet, man legt sich am Abend ins Bett und man steht in der Frühe wieder auf.*

![poster](poster.jpg)

Die Grafik ist auf die Sprechlänge geschnitten: **4,011 s**, 1920×1080, **ohne Ton**.

| Datei | Wofür |
|---|---|
| [`schlaf_4s_1080p25.mp4`](schlaf_4s_1080p25.mp4) | 25 fps, 100 Frames, für den Schnitt |
| [`schlaf_4s_1080p60.mp4`](schlaf_4s_1080p60.mp4) | 60 fps, 241 Frames |
| [`schlaf_4s_1080p25_mit-1.5s-auslauf.mp4`](schlaf_4s_1080p25_mit-1.5s-auslauf.mp4) | 25 fps mit 1,5 s Auslauf nach dem Satz: Die Sonne steigt weiter, die Figur streckt sich. Gut zum Überblenden in den nächsten Clip. |

## Ablauf (synchron zur Sprechspur)

Der Text läuft Wort für Wort als schnelle Kinetic-Typo im oberen Bilddrittel. Darunter läuft die Geschichte durchgehend mit.

| Zeit | Gesprochen | Bild |
|---|---|---|
| 0,00–1,25 s | **Ein *normaler* Schlaf bedeutet,** | Es ist Abend. Hinter „bedeutet," erscheint ein **„="**, das herunterfällt und zum Bett wird. |
| 1,29–2,45 s | **man legt sich am *Abend* ins Bett** | Die Figur ploppt auf, holt Schwung und hechtet ins Bett. Die **Landung sitzt auf „Bett"**, und gleichzeitig legt sich das Wort „legt" flach hin. Dann kommen die Decke und der Wecker mit 22:00. |
| 2,42–3,25 s | **und man steht …** | Die Nacht im Zeitraffer: Der Mond zieht einen durchgehenden Bogen, und der Wecker rast auf 06:30. Die Buchstaben von „steht" richten sich auf. |
| 3,25–4,01 s | **… in der *Frühe* wieder auf.** | **Der Mond wird auf „Frühe" zur Sonne.** Die Figur wacht auf, steht auf und **landet auf „auf"**. |

## Timing an die Sprechspur anpassen
Die Wort-Einsätze sind aus der Gesamtlänge von 4,011 s nach Silben geschätzt. Alle Zeitpunkte stehen gebündelt im Objekt `T` am Anfang von [`schlaf.js`](schlaf.js). Echte Wort-Zeitpunkte aus der Aufnahme dort eintragen und neu rendern:

```sh
node render.mjs --page "schlaf/index.html?fps=25" --name schlaf_4s_1080p25.mp4
node render.mjs --page "schlaf/index.html?fps=60" --name schlaf_4s_1080p60.mp4
node render.mjs --page "schlaf/index.html?fps=25&tail=1.5" --name schlaf_4s_1080p25_mit-1.5s-auslauf.mp4
```

Live-Vorschau im Browser: Ordner ausliefern (`npx serve .`) und `schlaf/index.html` öffnen. Dort gibt es einen Scrubber.
