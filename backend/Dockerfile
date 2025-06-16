FROM python:3.11-slim

WORKDIR /app

# Installiere System-Dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Kopiere Requirements und installiere Python-Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopiere Backend-Code
COPY app.py .

# Erstelle Upload-Ordner
RUN mkdir -p uploads/songs

# Exponiere Port
EXPOSE 5000

# Starte die Anwendung
CMD ["python", "app.py"]