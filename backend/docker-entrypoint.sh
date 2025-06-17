#!/bin/bash
set -e

echo "Initialisiere Spordle Backend..."

# Erstelle Haupt-Verzeichnisse falls nicht vorhanden
mkdir -p /app/data /app/uploads

# Setze Berechtigungen
chmod -R 777 /app/data /app/uploads

# Warte kurz, damit die Verzeichnisse bereit sind
sleep 2

# Initialisiere Datenbank mit Python direkt
python -c "
from app import app, db
with app.app_context():
    db.create_all()
    print('Datenbank-Tabellen erstellt!')
"

echo "Starte Spordle Backend Server..."

# Starte die Anwendung
exec gunicorn --bind 0.0.0.0:5000 --workers 1 --threads 2 --timeout 120 app:app