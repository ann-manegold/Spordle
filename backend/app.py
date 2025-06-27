from flask import Flask, request, jsonify, send_file, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import random
from datetime import datetime
import uuid
from pydub import AudioSegment
import eyed3

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Absolute Pfade für SQLite verwenden
basedir = os.path.abspath(os.path.dirname(__file__))
DATABASE_URL = os.getenv('DATABASE_URL', f'sqlite:///{os.path.join(basedir, "data", "spordle.db")}')
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'  # Haupt-Upload-Ordner
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

# Stelle sicher, dass JSON-Antworten korrekt sind
app.config['JSONIFY_MIMETYPE'] = 'application/json'

db = SQLAlchemy(app)

# Datenbank-Modelle
class Song(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    artist = db.Column(db.String(200))
    year = db.Column(db.Integer)
    genre = db.Column(db.String(100))
    type = db.Column(db.String(50))
    length = db.Column(db.Integer)
    audio_path = db.Column(db.String(500))
    cover_path = db.Column(db.String(500))
    hint1 = db.Column(db.String(500))
    hint2 = db.Column(db.String(500))
    hint3_audio_path = db.Column(db.String(500))
    root_path = db.Column(db.String(500))

class GameSession(db.Model):
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    song_id = db.Column(db.Integer, db.ForeignKey('song.id'))
    attempts = db.Column(db.Integer, default=0)
    solved = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Hilfsfunktionen
def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

def init_database():
    # Erstelle data Verzeichnis im gleichen Ordner wie app.py
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Setze Berechtigungen (nur auf Unix-Systemen)
    try:
        os.chmod(data_dir, 0o777)
        os.chmod(app.config['UPLOAD_FOLDER'], 0o777)
    except:
        pass  # Windows unterstützt chmod nicht

    with app.app_context():
        db.create_all()
        print("Datenbank initialisiert")

# Fehlerbehandlung
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Nicht gefunden'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Interner Serverfehler'}), 500

# API-Routen
@app.route('/api/songs', methods=['GET'])
def get_songs():
    try:
        songs = Song.query.all()
        return jsonify([{
            'id': s.id,
            'title': s.title,
            'artist': s.artist
        } for s in songs])
    except Exception as e:
        return jsonify({'error': 'Fehler beim Abrufen der Songs'}), 500

def create_temp_audio_files(song):
    temp_directory = os.path.join(basedir, 'data', 'temp_audio')

    os.makedirs(temp_directory, exist_ok=True)

    # Lösche die momentanen dateien in dem temp ordner.
    for filename in os.listdir(temp_directory):
        file_path = os.path.join(temp_directory, filename)
        if os.path.isfile(file_path):
            os.remove(file_path)

    try:
        audio = AudioSegment.from_mp3(song.audio_path)
        audio_start_time = random.randint(0, max(0, (song.length*1000) - 30000))

        if audio_start_time > (song.length*1000) - 30000:
            audio_start_time = (song.length*1000) - 30000

        start = audio[audio_start_time : audio_start_time+7000]
        hint3 = audio[audio_start_time : audio_start_time+15000]
        reveal = audio[audio_start_time : audio_start_time+30000]

        # Speicher im temp directory
        start.export(os.path.join(temp_directory, "start.mp3"), format="mp3")
        hint3.export(os.path.join(temp_directory, "hint3.mp3"), format="mp3")
        reveal.export(os.path.join(temp_directory, "reveal.mp3"), format="mp3")

    except Exception as e:
        print(f"Fehler beim Erstellen der Temp-Audio-Dateien: {e}")
        raise

@app.route('/api/game/start', methods=['POST'])
def start_game():
    try:
        songs = Song.query.all()
        if not songs:
            return jsonify({'error': 'Keine Songs verfügbar'}), 400

        song = random.choice(songs)

        if not song.audio_path or not os.path.exists(song.audio_path):
            return jsonify({'error': 'Song hat keine gültige Audio-Datei'}), 400

        session = GameSession(song_id=song.id)
        db.session.add(session)
        db.session.commit()
        create_temp_audio_files(song)
        return jsonify({
            'session_id': session.id,
            'audio_url': f'/api/audio/{session.id}/start'
        })
    except Exception as e:
        return jsonify({'error': 'Fehler beim Starten des Spiels'}), 500

#---------Getter für temp audio files-----------
@app.route('/api/audio/<session_id>/start')
def get_start_audio(session_id):
    try:
        temp_directory = os.path.join(basedir, 'data', 'temp_audio')
        audio_path = os.path.join(temp_directory, 'start.mp3')
        if os.path.exists(audio_path):
            return send_file(audio_path, mimetype='audio/mpeg')
        else:
            return jsonify({'error': 'Audio-Datei nicht gefunden'}), 404
    except Exception as e:
        return jsonify({'error': 'Fehler beim Abrufen der Audio-Datei'}), 500


@app.route('/api/audio/<session_id>/hint3')
def get_hint3_audio(session_id):
    try:
        temp_directory = os.path.join(basedir, 'data', 'temp_audio')
        hint3_path = os.path.join(temp_directory, 'hint3.mp3')

        if os.path.exists(hint3_path):
            return send_file(hint3_path, mimetype='audio/mpeg')
        else:
            return jsonify({'error': 'Hint-Audio nicht gefunden'}), 404
    except Exception as e:
        return jsonify({'error': 'Fehler beim Abrufen der Hint-Audio'}), 500

@app.route('/api/audio/<session_id>/reveal')
def get_reveal_audio(session_id):
    try:
        temp_directory = os.path.join(basedir, 'data', 'temp_audio')
        reveal_path = os.path.join(temp_directory, 'reveal.mp3')

        if os.path.exists(reveal_path):
            return send_file(reveal_path, mimetype='audio/mpeg')
        else:
            return jsonify({'error': 'Reveal-Audio nicht gefunden'}), 404
    except Exception as e:
        return jsonify({'error': 'Fehler beim Abrufen der Reveal-Audio'}), 500

@app.route('/api/game/<session_id>/guess', methods=['POST'])
def make_guess(session_id):
    try:
        session = GameSession.query.get_or_404(session_id)
        if session.solved:
            return jsonify({'error': 'Spiel bereits gelöst'}), 400

        data = request.json
        guess_title = data.get('title', '').strip()

        # Finde Song mit diesem Titel
        guessed_song = Song.query.filter(Song.title.ilike(f'%{guess_title}%')).first()

        if not guessed_song:
            return jsonify({
                'valid': False,
                'message': 'Unbekannter Song. Bitte wähle einen Song aus der Liste.'
            })

        session.attempts += 1
        db.session.commit()

        correct_song = Song.query.get(session.song_id)
        is_correct = guessed_song.id == correct_song.id

        if is_correct:
            session.solved = True
            db.session.commit()

        # Erstelle Antwort mit Vergleichen
        response = {
            'valid': True,
            'correct': is_correct,
            'attempts': session.attempts,
            'guess': {
                'title': guessed_song.title,
                'cover_url': f'/api/cover/{guessed_song.id}' if guessed_song.cover_path else None,
                'artist': {
                    'value': guessed_song.artist or 'Unbekannt',
                    'status': 'correct' if guessed_song.artist == correct_song.artist else
                    'partial' if correct_song.artist and guessed_song.artist and (
                            any(word.strip().lower() in correct_song.artist.lower()
                                for word in guessed_song.artist.split()
                                if len(word.strip()) > 2) or
                            any(word.strip().lower() in guessed_song.artist.lower()
                                for word in correct_song.artist.split()
                                if len(word.strip()) > 2)
                    ) else 'wrong'
                },
                'year': {
                    'value': guessed_song.year or 'Unbekannt',
                    'status': 'correct' if guessed_song.year == correct_song.year else 'wrong',
                    'direction': 'up' if guessed_song.year and correct_song.year and guessed_song.year < correct_song.year else
                    'down' if guessed_song.year and correct_song.year and guessed_song.year > correct_song.year else None
                },
                'genre': {
                    'value': guessed_song.genre or 'Unbekannt',
                    'status': 'correct' if guessed_song.genre == correct_song.genre else
                    'partial' if correct_song.genre and guessed_song.genre and
                                 any(g.strip().lower() in [cg.strip().lower() for cg in correct_song.genre.split(',')]
                                     for g in guessed_song.genre.split(',')) else 'wrong'
                },
                'type': {
                    'value': guessed_song.type or 'Unbekannt',
                    'status': 'correct' if guessed_song.type == correct_song.type else
                    'partial' if correct_song.type and guessed_song.type and
                                 any(t.strip() in correct_song.type.split(', ') for t in guessed_song.type.split(', ')) else 'wrong'
                },
                'length': {
                    'value': f"{guessed_song.length//60}:{guessed_song.length%60:02d}" if guessed_song.length else 'Unbekannt',
                    'status': 'correct' if guessed_song.length == correct_song.length else 'wrong',
                    'direction': 'up' if guessed_song.length and correct_song.length and guessed_song.length < correct_song.length else
                    'down' if guessed_song.length and correct_song.length and guessed_song.length > correct_song.length else None
                }
            }
        }

        # Füge Hints hinzu basierend auf Versuchen
        hints = []
        if session.attempts >= 3 and correct_song.hint1:
            hints.append(correct_song.hint1)
        if session.attempts >= 6 and correct_song.hint2:
            hints.append(correct_song.hint2)
        if session.attempts >= 9:
            hints.append({
                'type': 'audio',
                'url': f'/api/audio/{session_id}/hint3',
                'text': 'Höre eine längere Version des Songs'
            })

        if hints:
            response['hints'] = hints

        # Bei 10 Versuchen ist das Spiel verloren
        if session.attempts >= 10 and not is_correct:

            response['solution'] = {
                'title': correct_song.title,
                'artist': correct_song.artist
            }

        return jsonify(response)
    except Exception as e:
        return jsonify({'error': 'Fehler beim Verarbeiten der Antwort'}), 500

@app.route('/api/cover/<int:song_id>')
def get_cover(song_id):
    try:
        song = Song.query.get_or_404(song_id)
        if song.cover_path and os.path.exists(song.cover_path):
            return send_file(song.cover_path)
        # Wenn kein Cover vorhanden, sende einen 404 Status
        return '', 404
    except Exception as e:
        return jsonify({'error': 'Fehler beim Abrufen des Covers'}), 500

@app.route('/api/admin/metadata', methods=['POST'])
def get_audio_metadata():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'Keine Audio-Datei gefunden'}), 400

        audio_file = request.files['audio']
        if not audio_file or not audio_file.filename:
            return jsonify({'error': 'Ungültige Audio-Datei'}), 400

        # Temporäre Datei erstellen
        temp_path = os.path.join('/tmp', secure_filename(audio_file.filename))
        audio_file.save(temp_path)

        try:
            # Metadaten mit eyed3 extrahieren
            audiofile = eyed3.load(temp_path)
            metadata = {}

            if audiofile and audiofile.tag:
                metadata['title'] = audiofile.tag.title or ''
                metadata['artist'] = audiofile.tag.artist or ''
                metadata['year'] = str(audiofile.tag.getBestDate().year) if audiofile.tag.getBestDate() else ''

                # Dauer in MM:SS Format
                if audiofile.info and audiofile.info.time_secs:
                    minutes = int(audiofile.info.time_secs // 60)
                    seconds = int(audiofile.info.time_secs % 60)
                    metadata['duration'] = f"{minutes}:{seconds:02d}"
                else:
                    metadata['duration'] = ''

            return jsonify(metadata)

        finally:
            # Temporäre Datei löschen
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except Exception as e:
        return jsonify({'error': f'Fehler beim Lesen der Metadaten: {str(e)}'}), 500

def create_cover_from_mp3(song):
    try:
        if not song.audio_path or not os.path.exists(song.audio_path):
            return None
        audio = eyed3.load(song.audio_path)
        if audio and audio.tag and audio.tag.images:
            cover_file = audio.tag.images[0]
            if cover_file:
                return cover_file
    except Exception as e:
        print(f"Fehler beim Extrahieren des Covers: {e}")
    return None


@app.route('/api/admin/songs', methods=['GET'])
def get_all_songs():
    try:
        songs = Song.query.all()
        return jsonify([{
            'id': s.id,
            'title': s.title,
            'artist': s.artist,
            'year': s.year,
            'genre': s.genre,
            'type': s.type,
            'length': s.length,
            'has_audio': bool(s.audio_path),
            'has_cover': bool(s.cover_path),
            'hint1': s.hint1,
            'hint2': s.hint2
        } for s in songs])
    except Exception as e:
        return jsonify({'error': 'Fehler beim Abrufen der Songs'}), 500

@app.route('/api/admin/songs/<int:song_id>', methods=['PUT'])
def update_song(song_id):
    try:
        song = Song.query.get_or_404(song_id)

        # Update Textfelder
        if 'title' in request.form:
            song.title = request.form.get('title')
        if 'artist' in request.form:
            song.artist = request.form.get('artist') or None
        if 'year' in request.form:
            year_str = request.form.get('year')
            song.year = int(year_str) if year_str and year_str.isdigit() else None
        if 'genre' in request.form:
            song.genre = request.form.get('genre') or None
        if 'type' in request.form:
            song.type = request.form.get('type') or None
        if 'length' in request.form:
            length_str = request.form.get('length')
            song.length = int(length_str) if length_str and length_str.isdigit() else None
        if 'hint1' in request.form:
            song.hint1 = request.form.get('hint1') or None
        if 'hint2' in request.form:
            song.hint2 = request.form.get('hint2') or None

        # Update Audio wenn neue Datei hochgeladen wurde
        if 'audio' in request.files:
            audio_file = request.files['audio']
            if audio_file and audio_file.filename and allowed_file(audio_file.filename, {'mp3', 'wav', 'ogg'}):
                # Lösche alte Audio-Datei
                if song.audio_path and os.path.exists(song.audio_path):
                    try:
                        os.remove(song.audio_path)
                    except:
                        pass

                # Erstelle neuen Song-Ordner
                safe_folder_name = secure_filename(song.title.replace(' ', '_'))
                unique_folder_name = f"{safe_folder_name}_{song.id}"
                song_folder = os.path.join(app.config['UPLOAD_FOLDER'], unique_folder_name)
                os.makedirs(song_folder, exist_ok=True)

                filename = secure_filename(f"audio_{audio_file.filename}")
                audio_path = os.path.join(song_folder, filename)
                audio_file.save(audio_path)
                song.audio_path = audio_path

            try:
            # Lösche altes Cover falls vorhanden
                if song.cover_path and os.path.exists(song.cover_path):
                    try:
                        os.remove(song.cover_path)
                        song.cover_path = None
                    except:
                        pass

                audiofile = eyed3.load(audio_path)
                if audiofile and audiofile.tag and audiofile.tag.images:
                    for image in audiofile.tag.images:
                        if image.image_data:
                            cover_filename = f"cover_{song.id}.jpg"
                            cover_path = os.path.join(song_folder, cover_filename)

                            with open(cover_path, 'wb') as cover_file:
                                cover_file.write(image.image_data)

                            song.cover_path = cover_path
                            break
            except Exception as e:
                print(f"Warnung: Cover konnte nicht extrahiert werden: {e}")

        # Update Cover wenn neue Datei hochgeladen wurde
        if 'cover' in request.files:
            cover_file = request.files['cover']
            if cover_file and cover_file.filename and allowed_file(cover_file.filename, {'jpg', 'jpeg', 'png', 'gif'}):
                # Lösche altes Cover
                if song.cover_path and os.path.exists(song.cover_path):
                    try:
                        os.remove(song.cover_path)
                    except:
                        pass

                # Nutze denselben Song-Ordner
                safe_folder_name = secure_filename(song.title.replace(' ', '_'))
                unique_folder_name = f"{safe_folder_name}_{song.id}"
                song_folder = os.path.join(app.config['UPLOAD_FOLDER'], unique_folder_name)
                os.makedirs(song_folder, exist_ok=True)

                filename = secure_filename(f"cover_{cover_file.filename}")
                cover_path = os.path.join(song_folder, filename)
                cover_file.save(cover_path)
                song.cover_path = cover_path

        db.session.commit()

        return jsonify({
            'message': 'Song erfolgreich aktualisiert',
            'song_id': song.id
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Fehler beim Aktualisieren: {str(e)}'}), 500

@app.route('/api/admin/songs/<int:song_id>', methods=['DELETE'])
def delete_song(song_id):

    try:
        song = Song.query.get_or_404(song_id)

        # Lösche den kompletten Song-Ordner
        safe_folder_name = secure_filename(song.title.replace(' ', '_'))
        unique_folder_name = f"{safe_folder_name}_{song.id}"
        song_folder = os.path.join(app.config['UPLOAD_FOLDER'], unique_folder_name)

        if os.path.exists(song_folder):
            import shutil
            try:
                shutil.rmtree(song_folder)
            except:
                # Falls das nicht klappt, lösche einzelne Dateien
                if song.audio_path and os.path.exists(song.audio_path):
                    try:
                        os.remove(song.audio_path)
                    except:
                        pass
                if song.cover_path and os.path.exists(song.cover_path):
                    try:
                        os.remove(song.cover_path)
                    except:
                        pass

        # Lösche aus Datenbank
        db.session.delete(song)
        db.session.commit()

        return jsonify({'message': 'Song erfolgreich gelöscht'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Fehler beim Löschen: {str(e)}'}), 500


@app.route('/api/admin/songs', methods=['POST'])
def add_song():
    try:
        # Hole Formulardaten
        title = request.form.get('title')
        if not title:
            return jsonify({'error': 'Titel ist erforderlich'}), 400

        # Erstelle neuen Song
        song = Song(title=title)

        # Erstelle einen sicheren Ordnernamen basierend auf dem Songtitel
        safe_folder_name = secure_filename(title.replace(' ', '_'))
        unique_folder_name = f"{safe_folder_name}_{uuid.uuid4().hex[:8]}"

        # Erstelle den Song-spezifischen Ordner
        song_folder = os.path.join(app.config['UPLOAD_FOLDER'], unique_folder_name)
        os.makedirs(song_folder, exist_ok=True)

        song.root_path = song_folder

        # Setze optionale Felder
        artist = request.form.get('artist')
        song.artist = artist if artist else None

        year_str = request.form.get('year')
        song.year = int(year_str) if year_str and year_str.isdigit() else None

        genre = request.form.get('genre')
        song.genre = genre if genre else None

        type_str = request.form.get('type')
        song.type = type_str if type_str else None

        length_str = request.form.get('length')
        song.length = int(length_str) if length_str and length_str.isdigit() else None

        hint1 = request.form.get('hint1')
        song.hint1 = hint1 if hint1 else None

        hint2 = request.form.get('hint2')
        song.hint2 = hint2 if hint2 else None

        # Speicher Audio-Datei
        if 'audio' in request.files:
            audio_file = request.files['audio']
            if audio_file and audio_file.filename and allowed_file(audio_file.filename, {'mp3', 'wav', 'ogg'}):
                filename = secure_filename(f"audio_{audio_file.filename}")
                audio_path = os.path.join(song_folder, filename)
                audio_file.save(audio_path)
                song.audio_path = audio_path

                try:
                    audiofile = eyed3.load(audio_path)
                    if audiofile and audiofile.tag and audiofile.tag.images:
                        for image in audiofile.tag.images:
                            if image.image_data:
                                # Cover-Datei speichern
                                cover_filename = f"cover_{song.id}.jpg"
                                cover_path = os.path.join(song_folder, cover_filename)

                                with open(cover_path, 'wb') as cover_file:
                                    cover_file.write(image.image_data)

                                song.cover_path = cover_path
                                break  # Nur das erste Bild verwenden
                except Exception as e:
                    print(f"Warnung: Cover konnte nicht extrahiert werden: {e}")

        # Speichere in Datenbank
        db.session.add(song)
        db.session.commit()

        return jsonify({
            'message': 'Song erfolgreich hinzugefügt',
            'song_id': song.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Fehler beim Speichern: {str(e)}'}), 500


# Starte die App
if __name__ == '__main__':
    init_database()
    app.run(host='0.0.0.0', port=5000, debug=True)