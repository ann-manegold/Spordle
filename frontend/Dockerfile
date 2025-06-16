FROM node:18-alpine as build

WORKDIR /app

# Kopiere package.json und package-lock.json (falls vorhanden)
COPY package*.json ./

# Installiere Dependencies
RUN npm install

# Kopiere den Rest der Anwendung
COPY public ./public
COPY src ./src

# Baue die Anwendung
RUN npm run build

# Production Stage
FROM nginx:alpine

# Kopiere die gebaute App
COPY --from=build /app/build /usr/share/nginx/html

# Kopiere nginx Konfiguration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponiere Port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]