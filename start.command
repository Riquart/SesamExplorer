#!/bin/bash

# Se positionner dans le dossier où se trouve le script
cd "$(dirname "$0")"

echo "============================================="
echo "   LANCEMENT DU PROJET STATS TLT"
echo "============================================="

# 1. Vérification de Node.js
if ! command -v node &> /dev/null
then
    echo "❌ Erreur : Node.js n'est pas installé sur votre machine !"
    echo "👉 Veuillez installer Node.js (version LTS recommandée) depuis : https://nodejs.org/"
    echo ""
    read -p "Appuyez sur Entrée pour quitter..."
    exit 1
fi

echo "✅ Node.js est installé ($(node -v))"

# 2. Vérification et installation des dépendances
if [ ! -d "node_modules" ]; then
    echo "📦 Aucun dossier node_modules détecté. Installation des dépendances (npm install)..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Erreur lors de l'installation des dépendances."
        read -p "Appuyez sur Entrée pour quitter..."
        exit 1
    fi
    echo "✅ Dépendances installées avec succès !"
else
    echo "✅ Les dépendances sont déjà installées."
fi

# 3. Lancement du serveur de développement
echo "🚀 Démarrage du serveur de développement (npm run dev)..."
echo "---------------------------------------------"
# Ouvrir le navigateur automatiquement après 2 secondes (le temps que le serveur démarre)
if [[ "$OSTYPE" == "darwin"* ]]; then
    (sleep 2 && open "http://localhost:3000") &
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    (sleep 2 && start "http://localhost:3000") &
fi

npm run dev
