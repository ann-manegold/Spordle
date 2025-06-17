# Spordle Setup-Anleitung

## Python Interpreter Probleme (Optional)

Da ich jedes mal probleme mit dem code und meinem python interpreter habe kommt es im backend immer zu vielen "Errors".
Die Anführungsstriche sind nur da weil man die Errors ignorieren kann. Hier ist auch wie:

1. Zuerst navigiert man in dem Spordle projekt in den backend ordner.
2. Danach gibt man in die Konsole `python -m venv venv` ein um eine virtuelle python Umgebung zu starten, mithilfe welcher die Errors dann kein problem mehr sind.  
   **Bedenke:** Das ist lediglich nötig wenn du auch Probleme mit deinem python Interpreter hast.
3. Führe `venv/Scripts/activate` aus um die Umgebung zu starten
4. Zum Schluss muss man noch die requirements installieren mithilfe von `pip install -r requirements.txt`

## Docker Deployment

> **Wichtig!** für den nächsten Schritt wird Docker oder Docker Desktop auf dem PC/Laptop benötigt. Ich empfehle Docker Desktop.

Wenn alles soweit installier ist kann man auch direkt wieder in das haupt Spordle Verzeichnis navigieren und `docker-compose up --build` ausführen.
Jetzt sollte es etwas laden bis die container gestartet sind und das Projekt deployed ist.

Wenn man änderungen am code vorgenommen hat und diese nun im Browser sehen will muss man erstmal mit `strg + c` die container stoppen.

Im Anschluss macht man dann `docker-compose down` um die bestehenden container zu entfernen. Jetzt kann man die container wieder neu mit `docker-compose up --build` bauen.
## Zugriff auf die Anwendung

- **Spiel:** http://localhost:3000/~~~~
- **Admin-Bereich:** http://localhost:3000/admin (neue songs in einer Art Formular hinzufügen)
- **Song-Übersicht:** http://localhost:3000/api/songs (kleine übersicht über die bereits hinzugefügten songs)

> Kein sorge falls da keine anderen Metadaten erfasst sind als der Name. Das spiel funktioniert trotzdem.

## Für die Erfassung von neuen Songs

Die Metadaten müssen alle selbst erfasst werden. Für den mp3 ausschnitt kann ich einen relativ simplen, dennoch etwas umständlichen weg empfehlen mit dem ich das bisher ganz gut hinbekommen habe:

- Mithilfe von **OBS** nehme ich den gewünschten song auf und speicher mir diesen ab.
- Um nun das format in mp3 zu bekommen habe ich mir **REAPER** installiert. Das ist eine kostenlose Tonschnitt software. Hier kann man den Song clip zurrecht schneiden und Rendern.

---

**Viel spaß mit Spordle!**~~~~