import os
import sys
from pathlib import Path

from app import app, db, init_database

def check_and_init():

    data_dir = Path('data')
    db_path = data_dir / 'spordle.db'

    # Setze Berechtigungen (nur auf Unix-Systemen)
    # Nutzerfreundlichkeit wird so sichergestellt :)
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
