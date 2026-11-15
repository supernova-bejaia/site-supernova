import { estSlugValide } from "./articles";
import { creerSlug } from "./slug";

// Validation du formulaire d'article, exécutée côté serveur.
// Les mêmes limites existent dans la base (table article et stockage) :
// le site donne des messages clairs, la base sert de dernier rempart.

export const TAILLE_MAX_IMAGE = 2 * 1024 * 1024; // 2 Mo, comme dans le stockage

// Formats d'image acceptés, et l'extension donnée au fichier enregistré.
export const FORMATS_IMAGE = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function texte(formData, nom) {
  const valeur = formData.get(nom);
  return typeof valeur === "string" ? valeur.trim() : "";
}

// Reçoit le FormData du formulaire.
//   publier : vrai si l'article va être mis en ligne (le texte est alors
//             obligatoire ; un brouillon peut rester incomplet).
// Renvoie { valeurs, erreurs } : « erreurs » est vide si tout est correct.
export function validerArticle(formData, { publier }) {
  const erreurs = {};

  const titre = texte(formData, "titre");
  if (!titre) erreurs.titre = "Donnez un titre à l'article.";
  else if (titre.length > 200) erreurs.titre = "Ce titre est trop long (200 caractères au plus).";

  // L'adresse est déduite du titre si le champ est laissé vide. Ce qui est
  // saisi est toujours nettoyé (accents, espaces, majuscules).
  const slug = creerSlug(texte(formData, "slug") || titre);
  if (titre && !estSlugValide(slug)) {
    erreurs.slug = "Cette adresse n'est pas utilisable : utilisez des lettres ou des chiffres.";
  }

  const resume = texte(formData, "resume");
  if (resume.length > 500) erreurs.resume = "Ce résumé est trop long (500 caractères au plus).";

  // Le texte garde ses retours à la ligne : on ne retire que les espaces
  // de fin.
  const brut = formData.get("contenu");
  const contenu = typeof brut === "string" ? brut.replace(/\r\n/g, "\n").trimEnd() : "";
  if (contenu.length > 100000) erreurs.contenu = "Ce texte est trop long.";
  else if (publier && !contenu.trim()) {
    erreurs.contenu = "Écrivez le texte de l'article avant de le publier.";
  }

  return { valeurs: { titre, slug, resume, contenu }, erreurs };
}

// Vérifie une image de couverture envoyée par le formulaire.
// Renvoie un message d'erreur, ou null si l'image est acceptable.
//
// On ne se fie pas au type annoncé par le navigateur : les premiers octets
// du fichier doivent être ceux d'une vraie image du format déclaré.
export async function validerImage(fichier) {
  if (!FORMATS_IMAGE[fichier.type]) {
    return "Format d'image non accepté : utilisez un fichier JPEG, PNG ou WebP.";
  }
  if (fichier.size > TAILLE_MAX_IMAGE) {
    return "Cette image est trop lourde (2 Mo au plus).";
  }

  const debut = new Uint8Array(await fichier.slice(0, 12).arrayBuffer());
  const commencePar = (octets, position = 0) =>
    octets.every((octet, index) => debut[position + index] === octet);

  const signatureValide = {
    "image/jpeg": commencePar([0xff, 0xd8, 0xff]),
    "image/png": commencePar([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    // « RIFF » …. « WEBP »
    "image/webp": commencePar([0x52, 0x49, 0x46, 0x46]) && commencePar([0x57, 0x45, 0x42, 0x50], 8),
  }[fichier.type];

  return signatureValide ? null : "Ce fichier n'est pas une image valide.";
}
