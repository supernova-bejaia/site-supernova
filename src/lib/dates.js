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
// → "13 novembre 2026", à l'heure de Béjaïa.
export function dateEnLettres(horodatage) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: FUSEAU,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(horodatage));
}

// Date et heure enregistrées par la base → { date: "2026-12-05", heure: "17:30" },
// à l'heure de Béjaïa.
export function partiesDate(horodatage) {
  const parties = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: FUSEAU,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(horodatage))
      .map(({ type, value }) => [type, value])
  );
  return {
    date: `${parties.year}-${parties.month}-${parties.day}`,
    heure: `${parties.hour}:${parties.minute}`,
  };
}

// Valeur d'un champ « date et heure » (heure de Béjaïa) → horodatage pour
// la base. "2026-12-05T17:30" → "2026-12-05T17:30:00+01:00".
// ponytail: l'Algérie reste à UTC+1 toute l'année (pas d'heure d'été) ;
// à revoir seulement si cela change un jour.
export function versHorodatage(valeurChamp) {
  return `${valeurChamp}:00+01:00`;
}

// L'inverse, pour préremplir un champ « date et heure » : horodatage de la
// base → "2026-12-05T17:30".
export function versChampDate(horodatage) {
  if (!horodatage) return "";
  const { date, heure } = partiesDate(horodatage);
  return `${date}T${heure}`;
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
