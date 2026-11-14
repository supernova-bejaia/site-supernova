// Outils de dates pour l'affichage, à l'heure de Béjaïa.

const FUSEAU = "Africa/Algiers";

// Transforme "2026-12-05" en date (à midi, pour éviter tout décalage de jour).
function versDate(texte) {
  return new Date(`${texte}T12:00:00+01:00`);
}

// "2026-12-05" → { jour: "05", mois: "déc.", annee: "2026", jourSemaine: "samedi" }
export function decomposerDate(texte) {
  const date = versDate(texte);
  const format = (options) => new Intl.DateTimeFormat("fr-FR", { timeZone: FUSEAU, ...options }).format(date);

  return {
    jour: format({ day: "2-digit" }),
    mois: format({ month: "short" }),
    annee: format({ year: "numeric" }),
    jourSemaine: format({ weekday: "long" }),
  };
}

// "2026-12-05" → "samedi 5 décembre 2026"
export function dateLongue(texte) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: FUSEAU,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(versDate(texte));
}

// "2026-10-10" → "octobre 2026"
export function moisEtAnnee(texte) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: FUSEAU,
    month: "long",
    year: "numeric",
  }).format(versDate(texte));
}

// ("17:30", "20:00") → "17 h 30 – 20 h" ; ("17:30") → "17 h 30"
export function horaire(heure, heureFin) {
  if (!heure) return null;
  const lisible = (h) => {
    const [heures, minutes] = h.split(":");
    return minutes === "00" ? `${Number(heures)} h` : `${Number(heures)} h ${minutes}`;
  };
  return heureFin ? `${lisible(heure)} – ${lisible(heureFin)}` : lisible(heure);
}

// Date du jour à Béjaïa, au format AAAA-MM-JJ.
export function aujourdhui(maintenant) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSEAU }).format(maintenant);
}

// Date et heure enregistrées par la base (ex. "2026-11-13T10:45:03+00:00")
// → "13/11/2026", à l'heure de Béjaïa.
export function dateCourte(horodatage) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: FUSEAU,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(horodatage));
}
