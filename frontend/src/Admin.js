import React, { useState } from 'react';
import './style.css';
import './admin.css';

export default function Admin() {
    const [formData, setFormData] = useState({
        title: '',
        artists: [''],
        year: new Date().getFullYear(),
        genres: [''],
        types: [],
        duration: '',
        hint1: '',
        hint2: '',
        hint3: ''
    });
    const [mp3File, setMp3File] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const availableTypes = ['Album', 'EP', 'Single'];
    const commonGenres = ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'Country', 'Jazz', 'Classical', 'Metal', 'Indie'];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleArrayInputChange = (field, index, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].map((item, i) => i === index ? value : item)
        }));
    };

    const addArrayField = (field) => {
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], '']
        }));
    };

    const removeArrayField = (field, index) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index)
        }));
    };

    const handleTypeToggle = (type) => {
        setFormData(prev => ({
            ...prev,
            types: prev.types.includes(type)
                ? prev.types.filter(t => t !== type)
                : [...prev.types, type]
        }));
    };

    const handleFileChange = (e, type) => {
        const file = e.target.files[0];
        if (type === 'mp3') {
            setMp3File(file);
        } else {
            setCoverFile(file);
        }
    };

    const validateForm = () => {
        if (!formData.title) return 'Titel ist erforderlich';
        if (formData.artists.some(a => !a.trim())) return 'Alle Künstler müssen ausgefüllt sein';
        if (formData.genres.some(g => !g.trim())) return 'Alle Genres müssen ausgefüllt sein';
        if (formData.types.length === 0) return 'Mindestens ein Typ muss ausgewählt sein';
        if (!formData.duration || !/^\d+:\d{2}$/.test(formData.duration)) return 'Dauer muss im Format M:SS oder MM:SS sein';
        if (!formData.hint1 || !formData.hint2 || !formData.hint3) return 'Alle drei Tipps sind erforderlich';
        if (!mp3File) return 'MP3 Datei ist erforderlich';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const error = validateForm();
        if (error) {
            setMessage({ type: 'error', text: error });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        const formDataToSend = new FormData();
        formDataToSend.append('title', formData.title);
        formDataToSend.append('artists', JSON.stringify(formData.artists.filter(a => a.trim())));
        formDataToSend.append('year', formData.year.toString());
        formDataToSend.append('genres', JSON.stringify(formData.genres.filter(g => g.trim())));
        formDataToSend.append('types', JSON.stringify(formData.types));
        formDataToSend.append('duration', formData.duration);
        formDataToSend.append('hint1', formData.hint1);
        formDataToSend.append('hint2', formData.hint2);
        formDataToSend.append('hint3', formData.hint3);
        formDataToSend.append('mp3', mp3File);
        if (coverFile) {
            formDataToSend.append('cover', coverFile);
        }

        try {
            const response = await fetch('/api/admin/songs', {
                method: 'POST',
                body: formDataToSend
            });

            const data = await response.json();

            if (response.ok) {
                setMessage({ type: 'success', text: 'Song erfolgreich hinzugefügt!' });
                // Reset form
                setFormData({
                    title: '',
                    artists: [''],
                    year: new Date().getFullYear(),
                    genres: [''],
                    types: [],
                    duration: '',
                    hint1: '',
                    hint2: '',
                    hint3: ''
                });
                setMp3File(null);
                setCoverFile(null);
                // Reset file inputs
                document.getElementById('mp3-input').value = '';
                document.getElementById('cover-input').value = '';
            } else {
                setMessage({ type: 'error', text: data.error || 'Fehler beim Hinzufügen des Songs' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Netzwerkfehler: ' + error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-container">
            <h1>🎧 Spordle Admin</h1>

            <form onSubmit={handleSubmit} className="admin-form">
                <div className="form-group">
                    <label>Songtitel *</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="z.B. Shape of You"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Künstler *</label>
                    {formData.artists.map((artist, index) => (
                        <div key={index} className="array-input">
                            <input
                                type="text"
                                value={artist}
                                onChange={(e) => handleArrayInputChange('artists', index, e.target.value)}
                                placeholder={`Künstler ${index + 1}`}
                            />
                            {formData.artists.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeArrayField('artists', index)}
                                    className="remove-btn"
                                >
                                    ❌
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => addArrayField('artists')}
                        className="add-btn"
                    >
                        + Künstler hinzufügen
                    </button>
                </div>

                <div className="form-group">
                    <label>Jahr *</label>
                    <input
                        type="number"
                        name="year"
                        value={formData.year}
                        onChange={handleInputChange}
                        min="1900"
                        max={new Date().getFullYear()}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Genre *</label>
                    {formData.genres.map((genre, index) => (
                        <div key={index} className="array-input">
                            <input
                                type="text"
                                value={genre}
                                onChange={(e) => handleArrayInputChange('genres', index, e.target.value)}
                                placeholder={`Genre ${index + 1}`}
                                list="genre-suggestions"
                            />
                            {formData.genres.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeArrayField('genres', index)}
                                    className="remove-btn"
                                >
                                    ❌
                                </button>
                            )}
                        </div>
                    ))}
                    <datalist id="genre-suggestions">
                        {commonGenres.map(g => <option key={g} value={g} />)}
                    </datalist>
                    <button
                        type="button"
                        onClick={() => addArrayField('genres')}
                        className="add-btn"
                    >
                        + Genre hinzufügen
                    </button>
                </div>

                <div className="form-group">
                    <label>Typ * (Mehrfachauswahl möglich)</label>
                    <div className="type-selector">
                        {availableTypes.map(type => (
                            <label key={type} className="type-option">
                                <input
                                    type="checkbox"
                                    checked={formData.types.includes(type)}
                                    onChange={() => handleTypeToggle(type)}
                                />
                                <span className={formData.types.includes(type) ? 'selected' : ''}>
                                    {type}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label>Dauer * (Format: M:SS oder MM:SS)</label>
                    <input
                        type="text"
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        placeholder="z.B. 3:45"
                        pattern="\d{1,2}:\d{2}"
                        required
                    />
                </div>

                <div className="form-group">
                    <label>MP3 Datei *</label>
                    <input
                        id="mp3-input"
                        type="file"
                        accept=".mp3,audio/mpeg"
                        onChange={(e) => handleFileChange(e, 'mp3')}
                        required
                    />
                    {mp3File && <p className="file-info">Ausgewählt: {mp3File.name}</p>}
                </div>

                <div className="form-group">
                    <label>Cover Bild (optional)</label>
                    <input
                        id="cover-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'cover')}
                    />
                    {coverFile && <p className="file-info">Ausgewählt: {coverFile.name}</p>}
                </div>

                <div className="hints-section">
                    <h3>Tipps</h3>
                    <div className="form-group">
                        <label>Tipp 1 * (wird nach 3 Fehlversuchen angezeigt)</label>
                        <textarea
                            name="hint1"
                            value={formData.hint1}
                            onChange={handleInputChange}
                            placeholder="z.B. Der Song ist sehr bekannt auf TikTok"
                            rows="2"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Tipp 2 * (wird nach 6 Fehlversuchen angezeigt)</label>
                        <textarea
                            name="hint2"
                            value={formData.hint2}
                            onChange={handleInputChange}
                            placeholder="z.B. Der Artist kommt aus Kanada"
                            rows="2"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Tipp 3 * (wird nach 9 Fehlversuchen angezeigt)</label>
                        <textarea
                            name="hint3"
                            value={formData.hint3}
                            onChange={handleInputChange}
                            placeholder="z.B. Der Titel enthält eine Farbe"
                            rows="2"
                            required
                        />
                    </div>
                </div>

                {message.text && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                <button type="submit" disabled={loading} className="submit-btn">
                    {loading ? 'Wird hochgeladen...' : 'Song hinzufügen'}
                </button>
            </form>
        </div>
    );
}