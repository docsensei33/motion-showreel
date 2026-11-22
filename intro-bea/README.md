# Podcast-Intro „Bea": dramatischer Cold Open (1:40)

Das Intro ist eine Montage aus Beas O-Tönen mit drei Ebenen:

1. **Bea (A-Roll):** dein Material, geschnitten nach den Timecodes in [`schnittliste.csv`](schnittliste.csv).
2. **KI-B-Roll:** 17 Vollbild-Zwischenschnitte. Shotlist und fertige Prompts stehen in [`B-ROLL-PROMPTS.md`](B-ROLL-PROMPTS.md).
3. **Text- und Grafik-Overlay** (dieser Ordner): 25 Elemente, synchron zu den O-Tönen.

## Wo der Text sitzt
Bea sitzt links im Bild. **Alle** Texte und Datenkarten liegen deshalb in der **freien Zone rechts** (x 1090–1830 px bei 1920 px Breite). Dort stehen sie über der Holzwand und oberhalb der Mikrofonarme. So funktioniert das Overlay mit und ohne B-Roll und überdeckt Bea nie.
Sobald Vollbild-B-Roll vorliegt, lassen sich die drei Punchlines (NOTAUFNAHMEN, ½ JAHR, KÜRZUNGSORGIE) optional groß in die Bildmitte setzen. Dafür mit `?layout=center` rendern.

Die Schrift ist **Montserrat Bold** mit leichtem Schatten. Rot (#E63946) dient als Signalfarbe für Zahlen und Schlagworte.

## Dateien (25 fps, 1920×1080, Länge exakt 100,0 s)
Die Videodateien liegen nicht im Repo, weil sie zu groß sind. Du bekommst sie direkt geschickt. **Wichtig:** Im Schnitt immer eine `OVERLAY`-Datei verwenden, nie die Vorschau. In der Vorschau sind Platzhalter-Hintergründe fest eingebrannt.

| Datei | Wofür |
|---|---|
| `intro-bea_OVERLAY_transparent.webm` | Transparenz (VP9 mit Alpha), Schatten bleiben erhalten. **In CapCut zuerst diese testen.** |
| `intro-bea_OVERLAY_greenscreen.mp4` | Grüner Hintergrund, ohne Schatten. In CapCut: Clip auswählen → **Chroma-Key** → Farbauswahl auf das Grün → Intensität erhöhen. Funktioniert in jedem Programm. |
| `intro-bea_OVERLAY_schwarz_fuer-Bildschirm.mp4` | Schwarzer Hintergrund. In CapCut: **Mischmodus „Bildschirm"**. Das Schwarz verschwindet, dabei aber auch die Schatten, und die roten Balken wirken etwas heller. |
| `intro-bea_OVERLAY_ProRes4444.mov` | ProRes 4444 mit Transparenz für Premiere, DaVinci, Final Cut und After Effects. In CapCut wird der Hintergrund teils schwarz. |
| `intro-bea_VORSCHAU.mp4` | Nur zum Anschauen: Beas Standbilder als Platzhalter für die A-Roll, graue Karten als Platzhalter für die B-Roll. **Nicht für den Schnitt.** |

### So geht's in CapCut Pro
1. Beas Material liegt auf der **Hauptspur**. Dort keine automatische Hintergrundentfernung anwenden.
2. Die Overlay-Datei kommt als **Overlay-Spur darüber**, beginnend bei 00:00, auf 100 % Größe.
3. Ist der Hintergrund der WebM transparent, bist du fertig. Wird er schwarz, nimmst du die Greenscreen-Datei mit Chroma-Key oder die Schwarz-Datei mit Mischmodus „Bildschirm".

**Andere Bildrate** (z. B. 30 oder 50 fps): `node render.mjs --page "intro-bea/index.html?mode=overlay&fps=50"`. Danach mit ffmpeg kodieren. `&shadow=0` liefert die Variante ohne Schatten für Greenscreen.
**Timing anpassen:** Alle Zeiten stehen im Array `EL` in [`intro.js`](intro.js) (absolute Sekunden).

## Sounddesign
In [`schnittliste.csv`](schnittliste.csv) stehen unter „SOUND Hit (Vorschlag)" 26 Zeitpunkte für Impacts, Swooshes und Ticks, alle auf Grafik-Akzente gelegt. Die größten Treffer:
- 24,10–24,55 s: Kalender-Ratsche → **JULI**
- 37,05 s: **80 Mrd.**
- 47,55 s: **KÜRZUNGSORGIE**
- 58,55 / 59,25 s: Sensenschnitte „schnipp, schnapp"

## Faktencheck: was im Bild steht und was Bea sagt
Datenkarten mit Quellenzeile zeigen **geprüfte, aktuelle Zahlen**. Beas eigene Zahlen erscheinen nur als ihre Aussage, ohne Quellenzeile. Bei drei Stellen weicht ihre Formulierung von der Quellenlage ab. Das solltet ihr vor der Veröffentlichung wissen:

| Bea sagt | Quellenlage | Im Bild |
|---|---|---|
| „Mit **KI allein** 80 Milliarden" | McKinsey beziffert **80 Mrd. €/Jahr für Digitalisierung *und* KI zusammen**, davon **22,8 Mrd. € durch KI**. Gemeint ist Nutzenpotenzial, nicht reine Einsparung. | 80 Mrd. € mit dem Hinweis „davon KI: 22,8 Mrd." |
| „25 % Augenheilkunde, 20 % Psychiater, 15–16 % Kinder" | **Nicht verifizierbar.** KBV und Zi beziffern die Folgen des Spargesetzes in Euro je Arzt (Zi: bis zu 68.000 €/Jahr je nach Fach) bzw. in Behandlungsfällen. Prozentwerte je Fach in dieser Höhe fand ich nicht. | Als Beas Aussage, ohne Quelle. **Bitte bei Bea nachfragen**, worauf sich die Zahlen beziehen, oder ausblenden. |
| „50 % in der Deutschschweiz sind deutscher Nationalität im Gesundheitswesen" | FMH-Ärztestatistik: **43 %** der Ärzt:innen in der Schweiz haben ein ausländisches Diplom, **knapp die Hälfte davon aus Deutschland**. Das sind rund 1 von 5 aller Ärzt:innen. In der Deutschschweiz liegt der Anteil höher, „50 %" ist aber nicht belegt. | die FMH-Zahlen |
| „19 Milliarden" | ✓ Das **GKV-Beitragssatzstabilisierungsgesetz** (in Kraft seit 30.07.2026) sieht laut BMG knapp 19 Mrd. € Einsparvolumen für 2027 vor. Bea sagt „Beitragsstabilisierungsgesetz", korrekt ist „Beitrags**satz**stabilisierungsgesetz". | ✓ |
| „Facharzttermin in einem halben Jahr" | Ihr Einzelfall für Dringliches. Der Durchschnitt liegt bei **42 Tagen** (2024, GKV; 2019 noch 33). | beides |
| „Sauerstoffsättigung 85 %" | Normal sind 95–100 %. 85 % ist deutlich zu niedrig. | ✓ |
| „erste Generation, der es nicht besser geht" | Umfragen zeigen Pessimismus: **52 %** erwarten, dass es künftigen Generationen schlechter geht (Bertelsmann/YouGov 2025). Das ist eine Einschätzung, keine Messung. | ✓ |
| Kassenvertreterin: „Krankenkassen reduzieren bringt nichts" | Fakten ohne Wertung: 93 Kassen (2000: 420), Verwaltungskosten 12,6 Mrd. € (≈ 3,9 % der Ausgaben). Auch die Finanzkommission der Regierung sah 2026 in weniger Kassen kaum Sparpotenzial. | Zahlen ohne Wertung |

## Quellen
- DGINA-Umfrage Notaufnahmen, Stichtag 2. Juni 2026: [ZDFheute](https://www.zdfheute.de/politik/deutschland/notaufnahme-patient-gesundheitssystem-ueberlastet-zdf-frontal-100.html) · [Stuttgarter Zeitung](https://www.stuttgarter-zeitung.de/politik/krise-des-gesundheitssystems-am-limit-fast-jede-zweite-notaufnahme-in-deutschland-ueberlastet-79491333.html)
- Facharzt-Wartezeit Ø 42 Tage (2024) vs. 33 (2019), Antwort der Bundesregierung auf eine Kleine Anfrage: [ZDFheute](https://www.zdfheute.de/politik/deutschland/facharzt-wartezeit-gesetzliche-krankenversicherung-100.html) · GKV-Versichertenbefragung: [GKV-Spitzenverband](https://www.gkv-spitzenverband.de/gkv_spitzenverband/presse/pressemitteilungen_und_statements/pressemitteilung_2181888.jsp)
- ePA-Nutzung, Herbst 2026: [G+G / AOK](https://www.aok.de/pp/gg/magazine/gesundheit-gesellschaft-09-2026/epa/) · [zm-online](https://www.zm-online.de/news/detail/rund-acht-prozent-der-gkv-versicherten-nutzt-die-epa-aktiv)
- McKinsey, „KI und Digitalisierung: 80 Milliarden Euro Potenzial im deutschen Gesundheitswesen noch ungenutzt": [mckinsey.com](https://www.mckinsey.com/de/news/presse/digitalisierung-ki-gesundheitswesen-80-milliarden-euro-potenzial)
- GKV-Beitragssatzstabilisierungsgesetz: [BMG, Bundestagsbeschluss 10.07.2026](https://www.bundesgesundheitsministerium.de/ministerium/meldungen/bundestag-beschliesst-gkv-beitragssatzstabilisierunggesetz-pm-10-07-2026) · [BMG, Gesetzesseite](https://www.bundesgesundheitsministerium.de/service/gesetze-und-verordnungen/detail/gkv-beitragssatzstabilisierungsgesetz.html)
- Folgen für Praxen: [KBV-Sparliste (PDF)](https://www.kbv.de/documents/infothek/publikationen/praxisinfo/spargesetz-sparliste-infoblatt.pdf) · [Zi: bis zu 68.000 € pro Arzt](https://www.eyefox.com/news/2833/zi-gkv-spargesetz-kuerzungen-von-bis-zu-68-000-pro-arzt-im-jahr.html) · [Ärzteblatt](https://www.aerzteblatt.de/archiv/gkv-beitragssatzstabilisierungsgesetz-aerzte-muessen-mit-deutlichen-einbussen-rechnen-931aa471-f6c0-4b37-a9ee-6fc2e070599e)
- Generationen-Pessimismus: [Bertelsmann Stiftung, Einwurf 06/2026 (PDF)](https://www.bertelsmann-stiftung.de/fileadmin/files/user_upload/EINWURF_06_2026_Demokratie_braucht_Zukunft.pdf) · [Berliner Zeitung](https://www.berliner-zeitung.de/article/studie-mehrheit-der-deutschen-erwartet-schlechtere-zukunft-fuer-kommende-generationen-10198386)
- FMH-Ärztestatistik 2025: [Medienmitteilung 15.04.2026 (PDF)](https://js.fmh.ch/files/pdf33/2026-04-15-medienmitteilung-fmh-aerztestatistik_d.pdf) · [Poster 2025 (PDF)](https://report2025.fmh.ch/files/pdf33/fmh-aerztestatistikposter-2025_de.pdf) · Herkunft 2024: [SRF](https://www.srf.ch/news/schweiz/aerztestatistik-2024-berufsverband-schlaegt-alarm-wegen-der-vielen-auslaendischen-aerzte)
- Krankenkassen und Verwaltungskosten: [GKV-Spitzenverband, Fokus](https://www.gkv-spitzenverband.de/gkv_spitzenverband/presse/fokus/verwaltungskosten_kk.jsp) · [Ärzteblatt: Finanzkommission zu Kassenzahl](https://www.aerzteblatt.de/themen/krankenkassenfusion/finanzkommission-weniger-krankenkassen-helfen-nicht-beim-sparen-683c28aa-a9e8-4ef7-838a-ecf38d4b1af2)

Die Zahlen habe ich über eine Websuche geprüft (Stand 22.11.2026). Die Primär-PDFs konnte ich aus der Arbeitsumgebung nicht direkt öffnen. Vor der Veröffentlichung lohnt ein kurzer Blick in die verlinkten Originale.
