import React, { useState, useEffect } from "react";
import './style.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';


function StreakBox({ count }) {
    return (
        <div className="streak-box">
            🥩 Streak: <span className="streak-count">{count}</span>
        </div>
    );
}

function HintSection({ misses = 0, hints = [] }) {
    const handleLockedClick = (e) => {
        e.preventDefault();
        alert("Dieser Tipp ist noch gesperrt!");
    };

    return (
        <div className="hint-progress-container">
            <div className="progress-label">❌ Fehlversuche: {misses} / 9</div>
            <div className="progress-bar-wrapper">
                <div className="progress-marker marker-3"></div>
                <div className="progress-marker marker-6"></div>
                <div className="progress-marker marker-9"></div>
                <div
                    className="progress-bar-fill"
                    style={{ width: `${(misses / 9) * 100}%` }}
                ></div>
            </div>
            <div className="hint-buttons">
                <details
                    className={`hint ${misses >= 3 ? "unlocked" : "locked"}`}
                    onClick={misses < 3 ? handleLockedClick : undefined}
                >
                    <summary>💡 Fun Fact</summary>
                    {misses >= 3 && hints[0] && typeof hints[0] === 'string' && <p>{hints[0]}</p>}
                </details>
                <details
                    className={`hint ${misses >= 6 ? "unlocked" : "locked"}`}
                    onClick={misses < 6 ? handleLockedClick : undefined}
                >
                    <summary>🖼 Cover</summary>
                    {misses >= 6 && hints[1] && typeof hints[1] === 'string' && <p>{hints[1]}</p>}
                </details>
                <details
                    className={`hint ${misses >= 9 ? "unlocked" : "locked"}`}
                    onClick={misses < 9 ? handleLockedClick : undefined}
                >
                    <summary>🎵 Länger hören</summary>
                    {misses >= 9 && hints.find(hint => typeof hint === 'object' && hint.type === 'audio') && (
                        <div style={{padding: '10px'}}>
                            <p style={{marginBottom: '10px'}}>
                                {hints.find(hint => typeof hint === 'object' && hint.type === 'audio').text}
                            </p>
                            <audio controls style={{width: '100%'}}>
                                <source src={hints.find(hint => typeof hint === 'object' && hint.type === 'audio').url} type="audio/mpeg"/>
                                Dein Browser unterstützt kein Audio-Element.
                            </audio>
                        </div>
                    )}
                </details>
            </div>
        </div>
    );
}

function GuessInput({ onGuess, availableSongs, errorMessage }) {
    const [input, setInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setInput(value);

        if (value.length > 1) {
            const filtered = availableSongs.filter(song =>
                song.title.toLowerCase().includes(value.toLowerCase())
            );
            setSuggestions(filtered.slice(0, 5));
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (input.trim()) {
            onGuess(input.trim());
            setInput('');
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (title) => {
        setInput(title);
        setShowSuggestions(false);
    };

    return (
        <div className="input-container">
            <form className="input-row" onSubmit={handleSubmit}>
                <div className="input-wrapper">
                    <input
                        type="text"
                        placeholder="🎵 Gib einen Songtitel ein…"
                        value={input}
                        onChange={handleInputChange}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                    {showSuggestions && suggestions.length > 0 && (
                        <div className="suggestions">
                            {suggestions.map((song) => (
                                <div
                                    key={song.id}
                                    className="suggestion-item"
                                    onClick={() => handleSuggestionClick(song.title)}
                                >
                                    {song.title}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </form>
            {errorMessage && (
                <div className="error-message">{errorMessage}</div>
            )}
        </div>
    );
}

function GuessRow({ guess }) {
    const formatValue = (value) => {
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        return value;
    };

    const getCoverUrl = (coverUrl) => {
        if (!coverUrl) return '/assets/images/logo.png';
        if (coverUrl.startsWith('http')) return coverUrl;
        return `${API_BASE_URL.replace('/api', '')}${coverUrl}`;
    };

    return (
        <div className="guess-row">
            <div className="guess-cell cover" style={{
                backgroundImage: `url(${getCoverUrl(guess.cover_url)})`
            }}>
                {guess.title}
            </div>
            <div className={`guess-cell ${guess.artist.status}`}>
                {formatValue(guess.artist.value)}
            </div>
            <div className={`guess-cell ${guess.year.status} ${guess.year.direction ? `hint-bg-${guess.year.direction}` : ''}`}>
                {guess.year.value}
            </div>
            <div className={`guess-cell ${guess.genre.status}`}>
                {formatValue(guess.genre.value)}
            </div>
            <div className={`guess-cell ${guess.type.status}`}>
                {formatValue(guess.type.value)}
            </div>
            <div className={`guess-cell ${guess.length.status} ${guess.length.direction ? `hint-bg-${guess.length.direction}` : ''}`}>
                {guess.length.value}
            </div>
        </div>
    );
}

function GuessTable({ guesses }) {
    return (
        <>
            <div className="guess-row top-row">
                <div className="guess-cell"><strong>Songtitel</strong></div>
                <div className="guess-cell"><strong>Künstler</strong></div>
                <div className="guess-cell"><strong>Jahr</strong></div>
                <div className="guess-cell"><strong>Genre</strong></div>
                <div className="guess-cell"><strong>Typ</strong></div>
                <div className="guess-cell"><strong>Länge</strong></div>
            </div>
            {guesses.slice().reverse().map((guess, idx) => <GuessRow key={idx} guess={guess} />)}
        </>
    );
}

export default function App() {
    const [showInstructions, setShowInstructions] = useState(true);
    const [accessible, setAccessible] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [availableSongs, setAvailableSongs] = useState([]);
    const [guesses, setGuesses] = useState([]);
    const [hints, setHints] = useState([]);
    const [misses, setMisses] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const [gameWon, setGameWon] = useState(false);
    const [gameLost, setGameLost] = useState(false);
    const [solution, setSolution] = useState(null);
    const [streak, setStreak] = useState(() => {
        const saved = localStorage.getItem('spordle_streak');
        return saved ? parseInt(saved) : 0;
    });

    useEffect(() => {
        if (!localStorage.getItem('spordle_seen_instructions')) {
            setShowInstructions(true);
            localStorage.setItem('spordle_seen_instructions', '1');
        }
    }, []);

    const toggleAccessibility = () => {
        setAccessible(prev => !prev);
    };

    useEffect(() => {
        document.body.classList.toggle("accessible", accessible);
    }, [accessible]);

    useEffect(() => {
        // Lade verfügbare Songs
        fetch('/api/songs')
            .then(res => res.json())
            .then(data => setAvailableSongs(data))
            .catch(err => console.error('Fehler beim Laden der Songs:', err));

        // Starte neues Spiel
        startNewGame();
    }, []);

    const startNewGame = async () => {
        try {

            setAudioUrl(null);

            const response = await fetch('/api/game/start', {
                method: 'POST'
            });
            const data = await response.json();
            setSessionId(data.session_id);

            const audioUrl = data.audio_url.startsWith('http')
                ? data.audio_url
                : `${API_BASE_URL.replace('/api', '')}${data.audio_url}`;

            const audioUrlWithTimestamp = `${audioUrl}?t=${Date.now()}`;
            setAudioUrl(audioUrlWithTimestamp);

            setGuesses([]);
            setHints([]);
            setMisses(0);
            setErrorMessage('');
            setGameWon(false);
            setGameLost(false);
            setSolution(null);
        } catch (error) {
            console.error('Fehler beim erstellen der temporären Audio dateien:', error);
        }
    };

    const handleGuess = async (guessTitle) => {
        if (!sessionId || gameWon || gameLost) return;

        try {
            const response = await fetch(`/api/game/${sessionId}/guess`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title: guessTitle })
            });

            const data = await response.json();

            if (!data.valid) {
                setErrorMessage(data.message);
                setTimeout(() => setErrorMessage(''), 5000);
                return;
            }

            setErrorMessage('');
            setGuesses([...guesses, data.guess]);

            if (data.correct) {
                setGameWon(true);
                const newStreak = streak + 1;
                setStreak(newStreak);
                localStorage.setItem('spordle_streak', newStreak.toString());
            } else {
                 setMisses(data.attempts);
                            if (data.hints) {
                                const processedHints = data.hints.map(hint => {
                                    if (typeof hint === 'object' && hint.type === 'audio') {
                                        return {
                                            ...hint,
                                            url: hint.url.startsWith('http')
                                                ? hint.url
                                                : `${API_BASE_URL.replace('/api', '')}${hint.url}`
                                        };
                                    }
                                    return hint;
                                });
                                setHints(processedHints);
                            }
                if (data.attempts >= 10) {
                    setGameLost(true);
                    setSolution(data.solution);
                    setStreak(0);
                    localStorage.setItem('spordle_streak', '0');
                }
            }
        } catch (error) {
            console.error('Fehler beim Raten:', error);
            setErrorMessage('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
        }
    };

    return (
        <div className="overlay">
            <button
                className="instructions-toggle"
                onClick={() => setShowInstructions(true)}
                aria-label="Spieleanleitung anzeigen"
            >
                <span className="sr-only">Spieleanleitung anzeigen</span>
                ❓
            </button>

            {showInstructions && (
                <div className="instructions-modal">
                    <div className="instructions-content">
                        <button
                            className="instructions-close"
                            onClick={() => setShowInstructions(false)}
                            aria-label="Anleitung schließen"
                        >✖</button>
                        <h2>Spieleanleitung</h2>
                        <ul>
                            <li>Errate den Song anhand des kurzen Audioausschnitts.</li>
                            <li>Gib einen Songtitel ein und bestätige.</li>
                            <li>Nach 3, 6 und 9 Fehlversuchen erhältst du Tipps.</li>
                            <li>Du hast maximal 10 Versuche pro Runde.</li>
                        </ul>
                        <p>Viel Spaß beim Spielen!</p>
                    </div>
                </div>
            )}

            <button
                onClick={toggleAccessibility}
                className="accessibility-toggle"
                aria-label="Barrierefreier Modus umschalten"
            >
                <span className="sr-only">Barrierefreier Modus umschalten</span>
                ♿
            </button>

            <h1>🎧 Spordle</h1>

            <div className="guess-container">
                <StreakBox count={streak} />
                <HintSection misses={misses} hints={hints} />

                {audioUrl && (
                    <audio key={audioUrl} controls style={{ width: '100%', marginTop: '1rem' }}>
                        <source src={audioUrl} type="audio/mpeg" />
                        Dein Browser unterstützt kein Audio-Element.
                    </audio>
                )}

                {gameWon && (
                    <div className="game-message success">
                        🎉 Glückwunsch! Du hast den Song erraten!
                        <div style={{margin: '10px 0'}}>
                            <audio controls style={{width: '100%'}}>
                                <source src={`/api/audio/${sessionId}/reveal`} type="audio/mpeg"/>
                                Dein Browser unterstützt kein Audio-Element.
                            </audio>
                        </div>
                        <button onClick={startNewGame} className="play-again-btn">Neues Spiel</button>
                    </div>
                )}

                {gameLost && solution && (
                    <div className="game-message failure">
                        😢 Leider verloren! Der Song war: {solution.title}
                        <div style={{margin: '10px 0'}}>
                            <audio controls style={{width: '100%'}}>
                                <source src={`/api/audio/${sessionId}/reveal`} type="audio/mpeg"/>
                                Dein Browser unterstützt kein Audio-Element.
                            </audio>
                        </div>
                        <button onClick={startNewGame} className="play-again-btn">Neues Spiel</button>
                    </div>
                )}

                {!gameWon && !gameLost && (
                    <GuessInput
                        onGuess={handleGuess}
                        availableSongs={availableSongs}
                        errorMessage={errorMessage}
                    />
                )}

                <GuessTable guesses={guesses}/>
            </div>
        </div>
    );
}