#!/usr/bin/env python3
"""
Komplette Migration für Tipp 3 als Audio-only
"""
import sqlite3
import os

# Pfad zur Datenbank
db_path = os.path.join(os.path.dirname(__file__), 'data', 'spordle.db')

if os.path.exists(db_path):
    print(f"Migriere Datenbank: {db_path}")

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # Prüfe aktuelle Tabellenstruktur
        cursor.execute("PRAGMA table_info(song)")
        columns = [column[1] for column in cursor.fetchall()]
        print(f"Aktuelle Spalten: {columns}")

        # Prüfe ob Migration nötig ist
        needs_migration = 'hint3' in columns or 'hint3_audio_path' not in columns

        if needs_migration:
            print("Migration wird durchgeführt...")

            # Erstelle neue Tabelle mit korrekter Struktur
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS song_new (
                    id INTEGER PRIMARY KEY,
                    title VARCHAR(200) NOT NULL,
                    artist VARCHAR(200),
                    year INTEGER,
                    genre VARCHAR(100),
                    type VARCHAR(50),
                    length INTEGER,
                    audio_path VARCHAR(500),
                    cover_path VARCHAR(500),
                    hint1 VARCHAR(500),
                    hint2 VARCHAR(500),
                    hint3_audio_path VARCHAR(500)
                )
            """)

            # Kopiere Daten
            if 'hint3_audio_path' in columns:
                # Tabelle hat bereits hint3_audio_path
                cursor.execute("""
                    INSERT INTO song_new 
                    SELECT id, title, artist, year, genre, type, length,
                           audio_path, cover_path, hint1, hint2, hint3_audio_path
                    FROM song
                """)
            else:
                # Alte Struktur ohne hint3_audio_path
                cursor.execute("""
                    INSERT INTO song_new (id, title, artist, year, genre, type, 
                                        length, audio_path, cover_path, hint1, hint2)
                    SELECT id, title, artist, year, genre, type, length,
                           audio_path, cover_path, hint1, hint2
                    FROM song
                """)

            # Ersetze alte Tabelle
            cursor.execute("DROP TABLE song")
            cursor.execute("ALTER TABLE song_new RENAME TO song")

            conn.commit()
            print("✓ Migration erfolgreich abgeschlossen")

            # Zeige neue Struktur
            cursor.execute("PRAGMA table_info(song)")
            new_columns = [column[1] for column in cursor.fetchall()]
            print(f"Neue Spalten: {new_columns}")
        else:
            print("✓ Datenbank hat bereits die korrekte Struktur")

    except Exception as e:
        print(f"✗ Fehler bei der Migration: {e}")
        conn.rollback()
    finally:
        conn.close()
else:
    print(f"✗ Datenbank nicht gefunden: {db_path}")
    print("Erstelle neue Datenbank beim nächsten Start...")