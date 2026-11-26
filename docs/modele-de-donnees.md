# Modèle de données

Ce document décrit la base de données de Supernova : ce qui existe aujourd'hui, les décisions prises, et ce qui reste à créer.

- **Référence d'origine** : le modèle logique complet de l'équipe (document interne, non publié).
- **Schéma réel** : les fichiers de `supabase/migrations/`, appliqués au projet Supabase `vsfxylbexgchxsjbopxr`.

Toute évolution du schéma se propose d'abord, puis s'écrit dans un nouveau fichier de migration.

## Ce qui existe (migrations du 12 novembre 2026)

Cinq tables, celles nécessaires à l'inscription Orbite.

| Table | Rôle |
|---|---|
| `personne` | Une ligne par individu, identifié par son email (unique, sans tenir compte des majuscules). |
| `saison` | Une période d'activité. Une seule saison peut être `ACTIVE` à la fois. |
| `adhesion` | Le lien entre une personne et une saison, de type `ORBITE` ou `NOYAU`. Une seule adhésion par personne et par saison. |
| `centre_interet` | La liste des centres d'intérêt proposés. |
| `interet_adhesion` | Les centres d'intérêt choisis pour une adhésion. |

```
personne 1 ── n adhesion n ── 1 saison
                    │
                    n
             interet_adhesion n ── 1 centre_interet
```

### Fonction `inscrire_orbite`

Seule porte d'entrée du formulaire public. En une transaction, elle vérifie les champs, trouve la saison active, crée la personne (ou, si son email est déjà connu, met à jour ses seules informations d'études), crée ou met à jour son adhésion (sans jamais changer son type) et remplace ses centres d'intérêt.

### Sécurité

- La RLS est activée sur les cinq tables.
- Un visiteur ne peut lire que `centre_interet`. Il ne peut ni lire ni écrire ailleurs.
- Il peut seulement exécuter `inscrire_orbite`.

## Espace équipe (migration du 13 novembre 2026)

| Élément | Rôle |
|---|---|
| `acces_admin` | La liste des comptes de connexion autorisés à l'espace équipe, chacun relié à sa personne (`id_personne`, ajouté le 26/11). RLS activée et aucune règle : la table n'est lisible par personne depuis le site, elle se gère dans Supabase. |
| `est_admin()` | Fonction qui répond si le compte connecté figure dans `acces_admin`. Elle ne renvoie qu'un oui ou un non. |

Les comptes autorisés peuvent **lire** `personne`, `adhesion`, `interet_adhesion` et `saison`. Ils n'y écrivent rien.

## Articles (migration du 15 novembre 2026)

```
ARTICLE(
    id_article        uuid, clé primaire
    titre             texte, 200 caractères au plus
    slug              texte, unique       -- adresse : /articles/<slug> (minuscules, chiffres, tirets)
    resume            texte, 500 caractères au plus
    contenu           texte               -- au format Markdown
    image_couverture  texte [nullable]    -- chemin du fichier dans le stockage « articles »
    statut            BROUILLON | PUBLIE
    id_auteur         → compte de connexion [nullable]   -- illisible depuis le site (migration du 26/11)
    published_at      date et heure [nullable]           -- obligatoire si PUBLIE
    created_at, updated_at
)
```

- `updated_at` est tenu à jour par un déclencheur (`maj_updated_at`).
- `published_at` est fixé à la première mise en ligne, et conservé si l'article repasse en brouillon.
- Les images de couverture sont dans l'espace de stockage `articles` : public en lecture, 2 Mo au plus, JPEG, PNG ou WebP.

Sécurité :

- Tout le monde lit les articles `PUBLIE`, et seulement ceux-là : un brouillon reste invisible, même si l'on devine son adresse.
- Les comptes autorisés (`est_admin()`) lisent tout, créent, modifient et suppriment. C'est la seule écriture ouverte à l'espace équipe.
- La colonne `id_auteur` n'est lisible ni par les visiteurs ni par les comptes connectés : le droit de lecture est accordé colonne par colonne, sans elle. Une colonne ajoutée plus tard à `article` doit être ajoutée à cette liste pour être lisible par le site.
- Seuls les comptes autorisés envoient, remplacent ou suppriment une image. Le stockage étant public, l'image d'un brouillon est lisible par qui connaît son adresse exacte ; les noms de fichiers sont aléatoires.

Par rapport au modèle proposé au départ : noms en `snake_case`, ajout de `created_at` et de `id_auteur`.

## Carnet de contacts (migration du 26 novembre 2026)

Le carnet centralise toutes les personnes rencontrées par l'équipe, avec où et pourquoi, pour ne plus les perdre. Il est réservé aux **membres** : une personne qui a une adhésion `NOYAU` active et dont le compte figure dans `acces_admin`, relié par la nouvelle colonne `acces_admin.id_personne`.

```
personne ──(id_personne)── acces_admin
    │
    ├── ajoute_par / referent ──┐
    │                           ▼
    │   contact_organisation n ── 1 contact 1 ── n coordonnee_contact
    │                               │
    │                               n
    └───────────────────── acces_contact (membres autorisés)
```

```
CONTACT
    id_contact        uuid, clé primaire
    nom               texte
    lieu_rencontre    texte
    date_rencontre    date, aujourd'hui par défaut
    raison_rencontre  texte [nullable]
    ajoute_par        → PERSONNE [nullable]   -- rempli par la base
    referent          → PERSONNE              -- celui qui suit la relation aujourd'hui
    visibilite        EQUIPE | RESTREINT | PRIVE   (RESTREINT par défaut)
    partenaire        booléen
    conditions        texte [nullable]        -- ex. « ne pas appeler sans accord »
    notes             texte [nullable]
    created_at, updated_at

CONTACT_ORGANISATION                          -- 0, 1 ou plusieurs par contact
    id_lien, #id_contact, organisation (texte libre), poste [nullable],
    principale (une seule par contact), actuel, created_at

COORDONNEE_CONTACT                            -- plusieurs téléphones et emails
    id_coordonnee, #id_contact, type (TELEPHONE | EMAIL), valeur, libelle [nullable],
    principal (un seul par type et par contact), created_at

ACCES_CONTACT
    #id_contact, #id_membre → PERSONNE, #accorde_par → PERSONNE, created_at
```

Qui voit quoi :

| | Fiche et organisations | Coordonnées |
|---|---|---|
| `EQUIPE` | tous les membres | tous les membres |
| `RESTREINT` | tous les membres | le référent et les membres qu'il autorise |
| `PRIVE` | le référent | le référent |

Règles :

- Tout membre ajoute un contact et en devient le référent. Seul le référent modifie la fiche, ses organisations, ses coordonnées et ses accès.
- `ajoute_par`, `referent` et `accorde_par` sont remplis par la base, jamais par le formulaire.
- Un accès ne s'accorde qu'à un membre, et seulement pour un contact `RESTREINT`.
- `transferer_contact(contact, nouveau_referent)` : réservée au référent actuel, vers un autre membre. La visibilité et les conditions sont conservées ; la liste des accès est vidée, le nouveau référent la redonne lui-même.
- `ajouter_contact(…)` enregistre la fiche, son organisation et ses coordonnées en une seule opération : si une étape échoue, rien n'est enregistré.
- `liste_membres()` donne le prénom et le nom des membres, aux seuls membres.
- Les notes et les conditions ne doivent contenir aucune coordonnée : la base refuse un email ou une suite de 9 chiffres ou plus.
- Une personne encore référente ne peut pas être supprimée : ses contacts doivent d'abord être transférés.
- Les visiteurs n'ont aucun droit sur ces tables. Les contacts ne sont jamais publiés.

L'organisation est un texte libre, avec des suggestions tirées des contacts visibles : un formulaire ne crée jamais d'organisation, pour éviter les doublons. Une table `organisation` viendra plus tard, en regroupant les variantes à la main.

## Décisions prises par rapport au MLD d'origine

| Sujet | MLD d'origine | Décision |
|---|---|---|
| Noms | `idPersonne`, `nomP`… | `snake_case` : `id_personne`, `nom`, `prenom` |
| Identifiants | non précisé | `uuid` |
| Établissement | `fac` | renommé `etablissement` |
| Centres d'intérêt | liés à la personne (`INTERET_PERSONNE`) | liés à l'adhésion (`interet_adhesion`) : ils se renouvellent à chaque saison |
| Texte libre « ce que la personne aimerait vivre » | absent | colonne `attentes` sur `adhesion` |
| Consentement newsletter | absent | colonnes `consentement_newsletter` et `date_consentement_newsletter` sur `adhesion` |
| Statut d'une adhésion | non défini | `ACTIVE` / `CLOTUREE` |
| Statut d'une saison | `ACTIVE` mentionné | `A_VENIR` / `ACTIVE` / `CLOTUREE` |
| Email déjà inscrit | non défini | seules les informations d'études (établissement, filière, niveau) sont mises à jour ; le nom, le prénom et le téléphone d'une fiche existante se corrigent par l'équipe (migration du 26/11). La même confirmation est affichée |

Données de départ : la « Saison 1 » (début le 1er novembre 2026, active) et un premier jet de neuf centres d'intérêt, modifiables dans Supabase.

## Ce qui reste à créer

**Bloc recrutement du MLD** (migration ultérieure) : `candidature`, `entretien`, `evaluation`, `historique`, `fonction`, `occuper`, et la colonne `adhesion.id_candidature`.

Statuts déjà décidés :
- entretien : planifié, achevé ;
- évaluation : accepté, refusé.

Reste à définir : les statuts d'une candidature et son système de priorité.

**Bloc événements** — schéma cible validé le 13 novembre 2026, à créer avec l'espace équipe (niveau 3).

En attendant, les événements sont des données statiques dans `src/content/evenements.js` (mode d'emploi : [evenements.md](evenements.md)). Ce fichier suit déjà la structure ci-dessous : le jour de la migration, seule la fonction `getPageEvenements` de `src/services/evenements.js` changera de source.

Pourquoi attendre : sans espace équipe ni envoi de photos, ajouter un événement dans Supabase (saisie dans l'éditeur de tables, chemins de photos à recopier) serait plus compliqué que de modifier le fichier.

```
EVENEMENT(
    id_evenement      uuid, clé primaire
    slug              texte unique        -- ex. atelier-decouverte-2026
    titre             texte
    resume            texte               -- une ou deux phrases pour les listes
    description       texte [nullable]
    categorie         texte [nullable]    -- Masterclass, Rencontre, Atelier…
    lieu_nom          texte
    lieu_ville        texte
    debut             date et heure
    fin               date et heure [nullable], >= debut
    statut            BROUILLON | PUBLIE | ANNULE
    mise_en_avant     booléen
    #id_saison        → SAISON
    created_at, updated_at
)

PHOTO_EVENEMENT(
    id_photo          uuid, clé primaire
    #id_evenement     → EVENEMENT, supprimée avec l'événement
    chemin            texte               -- emplacement du fichier (Supabase Storage)
    texte_alternatif  texte               -- obligatoire
    legende           texte [nullable]
    credit            texte [nullable]    -- photographe
    ordre             entier, unique par événement
    est_couverture    booléen, une seule couverture par événement
    validee           booléen             -- validation avant publication
)
```

Décisions associées :

- « À venir » ou « passé » se déduit des dates : ce n'est pas stocké. `statut` ne sert qu'à la publication.
- Sécurité prévue : un visiteur ne lit que les événements `PUBLIE` et les photos `validee`, et n'écrit rien.
- Reportées après le MVP : `INSCRIPTION` (une personne, membre ou non, inscrite à un événement : lien vers `PERSONNE`) et `PARTICIPATION` (l'implication d'un membre, avec un rôle : lien vers `ADHESION`).

**Carnet de contacts, plus tard** : une table `organisation` (regroupant les noms saisis librement) et `collaboration_evenement` (le lien entre partenaires et événements, une fois les tables d'événements créées). Le suivi des relations (étapes, relances, collaborations hors événement) est prévu en V2.
