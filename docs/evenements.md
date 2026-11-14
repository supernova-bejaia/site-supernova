# Ajouter un événement

La page « Événements » se construit automatiquement à partir d'une liste. Pour ajouter, corriger ou retirer un événement, on modifie **un seul fichier de données** et on dépose les photos dans **un dossier** : aucune mise en page à toucher.

| Quoi | Où |
|---|---|
| Les informations des événements | `src/content/evenements.js` |
| Les photos | `public/evenements/<identifiant-de-l-evenement>/` |
| La logique (à venir, passé, à la une) | `src/services/evenements.js` — à ne pas modifier pour ajouter un événement |

## En 4 étapes

### 1. Choisir un identifiant

En minuscules, sans accents ni espaces, avec des tirets. Il doit être unique.

```
atelier-decouverte-2026
```

### 2. Déposer les photos

Créer le dossier `public/evenements/atelier-decouverte-2026/` et y copier les photos, nommées simplement : `01.jpg`, `02.jpg`, `03.jpg`…

Conseils :

- **Format** : JPG, de préférence en largeur (paysage).
- **Poids** : idéalement moins de 500 Ko par photo, 2 000 px de large au maximum. Le site redimensionne automatiquement les photos pour chaque écran, mais une photo trop lourde ralentit la mise en ligne.
- **Autorisations** : ne publier que des photos dont la diffusion a été validée (personnes reconnaissables, partenaires, lieu).

### 3. Ajouter l'événement dans `src/content/evenements.js`

Copier ce modèle dans la liste `EVENEMENTS`, puis remplir les champs :

```js
{
  id: "atelier-decouverte-2026",
  titre: "Atelier découverte",
  date: "2026-12-12",            // AAAA-MM-JJ
  heure: "14:00",                // facultatif
  heureFin: "17:00",             // facultatif
  lieu: { nom: "Nom du lieu", ville: "Béjaïa" },
  categorie: "Atelier",          // facultatif
  resume: "Une ou deux phrases pour les listes.",
  description: "Le texte complet, affiché à la une et dans les archives.",
  statut: "brouillon",           // « publie » pour l'afficher sur le site
  couverture: {                  // facultatif
    src: "/evenements/atelier-decouverte-2026/01.jpg",
    alt: "Description de la photo pour les personnes qui ne la voient pas.",
  },
  photos: [                      // facultatif, surtout pour un événement passé
    { src: "/evenements/atelier-decouverte-2026/01.jpg", alt: "…" },
    { src: "/evenements/atelier-decouverte-2026/02.jpg", alt: "…", legende: "Facultatif" },
  ],
},
```

### 4. Vérifier puis publier

1. Lancer le site en local (`npm run dev`) et ouvrir http://localhost:3000/evenements.
2. Passer `statut` à `"publie"` quand tout est validé.
3. Faire un commit, puis l'envoyer sur GitHub : le site en ligne se met à jour automatiquement.

## Ce qui se fait tout seul

- **À venir ou passé** : déduit de la date. Le lendemain d'un événement, il passe dans les archives sans rien modifier (dans l'heure qui suit minuit).
- **À la une** : le premier événement à venir qui a `miseEnAvant: true` est présenté en grand.
- **Galerie** : la composition s'adapte au nombre de photos (une, deux, trois, quatre, ou une mosaïque au-delà, avec les photos suivantes dépliables).
- **Sans photo** : un visuel aux couleurs de Supernova remplace la couverture.
- **Agenda vide** : la page affiche « Prochains rendez-vous bientôt annoncés » avec un lien vers l'Orbite.
- **Archives vides** : la section n'apparaît pas.

## Champs

| Champ | Obligatoire | Rôle |
|---|---|---|
| `id` | oui | Identifiant unique, et nom du dossier des photos |
| `titre` | oui | Titre affiché |
| `date` | oui | Date de début (AAAA-MM-JJ) |
| `dateFin` | non | Date de fin pour un événement sur plusieurs jours |
| `heure`, `heureFin` | non | Horaires (HH:MM) |
| `lieu` | oui | `{ nom, ville }` |
| `categorie` | non | Masterclass, Rencontre, Atelier… |
| `resume` | oui | Une ou deux phrases pour les listes |
| `description` | non | Texte complet (à la une et archives) |
| `statut` | oui | `"publie"` ou `"brouillon"` (un brouillon n'apparaît jamais) |
| `miseEnAvant` | non | `true` pour placer l'événement à la une |
| `couverture` | non | Image principale `{ src, alt }` |
| `photos` | non | Galerie : liste de `{ src, alt, legende? }` |

Le texte `alt` de chaque photo est obligatoire : il décrit la photo aux personnes qui utilisent un lecteur d'écran.

## Et plus tard ?

Le jour où un outil de gestion des événements existera (base de données, espace équipe), seule la fonction `getPageEvenements` de `src/services/evenements.js` changera de source. Les composants et la page recevront les mêmes données et ne bougeront pas.
