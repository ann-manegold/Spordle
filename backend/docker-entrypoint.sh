#!/bin/bash
set -e

echo "Starte Spordle Backend..."

# Stelle sicher, dass die Verzeichnisse existieren und beschreibbar sind
mkdir -p /app/data
mkdir -p /app/uploads
chmod -R 777 /app/data
chmod -R 777 /app/uploads

# Initialisiere die Datenbank falls noch nicht vorhanden
if [ ! -f "/app/data/spordle.db" ]; then
    echo "Erstelle neue Datenbank..."
    python -c "from app import init_database; init_database()"
fi

echo "Datenbank-Status:"
ls -la /app/data/

# Starte Gunicorn
echo "Starte Gunicorn Server..."
exec gunicorn --bind 0.0.0.0:5000 --workers 1 --threads 2 --timeout 120 app:app