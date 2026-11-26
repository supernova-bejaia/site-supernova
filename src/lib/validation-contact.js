// Validation du formulaire « Ajouter un contact » (espace équipe).
//
// Mêmes règles que la base (migration carnet_contacts), pour afficher un
// message clair champ par champ avant d'envoyer. La base les revérifie.

export const VISIBILITES = {
  EQUIPE: {
    libelle: "Équipe",
    explication: "Tous les membres voient la fiche et les coordonnées.",
  },
  RESTREINT: {
    libelle: "Restreint",
    explication:
      "Tous les membres voient la fiche ; les coordonnées restent à vous et aux membres que vous autorisez.",
  },
  PRIVE: {
    libelle: "Privé",
    explication: "Vous seul voyez ce contact.",
  },
};

export const VISIBILITE_PAR_DEFAUT = "RESTREINT";

export const NOMBRE_MAX_COORDONNEES = 5;

const FORME_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FORME_TELEPHONE = /^\+?[0-9][0-9 .()-]{5,28}[0-9]$/;
const FORME_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Un email, ou 9 chiffres ou plus séparés au plus par un espace, un point
// ou un tiret : interdit dans les notes et les conditions, qui ne sont
// pas protégées comme les coordonnées (même règle que la base).
const EMAIL_DANS_TEXTE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const NUMERO_DANS_TEXTE = /[0-9]([ .-]?[0-9]){8,}/;

export function contientCoordonnees(texte) {
  return EMAIL_DANS_TEXTE.test(texte) || NUMERO_DANS_TEXTE.test(texte);
}

const MESSAGE_COORDONNEES =
  "Pas de numéro ni d'email ici : ce champ n'est pas protégé. Mettez-les dans « Téléphones » ou « Emails ».";

function texte(formData, nom) {
  const valeur = formData.get(nom);
  return typeof valeur === "string" ? valeur.trim() : "";
}

function liste(formData, nom) {
  return formData
    .getAll(nom)
    .map((valeur) => (typeof valeur === "string" ? valeur.trim() : ""))
    .filter(Boolean);
}

// Organisations saisies dans le formulaire de modification : une ligne
// par organisation (champs org_organisation et org_poste, dans l'ordre ;
// la case org_ancienne porte le numéro de la ligne). Les lignes vides sont
// ignorées ; la première restante est la principale.
function lignesOrganisations(formData) {
  const noms = formData.getAll("org_organisation");
  const postes = formData.getAll("org_poste");
  const anciennes = new Set(formData.getAll("org_ancienne").map(String));

  return noms
    .map((nomOrganisation, index) => ({
      organisation: String(nomOrganisation ?? "").trim(),
      poste: String(postes[index] ?? "").trim(),
      actuel: !anciennes.has(String(index)),
    }))
    .filter((ligne) => ligne.organisation || ligne.poste);
}

export const NOMBRE_MAX_ORGANISATIONS = 5;

// formData : le formulaire « Ajouter » (une organisation, ou « Sans
// organisation ») ou « Modifier » ({ modification: true } : une liste
// d'organisations). Renvoie { valeurs, erreurs }.
export function validerContact(formData, { modification = false } = {}) {
  const erreurs = {};

  const nom = texte(formData, "nom");
  const sansOrganisation = !modification && formData.get("sans_organisation") === "on";
  const organisation = sansOrganisation || modification ? "" : texte(formData, "organisation");
  const poste = sansOrganisation || modification ? "" : texte(formData, "poste");

  // La liste des organisations, dans les deux cas.
  let organisations = modification
    ? lignesOrganisations(formData)
    : organisation
      ? [{ organisation, poste, actuel: true }]
      : [];

  if (modification) {
    if (organisations.length > NOMBRE_MAX_ORGANISATIONS) {
      erreurs.org_organisation = `${NOMBRE_MAX_ORGANISATIONS} organisations au plus.`;
    } else if (organisations.some((ligne) => !ligne.organisation)) {
      erreurs.org_organisation = "Chaque poste doit avoir son organisation.";
    } else if (organisations.some((ligne) => ligne.organisation.length > 150 || ligne.poste.length > 150)) {
      erreurs.org_organisation = "150 caractères au plus par organisation et par poste.";
    } else {
      const noms = organisations.map((ligne) => ligne.organisation.toLowerCase());
      if (new Set(noms).size !== noms.length) {
        erreurs.org_organisation = "La même organisation apparaît deux fois.";
      }
    }
  } else {
    organisations = organisations.slice(0, 1);
  }
  const lieu = texte(formData, "lieu_rencontre");
  const date = texte(formData, "date_rencontre");
  const visibilite = texte(formData, "visibilite");
  const raison = texte(formData, "raison_rencontre");
  const conditions = texte(formData, "conditions");
  const notes = texte(formData, "notes");
  const partenaire = formData.get("partenaire") === "on";
  const telephones = liste(formData, "telephone");
  const emails = liste(formData, "email").map((email) => email.toLowerCase());

  if (!nom) erreurs.nom = "Indiquez le nom de la personne.";
  else if (nom.length > 150) erreurs.nom = "150 caractères au plus.";

  if (!sansOrganisation && !modification) {
    if (!organisation) erreurs.organisation = "Indiquez sa structure, ou cochez « Sans organisation ».";
    else if (organisation.length > 150) erreurs.organisation = "150 caractères au plus.";

    if (!poste) erreurs.poste = "Indiquez son poste ou son rôle.";
    else if (poste.length > 150) erreurs.poste = "150 caractères au plus.";
  }

  if (!lieu) erreurs.lieu_rencontre = "Indiquez où vous l'avez rencontré.";
  else if (lieu.length > 200) erreurs.lieu_rencontre = "200 caractères au plus.";

  if (!FORME_DATE.test(date) || Number.isNaN(Date.parse(date))) {
    erreurs.date_rencontre = "Indiquez une date valide.";
  }

  if (!VISIBILITES[visibilite]) erreurs.visibilite = "Choisissez qui peut voir ce contact.";

  if (raison.length > 1000) erreurs.raison_rencontre = "1 000 caractères au plus.";

  if (conditions.length > 1000) erreurs.conditions = "1 000 caractères au plus.";
  else if (contientCoordonnees(conditions)) erreurs.conditions = MESSAGE_COORDONNEES;

  if (notes.length > 5000) erreurs.notes = "5 000 caractères au plus.";
  else if (contientCoordonnees(notes)) erreurs.notes = MESSAGE_COORDONNEES;

  if (telephones.length > NOMBRE_MAX_COORDONNEES) {
    erreurs.telephone = `${NOMBRE_MAX_COORDONNEES} numéros au plus.`;
  } else if (telephones.some((numero) => !FORME_TELEPHONE.test(numero))) {
    erreurs.telephone = "Un numéro n'est pas valide (chiffres, espaces, +, points ou tirets).";
  }

  if (emails.length > NOMBRE_MAX_COORDONNEES) {
    erreurs.email = `${NOMBRE_MAX_COORDONNEES} emails au plus.`;
  } else if (emails.some((email) => email.length > 254 || !FORME_EMAIL.test(email))) {
    erreurs.email = "Un email n'est pas valide.";
  }

  return {
    erreurs,
    valeurs: {
      nom,
      organisation,
      poste,
      organisations,
      lieu_rencontre: lieu,
      date_rencontre: date,
      visibilite,
      raison_rencontre: raison,
      conditions,
      notes,
      partenaire,
      telephones: [...new Set(telephones)],
      emails: [...new Set(emails)],
    },
  };
}

// « Élodie  Martin » → « elodie martin » : pour repérer un doublon.
export function normaliserNom(nom) {
  return String(nom ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
