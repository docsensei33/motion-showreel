# „Ein normaler Schlaf …" — Motion Graphics

> *Ein normaler Schlaf bedeutet, man legt sich am Abend ins Bett und man steht in der Frühe wieder auf.*

![poster](poster.jpg)

Die Grafik ist 12 Sekunden lang, in 1920×1080 und **ohne Ton**, damit sie unter Podcast-Stimme und Musik gelegt werden kann.
- [`schlaf_1080p25.mp4`](schlaf_1080p25.mp4): 25 fps für den Schnitt
- [`schlaf_1080p60.mp4`](schlaf_1080p60.mp4): 60 fps

## Ablauf

| Zeit | Text | Bild |
|---|---|---|
| 0,0–3,2 s | **Ein *normaler* Schlaf bedeutet,** | Horizontlinie und Stunden-Ticks zeichnen sich. Dahinter läuft ein Ziffernblatt, dessen Sekundenzeiger jede Sekunde tickt. „Schlaf" atmet langsam. Das **„="** verwandelt sich in Matratze und Bettgestell. |
| 3,2–6,3 s | **man legt sich am *Abend* ins Bett** | Die Abenddämmerung beginnt und die Sonne sinkt. Die Figur holt Schwung, springt mit Squash & Stretch ins Bett und schließt die Augen. Das Wort „legt" legt sich dabei flach hin. Dann kommt die Decke, und der Wecker springt auf 22:00. |
| 6,3–7,4 s | — | Nacht mit Sternen und Mond. Ein großer Rollzähler rast von 22:00 Richtung Morgen, und der Mond zieht einen **durchgehenden Bogen** über die Nacht. |
| 7,4–9,5 s | **und man *steht* in der *Frühe* wieder auf.** | Der Mond wird am Bogenende zur aufgehenden Sonne (06:30). Die Buchstaben von „steht" richten sich auf, die Figur wacht auf, steht auf und landet, und „auf." hüpft mit. |
| 9,5–12 s | (Standbild) | Der Morgen mit einer Streck-Geste. Das Ende bleibt ruhig stehen, damit man gut schneiden kann. |

## Timing an Sprecher anpassen
Alle Zeitpunkte stehen gebündelt im Objekt `T` am Anfang von [`schlaf.js`](schlaf.js). Das sind die Wort-Einsätze, Sprung, Aufstehen und Nacht-Zeitraffer. Werte ändern und neu rendern:

```sh
node render.mjs --page schlaf/index.html --name schlaf_1080p60.mp4             # 60 fps
node render.mjs --page "schlaf/index.html?fps=25" --name schlaf_1080p25.mp4    # 25 fps
```

Live-Vorschau im Browser: Ordner ausliefern (`npx serve .`) und `schlaf/index.html` öffnen. Dort gibt es einen Scrubber.
