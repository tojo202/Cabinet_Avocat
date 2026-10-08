# Étape 1 : Build de l'application React PWA
FROM node:24-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

# Étape 2 : Serveur Nginx Production PWA
FROM nginx:alpine

# Copier la configuration Nginx optimisée PWA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers statiques générés (HTML, JS, PWA sw.js, manifest)
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
