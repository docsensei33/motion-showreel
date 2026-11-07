# PubMed-Stapel — PAE vs. TURP

Das ist eine Hintergrundplatte von **genau 4,000 s** in 1920×1080, ohne Ton. Echte PubMed-Publikationen zu Prostata-Arterien-Embolisation (PAE) und TURP fallen leicht rotiert auf einen Stapel, und zwar **immer schneller**. Die Landerate wächst exponentiell: Das erste Blatt landet bei 0,32 s, das zweite bei 1,09 s, und am Ende kommen ~20 Blätter pro Sekunde.

| Datei | |
|---|---|
| `pubmed-stapel_4s_1080p25.mp4` | 25 fps, clean |
| `pubmed-stapel_4s_1080p25_mit-zaehler.mp4` | 25 fps, mit Zähler-Chip „PUBMED · PAE vs. TURP — 66 Publikationen" |
| `pubmed-stapel_4s_1080p60.mp4` / `…_mit-zaehler.mp4` | 60 fps |

## Echtheit
- **Alle 66 Blätter sind echte, unterschiedliche Publikationen.** Titel, Autoren, Zitation, PMID, DOI und Abstract wurden unverändert aus PubMed übernommen (`pubs.json`). Wer pausiert, kann jedes Blatt über die PMID nachschlagen. Die vollständige Liste mit Links steht in [QUELLEN.md](QUELLEN.md).
- Die ersten sechs Blätter landen langsam genug, um lesbar zu sein. Ein Textmarker hebt dort jeweils einen **wörtlichen** Satz aus dem Abstract hervor, zum Beispiel *„PAE is associated with fewer complications than TURP"* (BMJ 2018). Der Code bricht ab, falls ein Satz nicht exakt im Abstract steht.
- Tief im Stapel liegende Blätter, von denen nur noch Kanten sichtbar sind, werden als Platzhalter-Papier gezeichnet.

## Hinweis zur Studienlage
Die Literatur stützt **nicht** pauschal „PAE ist TURP überlegen". Sie zeigt ein gemischtes Bild:
- Konsistent belegt sind für PAE **weniger Komplikationen bzw. Nebenwirkungen**, ein kürzerer Klinikaufenthalt und geringere Kosten.
- TURP erzielt dagegen meist die **stärkere Verbesserung** bei Harnfluss und Restharn, teils auch bei den Symptomen. Siehe das 5-Jahres-RCT, Eur Urol Focus 2024, PMID 38531756.

Formulierungen wie „schonender, mit weniger Nebenwirkungen" sind durch die gezeigten Zitate gedeckt.

## Neu rendern
```sh
node render.mjs --page "pubstack/index.html?fps=25" --name pubmed-stapel_4s_1080p25.mp4
node render.mjs --page "pubstack/index.html?fps=25&overlay=1" --name pubmed-stapel_4s_1080p25_mit-zaehler.mp4
```
Die markierten Sätze und die Reihenfolge der lesbaren Blätter stehen in `HEROES` am Anfang von [`pubstack.js`](pubstack.js).
