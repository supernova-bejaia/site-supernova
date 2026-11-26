import { estSlugValide } from "./articles";
import { versHorodatage } from "./dates";
import { creerSlug } from "./slug";
import { FORMAT_EMAIL, FORMAT_TEL, texte } from "./validation";

// Validation des formulaires liés aux événements, exécutée côté serveur.
// Les mêmes limites existent dans la base (migration « evenements ») :
// le site donne des messages clairs, la base sert de dernier rempart.

const FORMAT_DATE_HEURE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const FORMAT_LIEN = /^https?:\/\/\S+$/;

// Texte sur plusieurs lignes : on garde les retours à la ligne.
function texteLong(formData, nom) {
  const valeur = formData.get(nom);
  return typeof valeur === "string" ? valeur.replace(/\r\n/g, "\n").trim() : "";
}

function longueurMax(erreurs, nom, valeur, max) {
  if (valeur.length > max) erreurs[nom] = `Ce texte est trop long (${max} caractères au plus).`;
}

// Formulaire d'un événement (espace équipe).
// Renvoie { valeurs, erreurs } : « valeurs » porte les noms des colonnes.
export function validerEvenement(formData) {
  const erreurs = {};

  const titre = texte(formData, "titre");
  if (!titre) erreurs.titre = "Donnez un titre à l'événement.";
  longueurMax(erreurs, "titre", titre, 200);

  const slug = creerSlug(texte(formData, "slug") || titre);
  if (titre && !estSlugValide(slug)) {
    erreurs.slug = "Cette adresse n'est pas utilisable : utilisez des lettres ou des chiffres.";
  }

  const resume = texte(formData, "resume");
  longueurMax(erreurs, "resume", resume, 500);
  const description = texteLong(formData, "description");
  longueurMax(erreurs, "description", description, 10000);
  const categorie = texte(formData, "categorie");
  longueurMax(erreurs, "categorie", categorie, 60);

  const lieuNom = texte(formData, "lieu_nom");
  if (!lieuNom) erreurs.lieu_nom = "Indiquez le lieu.";
  longueurMax(erreurs, "lieu_nom", lieuNom, 150);
  const lieuVille = texte(formData, "lieu_ville");
  if (!lieuVille) erreurs.lieu_ville = "Indiquez la ville.";
  longueurMax(erreurs, "lieu_ville", lieuVille, 100);

  const debut = texte(formData, "debut");
  if (!FORMAT_DATE_HEURE.test(debut)) erreurs.debut = "Indiquez la date et l'heure de début.";
  const fin = texte(formData, "fin");
  if (fin && !FORMAT_DATE_HEURE.test(fin)) erreurs.fin = "Cette date de fin n'est pas valide.";
  // Même format des deux côtés : l'ordre alphabétique est l'ordre des dates.
  else if (fin && debut && fin < debut) erreurs.fin = "La fin doit être après le début.";

  // Prix : vide = gratuit. On accepte « 500 », « 500,50 » ou « 1 000 ».
  const prixSaisi = texte(formData, "prix").replace(/\s/g, "").replace(",", ".");
  const prix = prixSaisi ? Number(prixSaisi) : null;
  if (prixSaisi && !(prix > 0 && prix < 100000000)) {
    erreurs.prix = "Indiquez un prix en dinars, ou laissez vide si l'événement est gratuit.";
  }

  const invites = texteLong(formData, "invites");
  longueurMax(erreurs, "invites", invites, 2000);

  const lienInscription = texte(formData, "lien_inscription");
  if (lienInscription && (!FORMAT_LIEN.test(lienInscription) || lienInscription.length > 500)) {
    erreurs.lien_inscription = "Ce lien doit commencer par https://";
  }

  return {
    valeurs: {
      titre,
      slug,
      resume,
      description: description || null,
      categorie: categorie || null,
      lieu_nom: lieuNom,
      lieu_ville: lieuVille,
      debut: debut ? versHorodatage(debut) : null,
      fin: fin ? versHorodatage(fin) : null,
      prix,
      invites: invites || null,
      inscription_requise: formData.get("inscription_requise") === "on",
      lien_inscription: lienInscription || null,
      mise_en_avant: formData.get("mise_en_avant") === "on",
    },
    erreurs,
  };
}

// Une personne qui s'inscrit (site public) ou que l'équipe ajoute.
// Le téléphone est facultatif.
export function validerParticipant(formData) {
  const erreurs = {};

  const prenom = texte(formData, "prenom");
  if (!prenom) erreurs.prenom = "Indiquez votre prénom.";
  else if (prenom.length > 100) erreurs.prenom = "Ce prénom est trop long.";

  const nom = texte(formData, "nom");
  if (!nom) erreurs.nom = "Indiquez votre nom.";
  else if (nom.length > 100) erreurs.nom = "Ce nom est trop long.";

  const email = texte(formData, "email").toLowerCase();
  if (!email) erreurs.email = "Indiquez votre adresse email.";
  else if (email.length > 254 || !FORMAT_EMAIL.test(email))
    erreurs.email = "Cette adresse email ne semble pas valide.";

  const tel = texte(formData, "tel");
  if (tel && !FORMAT_TEL.test(tel))
    erreurs.tel = "Ce numéro ne semble pas valide (chiffres, espaces et + uniquement).";

  return { valeurs: { prenom, nom, email, tel: tel || null }, erreurs };
}

// Responsable et bilan d'un événement. Renvoie { valeurs, erreur }.
export function validerSuivi(formData) {
  const erreurs = {};
  const valeurs = {};
  for (const [nom, max] of [
    ["responsable", 150],
    ["ce_qui_a_marche", 5000],
    ["difficultes", 5000],
    ["a_ameliorer", 5000],
    ["ressources", 5000],
  ]) {
    const valeur = texteLong(formData, nom);
    longueurMax(erreurs, nom, valeur, max);
    valeurs[nom] = valeur || null;
  }
  return { valeurs, erreur: Object.values(erreurs)[0] ?? null };
}

// Description d'une photo. Renvoie { valeurs, erreur }.
export function validerDetailsPhoto(formData) {
  const texteAlternatif = texte(formData, "texte_alternatif");
  const legende = texte(formData, "legende");
  const credit = texte(formData, "credit");

  let erreur = null;
  if (!texteAlternatif || texteAlternatif.length > 300) erreur = "description";
  else if (legende.length > 300 || credit.length > 100) erreur = "longueur";

  return {
    valeurs: { texte_alternatif: texteAlternatif, legende: legende || null, credit: credit || null },
    erreur,
  };
}
