#!/usr/bin/env python3
"""
Initialisierungsskript für die Spordle-Datenbank
Erstellt die Datenbank und Verzeichnisse, falls sie nicht existieren
"""

import os
import sys
from pathlib import Path

# Füge das aktuelle Verzeichnis zum Python-Pfad hinzu
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, init_database

def check_and_init():
    """Prüft ob die Datenbank existiert und initialisiert sie bei Bedarf"""

    data_dir = Path('data')
    db_path = data_dir / 'spordle.db'

    # Erstelle Verzeichnisse
    data_dir.mkdir(exist_ok=True)
    Path('uploads/songs').mkdir(parents=True, exist_ok=True)
    Path('uploads/covers').mkdir(parents=True, exist_ok=True)

    # Setze Berechtigungen (nur auf Unix-Systemen)
    try:
        os.chmod('data', 0o777)
        os.chmod('uploads', 0o777)
        os.chmod('uploads/songs', 0o777)
        os.chmod('uploads/covers', 0o777)
    except:
        pass  # Windows unterstützt chmod nicht

    # Initialisiere Datenbank wenn sie nicht existiert
    if not db_path.exists():
        print("Initialisiere neue Datenbank...")
        with app.app_context():
            db.create_all()
            print("Datenbank erfolgreich erstellt!")
    else:
        print("Datenbank existiert bereits.")

if __name__ == '__main__':
    check_and_init()