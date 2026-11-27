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
| `est_admin()` | Fonction qui répond si le compte connecté a accès à l'espace équipe : depuis le 26/11, « niveau 1 ou plus » (voir plus bas). Elle ne renvoie qu'un oui ou un non. |

Les comptes autorisés peuvent **lire** `personne`, `adhesion`, `interet_adhesion` et `saison`. Ils n'y écrivent rien. Depuis le 26/11, le téléphone et l'email d'une personne ne sont plus lisibles que par la direction, avec `coordonnees_personne()`.

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
- L'équipe lit tout. Depuis le 26/11, l'écriture dépend du niveau (voir « Droits par niveau »), et un statut `ARCHIVE` s'ajoute : l'article est retiré du site mais reste récupérable.
- La colonne `id_auteur` n'est lisible ni par les visiteurs ni par les comptes connectés : le droit de lecture est accordé colonne par colonne, sans elle. Une colonne ajoutée plus tard à `article` doit être ajoutée à cette liste pour être lisible par le site.
- Seuls les comptes autorisés envoient, remplacent ou suppriment une image. Le stockage étant public, l'image d'un brouillon est lisible par qui connaît son adresse exacte ; les noms de fichiers sont aléatoires.

Par rapport au modèle proposé au départ : noms en `snake_case`, ajout de `created_at` et de `id_auteur`.

## Fonctions, départements et niveaux (migration du 26 novembre 2026)

Les droits suivent les fonctions, et les fonctions ont une date de début et une date de fin. La base enregistre qui occupe quoi et depuis quand ; les règles d'organisation restent dans le Code Supernova.

```
DEPARTEMENT   id_departement, nom (unique), description, actif, created_at, updated_at
FONCTION      code (PRESIDENT | CHIEF_SUPERVISOR | HEAD_OF), libelle, niveau, par_departement
OCCUPATION    id_occupation, #id_personne, #code_fonction, #id_departement [Head of seulement],
              debut, fin [vide = en cours], #nomme_par [nullable], motif_fin

+ adhesion.id_departement   département d'un membre du Noyau pour cette saison
+ personne.fondateur        statut de reconnaissance, sans aucun droit
+ acces_admin.proprietaire  le compte propriétaire (un seul)
```

Départements de départ, provisoires : Events, Marketing, Membres, Tech.

`mon_niveau()` donne le niveau du compte connecté ; en cas de cumul, le plus élevé l'emporte :

| Niveau | Qui |
|---|---|
| 0 | compte sans adhésion NOYAU active ou non relié à une personne |
| 1 | membre du Noyau |
| 2 | Head of en cours |
| 3 | Président ou Chief Supervisor en cours |
| 4 | compte propriétaire |

Règles :

- Un seul titulaire en cours par fonction, et par département pour un Head of. Une personne peut cumuler des fonctions différentes.
- Seul un membre du Noyau occupe une fonction. Un département est obligatoire pour un Head of et interdit sinon.
- `nommer(personne, fonction, département)` : le titulaire en cours termine son mandat le même jour (passation). Les Head of sont nommés par la direction (niveau 3) ; le Président et le Chief Supervisor, par le compte propriétaire seulement. Tant qu'il n'existe pas, ces nominations se font dans Supabase.
- `terminer_fonction(occupation, motif)` : motif obligatoire, mêmes conditions que `nommer`.
- `affecter_departement(adhesion, département)` : direction uniquement, pour une adhésion NOYAU.
- Personne ne modifie ses propres fonctions ni sa propre affectation : la base le refuse.
- Les membres lisent les départements, les fonctions et leurs titulaires. Les départements se gèrent par la direction ; les fonctions, dans Supabase ; les occupations, seulement par les fonctions ci-dessus.

### Droits par niveau (migration du 26 novembre 2026)

L'entrée de l'espace équipe (`est_admin()`) demande le niveau 1. Ensuite :

| | Membre (1) | Head of (2) | Direction (3) |
|---|---|---|---|
| Articles : lire, brouillons et archives compris | ✓ | ✓ | ✓ |
| Articles : créer un brouillon | ✓ | ✓ | ✓ |
| Articles : modifier | ses brouillons | tous | tous |
| Articles : publier, dépublier, archiver | — | ✓ | ✓ |
| Articles : supprimer définitivement | ses brouillons jamais publiés | — | ✓ |
| Images de couverture : envoyer | ✓ | ✓ | ✓ |
| Images : remplacer, supprimer | les siennes | toutes | toutes |
| Personnes : nom, études | ✓ | ✓ | ✓ |
| Personnes : téléphone, email (`coordonnees_personne()`) | — | — | ✓ |
| Carnet : modifier une fiche Équipe ou Restreint d'un autre | — | ✓ | ✓ |
| Carnet : coordonnées d'un contact Équipe d'un autre | — | ✓ | ✓ |
| Carnet : supprimer le contact d'un autre (hors privé) | — | — | ✓ |
| Carnet : transférer les contacts d'un membre parti (`transferer_contacts_de()`) | — | — | ✓ |

- `mes_articles()` donne les articles écrits par le compte connecté (`id_auteur` reste illisible).
- Le référent garde seul la main sur la visibilité, les conditions, les coordonnées d'un contact Restreint et les accès. Un contact privé n'est visible que de lui, direction comprise ; le transfert d'un membre parti le déplace sans le lire.
- Une fiche de contact peut être archivée (`archive_le`) : elle disparaît des listes mais reste récupérable.

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

- Tout membre ajoute un contact et en devient le référent. Le référent modifie la fiche, ses organisations, ses coordonnées et ses accès ; depuis le 26/11, les Head of et la direction peuvent aussi modifier certaines fiches (voir « Droits par niveau »).
- `ajoute_par`, `referent` et `accorde_par` sont remplis par la base, jamais par le formulaire.
- Un accès ne s'accorde qu'à un membre, et seulement pour un contact `RESTREINT`.
- `transferer_contact(contact, nouveau_referent)` : réservée au référent actuel, vers un autre membre. La visibilité et les conditions sont conservées ; la liste des accès est vidée, le nouveau référent la redonne lui-même.
- `ajouter_contact(…)` enregistre la fiche, son organisation et ses coordonnées en une seule opération : si une étape échoue, rien n'est enregistré.
- `modifier_contact(…)` (migration du 26/11) fait de même pour une modification : la fiche, la liste de ses organisations et, si demandé, ses coordonnées. Elle s'exécute avec les droits du compte connecté.
- `liste_membres()` donne le prénom et le nom des membres, aux seuls membres.
- Les notes et les conditions ne doivent contenir aucune coordonnée : la base refuse un email ou une suite de 9 chiffres ou plus.
- Une personne encore référente ne peut pas être supprimée : ses contacts doivent d'abord être transférés.
- Les visiteurs n'ont aucun droit sur ces tables. Les contacts ne sont jamais publiés.

L'organisation est un texte libre, avec des suggestions tirées des contacts visibles : un formulaire ne crée jamais d'organisation, pour éviter les doublons. Une table `organisation` viendra plus tard, en regroupant les variantes à la main.

## Événements (migration du 27 novembre 2026)

Les événements ne sont plus dans un fichier (`src/content/evenements.js`, retiré : il ne contenait aucun événement) : ils sont dans la base et se gèrent depuis l'espace équipe.

```
EVENEMENT(
    id_evenement        uuid, clé primaire
    slug                texte unique        -- adresse : /evenements/<slug>
    titre               texte, 200 caractères au plus
    resume              texte, 500 caractères au plus
    description         texte [nullable]
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
    id_auteur           → compte [nullable] -- rempli par la base, illisible depuis le site
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
    #id_responsable     → PERSONNE [nullable] -- un membre du Noyau, facultatif
    ce_qui_a_marche, difficultes, a_ameliorer   texte [nullable]
    ressources          texte [nullable]    -- liens, un par ligne
    updated_at
)

PARTENAIRE_EVENEMENT(                       -- interne à l'équipe, jamais publié
    id_lien             uuid, clé primaire
    #id_evenement       → EVENEMENT, supprimé avec l'événement
    #id_contact         → CONTACT [nullable] -- vidé si le contact est supprimé
    organisation        texte [nullable]    -- si aucun contact
    role                PARTENAIRE | SPONSOR | INTERVENANT | LIEU | AUTRE
    note                texte [nullable]    -- aucune coordonnée (refusées par la base)
    created_at
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
evenement 1 ── 0..1 suivi_evenement n ── 0..1 personne (responsable)
evenement 1 ── n partenaire_evenement n ── 0..1 contact
evenement 1 ── n inscription_evenement n ── 1 personne
```

Pas de catégorie : le cadrage ne distingue pas de types d'événements. Un seul responsable pour l'instant ; s'il en faut plusieurs plus tard, ce sera une table à part.

### Qui fait quoi

| | Membre (1) | Head of (2) | Direction (3) |
|---|---|---|---|
| Lire tous les événements, brouillons compris | ✓ | ✓ | ✓ |
| Créer un événement (brouillon) | ✓ | ✓ | ✓ |
| Modifier informations, bilan, responsable, partenaires | ses brouillons | tous | tous |
| Publier, repasser en brouillon, annuler, terminer | — | ✓ | ✓ |
| Envoyer une photo | ✓ | ✓ | ✓ |
| Valider, masquer, choisir la couverture, supprimer une photo | — | ✓ | ✓ |
| Voir la liste des inscrits (noms) et pointer les présences | ✓ | ✓ | ✓ |
| Retirer un inscrit de la liste | — | ✓ | ✓ |
| Voir l'email et le téléphone des inscrits (`coordonnees_inscrits()`) | — | — | ✓ |
| Supprimer définitivement | ses brouillons jamais publiés | — | ✓ |

Un visiteur lit les événements **publiés** (publiés au moins une fois et pas repassés en brouillon, donc aussi annulés ou terminés) et leurs photos **validées**. Il ne lit ni le suivi, ni les partenaires, ni les inscriptions, n'écrit nulle part, et peut seulement exécuter `inscrire_evenement`.

Un lien vers un contact du carnet n'est visible que de ceux qui voient ce contact : un contact privé ne se devine pas par l'événement.

### Fonctions

| Fonction | Qui | Rôle |
|---|---|---|
| `inscrire_evenement` | visiteur | Inscrit une personne à un événement publié qui demande une inscription et n'est pas terminé. Crée la personne si son email est inconnu ; **ne modifie jamais une fiche existante**. Une personne désistée qui se réinscrit redevient inscrite. Si la case a été cochée, ajoute une adhésion ORBITE à la saison active (sans toucher à une adhésion existante). |
| `ajouter_participant` | membre du Noyau | Ajoute une personne, nouvelle ou connue, comme présente (sans inscription préalable) ou inscrite. L'email reste obligatoire. Même prudence sur les fiches existantes. |
| `coordonnees_inscrits` | direction | Email et téléphone des inscrits d'un événement. |
| `peut_modifier_evenement`, `mes_evenements` | équipe | Droits sur un événement ; événements créés par le compte connecté. |
| `trouver_ou_creer_personne` | personne | Interne aux fonctions d'inscription ; personne ne peut l'appeler directement. |

Le stockage `evenements` est public en lecture par adresse (2 Mo, JPEG, PNG ou WebP, noms de fichiers aléatoires) : tout membre envoie, un Head of ou l'auteur du fichier remplace ou supprime.

### Décisions

- « À venir » ou « passé » se déduit toujours des dates ; `TERMINE` classe en plus un événement dans les archives, à la main.
- La présence se vérifie à la main, après l'événement. Pas de capacité maximale ni de liste d'attente.
- Le téléphone est facultatif pour s'inscrire à un événement (obligatoire pour l'Orbite).
- Partenaires et sponsors liés : visibles de l'équipe seulement ; aucun nom ni logo n'est affiché sur le site sans l'accord du partenaire.

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

**Bloc recrutement du MLD** (migration ultérieure) : `candidature`, `entretien`, `evaluation`, `historique`, et la colonne `adhesion.id_candidature`. (`fonction` et `occuper` existent depuis le 26/11 : tables `fonction` et `occupation`.)

Statuts déjà décidés :
- entretien : planifié, achevé ;
- évaluation : accepté, refusé.

Reste à définir : les statuts d'une candidature et son système de priorité.

**Bloc participation** : `PARTICIPATION` (l'implication d'un membre dans un événement, avec un rôle : lien vers `ADHESION`), reportée après le MVP. L'inscription à un événement, elle, existe (voir « Événements »).

**Carnet de contacts, plus tard** : une table `organisation` (regroupant les noms saisis librement) (le lien entre partenaires et événements existe : `partenaire_evenement`). Le suivi des relations (étapes, relances, collaborations hors événement) est prévu en V2.
