// =====================================================================
// Les événements de Supernova
//
// C'est le SEUL fichier à modifier pour ajouter, corriger ou retirer un
// événement : la page « Événements » se construit automatiquement à partir
// de cette liste. Le mode d'emploi complet est dans docs/evenements.md.
//
// Les photos sont rangées dans public/evenements/<identifiant>/ et se
// citent ici avec un chemin qui commence par « /evenements/… ».
//
// Ce fichier est une source provisoire : le jour où un outil de gestion
// des événements existera, seul services/evenements.js devra changer.
// =====================================================================

/**
 * Structure d'un événement.
 *
 * @typedef {Object} Evenement
 * @property {string}  id            Identifiant unique, en minuscules et tirets
 *                                   (ex. "atelier-decouverte-2026"). C'est
 *                                   aussi le nom du dossier de ses photos.
 * @property {string}  titre         Titre affiché.
 * @property {string}  date          Date de début, au format AAAA-MM-JJ.
 * @property {string}  [dateFin]     Date de fin si l'événement dure plusieurs jours.
 * @property {string}  [heure]       Heure de début, au format HH:MM.
 * @property {string}  [heureFin]    Heure de fin, au format HH:MM.
 * @property {{nom: string, ville: string}} lieu  Lieu de l'événement.
 * @property {string}  [categorie]   Type d'événement (Masterclass, Rencontre…).
 * @property {string}  resume        Une ou deux phrases, pour les listes.
 * @property {string}  [description] Texte plus long, affiché pour les
 *                                   événements passés et l'événement à la une.
 * @property {"publie"|"brouillon"} statut  Seuls les événements « publie »
 *                                   apparaissent sur le site.
 * @property {boolean} [miseEnAvant] Met l'événement « à la une » (le premier
 *                                   événement à venir marqué ainsi).
 * @property {Image}   [couverture]  Image principale. Sans couverture, un
 *                                   visuel aux couleurs de Supernova la remplace.
 * @property {Image[]} [photos]      Galerie, surtout pour les événements passés.
 *
 * Le classement « à venir » ou « passé » se fait automatiquement d'après
 * la date : il n'y a rien à changer le lendemain d'un événement.
 *
 * @typedef {Object} Image
 * @property {string} src        Chemin de la photo, ex. "/evenements/mon-id/01.jpg".
 * @property {string} alt        Description de la photo pour les personnes qui
 *                               ne la voient pas (obligatoire).
 * @property {string} [legende]  Légende affichée sous la photo.
 */

/** @type {Evenement[]} */
export const EVENEMENTS = [
  // Aucun événement publié pour le moment.
  // Pour en ajouter un, suivre docs/evenements.md.
];
