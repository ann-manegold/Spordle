from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
import os
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Konfiguration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///spordle.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads/songs'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max

# Erstelle Upload-Ordner
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)

# Datenbank-Modelle
class Song(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    artists = db.Column(db.Text, nullable=False)  # JSON Array von Künstlern
    year = db.Column(db.Integer, nullable=False)
    genres = db.Column(db.Text, nullable=False)  # JSON Array von Genres
    types = db.Column(db.Text, nullable=False)  # JSON Array von Typen (Album/EP/Single)
    duration = db.Column(db.String(10), nullable=False)  # Format: "3:45"
    duration_seconds = db.Column(db.Integer, nullable=False)  # Für Vergleiche
    mp3_filename = db.Column(db.String(255), nullable=False)
    cover_filename = db.Column(db.String(255))
    hint1 = db.Column(db.String(500))
    hint2 = db.Column(db.String(500))
    hint3 = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self, include_hints=False):
        data = {
            'id': self.id,
            'title': self.title,
            'artists': json.loads(self.artists),
            'year': self.year,
            'genres': json.loads(self.genres),
            'types': json.loads(self.types),
            'duration': self.duration,
            'duration_seconds': self.duration_seconds,
            'cover_url': f'/api/songs/{self.id}/cover' if self.cover_filename else None
        }
        if include_hints:
            data['hints'] = [self.hint1, self.hint2, self.hint3]
        return data

class GameSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    song_id = db.Column(db.Integer, db.ForeignKey('song.id'), nullable=False)
    attempts = db.Column(db.Integer, default=0)
    completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Datenbank initialisieren
with app.app_context():
    db.create_all()

# Hilfsfunktionen
def duration_to_seconds(duration_str):
    """Konvertiert "3:45" zu Sekunden"""
    parts = duration_str.split(':')
    return int(parts[0]) * 60 + int(parts[1])

def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

# API-Routen

@app.route('/api/songs', methods=['GET'])
def get_songs():
    """Alle Songs für Autovervollständigung"""
    songs = Song.query.all()
    return jsonify([{'id': s.id, 'title': s.title} for s in songs])

@app.route('/api/songs/<int:song_id>', methods=['GET'])
def get_song(song_id):
    """Einzelnen Song abrufen"""
    song = Song.query.get_or_404(song_id)
    return jsonify(song.to_dict())

@app.route('/api/songs/<int:song_id>/audio', methods=['GET'])
def get_song_audio(song_id):
    """MP3 eines Songs streamen"""
    song = Song.query.get_or_404(song_id)
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], song.mp3_filename)
    return send_file(file_path, mimetype='audio/mpeg')

@app.route('/api/songs/<int:song_id>/cover', methods=['GET'])
def get_song_cover(song_id):
    """Cover eines Songs abrufen"""
    song = Song.query.get_or_404(song_id)
    if song.cover_filename:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], song.cover_filename)
        return send_file(file_path)
    return '', 404

@app.route('/api/admin/songs', methods=['POST'])
def create_song():
    """Neuen Song hinzufügen (Admin)"""
    # Validierung
    required_fields = ['title', 'artists', 'year', 'genres', 'types', 'duration', 'hint1', 'hint2', 'hint3']
    for field in required_fields:
        if field not in request.form:
            return jsonify({'error': f'Feld {field} fehlt'}), 400

    # MP3 Datei verarbeiten
    if 'mp3' not in request.files:
        return jsonify({'error': 'MP3 Datei fehlt'}), 400

    mp3_file = request.files['mp3']
    if mp3_file.filename == '':
        return jsonify({'error': 'Keine MP3 Datei ausgewählt'}), 400

    if not allowed_file(mp3_file.filename, {'mp3'}):
        return jsonify({'error': 'Nur MP3 Dateien erlaubt'}), 400

    # Sichere Dateinamen generieren
    mp3_filename = secure_filename(f"{datetime.now().timestamp()}_{mp3_file.filename}")
    mp3_path = os.path.join(app.config['UPLOAD_FOLDER'], mp3_filename)
    mp3_file.save(mp3_path)

    # Cover verarbeiten (optional)
    cover_filename = None
    if 'cover' in request.files:
        cover_file = request.files['cover']
        if cover_file.filename != '' and allowed_file(cover_file.filename, {'jpg', 'jpeg', 'png', 'gif'}):
            cover_filename = secure_filename(f"{datetime.now().timestamp()}_{cover_file.filename}")
            cover_path = os.path.join(app.config['UPLOAD_FOLDER'], cover_filename)
            cover_file.save(cover_path)

    # Song in Datenbank speichern
    try:
        new_song = Song(
            title=request.form['title'],
            artists=request.form['artists'],  # Erwartet JSON Array
            year=int(request.form['year']),
            genres=request.form['genres'],  # Erwartet JSON Array
            types=request.form['types'],  # Erwartet JSON Array
            duration=request.form['duration'],
            duration_seconds=duration_to_seconds(request.form['duration']),
            mp3_filename=mp3_filename,
            cover_filename=cover_filename,
            hint1=request.form['hint1'],
            hint2=request.form['hint2'],
            hint3=request.form['hint3']
        )
        db.session.add(new_song)
        db.session.commit()
        return jsonify(new_song.to_dict(include_hints=True)), 201
    except Exception as e:
        # Bei Fehler Dateien löschen
        if os.path.exists(mp3_path):
            os.remove(mp3_path)
        if cover_filename and os.path.exists(os.path.join(app.config['UPLOAD_FOLDER'], cover_filename)):
            os.remove(os.path.join(app.config['UPLOAD_FOLDER'], cover_filename))
        return jsonify({'error': str(e)}), 500

@app.route('/api/game/start', methods=['POST'])
def start_game():
    """Neues Spiel starten"""
    # Zufälligen Song auswählen
    song = Song.query.order_by(db.func.random()).first()
    if not song:
        return jsonify({'error': 'Keine Songs verfügbar'}), 404

    # Neue Session erstellen
    session = GameSession(song_id=song.id)
    db.session.add(session)
    db.session.commit()

    return jsonify({
        'session_id': session.id,
        'audio_url': f'/api/songs/{song.id}/audio'
    })

@app.route('/api/game/<int:session_id>/guess', methods=['POST'])
def make_guess(session_id):
    """Rateversuch verarbeiten"""
    session = GameSession.query.get_or_404(session_id)
    if session.completed:
        return jsonify({'error': 'Spiel bereits beendet'}), 400

    data = request.get_json()
    guess_title = data.get('title', '').strip()

    # Suche nach Song (case-insensitive)
    guessed_song = Song.query.filter(
        db.func.lower(Song.title) == db.func.lower(guess_title)
    ).first()

    if not guessed_song:
        return jsonify({
            'valid': False,
            'message': 'Dieser Song existiert nicht in unserer Datenbank. Bitte überprüfe deine Eingabe.'
        })

    # Erhöhe Versuche
    session.attempts += 1

    # Hole den richtigen Song
    correct_song = Song.query.get(session.song_id)

    # Vergleiche die Songs
    is_correct = guessed_song.id == correct_song.id

    if is_correct:
        session.completed = True

    db.session.commit()

    # Bereite Antwort vor
    response = {
        'valid': True,
        'correct': is_correct,
        'attempts': session.attempts,
        'guess': {
            'title': guessed_song.title,
            'cover_url': f'/api/songs/{guessed_song.id}/cover' if guessed_song.cover_filename else None,
            'artist': {
                'value': json.loads(guessed_song.artists),
                'status': 'correct' if guessed_song.artists == correct_song.artists else
                'partial' if any(a in json.loads(correct_song.artists) for a in json.loads(guessed_song.artists)) else 'wrong'
            },
            'year': {
                'value': guessed_song.year,
                'status': 'correct' if guessed_song.year == correct_song.year else 'wrong',
                'direction': 'up' if guessed_song.year < correct_song.year else 'down' if guessed_song.year > correct_song.year else None
            },
            'genre': {
                'value': json.loads(guessed_song.genres),
                'status': 'correct' if guessed_song.genres == correct_song.genres else
                'partial' if any(g in json.loads(correct_song.genres) for g in json.loads(guessed_song.genres)) else 'wrong'
            },
            'type': {
                'value': json.loads(guessed_song.types),
                'status': 'correct' if guessed_song.types == correct_song.types else
                'partial' if any(t in json.loads(correct_song.types) for t in json.loads(guessed_song.types)) else 'wrong'
            },
            'length': {
                'value': guessed_song.duration,
                'status': 'correct' if guessed_song.duration_seconds == correct_song.duration_seconds else 'wrong',
                'direction': 'up' if guessed_song.duration_seconds < correct_song.duration_seconds else 'down' if guessed_song.duration_seconds > correct_song.duration_seconds else None
            }
        }
    }

    # Füge Hinweise hinzu wenn nötig
    if session.attempts >= 3:
        response['hints'] = []
        if session.attempts >= 3:
            response['hints'].append(correct_song.hint1)
        if session.attempts >= 6:
            response['hints'].append(correct_song.hint2)
        if session.attempts >= 9:
            response['hints'].append(correct_song.hint3)

    # Wenn Spiel vorbei, füge Lösung hinzu
    if is_correct or session.attempts >= 10:
        response['solution'] = correct_song.to_dict()

    return jsonify(response)

@app.route('/api/game/<int:session_id>/hints', methods=['GET'])
def get_hints(session_id):
    """Verfügbare Hinweise abrufen"""
    session = GameSession.query.get_or_404(session_id)
    correct_song = Song.query.get(session.song_id)

    hints = []
    if session.attempts >= 3:
        hints.append({'number': 1, 'text': correct_song.hint1})
    if session.attempts >= 6:
        hints.append({'number': 2, 'text': correct_song.hint2})
    if session.attempts >= 9:
        hints.append({'number': 3, 'text': correct_song.hint3})

    return jsonify({
        'attempts': session.attempts,
        'hints': hints
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)