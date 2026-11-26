// Réglages généraux du site, modifiables ici sans toucher au reste du code.

// Adresse de contact affichée sur la page « Vos données ».
// Si elle est vide, la page affiche un emplacement « à compléter ».
export const EMAIL_CONTACT = "supernova.bejaia@gmail.com";

// Comptes de Supernova sur les réseaux sociaux. Pour en ajouter un,
// ajouter une ligne : il apparaîtra dans la section « Nos réseaux ».
export const RESEAUX = [
  {
    nom: "Instagram",
    identifiant: "@supernova.bejaia",
    url: "https://www.instagram.com/supernova.bejaia",
  },
];

// Pages du site, dans l'ordre d'affichage. Utilisée par le menu de
// navigation et par le pied de page : ajouter une page ici l'ajoute aux deux.
// « horsBarre » : la page n'apparaît pas dans la barre du haut sur
// ordinateur (elle reste dans le menu du téléphone et le pied de page).
export const NAVIGATION = [
  { href: "/", libelle: "Accueil" },
  { href: "/notre-histoire", libelle: "Notre histoire" },
  { href: "/evenements", libelle: "Événements" },
  { href: "/articles", libelle: "Articles" },
  { href: "/rejoindre", libelle: "Rejoindre" },
  { href: "/vos-donnees", libelle: "Vos données", horsBarre: true },
];
