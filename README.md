# Supernova — site public

Site de Supernova, collectif étudiant indépendant basé à Béjaïa.

Il présente le collectif, publie ses articles et permet à tout étudiant de rejoindre l'**Orbite**, son réseau ouvert, grâce à un formulaire d'inscription. C'est la première brique d'un écosystème plus large (espace équipe, application mobile) qui partagera la même base de données.

## Pages

| Adresse | Contenu |
|---|---|
| `/` | Accueil : le collectif, les deux parcours, les événements |
| `/notre-histoire` | Notre histoire (page en préparation) |
| `/rejoindre` | Présentation de l'Orbite et du Noyau, formulaire d'inscription à l'Orbite |
| `/evenements` | Événements : à la une, agenda, archives et galeries photos |
| `/articles` | Liste des articles publiés |
| `/articles/[slug]` | Lecture d'un article |
| `/vos-donnees` | Informations collectées, usage, accès, suppression, contact |
| `/admin` | Espace équipe, réservé aux comptes autorisés (voir plus bas) |
| `/admin/connexion` | Connexion de l'équipe par email et mot de passe |
| `/admin/articles` | Tous les articles, brouillons compris |
| `/admin/articles/nouveau` | Écrire un article |
| `/admin/articles/[id]` | Modifier, publier, dépublier ou supprimer un article |
| `/admin/articles/[id]/apercu` | Aperçu d'un article, tel qu'il apparaîtra sur le site |

## Espace équipe (`/admin`)

L'outil des membres autorisés du Noyau : un tableau de bord des inscriptions, **en lecture seule**, et la rédaction des articles. Il n'apparaît pas dans le menu (un lien discret figure dans le pied de page) et n'est pas indexé par les moteurs de recherche.

Le tableau de bord affiche, pour la saison en cours :

- une vue d'ensemble : membres de l'Orbite, membres du Noyau, inscriptions des 7 et 30 derniers jours, abonnés à la newsletter ;
- les dernières inscriptions ;
- la répartition par établissement et par centre d'intérêt.

Fonctionnement :

- **Connexion** : par email et mot de passe, avec Supabase Auth. Le site ne propose aucune création de compte : les comptes sont créés par l'équipe dans Supabase.
- **Autorisation** : avoir un compte ne suffit pas. Les droits suivent les fonctions : la fonction `mon_niveau()` donne le niveau du compte (1 membre du Noyau, 2 Head of, 3 Président ou Chief Supervisor). Il faut au moins être membre du Noyau ; un compte connecté mais sans niveau est déconnecté.
- **Ce que permet chaque niveau** : un membre écrit des brouillons et modifie les siens ; un Head of modifie, publie et archive tous les articles ; la direction supprime définitivement et seule voit les téléphones et emails des inscrits. Les boutons affichés suivent ces droits, et la base les vérifie elle-même.
- **Contrôle côté serveur** : `src/proxy.js` rafraîchit la session sur les adresses `/admin`, et chaque page de l'espace vérifie la session et l'autorisation avant de lire la moindre donnée (`src/lib/acces-admin.js`). Les données sont filtrées par les règles RLS de la base, pas par l'interface.
- **Session** : stockée dans des cookies `HttpOnly`, inaccessibles au JavaScript de la page.

Donner l'accès à un membre se fait dans Supabase : créer son compte (*Authentication > Users*), l'ajouter à la table `acces_admin` en le reliant à sa fiche `personne` (`id_personne`), et lui donner une adhésion NOYAU pour la saison active. Les fonctions (Head of…) se donnent ensuite avec `nommer()`.

## Carnet de contacts

Réservé aux membres du Noyau, dans l'espace équipe (`/admin/contacts`), et pensé d'abord pour le téléphone : ajouter une personne rencontrée prend moins d'une minute.

- **Ajouter** : nom, organisation et poste (ou « sans organisation »), lieu et date de la rencontre, visibilité. Le reste (téléphones, emails, pourquoi, conditions, notes, partenaire) est facultatif. Les organisations déjà saisies sont proposées, et un contact du même nom est signalé.
- **Visibilité** : *Équipe* (tout le monde voit tout), *Restreint* (tout le monde voit la fiche, les coordonnées restent au référent et aux membres qu'il autorise), *Privé* (le référent seul). La base applique ces règles elle-même.
- **Fiche** : boutons « Appeler » et « Écrire » ; sinon, « contact détenu par [référent] ».
- **Modifier** : le référent modifie tout ; un Head of ou la direction modifie un contact non privé, sans changer sa visibilité ni ses conditions.
- Aucune coordonnée dans les notes : la base refuse un email ou un numéro.

## Articles

Les articles s'écrivent depuis l'espace équipe et se lisent sur `/articles`.

- **Écriture** : titre, adresse (déduite du titre si elle est laissée vide), résumé, texte et image de couverture facultative. Un article est un **brouillon**, invisible du public, tant qu'il n'est pas **publié**. Il peut être dépublié, **archivé** (retiré du site, récupérable) ou supprimé.
- **Texte en Markdown** : intertitres, gras, italique, liens, listes, citations. Un aide-mémoire figure sous le champ de saisie. Le texte n'est jamais interprété comme du HTML, et les images dans le texte sont désactivées.
- **Image de couverture** : JPEG, PNG ou WebP, 2 Mo au plus, enregistrée dans le stockage Supabase `articles`. Elle est recadrée en 16/9 dans la liste et affichée entière sur la page de l'article.
- **Aperçu** : la page d'aperçu montre la dernière version enregistrée, avec la mise en page du site public.
- **Mise à jour du site** : les pages publiques gardent les articles en mémoire ; cette mémoire est vidée à chaque enregistrement, le site est donc à jour aussitôt.

C'est la seule écriture ouverte à l'espace équipe : les inscriptions restent en lecture seule. Comme pour le reste, c'est la base qui autorise ou refuse chaque opération.

## Technologies

- [Next.js](https://nextjs.org) 16 (App Router) et React 19, en JavaScript.
- Styles en CSS Modules, sans bibliothèque de composants.
- [Supabase](https://supabase.com) : base de données PostgreSQL, connexion de l'équipe et stockage des images.
- [react-markdown](https://github.com/remarkjs/react-markdown) pour afficher le texte des articles (rendu sur le serveur).
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
  app/                 pages (un dossier par page, dont admin/)
  actions/             Server Actions : inscription, connexion de l'équipe, articles
  components/
    layout/            présent sur toutes les pages : en-tête, menu, pied de page, logo
    rejoindre/         le formulaire d'inscription
    evenements/        cartes et galeries d'événements
    articles/          carte d'un article, page de lecture, rendu du Markdown
    admin/             tableau de bord, formulaire de connexion, formulaire d'article
    emblemes/          illustrations animées de l'Orbite et du Noyau
    mouvement/         apparition progressive des blocs au défilement
  services/            accès aux données, un fichier par domaine
  content/             contenus statiques (événements)
  lib/                 outils : clients Supabase, accès à l'espace équipe, validation, dates, réglages
  proxy.js             rafraîchissement de la session sur /admin
supabase/migrations/   schéma de la base, en fichiers SQL versionnés
docs/                  documentation du projet
```

Le sens des dépendances est toujours : **page ou Server Action → service → lib**. Seuls les services parlent à Supabase.

Les listes du formulaire (établissements, niveaux d'études, filières) se modifient dans `src/lib/formulaire-orbite.js` ; l'adresse de contact, les réseaux et les pages du menu dans `src/lib/site.js`.

## Base de données

Le schéma est décrit dans [docs/modele-de-donnees.md](docs/modele-de-donnees.md) et défini par les fichiers de `supabase/migrations/`.

En résumé :

- cinq tables pour les inscriptions : `personne`, `saison`, `adhesion`, `centre_interet`, `interet_adhesion` ;
- une table `article`, et un espace de stockage `articles` pour les images de couverture ;
- une table `acces_admin`, la liste des comptes autorisés à l'espace équipe, fermée à toute lecture directe ;
- la sécurité au niveau des lignes (RLS) est activée partout : un visiteur ne peut lire que la liste des centres d'intérêt et les articles publiés ; seuls les comptes autorisés lisent les inscriptions et écrivent les articles ;
- les inscriptions passent uniquement par la fonction `inscrire_orbite`, l'autorisation par la fonction `mon_niveau`.

Toute évolution du schéma s'écrit dans un nouveau fichier de migration.

## Déploiement

Le site est déployé sur Vercel à partir de ce dépôt : chaque envoi sur la branche `main` met le site en ligne. Les deux variables d'environnement doivent être définies dans le projet Vercel pour que le site fonctionne.

Le code et la base doivent rester alignés : une migration s'applique à Supabase avant l'envoi du code qui en dépend.

## Documentation

- [docs/modele-de-donnees.md](docs/modele-de-donnees.md) — tables, fonctions, sécurité, décisions.
- [docs/evenements.md](docs/evenements.md) — ajouter un événement et ses photos.
