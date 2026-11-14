import { AUTRE, ETABLISSEMENTS, NIVEAUX_VALIDES } from "./formulaire-orbite";

// Validation du formulaire Orbite, exécutée côté serveur.
// Les mêmes règles existent dans la fonction SQL inscrire_orbite :
// le site donne des messages clairs, la base sert de dernier rempart.

const FORMAT_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const FORMAT_TEL = /^[0-9+ ().-]{6,30}$/;
const FORMAT_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Lit un champ texte du formulaire et retire les espaces autour.
function texte(formData, nom) {
  const valeur = formData.get(nom);
  return typeof valeur === "string" ? valeur.trim() : "";
}

// Reçoit le FormData du formulaire.
// Renvoie { valeurs, erreurs } : « erreurs » est vide si tout est correct.
export function validerInscription(formData) {
  const erreurs = {};

  // Les champs sont vérifiés dans l'ordre où ils apparaissent à l'écran :
  // le curseur est replacé sur la première erreur rencontrée.
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
  if (!tel) erreurs.tel = "Indiquez votre numéro de téléphone.";
  else if (!FORMAT_TEL.test(tel))
    erreurs.tel = "Ce numéro ne semble pas valide (chiffres, espaces et + uniquement).";

  // Établissement : choix dans la liste, ou champ libre si « Autre ».
  const choixEtablissement = texte(formData, "etablissement");
  let etablissement = choixEtablissement;
  if (!ETABLISSEMENTS.includes(choixEtablissement)) {
    erreurs.etablissement = "Choisissez votre établissement.";
  } else if (choixEtablissement === AUTRE) {
    etablissement = texte(formData, "etablissement_autre");
    if (!etablissement) erreurs.etablissement_autre = "Précisez votre établissement.";
    else if (etablissement.length > 150)
      erreurs.etablissement_autre = "Ce nom d'établissement est trop long.";
  }

  const filiere = texte(formData, "filiere");
  if (!filiere) erreurs.filiere = "Indiquez votre filière.";
  else if (filiere.length > 150) erreurs.filiere = "Ce nom de filière est trop long.";

  const annee = texte(formData, "annee");
  if (!NIVEAUX_VALIDES.includes(annee)) erreurs.annee = "Choisissez votre niveau d'études.";

  // Centres d'intérêt : on ne garde que des identifiants bien formés.
  const centresInteret = formData
    .getAll("centres")
    .filter((id) => typeof id === "string" && FORMAT_UUID.test(id))
    .slice(0, 30);

  const attentes = texte(formData, "attentes");
  if (attentes.length > 2000)
    erreurs.attentes = "Ce texte est trop long (2000 caractères maximum).";

  const consentementNewsletter = formData.get("newsletter") === "on";

  return {
    valeurs: {
      nom,
      prenom,
      email,
      tel,
      etablissement,
      filiere,
      annee,
      centresInteret,
      attentes,
      consentementNewsletter,
    },
    erreurs,
  };
}
