# Gérer un événement

Les événements se gèrent depuis l'espace équipe, rubrique **Événements** (`/admin/evenements`). Aucun fichier à modifier, aucun envoi sur GitHub : ce qui est enregistré apparaît aussitôt sur le site.

Il faut un compte autorisé (voir le README, « Espace équipe »).

## En 5 étapes

### 1. Créer l'événement

**Nouvel événement**, puis remplir :

| Champ | Obligatoire | Rôle |
|---|---|---|
| Titre | oui | Titre affiché |
| Résumé | non | Une ou deux phrases, pour la liste et les partages |
| Catégorie | non | Masterclass, Rencontre, Atelier… |
| Adresse de la page | non | Déduite du titre si laissée vide : `/evenements/<adresse>` |
| Début | oui | Date et heure, heure de Béjaïa |
| Fin | non | Date et heure de fin |
| Lieu, Ville | oui | Ville préremplie : Béjaïa |
| Description | non | Le texte complet (les retours à la ligne sont conservés) |
| Invités et intervenants | non | Un par ligne |
| Prix | non | En dinars ; vide = gratuit |
| Inscription requise | non | Affiche un formulaire d'inscription sur la page de l'événement |
| Lien d'inscription externe | non | Si les inscriptions se font ailleurs (Google Forms…) : la page renvoie vers ce lien au lieu du formulaire |
| Mettre à la une | non | Le premier événement à venir ainsi marqué est présenté en grand |

**Créer le brouillon** : l'événement existe, mais personne ne le voit encore.

Chaque événement a ensuite quatre onglets : **Informations**, **Photos**, **Inscrits** et **Bilan**.

### 2. Ajouter les photos

Onglet **Photos** : une photo par envoi, JPEG, PNG ou WebP, 2 Mo au plus, avec une **description** obligatoire (ce que montre la photo, pour les personnes qui ne la voient pas). Légende et photographe sont facultatifs.

- Une photo ajoutée est **à valider** : invisible du public. **Valider** la rend visible ; **Masquer** la retire du site sans la supprimer.
- La première photo devient la **couverture** ; **Mettre en couverture** en choisit une autre.
- Ne valider que des photos dont la diffusion est acceptée (personnes reconnaissables, partenaires, lieu).
- Sans photo validée, un visuel aux couleurs de Supernova remplace la couverture.

### 3. Publier

Onglet **Informations**, encadré **Publication** (chaque action demande une confirmation) :

| Bouton | Effet sur le site |
|---|---|
| Publier | L'événement apparaît (agenda, à la une, plan du site) |
| Annuler l'événement | Il reste visible avec la mention « Annulé » ; les inscriptions sont fermées |
| Marquer comme terminé | Il passe dans les archives |
| Repasser en brouillon | Il disparaît du site |

Le lendemain d'un événement, il passe aussi tout seul dans les archives (dans l'heure qui suit minuit).

### 4. Suivre les inscrits, puis pointer le jour J

Onglet **Inscrits** :

- les chiffres clés : présents (sur le nombre attendu), inscrits pas encore pointés, absents, désistés ;
- une **recherche** instantanée par nom, email ou téléphone, sans se soucier des accents : à l'entrée, trois lettres suffisent ;
- sur chaque ligne, quatre boutons : **Inscrit**, **Présent**, **Absent**, **Désisté**. Le statut actuel est coloré (vert pour présent) ;
- **Ajouter une personne** : pour quelqu'un de présent sans s'être inscrit (ou inscrit par téléphone). Si son email est déjà connu, sa fiche est reprise telle quelle.

Les inscriptions en ligne ferment à la fin de l'événement (à son début s'il n'a pas d'heure de fin). Une personne qui s'inscrit peut cocher une case pour rejoindre aussi l'Orbite ; la case est décochée par défaut.

### 5. Remplir le bilan

Onglet **Bilan** : le responsable, ce qui a marché, les difficultés, ce qui est à améliorer, et les liens vers les ressources (photos, documents…), un par ligne. Rien de cette rubrique n'apparaît sur le site.

## Ce qui se fait tout seul

- **À venir ou passé** : déduit de la date.
- **Agenda vide** : la page affiche « Prochains rendez-vous bientôt annoncés » avec un lien vers l'Orbite.
- **Archives vides** : la section n'apparaît pas.
- **Galerie** : la composition s'adapte au nombre de photos validées.
- **Référencement** : chaque événement publié a sa page, sa description pour les moteurs de recherche et ses données structurées (date, lieu, prix, intervenants), et figure dans le plan du site.
