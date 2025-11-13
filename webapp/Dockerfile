# Utiliser Node 20 Alpine pour légèreté
FROM node:20-alpine

# Créer le dossier de travail
WORKDIR /app

# Copier uniquement package.json et package-lock.json pour installer deps
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier tout le code source
COPY . .

# Exposer le port Vite par défaut
EXPOSE 5173

# Lancer Vite en dev avec host 0.0.0.0 pour Docker
CMD ["npm", "run", "dev", "--", "--host"]