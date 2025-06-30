# 🎧 Spordle

Ein Musik-basiertes Ratespiel im Stil von Wordle, bei dem Songs anhand kurzer Audio-Ausschnitte erraten werden müssen.

## 📋 Übersicht

Spordle ist ein interaktives Webspiel, das Musikliebhabende herausfordert, Songs anhand kurzer Audio-Clips zu identifizieren. Das Spiel kombiniert die Mechanik von Wordle mit Musikerkennung und bietet ein progressives Hinweissystem, das bei falschen Antworten aktiviert wird.

## ✨ Features

### Spielmechanik
- **Audio-basiertes Raten**: 7-Sekunden-Audioausschnitt als Haupthinweis
- **Progressives Hinweissystem**:
    - Nach 3 Fehlversuchen: Texthinweis
    - Nach 6 Fehlversuchen: Blurred Album-Cover
    - Nach 9 Fehlversuchen: 15-Sekunden-Audioausschnitt
- **Detailliertes Feedback**: Vergleich von Künstler, Jahr, Genre, Typ und Songlänge
- **Streak-System**: Verfolge deine Erfolgssträhne

### Technische Features
- **Autocomplete-Suche**: Intelligente Songvorschläge während der Eingabe
- **Metadaten-Extraktion**: Automatische Erkennung von Song-Informationen aus MP3-Dateien

## 🛠️ Technologie-Stack

### Frontend
- **React**: Benutzeroberfläche und Zustandsverwaltung
- **CSS3**: Styling mit modernen Features

### Backend
- **Flask**: Python-Web-Framework
- **SQLAlchemy**: ORM für Datenbankoperationen
- **SQLite**: Lokale Datenbank
- **PyDub**: Audio-Verarbeitung
- **eyeD3**: MP3-Metadaten-Extraktion

## KI
- Inline Completion von Github-Copilot
- ChatGPT unterstützend beim Übernehmen des Designs auf die Admin-Page und beim Trouble Shooting
- ChatGPT beim erstellen der Readme und teilweise bei den Kommentaren
- Gemini/ Microsoft Copilot Suchvorschläge bei Google-Suchen

## 🚀 Installation & Setup

### Voraussetzungen
- Python 3.8+
- Node.js 14+
- npm oder yarn

## Setup
Für die Anleitung zum Setup, gerne in die `DEPLOYMENT_ANLEITUNG.md` schauen

## 🎮 Spielanleitung

1. **Spiel starten**: Klicke auf "Neues Spiel" oder lade die Seite
2. **Audio anhören**: Höre den 7-Sekunden-Clip
3. **Song raten**: Gib den Songtitel in das Eingabefeld ein
4. **Feedback erhalten**: Sieh dir die Vergleichstabelle an
5. **Hinweise nutzen**: Bei Fehlversuchen werden automatisch Hinweise freigeschaltet
6. **Gewinn/Verlust**: Errate den Song oder verliere nach 10 Versuchen

### Feedback-System
- 🟢 **Grün**: Korrekte Übereinstimmung
- 🟡 **Gelb**: Teilweise Übereinstimmung
- 🔴 **Rot**: Keine Übereinstimmung
- ⬆️ **Pfeil nach oben**: Zielwert ist höher
- ⬇️ **Pfeil nach unten**: Zielwert ist niedriger

## 🎯 Zukünftige Erweiterungen

- [ ] Tägliche Challenges
- [ ] Diverse Spiel-Kategorien
- [ ] Ranglistensystem
- [ ] ...


## 🤝 Beitragen

1. Fork das Repository (`https://github.com/ann-manegold/Spordle`)
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne eine Pull Request

---

**Viel Spaß beim Raten! 🎵**
