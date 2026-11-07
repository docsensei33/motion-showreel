# „Nur TURP" — Urologie lehnt PAE ab

> *Es wird einfach von der Urologie nach wie vor zu großen Teilen abgelehnt und nicht angeboten. Einfach weil sie es nicht selber machen. Punkt. Dann wird ihnen einfach die TURP angeboten. Punkt.*

Die Grafik ist **8,05 s** lang (5,05 + 1,0 + 2,0 s), in 1920×1080 und ohne Ton. Sie ist für eine Split-Screen-Montage gebaut:
- Der Hintergrund ist **reines Schwarz**.
- **Alles wird ausschließlich in der linken Hälfte animiert** (harter Clip bei x = 960). Die rechte Hälfte ist in jedem Frame exakt RGB 0, dort ist Platz für den Sprecher.
- Es gibt kein Korn und keine Vignette, damit nichts in die Sprecherseite hineinwirkt.

| Datei | |
|---|---|
| `nur-turp_8s_1080p25.mp4` | 25 fps |
| `nur-turp_8s_1080p60.mp4` | 60 fps |
| `nur-turp_8s_1080p25_mit-1s-auslauf.mp4` | 25 fps mit 1 s Standbild-Auslauf zum Überblenden |

## Ablauf
| Zeit | Gesprochen | Bild |
|---|---|---|
| 0–5,05 s | „… von der Urologie nach wie vor zu großen Teilen abgelehnt und nicht angeboten." | Eine Karte „PAE · Prostata-Arterien-Embolisation" fährt ein. Darüber erscheinen der Chip „UROLOGIE" und die Wörter „nach wie vor · zu großen Teilen". Auf „abgelehnt" knallt ein Stempel **ABGELEHNT** auf die Karte. Auf „nicht angeboten" wird die Karte ausgegraut, „PAE" durchgestrichen, und darunter erscheint ein ✕-Tag „nicht angeboten". |
| 5,05–6,05 s | „Einfach weil sie es nicht selber machen. **Punkt.**" | Der Satz erscheint Wort für Wort. Das gesprochene „Punkt" landet als großer Punkt mit Aufprall am Satzende. |
| 6,05–8,05 s | „Dann wird ihnen einfach die TURP angeboten. **Punkt.**" | Die Karte „TURP · Transurethrale Resektion der Prostata" fährt ein. Auf „angeboten" leuchtet sie grün auf, mit dem Tag ✓ „angeboten". Das zweite „Punkt" knallt hinter „TURP". |

## Timing anpassen
Die Wort-Einsätze innerhalb der Phrasen sind geschätzt. Sie stehen gebündelt im Objekt `T` am Anfang von [`turp.js`](turp.js).
```sh
node render.mjs --page "nur-turp/index.html?fps=25" --name nur-turp_8s_1080p25.mp4
```
