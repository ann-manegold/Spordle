FROM python:3.11-slim

WORKDIR /app

# Installiere System-Dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Kopiere requirements und installiere Python-Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopiere App-Code
COPY . .

# Erstelle notwendige Verzeichnisse mit korrekten Berechtigungen
RUN mkdir -p /app/data /app/uploads /app/instance && \
    chmod -R 777 /app/data /app/uploads /app/instance

# Kopiere Entrypoint-Skript
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# Exponiere Port
EXPOSE 5000

# Starte die App über Entrypoint
ENTRYPOINT ["/app/docker-entrypoint.sh"]