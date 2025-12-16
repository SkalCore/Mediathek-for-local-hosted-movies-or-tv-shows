# 1. Basis-Image: Nutze die offizielle Node.js LTS Version
FROM node:20-slim

# 2. Setze das Arbeitsverzeichnis im Container
WORKDIR /usr/src/app

# 3. Kopiere die Paketdateien und installiere Abhängigkeiten
COPY package*.json ./

RUN npm install

# 4. Kopiere alle restlichen Dateien aus dem lokalen Ordner in das Arbeitsverzeichnis
COPY . .

# 5. Stelle sicher, dass der uploads Ordner existiert (wichtig für Poster/Logs)
RUN mkdir -p uploads

# 6. Öffne den Port, den der Server nutzt (standardmäßig 3000)
EXPOSE 3000

# 7. Definiere den Befehl, der beim Start des Containers ausgeführt wird
CMD [ "node", "server.js" ]
