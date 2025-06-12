import React, { useState, useEffect } from "react";

function StreakBox({ count }) {
    return (
        <div className="streak-box">
            🥩 Streak: <span className="streak-count">{count}</span>
        </div>
    );
}

function HintSection({ misses = 5 }) {
    const handleLockedClick = (e) => {
        e.preventDefault();
        alert("Dieser Tipp ist noch gesperrt!");
    };

    return (
        <div className="hint-progress-container">
            <div className="progress-label">❌ Fehlversuche: {misses} / 9</div>
            <div className="progress-bar-wrapper">
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
                    <summary>💡 Tipp 1 nach 3❌</summary>
                    <p>Der Song ist sehr bekannt auf TikTok.</p>
                </details>
                <details
                    className={`hint ${misses >= 6 ? "unlocked" : "locked"}`}
                    onClick={misses < 6 ? handleLockedClick : undefined}
                >
                    <summary>💡 Tipp 2 nach 6❌</summary>
                    <p>Der Artist kommt aus Kanada.</p>
                </details>
                <details
                    className={`hint ${misses >= 9 ? "unlocked" : "locked"}`}
                    onClick={misses < 9 ? handleLockedClick : undefined}
                >
                    <summary>💡 Tipp 3 nach 9❌</summary>
                    <p>Der Titel enthält eine Farbe.</p>
                </details>
            </div>
        </div>
    );
}

function GuessInput() {
    return (
        <form className="input-row">
            <input type="text" placeholder="🎵 Gib einen Songtitel ein…" />
        </form>
    );
}

function GuessRow({ guess }) {
    return (
        <div className="guess-row">
            <div className="guess-cell cover" style={{ backgroundImage: `url(${guess.cover})` }}>
                {guess.title}
            </div>
            <div className={`guess-cell ${guess.artistStatus}`}>{guess.artist}</div>
            <div className={`guess-cell ${guess.yearStatus}`}>{guess.year}</div>
            <div className={`guess-cell ${guess.genreStatus}`}>{guess.genre}</div>
            <div className={`guess-cell ${guess.typeStatus}`}>{guess.type}</div>
            <div className={`guess-cell ${guess.lengthStatus}`}>{guess.length}</div>
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
            {guesses.map((guess, idx) => <GuessRow key={idx} guess={guess} />)}
        </>
    );
}

export default function App() {
    const [accessible, setAccessible] = useState(false);

    const toggleAccessibility = () => {
        setAccessible(prev => !prev);
    };

    useEffect(() => {
        document.body.classList.toggle("accessible", accessible);
    }, [accessible]);

    const [streak, setStreak] = useState(3);

    const guesses = [
        {
            cover: 'assets/images/SOY-Cover.png',
            title: 'Shape of You',
            artist: 'Ed Sheeran', artistStatus: 'correct',
            year: '2017', yearStatus: 'wrong hint-bg-up',
            genre: 'Pop', genreStatus: 'wrong',
            type: 'Album', typeStatus: 'partial',
            length: '4:24', lengthStatus: 'wrong hint-bg-down'
        },
        {
            cover: 'assets/images/BL-Cover.png',
            title: 'Blinding Lights',
            artist: 'The Weeknd', artistStatus: 'wrong',
            year: '2020', yearStatus: 'correct',
            genre: 'Synthpop', genreStatus: 'partial',
            type: 'EP', typeStatus: 'correct',
            length: '3:45', lengthStatus: 'wrong hint-bg-down'
        }
    ];

    return (
        <div className="overlay">
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
                <HintSection />
                <audio controls style={{ width: '100%', marginTop: '1rem' }}>
                    <source src="https://p.scdn.co/mp3-preview/7339548839a263fd721d01eb3364a848cad16fa7" type="audio/mpeg" />
                    Dein Browser unterstützt kein Audio-Element.
                </audio>
                <GuessInput />
                <GuessTable guesses={guesses} />
            </div>
        </div>
    );
}
