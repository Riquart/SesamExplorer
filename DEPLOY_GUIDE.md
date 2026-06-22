# Guide de Déploiement Production - SESAM Explorer (Next.js)

Ce guide décrit pas à pas comment déployer votre application professionnelle **Next.js** sur votre serveur **VPS Hostinger** (généralement sous Ubuntu Server).

En utilisant la version originale Next.js, vous conservez le rendu haut de gamme, les animations fluides de **Framer Motion**, et les graphiques précis de **Recharts**, sans aucun problème de CORS (géré côté serveur par le proxy API).

---

## 📋 Prérequis sur le VPS

Assurez-vous de pouvoir vous connecter en SSH à votre VPS Hostinger.

### 1. Installer Node.js (via NVM)
Il est fortement recommandé d'utiliser **NVM** (Node Version Manager) pour installer et gérer Node.js sur un serveur de production.

Exécutez ces commandes sur votre VPS :
```bash
# Télécharger et installer NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Charger NVM dans votre terminal actuel
source ~/.bashrc

# Installer la version LTS recommandée de Node.js (ex: 20)
nvm install 20
nvm use 20
node -v  # Doit afficher v20.x.x
```

### 2. Installer PM2 (Process Manager)
PM2 permet de faire tourner l'application Next.js en arrière-plan, de la redémarrer automatiquement en cas de crash ou après un redémarrage du VPS.
```bash
npm install -g pm2
```

---

## 🚀 Étape 1 : Téléverser le code sur le VPS

Vous avez deux méthodes simples :

### Méthode A : Via Git (Recommandé)
Poussez votre projet sur un dépôt Git privé (GitHub ou GitLab), puis clonez-le sur votre VPS :
```bash
cd /var/www
git clone <URL_DE_VOTRE_DEPOT_PRIVE> stats-tlt
cd stats-tlt
```

### Méthode B : Via SFTP (FileZilla ou Cyberduck)
Compressez votre dossier de travail en excluant les dossiers lourds. Vous pouvez utiliser le fichier `projet-stats.zip` déjà généré à la racine.
1. Connectez-vous en SFTP à votre VPS.
2. Déposez l'archive dans `/var/www/` par exemple.
3. Connectez-vous en SSH à votre VPS et décompressez-la :
   ```bash
   cd /var/www
   unzip projet-stats.zip -d stats-tlt
   cd stats-tlt
   ```

---

## 🛠️ Étape 2 : Préparer et Compiler l'Application

Sur le VPS, lancez l'installation et la compilation :

```bash
# 1. Installer les dépendances de production
npm install

# 2. Compiler le projet pour la production (génère le dossier ultra-optimisé .next)
npm run build
```
*(Le build a été entièrement corrigé et testé avec succès, il se compilera sans aucune erreur !)*

---

## 🏃‍♂️ Étape 3 : Lancer avec PM2 en mode Cluster (Haute Performance)

Pour exploiter toute la puissance de votre VPS, nous avons créé un fichier `ecosystem.config.js` à la racine de votre projet. Il configure PM2 pour exécuter Next.js en **mode Cluster** (répartition de charge sur tous les cœurs du CPU).

Lancez simplement l'application avec la commande :
```bash
pm2 start ecosystem.config.js
```

### Commandes utiles pour gérer le serveur :
* **Voir l'état de l'application** : `pm2 status`
* **Voir les logs en direct** : `pm2 logs sesam-explorer`
* **Redémarrer l'application** : `pm2 restart sesam-explorer`
* **Arrêter l'application** : `pm2 stop sesam-explorer`

Pour s'assurer que PM2 redémarre automatiquement après un reboot du VPS :
```bash
pm2 startup
# (Copiez-collez la commande renvoyée par le terminal pour finaliser la configuration)
pm2 save
```

L'application tourne maintenant en local sur le VPS sur le port **`3000`**.

---

## 🌐 Étape 4 : Configurer le nom de domaine et le Reverse Proxy (Nginx)

Pour que l'application soit accessible publiquement via votre nom de domaine (ex: `https://sesam.votredomaine.com`), configurez **Nginx** comme Reverse Proxy.

### 1. Installer Nginx
```bash
sudo apt update
sudo apt install nginx -y
```

### 2. Configurer le bloc serveur
Créez un fichier de configuration pour votre site :
```bash
sudo nano /etc/nginx/sites-available/sesam-explorer
```

Collez la configuration suivante (remplacez `sesam.votredomaine.com` par votre domaine ou sous-domaine) :
```nginx
server {
    listen 80;
    server_name sesam.votredomaine.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Activer la configuration et redémarrer Nginx
```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/sesam-explorer /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl restart nginx
```

---

## 🔒 Étape 5 : Sécuriser avec un certificat SSL gratuit (HTTPS)

Utilisez **Certbot** (Let's Encrypt) pour sécuriser l'accès en HTTPS en une seule commande :

```bash
# Installer Certbot et le plugin Nginx
sudo apt install certbot python3-certbot-nginx -y

# Générer et installer le certificat SSL
sudo certbot --nginx -d sesam.votredomaine.com
```
*Suivez les instructions à l'écran. Certbot configurera automatiquement la redirection HTTP vers HTTPS et s'occupera du renouvellement automatique du certificat.*

---

✨ **Félicitations !** Votre projet **SESAM Explorer** original est maintenant en ligne, ultra-performant, sécurisé en HTTPS, et accessible à tous vos collègues avec son design d'origine de qualité professionnelle !
