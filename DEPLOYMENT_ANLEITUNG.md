# Spordle Setup-Anleitung

## Python Interpreter Probleme (Optional - nur bei Problemen)

Da ich jedes mal probleme mit dem code und meinem python interpreter habe kommt es im backend immer zu vielen "Errors".
Die Anführungsstriche sind nur da weil man die Errors ignorieren kann. Hier ist auch wie:

1. Zuerst navigiert man in dem Spordle projekt in den backend ordner.
2. Danach gibt man in die Konsole `python -m venv venv` ein um eine virtuelle python Umgebung zu starten, mithilfe welcher die Errors dann kein problem mehr sind.  
   **Bedenke:** Das ist lediglich nötig wenn du auch Probleme mit deinem python Interpreter hast.
3. Führe `venv/Scripts/activate` aus um die Umgebung zu starten
4. Zum Schluss muss man noch die requirements installieren mithilfe von `pip install -r requirements.txt`

## Docker Deployment

> **Wichtig!** für den nächsten Schritt wird Docker oder Docker Desktop auf dem PC/Laptop benötigt. Ich empfehle Docker Desktop.

Wenn alles soweit installier ist kann man auch direkt wieder in das haupt Spordle Verzeichnis navigieren und `docker-compose up --build` ausführen. Je nach Docker Version stattdessen `docker compose up --build`.

Jetzt sollte es etwas laden bis die container gestartet sind und das Projekt deployed ist.

Wenn man änderungen am code vorgenommen hat und diese nun im Browser sehen will muss man erstmal mit `strg + c` die container stoppen.

Im Anschluss macht man dann `docker-compose down` um die bestehenden container zu entfernen. Jetzt kann man die container wieder neu mit `docker-compose up --build` bauen.
## Zugriff auf die Anwendung

- **Spiel:** http://localhost:3000/~~~~
- **Admin-Bereich:** http://localhost:3000/admin (neue songs in einer Art Formular hinzufügen)

## Für die Erfassung von neuen Songs

Man muss lediglich eine mp3-Datei hochladen und die hinterlegten Metadaten werden direkt raus gezogen. 
Da Sachen wie zum Beispiel die hinweise natürlich nicht in einer mp3 hinterlegt sind, muss man sowas noch selbst hinzufügen.

---

**Viel spaß mit Spordle!**~~~~
