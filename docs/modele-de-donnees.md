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

Seule porte d'entrée du formulaire public. En une transaction, elle vérifie les champs, trouve la saison active, crée ou met à jour la personne, crée ou met à jour son adhésion (sans jamais changer son type) et remplace ses centres d'intérêt.

### Sécurité

- La RLS est activée sur les cinq tables.
- Un visiteur ne peut lire que `centre_interet`. Il ne peut ni lire ni écrire ailleurs.
- Il peut seulement exécuter `inscrire_orbite`.

## Espace équipe (migration du 13 novembre 2026)

| Élément | Rôle |
|---|---|
| `acces_admin` | La liste des comptes de connexion autorisés à l'espace équipe. RLS activée et aucune règle : la table n'est lisible par personne depuis le site, elle se gère dans Supabase. |
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
    id_auteur         → compte de connexion [nullable]   -- non affiché sur le site
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
- Seuls les comptes autorisés envoient, remplacent ou suppriment une image. Le stockage étant public, l'image d'un brouillon est lisible par qui connaît son adresse exacte ; les noms de fichiers sont aléatoires.

Par rapport au modèle proposé au départ : noms en `snake_case`, ajout de `created_at` et de `id_auteur`.

## Événements (migration du 26 novembre 2026)

Les événements ne sont plus dans un fichier (`src/content/evenements.js`, retiré) : ils sont dans la base et se gèrent depuis l'espace équipe.

```
EVENEMENT(
    id_evenement        uuid, clé primaire
    slug                texte unique        -- adresse : /evenements/<slug>
    titre               texte, 200 caractères au plus
    resume              texte, 500 caractères au plus
    description         texte [nullable]
    categorie           texte [nullable]    -- Masterclass, Rencontre, Atelier…
    lieu_nom, lieu_ville texte
    debut               date et heure
    fin                 date et heure [nullable], >= debut
    prix                nombre [nullable]   -- en dinars ; vide = gratuit (0 refusé)
    invites             texte [nullable]    -- invités et intervenants, un par ligne
    inscription_requise booléen
    lien_inscription    texte [nullable]    -- formulaire externe (http ou https)
    statut              BROUILLON | PUBLIE | ANNULE | TERMINE
    mise_en_avant       booléen
    #id_saison          → SAISON [nullable] -- saison active à la création
    published_at        date et heure [nullable] -- fixée à la première publication
    created_at, updated_at
)

PHOTO_EVENEMENT(
    id_photo            uuid, clé primaire
    #id_evenement       → EVENEMENT, supprimée avec l'événement
    chemin              texte unique        -- fichier dans le stockage « evenements »
    texte_alternatif    texte, obligatoire
    legende, credit     texte [nullable]
    ordre               entier, unique par événement
    est_couverture      booléen, une seule couverture par événement
    validee             booléen             -- montrée au public seulement si validée
    created_at
)

SUIVI_EVENEMENT(                            -- interne à l'équipe
    #id_evenement       → EVENEMENT, clé primaire, supprimé avec l'événement
    responsable         texte [nullable]
    ce_qui_a_marche, difficultes, a_ameliorer   texte [nullable]
    ressources          texte [nullable]    -- liens, un par ligne
    updated_at
)

INSCRIPTION_EVENEMENT(
    id_inscription      uuid, clé primaire
    #id_evenement       → EVENEMENT, supprimée avec l'événement
    #id_personne        → PERSONNE, supprimée avec la personne
    statut              INSCRIT | PRESENT | ABSENT | DESISTE
    origine             FORMULAIRE | EQUIPE
    created_at, updated_at
    unique (id_evenement, id_personne)
)
```

```
evenement 1 ── n photo_evenement
evenement 1 ── 0..1 suivi_evenement
evenement 1 ── n inscription_evenement n ── 1 personne
```

### Fonctions

| Fonction | Qui | Rôle |
|---|---|---|
| `inscrire_evenement` | visiteur | Inscrit une personne à un événement publié qui demande une inscription et n'est pas terminé. Crée la personne si son email est inconnu ; **ne modifie jamais une fiche existante** (ni nom, ni email, ni téléphone). Une personne désistée qui se réinscrit redevient inscrite ; un présent reste présent. Si la case a été cochée, ajoute une adhésion ORBITE à la saison active (sans toucher à une adhésion existante). |
| `ajouter_participant` | équipe (`est_admin()`) | Ajoute une personne, nouvelle ou connue, avec le statut PRESENT (présent sans inscription) ou INSCRIT. Même prudence sur les fiches existantes. |
| `trouver_ou_creer_personne` | personne | Interne aux deux fonctions précédentes ; personne ne peut l'appeler directement. |

### Sécurité

- RLS activée sur les quatre tables.
- Un visiteur lit les événements **publiés** — publiés au moins une fois et pas repassés en brouillon, donc aussi annulés ou terminés — et leurs photos **validées**. Il ne lit ni `suivi_evenement` ni `inscription_evenement`, n'écrit nulle part, et peut seulement exécuter `inscrire_evenement`.
- Les comptes autorisés (`est_admin()`) lisent et écrivent tout sur ces quatre tables, et gèrent les photos du stockage `evenements` (public en lecture par adresse, 2 Mo, JPEG, PNG ou WebP ; noms de fichiers aléatoires).
- Aucune table existante n'est modifiée : l'équipe ne peut toujours pas écrire dans `personne` ou `adhesion` directement, tout passe par les fonctions.

### Décisions

- « À venir » ou « passé » se déduit toujours des dates ; `TERMINE` permet en plus de classer un événement dans les archives à la main.
- Responsable et bilan sont dans une table à part (`suivi_evenement`) : la lecture publique d'`evenement` porte sur la ligne entière, ils ne pouvaient donc pas y figurer. Le responsable est un texte libre, pas un lien vers un compte : les comptes de l'équipe ne sont pas lisibles depuis le site.
- Le téléphone est facultatif pour s'inscrire à un événement (obligatoire pour l'Orbite).
- Données de départ : `src/content/evenements.js` ne contenait aucun événement ; il n'y avait rien à reprendre.

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
| Email déjà inscrit | non défini | les informations sont mises à jour, la même confirmation est affichée |

Données de départ : la « Saison 1 » (début le 1er novembre 2026, active) et un premier jet de neuf centres d'intérêt, modifiables dans Supabase.

## Ce qui reste à créer

**Bloc recrutement du MLD** (migration ultérieure) : `candidature`, `entretien`, `evaluation`, `historique`, `fonction`, `occuper`, et la colonne `adhesion.id_candidature`.

Statuts déjà décidés :
- entretien : planifié, achevé ;
- évaluation : accepté, refusé.

Reste à définir : les statuts d'une candidature et son système de priorité.

**Bloc participation** : `PARTICIPATION` (l'implication d'un membre dans un événement, avec un rôle : lien vers `ADHESION`), reportée après le MVP. L'inscription à un événement, elle, existe (voir « Événements »).

**Autres entités à proposer le moment venu** : contacts du carnet.
