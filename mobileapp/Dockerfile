# =====================================================================
# Étape 1: L'environnement de construction (The Builder)
# On utilise une image qui contient déjà le SDK Flutter et Android.
# =====================================================================
FROM ghcr.io/cirruslabs/flutter:3.38.0-0.1.pre AS builder

# Définit le répertoire de travail dans le conteneur
WORKDIR /app

# Copie des fichiers de dépendances en premier pour profiter du cache Docker.
# Si ces fichiers не changent pas, Docker réutilisera le layer mis en cache.
COPY pubspec.yaml pubspec.lock ./
RUN flutter pub get

# Copie tout le reste du code source de l'application
COPY . .

# Nettoie les builds précédents (bonne pratique)
RUN flutter clean

# Construit l'APK en mode "release".
# L'APK généré se trouvera dans /app/build/app/outputs/flutter-apk/app-release.apk
RUN flutter build apk --release

# =====================================================================
# Étape 2: L'image finale (The Final Image)
# On utilise une image légère pour contenir l'APK et exécuter la commande finale.
# =====================================================================
FROM alpine:latest

# Définit le répertoire de travail
WORKDIR /app

# Copie UNIQUEMENT l'APK généré depuis l'étape "builder" et le renomme en client.apk
COPY --from=builder /app/build/app/outputs/flutter-apk/app-release.apk client.apk

CMD ["echo", "APK ready"]
