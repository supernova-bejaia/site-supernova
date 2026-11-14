# Supernova — site public

Site de Supernova, collectif étudiant indépendant basé à Béjaïa.

Il présente le collectif et permet à tout étudiant de rejoindre l'**Orbite**, son réseau ouvert, grâce à un formulaire d'inscription. C'est la première brique d'un écosystème plus large (espace équipe, application mobile) qui partagera la même base de données.

## Pages

| Adresse | Contenu |
|---|---|
| `/` | Accueil : le collectif, les deux parcours, les événements |
| `/rejoindre` | Présentation de l'Orbite et du Noyau, formulaire d'inscription à l'Orbite |
| `/evenements` | Événements : à la une, agenda, archives et galeries photos |
| `/vos-donnees` | Informations collectées, usage, accès, suppression, contact |

## Technologies

- [Next.js](https://nextjs.org) 16 (App Router) et React 19, en JavaScript.
- Styles en CSS Modules, sans bibliothèque de composants.
- [Supabase](https://supabase.com) (PostgreSQL) pour la base de données.
- Hébergement sur [Vercel](https://vercel.com).

## Lancer le site en local

Prérequis : Node.js 20.9 ou plus récent, et npm.

1. Installer les dépendances :

   ```
   npm install
   ```

2. Créer le fichier `.env.local` à partir du modèle, puis y renseigner les deux valeurs (voir plus bas) :

   ```
   cp .env.example .env.local
   ```

3. Démarrer le serveur de développement :

   ```
   npm run dev
   ```

Le site est alors disponible sur http://localhost:3000.

Sous Windows PowerShell, si l'exécution de `npm` est bloquée, utiliser `npm.cmd` à la place de `npm`.

### Autres commandes

| Commande | Rôle |
|---|---|
| `npm run lint` | Vérifie le code avec ESLint |
| `npm run build` | Construit la version de production |
| `npm run start` | Sert la version de production construite |

## Variables d'environnement

| Nom | Rôle |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Adresse du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clé publique (« publishable ») du projet |

Les valeurs se trouvent dans Supabase, sous *Project Settings > API*. Elles sont publiques par nature : la sécurité repose sur les règles de la base de données, pas sur leur confidentialité.

La clé secrète de Supabase (`service_role`) n'est pas utilisée par ce projet et ne doit jamais y être ajoutée.

`.env.local` n'est jamais versionné. En production, les mêmes variables sont à définir dans les réglages du projet Vercel.

## Organisation du code

```
src/
  app/                 pages (un dossier par page)
  actions/             Server Actions (appelées par les formulaires)
  components/
    layout/            présent sur toutes les pages : Header, Footer, Logo
    rejoindre/         le formulaire d'inscription
  services/            accès aux données, un fichier par domaine
  content/             contenus statiques (événements)
  lib/                 outils : client Supabase, validation, dates, réglages
supabase/migrations/   schéma de la base, en fichiers SQL versionnés
docs/                  documentation du projet
```

Le sens des dépendances est toujours : **page ou Server Action → service → lib**. Seuls les services parlent à Supabase.

Les listes du formulaire (établissements, niveaux d'études, filières) se modifient dans `src/lib/formulaire-orbite.js`, l'adresse de contact dans `src/lib/site.js`.

## Base de données

Le schéma est décrit dans [docs/modele-de-donnees.md](docs/modele-de-donnees.md) et défini par les fichiers de `supabase/migrations/`.

En résumé :

- cinq tables : `personne`, `saison`, `adhesion`, `centre_interet`, `interet_adhesion` ;
- la sécurité au niveau des lignes (RLS) est activée partout : un visiteur ne peut lire que la liste des centres d'intérêt ;
- les inscriptions passent uniquement par la fonction `inscrire_orbite`.

Toute évolution du schéma s'écrit dans un nouveau fichier de migration.

## Déploiement

Le site est déployé sur Vercel à partir de ce dépôt : chaque envoi sur la branche `main` met le site en ligne. Les deux variables d'environnement doivent être définies dans le projet Vercel pour que le formulaire fonctionne.

## Documentation

- [docs/modele-de-donnees.md](docs/modele-de-donnees.md) — tables, fonction d'inscription, sécurité, décisions.
- [docs/evenements.md](docs/evenements.md) — ajouter un événement et ses photos.
- [CLAUDE.md](CLAUDE.md) — contexte du projet et règles de travail pour Claude Code.
