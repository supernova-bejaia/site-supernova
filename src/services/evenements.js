import { cacheLife } from "next/cache";
import { EVENEMENTS } from "@/content/evenements";
import { aujourdhui } from "@/lib/dates";

// Service « événements » : prépare les événements pour la page.
//
// Aujourd'hui, les données viennent d'un fichier (content/evenements.js).
// Le jour où un outil de gestion existera, seule cette fonction changera :
// la page et ses composants recevront toujours les mêmes données.
//
// « use cache » : le classement à venir / passé dépend de la date du jour.
// Il est recalculé environ toutes les heures, ce qui suffit pour basculer
// un événement dans les archives le lendemain.
export async function getPageEvenements() {
  "use cache";
  cacheLife("hours");

  const ceJour = aujourdhui(new Date());

  const publies = EVENEMENTS.filter((evenement) => evenement.statut === "publie");

  // Un événement reste « à venir » jusqu'à la fin de son dernier jour.
  const estAVenir = (evenement) => (evenement.dateFin ?? evenement.date) >= ceJour;

  const aVenir = publies
    .filter(estAVenir)
    .sort((a, b) => a.date.localeCompare(b.date));

  const passes = publies
    .filter((evenement) => !estAVenir(evenement))
    .sort((a, b) => b.date.localeCompare(a.date));

  // À la une : le premier événement à venir marqué « miseEnAvant ».
  const miseEnAvant = aVenir.find((evenement) => evenement.miseEnAvant) ?? null;

  return {
    miseEnAvant,
    aVenir: aVenir.filter((evenement) => evenement !== miseEnAvant),
    passes,
  };
}
