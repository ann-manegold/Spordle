import React, { useState, useEffect } from "react";

function StreakBox({ count }) {
    return <div className="streak-box">🥩 Streak: <span>{count}</span></div>;
}

function HintSection() {
    return (
        <div className="hint-progress-container">
            <div className="progress-label">❌ Fehlversuche: 5 / 9</div>
            <div className="progress-bar-wrapper">
                <div className="progress-bar-fill" style={{ width: '55%' }}></div>
            </div>
            <div className="hint-buttons">
                <details className="hint unlocked">
                    <summary>💡 Tipp 1</summary>
                    <p>Der Song ist sehr bekannt auf TikTok.</p>
                </details>
                <details className="hint locked" onClick={(e) => e.preventDefault()}>
                    <summary>💡 Tipp 2</summary>
                    <p>Der Artist kommt aus Kanada.</p>
                </details>
                <details className="hint locked" onClick={(e) => e.preventDefault()}>
                    <summary>💡 Tipp 3</summary>
                    <p>Der Titel enthält eine Farbe.</p>
                </details>
            </div>
        </div>
    );
}

function AudioPlayer() {
    return (
        <div className="player-container">
            <div className="audio-player">
                <button className="play-button">▶️</button>
                <div className="progress-bar">
                    <div className="progress-fill"></div>
                </div>
            </div>
        </div>
    );
}

function SpotifyPlayer({ trackId }) {
    return (
        <div className="player-container">
            <iframe
                title="Spotify Player"
                src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator`}
                width="100%"
                height="80"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                style={{ borderRadius: '12px' }}
                loading="lazy"
            ></iframe>
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
            <div className="guess-row">
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
    const [previewUrl, setPreviewUrl] = useState(null);

    const toggleAccessibility = () => {
        setAccessible(prev => !prev);
    };

    useEffect(() => {
        document.body.classList.toggle("accessible", accessible);
    }, [accessible]);



    useEffect(() => {
        const fetchPreviewUrl = async () => {
            const clientId = "69d50dbfe15447c18423fd02e688b7f4";
            const clientSecret = "";
            const trackId = "4uLU6hMCjMI75M1A2tKUQC"; // Beispiel: Shape of You

            try {
                const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
                    method: "POST",
                    headers: {
                        Authorization: "Basic " + btoa(`${clientId}:${clientSecret}`),
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: "grant_type=client_credentials",
                });

                const tokenData = await tokenResponse.json();
                const token = tokenData.access_token;

                const trackResponse = await fetch(
                    `https://api.spotify.com/v1/tracks/${trackId}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                const trackData = await trackResponse.json();
                //setPreviewUrl(trackData.preview_url);
                setPreviewUrl("https://p.scdn.co/mp3-preview/7339548839a263fd721d01eb3364a848cad16fa7");
                console.log("Preview URL:", trackData.preview_url);
            } catch (error) {
                console.error("Fehler beim Laden der preview_url:", error);
            }
        };

        fetchPreviewUrl();
    }, []);


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
                ♿
            </button>




            <h1>🎧 Spordle</h1>
            <div className="guess-container">
                <StreakBox count={streak} />
                <HintSection />
                {previewUrl ? (
                    <audio controls style={{ width: '100%', marginTop: '1rem' }}>
                        <source src={previewUrl} type="audio/mpeg" />
                        Dein Browser unterstützt kein Audio-Element.
                    </audio>
                ) : (
                    <p style={{ color: '#ccc', marginTop: '1rem' }}>
                        🎵 Keine Vorschau verfügbar für diesen Song
                    </p>
                )}
                <GuessInput />
                <GuessTable guesses={guesses} />
            </div>
        </div>
    );
}
