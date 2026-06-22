# Guide de Reconstruction - SESAM Explorer (Statistiques de Télétransmission)

Ce guide complet contient toutes les instructions, architectures de fichiers et codes sources nécessaires pour reconstruire ce projet à partir de zéro.

## 🌟 Présentation du Projet

**SESAM Explorer** (ou **StatsTLT**) est un tableau de bord analytique moderne construit avec **Next.js** (App Router) et **Tailwind CSS**. Il permet de visualiser en temps réel et sous forme de projections le parc de télétransmission SESAM-Vitale des professionnels de santé en France. 

Il intègre des graphiques dynamiques avec **Recharts**, des calculs d'évolution historique, des ventilations par profession, des analyses de performances à 1 mois, 6 mois et 1 an, ainsi qu'un comparateur avec projections prédictives basées sur une régression linéaire par moindres carrés.

---

## 🛠️ Stack Technique

Le projet utilise les technologies et versions suivantes :

*   **Framework :** Next.js 16.1.6 (App Router + Turbopack)
*   **Bibliothèque UI :** React 19.2.3 & React DOM 19.2.3
*   **Langage :** TypeScript (TSConfig fourni)
*   **Design & Style :** Tailwind CSS ^4 (avec `@tailwindcss/postcss`)
*   **Graphiques :** Recharts ^3.7.0
*   **Utilitaires de Date :** date-fns ^4.1.0
*   **Icônes :** lucide-react ^0.563.0

---

## 📁 Architecture des Fichiers

Voici l'arborescence des fichiers du projet que vous allez devoir créer :

```text
StatsTLT/
├── app/
│   ├── api/
│   │   └── proxy/
│   │       └── route.ts         # Route API Proxy pour contourner le CORS
│   ├── compare/
│   │   └── page.tsx             # Page Comparateur & Projections
│   ├── focus/
│   │   └── page.tsx             # Page Focus Métrique Entité
│   ├── performance/
│   │   └── page.tsx             # Page Analyse de Performance
│   ├── favicon.ico
│   ├── globals.css              # Styles Tailwind CSS globaux
│   ├── layout.tsx               # Layout principal de l'application
│   ├── manifest.ts              # Manifest PWA/Meta
│   └── page.tsx                 # Page Dashboard Principal (Accueil)
├── components/
│   ├── dashboard/
│   │   ├── ComparisonChart.tsx  # Graphique de comparaison historique/projection
│   │   ├── DistributionChart.tsx# Graphique de répartition en barres horizontales
│   │   ├── EvolutionChart.tsx   # Graphique en aires de l'évolution (avec plein écran)
│   │   ├── FilterBar.tsx        # Barre de filtres principale (Profession, Année, Recherche)
│   │   ├── PerformanceChart.tsx # Graphique de performance des variations (1M, 6M, 12M)
│   │   ├── PerformanceTable.tsx # Tableau de classement des performances triable
│   │   ├── ProfessionDistributionChart.tsx # Graphique en secteurs (Pie) de répartition
│   │   ├── ProfessionPerformanceChart.tsx  # Graphique en barres horizontales de performance
│   │   ├── StatCard.tsx         # Carte statistique détaillée avec tendances
│   │   └── StatsCard.tsx        # Carte statistique simplifiée
│   └── ui/
│       ├── button.tsx           # Composant Bouton réutilisable
│       ├── card.tsx             # Composant Conteneur Card réutilisable
│       └── select.tsx           # Composant Sélecteur HTML stylisé
├── lib/
│   ├── api.ts                   # Logique d'appel vers l'API Proxy
│   ├── colors.ts                # Palette de couleurs unifiée et déterministe
│   ├── data-utils.ts            # Logique d'agrégation, calculs de régression linéaire et performances
│   └── types.ts                 # Définition des types TypeScript
├── package.json                 # Dépendances et scripts de build
├── postcss.config.mjs           # Configuration PostCSS
├── tsconfig.json                # Configuration TypeScript compiler
├── eslint.config.mjs            # Configuration Eslint
└── next.config.ts               # Configuration Next.js
```

---

## 🚀 Étape 1 : Initialisation & Installation

### 1. Initialiser le projet Next.js avec TypeScript et Tailwind v4
Exécutez dans votre terminal vide :
```bash
npx -y create-next-app@16.1.6 ./ --typescript --eslint --src-dir=false --app --import-alias="@/*"
```

### 2. Mettre à jour le fichier `package.json`
Modifiez votre fichier `package.json` pour y inclure les dépendances requises :
```json
{
  "name": "stats-tlt",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "framer-motion": "^12.29.2",
    "lucide-react": "^0.563.0",
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "recharts": "^3.7.0",
    "tailwind-merge": "^3.4.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.6",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```
Exécutez `npm install` pour installer toutes les dépendances.

---

## 🛠️ Fichiers de Configuration Standard

### `next.config.ts`
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

### `postcss.config.mjs`
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## 📖 Sommaire du Guide de Reconstruction

Veuillez consulter les fichiers suivants dans l'ordre pour implémenter chaque partie du projet :

1.  **[01 - Couche Données (Data Layer)](./01-data-layer.md) :** Types TS, palette de couleurs cohérente, logique API Proxy et utilitaires complexes d'agrégation, calculs de variations et algorithme de régression linéaire.
2.  **[02 - Composants UI et Graphiques](./02-ui-components.md) :** Boutons, sélecteurs, conteneurs Card, et les graphiques Recharts interactifs personnalisés avec support plein écran.
3.  **[03 - Pages et Routage](./03-pages-routing.md) :** Layout global, pages du Dashboard, Focus, Comparateur de Projections, Analyse de Performance et Route API Proxy.
