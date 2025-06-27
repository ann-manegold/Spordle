import React, { useState, useEffect } from 'react';
import './admin.css';

export default function Admin() {
    const [songs, setSongs] = useState([]);
    const [editingSong, setEditingSong] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        artist: '',
        year: '',
        genres: [],
        types: [],
        duration: '',
        hint1: '',
        hint2: ''
    });
    const [audioFile, setAudioFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [message, setMessage] = useState('');
    const [showList, setShowList] = useState(false);
    const [customGenre, setCustomGenre] = useState('');
    const [showCustomGenre, setShowCustomGenre] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Vordefinierte Genres (werden mit benutzerdefinierten aus localStorage ergänzt)
    const [availableGenres, setAvailableGenres] = useState([
        'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'Jazz', 'Classical',
        'Country', 'Metal', 'Indie', 'Alternative', 'Reggae', 'Blues', 'Folk'
    ]);

    const songTypes = ['Album', 'Single', 'EP'];

    useEffect(() => {
        fetchSongs();
        // Lade gespeicherte custom genres
        const savedGenres = localStorage.getItem('spordle_custom_genres');
        if (savedGenres) {
            const customGenres = JSON.parse(savedGenres);
            setAvailableGenres(prev => [...new Set([...prev, ...customGenres])].sort());
        }
    }, []);

    const fetchSongs = async () => {
        try {
            const response = await fetch('/api/admin/songs');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setSongs(data);
        } catch (error) {
            console.error('Fehler beim Laden der Songs:', error);
            setMessage('Fehler beim Laden der Songs');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleTypeChange = (type) => {
        const newTypes = formData.types.includes(type)
            ? formData.types.filter(t => t !== type)
            : [...formData.types, type];

        setFormData({
            ...formData,
            types: newTypes
        });
    };

    const handleGenreChange = (genre) => {
        const newGenres = formData.genres.includes(genre)
            ? formData.genres.filter(g => g !== genre)
            : [...formData.genres, genre];

        setFormData({
            ...formData,
            genres: newGenres
        });
    };

    const handleDurationChange = (e) => {
        let value = e.target.value;
        // Automatisch : nach 1-2 Ziffern einfügen
        if (value.length === 2 && !value.includes(':')) {
            value = value + ':';
        }
        setFormData({
            ...formData,
            duration: value
        });
    };

    const convertDurationToSeconds = (duration) => {
        if (!duration) return null;
        const parts = duration.split(':');
        if (parts.length !== 2) return null;
        const minutes = parseInt(parts[0]);
        const seconds = parseInt(parts[1]);
        if (isNaN(minutes) || isNaN(seconds)) return null;
        return minutes * 60 + seconds;
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '';
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const handleAddCustomGenre = () => {
        if (customGenre.trim()) {
            const newGenre = customGenre.trim();
            const updatedGenres = [...new Set([...availableGenres, newGenre])].sort();
            setAvailableGenres(updatedGenres);

            // Speichere custom genres
            const customGenres = updatedGenres.filter(g =>
                !['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'Jazz', 'Classical',
                    'Country', 'Metal', 'Indie', 'Alternative', 'Reggae', 'Blues', 'Folk'].includes(g)
            );
            localStorage.setItem('spordle_custom_genres', JSON.stringify(customGenres));

            // Füge das neue Genre zu den ausgewählten hinzu
            if (!formData.genres.includes(newGenre)) {
                setFormData({ ...formData, genres: [...formData.genres, newGenre] });
            }
            setCustomGenre('');
            setShowCustomGenre(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isLoading) return;

        setIsLoading(true);
        setMessage('');

        const formDataToSend = new FormData();
        formDataToSend.append('title', formData.title);
        formDataToSend.append('artist', formData.artist || '');
        formDataToSend.append('year', formData.year || '');
        formDataToSend.append('genre', formData.genres.join(', '));
        formDataToSend.append('type', formData.types.join(', '));

        const lengthInSeconds = convertDurationToSeconds(formData.duration);
        if (lengthInSeconds) {
            formDataToSend.append('length', lengthInSeconds.toString());
        }

        formDataToSend.append('hint1', formData.hint1 || '');
        formDataToSend.append('hint2', formData.hint2 || '');

        if (audioFile) {
            formDataToSend.append('audio', audioFile);
        }

        try {
            const url = editingSong
                ? `/api/admin/songs/${editingSong.id}`
                : '/api/admin/songs';

            const method = editingSong ? 'PUT' : 'POST';

            console.log(`Sende ${method} Request an ${url}`);

            const response = await fetch(url, {
                method: method,
                body: formDataToSend
            });

            const contentType = response.headers.get("content-type");

            if (!response.ok) {
                // Versuche die Antwort zu lesen
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Server Error: ${response.status}`);
                } else {
                    const text = await response.text();
                    console.error('Nicht-JSON Antwort:', text);
                    throw new Error(`Server Error: ${response.status} - Möglicherweise ist die API nicht erreichbar`);
                }
            }

            // Prüfe ob die Antwort JSON ist
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                setMessage(data.message || 'Erfolgreich gespeichert!');
                resetForm();
                fetchSongs();
                setTimeout(() => setMessage(''), 5000);
            } else {
                throw new Error('Server hat keine JSON-Antwort gesendet');
            }

        } catch (error) {
            console.error('Fehler:', error);
            setMessage('Fehler: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (song) => {
        setEditingSong(song);
        setFormData({
            title: song.title || '',
            artist: song.artist || '',
            year: song.year || '',
            genres: song.genre ? song.genre.split(', ').map(g => g.trim()) : [],
            types: song.type ? song.type.split(', ').filter(t => songTypes.includes(t)) : [],
            duration: formatDuration(song.length),
            hint1: song.hint1 || '',
            hint2: song.hint2 || ''
        });
        setShowList(false);
    };

    const handleDelete = async (songId) => {
        if (!window.confirm('Bist du sicher, dass du diesen Song löschen möchtest?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/songs/${songId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Fehler beim Löschen');
                } else {
                    throw new Error(`Server Error: ${response.status}`);
                }
            }

            const data = await response.json();
            setMessage(data.message);
            fetchSongs();
            setTimeout(() => setMessage(''), 5000);

        } catch (error) {
            console.error('Fehler:', error);
            setMessage('Fehler: ' + error.message);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            artist: '',
            year: '',
            genres: [],
            types: [],
            duration: '',
            hint1: '',
            hint2: ''
        });
        setEditingSong(null);
        // Reset file inputs
        setAudioFile(null);
        setCoverFile(null);
// Reset file inputs
        const audioInput = document.getElementById('audio');
        if (audioInput) audioInput.value = '';
    };

    const getAudioMetadata = async (file) => {
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append('audio', file);

            const response = await fetch('/api/admin/metadata', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const metadata = await response.json();
                // Automatisch Felder mit Metadaten füllen
                setFormData(prev => ({
                    ...prev,
                    title: prev.title || metadata.title || '',
                    artist: prev.artist || metadata.artist || '',
                    year: prev.year || metadata.year || '',
                    duration: prev.duration || metadata.duration || ''
                }));
            }
        } catch (error) {
            console.error('Fehler beim Abrufen der Metadaten:', error);
        }
    }

    return (
        <div className="admin-overlay">
            <div className="admin-container">
                <h1>🎧 Spordle Admin</h1>

                <div className="admin-actions">
                    <button
                        className="toggle-btn"
                        onClick={() => setShowList(!showList)}
                    >
                        {showList ? '➕ Neuer Song' : '📋 Song-Liste'}
                    </button>
                </div>

                {message && (
                    <div className={`message ${message.includes('Fehler') ? 'error' : 'success'}`}>
                        {message}
                    </div>
                )}

                {!showList ? (
                    <form onSubmit={handleSubmit} className="song-form">
                        <h2>{editingSong ? '🎵 Song bearbeiten' : '➕ Neuen Song hinzufügen'}</h2>

                        {editingSong && (
                            <button type="button" onClick={resetForm} className="cancel-edit">
                                ❌ Abbrechen
                            </button>
                        )}

                        <div className="form-section">
                            <div className="form-group">
                                <label htmlFor="audio">
                                    Audio-Datei (MP3) {editingSong && editingSong.has_audio &&
                                    <span className="file-indicator">✓</span>}
                                </label>
                                <input
                                    type="file"
                                    id="audio"
                                    accept=".mp3,.wav,.ogg"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        setAudioFile(file);
                                        getAudioMetadata(file);
                                    }}
                                    disabled={isLoading}
                                />
                            </div>

                        </div>

                        <div className="form-section">
                            <div className="form-group">
                            <label htmlFor="title">Titel *</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="Song-Titel eingeben"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="artist">Künstler</label>
                                <input
                                    type="text"
                                    id="artist"
                                    name="artist"
                                    value={formData.artist}
                                    onChange={handleInputChange}
                                    placeholder="Künstlername"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="year">Jahr</label>
                                <input
                                    type="number"
                                    id="year"
                                    name="year"
                                    value={formData.year}
                                    onChange={handleInputChange}
                                    min="1900"
                                    max="2030"
                                    placeholder="z.B. 2024"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="duration">Dauer</label>
                                <input
                                    type="text"
                                    id="duration"
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleDurationChange}
                                    placeholder="3:45"
                                    pattern="[0-9]{1,2}:[0-9]{2}"
                                    title="Format: MM:SS"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="form-section">
                            <div className="form-group">
                                <label>Genre</label>
                                <div className="genre-selector">
                                    <div className="selected-genres">
                                        {formData.genres.map(genre => (
                                            <span key={genre} className="genre-tag">
                                                {genre}
                                                <button
                                                    type="button"
                                                    onClick={() => handleGenreChange(genre)}
                                                    className="remove-tag"
                                                    disabled={isLoading}
                                                >
                                                    ×
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                    <div>
                                        <select
                                            value=""
                                            onChange={(e) => e.target.value && handleGenreChange(e.target.value)}
                                            disabled={isLoading}
                                        >
                                            <option value="">Genre hinzufügen...</option>
                                            {availableGenres
                                                .filter(g => !formData.genres.includes(g))
                                                .map(genre => (
                                                    <option key={genre} value={genre}>{genre}</option>
                                                ))}
                                        </select>
                                        <button
                                            type="button"
                                            className="add-genre-btn"
                                            onClick={() => setShowCustomGenre(!showCustomGenre)}
                                            disabled={isLoading}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                                {showCustomGenre && (
                                    <div className="custom-genre-input">
                                        <input
                                            type="text"
                                            value={customGenre}
                                            onChange={(e) => setCustomGenre(e.target.value)}
                                            placeholder="Neues Genre"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleAddCustomGenre();
                                                }
                                            }}
                                            disabled={isLoading}
                                        />
                                        <button type="button" onClick={handleAddCustomGenre} disabled={isLoading}>
                                            Hinzufügen
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Typ</label>
                                <div className="type-checkboxes">
                                    {songTypes.map(type => (
                                        <label key={type} className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={formData.types.includes(type)}
                                                onChange={() => handleTypeChange(type)}
                                                disabled={isLoading}
                                            />
                                            <span>{type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="hints-section">
                            <h3>💡 Hinweise</h3>
                            <div className="form-group">
                                <label htmlFor="hint2text">
                                    📋 Tipp 1: (nach 3 Fehlversuchen)
                                </label>
                                <input
                                    type="text"
                                    name="hint1"
                                    value={formData.hint1}
                                    onChange={handleInputChange}
                                    placeholder="Hinweis nach 3 Fehlversuchen"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="hint2text">
                                    📋 Tipp 2: (nach 6 Fehlversuchen)
                                </label>
                                <input
                                    type="text"
                                    name="hint2"
                                    value={formData.hint2}
                                    onChange={handleInputChange}
                                    placeholder="Hinweis nach 6 Fehlversuchen"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <button type="submit" className="submit-btn" disabled={isLoading}>
                            {isLoading ? '⏳ Wird gespeichert...' : (editingSong ? '💾 Aktualisieren' : '➕ Hinzufügen')}
                        </button>
                    </form>
                ) : (
                    <div className="song-list">
                        <h2>📋 Song-Verwaltung</h2>
                        <div className="songs-grid">
                            {songs.map(song => (
                                <div key={song.id} className="song-card">
                                    <h3>{song.title}</h3>
                                    <div className="song-info">
                                        <p><strong>Künstler:</strong> {song.artist || '-'}</p>
                                        <p><strong>Jahr:</strong> {song.year || '-'}</p>
                                        <p><strong>Genre:</strong> {song.genre || '-'}</p>
                                        <p><strong>Typ:</strong> {song.type || '-'}</p>
                                        <p><strong>Dauer:</strong> {formatDuration(song.length) || '-'}</p>
                                    </div>
                                    <div className="file-indicators">
                                        {song.has_audio && <span className="indicator audio">🎵</span>}
                                        {song.has_cover && <span className="indicator cover">🖼️</span>}
                                    </div>
                                    <div className="song-actions">
                                        <button
                                            className="edit-btn"
                                            onClick={() => handleEdit(song)}
                                        >
                                            ✏️
                                        </button>
                                        <button
                                            className="delete-btn"
                                            onClick={() => handleDelete(song.id)}
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {songs.length === 0 && (
                            <p className="no-songs">Noch keine Songs vorhanden</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}