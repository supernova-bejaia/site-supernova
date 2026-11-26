"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { obtenirAccesAdmin, verifierAccesAdmin } from "@/lib/acces-admin";
import { ETIQUETTE_CACHE_ARTICLES } from "@/lib/articles";
import { droitsArticle } from "@/lib/droits";
import { validerArticle, validerImage } from "@/lib/validation-article";
import {
  changerStatutArticle,
  enregistrerArticle as enregistrerDansLaBase,
  envoyerCouverture,
  lireArticle,
  listerMesArticles,
  supprimerArticle as supprimerDansLaBase,
  supprimerCouverture,
} from "@/services/articles-admin";

// Server Actions des articles (espace équipe).
// Elles s'exécutent sur le serveur. Chacune revérifie l'accès avant d'agir :
// une action peut être appelée directement, sans passer par la page.

const FORMAT_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MESSAGE_SESSION = "Votre session a expiré. Reconnectez-vous, puis réessayez.";
const MESSAGE_PANNE = "L'enregistrement a échoué. Réessayez dans un instant : votre saisie est conservée.";
const MESSAGE_ERREURS = "Certains champs sont à corriger.";
const MESSAGE_LECTURE_SEULE =
  "Cet article n'est plus un brouillon : seuls les Head of et la direction peuvent le modifier.";
const MESSAGE_PUBLICATION =
  "La publication est faite par un Head of ou la direction. Enregistrez votre brouillon : il sera relu avant d'être mis en ligne.";

// Ce que le compte connecté peut faire de cet article (null = nouveau).
async function droitsSur(supabase, niveau, article) {
  const estAuteur = article ? (await listerMesArticles(supabase)).has(article.id_article) : true;
  return droitsArticle(article, niveau, estAuteur);
}

const echec = (message, erreurs = {}) => ({ ok: false, message, erreurs });

// Après une écriture : le site public relira les articles, et le
// navigateur oublie les pages de l'espace équipe qu'il a en mémoire (la
// liste afficherait sinon un article supprimé ou un ancien statut).
function rafraichirApresEcriture() {
  updateTag(ETIQUETTE_CACHE_ARTICLES);
  revalidatePath("/admin", "layout");
}

// Crée ou modifie un article, en brouillon ou publié.
//
// Champs attendus : id (vide pour une création), intention (« publier » ou
// « brouillon »), titre, slug, resume, contenu, image (fichier facultatif),
// retirer_image (case à cocher).
//
// État renvoyé au formulaire :
//   { ok: true, id, statut }            → enregistré
//   { ok: false, message, erreurs }     → à corriger, ou échec
export async function enregistrerArticle(etatPrecedent, formData) {
  try {
    // Sans redirection : le formulaire garde ainsi la saisie en cours.
    const acces = await obtenirAccesAdmin();
    if (!acces) return echec(MESSAGE_SESSION);
    const { supabase, niveau } = acces;

    const publier = formData.get("intention") === "publier";

    // Modification : l'article doit exister.
    const idSaisi = String(formData.get("id") ?? "");
    let existant = null;
    if (idSaisi) {
      existant = FORMAT_UUID.test(idSaisi) ? await lireArticle(supabase, idSaisi) : null;
      if (!existant) return echec("Cet article n'existe plus.");
    }

    // Droits (la base les vérifie aussi) : message clair avant d'essayer.
    const droits = await droitsSur(supabase, niveau, existant);
    if (!droits.modifier) return echec(MESSAGE_LECTURE_SEULE);
    if (publier && !droits.publier) return echec(MESSAGE_PUBLICATION);

    // Validation des champs, puis de l'image éventuelle.
    const { valeurs, erreurs } = validerArticle(formData, { publier });

    const fichier = formData.get("image");
    const nouvelleImage = fichier instanceof File && fichier.size > 0 ? fichier : null;
    if (nouvelleImage) {
      const erreurImage = await validerImage(nouvelleImage);
      if (erreurImage) erreurs.image = erreurImage;
    }

    if (Object.keys(erreurs).length > 0) return echec(MESSAGE_ERREURS, erreurs);

    // L'image est envoyée en premier : si l'enregistrement échoue ensuite,
    // elle est retirée (voir plus bas).
    const cheminNouvelleImage = nouvelleImage
      ? await envoyerCouverture(supabase, nouvelleImage)
      : null;

    const ancienneImage = existant?.image_couverture ?? null;
    const retirerImage = formData.get("retirer_image") === "on";
    const imageCouverture = cheminNouvelleImage ?? (retirerImage ? null : ancienneImage);

    const resultat = await enregistrerDansLaBase(supabase, existant?.id_article ?? null, {
      ...valeurs,
      image_couverture: imageCouverture,
      statut: publier ? "PUBLIE" : "BROUILLON",
      // La date de publication est fixée à la première mise en ligne, et
      // conservée ensuite (même si l'article repasse en brouillon).
      published_at: publier
        ? (existant?.published_at ?? new Date().toISOString())
        : (existant?.published_at ?? null),
    }).catch(async (erreur) => {
      await supprimerCouverture(supabase, cheminNouvelleImage);
      throw erreur;
    });

    if (resultat.slugDejaPris) {
      await supprimerCouverture(supabase, cheminNouvelleImage);
      return echec(MESSAGE_ERREURS, {
        slug: "Un autre article utilise déjà cette adresse. Choisissez-en une autre.",
      });
    }

    // L'ancienne image n'est plus utilisée : on la retire du stockage.
    if (ancienneImage && ancienneImage !== imageCouverture) {
      await supprimerCouverture(supabase, ancienneImage);
    }

    rafraichirApresEcriture();

    return { ok: true, id: resultat.article.id_article, statut: resultat.article.statut };
  } catch (erreur) {
    console.error("Enregistrement d'un article en échec :", erreur.message);
    return echec(MESSAGE_PANNE);
  }
}

// Supprime définitivement un article et son image de couverture, puis
// revient à la liste. Appelée par un formulaire simple (champ « id »).
export async function supprimerArticle(formData) {
  // Redirige vers la connexion si la session n'est plus valide.
  const { supabase, niveau } = await verifierAccesAdmin();

  const idArticle = String(formData.get("id") ?? "");
  if (!FORMAT_UUID.test(idArticle)) redirect("/admin/articles");

  let etat = "supprime";
  try {
    const article = await lireArticle(supabase, idArticle);
    if (!article || !(await droitsSur(supabase, niveau, article)).supprimer) {
      etat = "refuse";
    } else {
      const image = await supprimerDansLaBase(supabase, idArticle);
      await supprimerCouverture(supabase, image);
      rafraichirApresEcriture();
    }
  } catch (erreur) {
    console.error("Suppression d'un article en échec :", erreur.message);
    etat = "echec";
  }

  redirect(`/admin/articles?etat=${etat}`);
}

// Archive un article (retiré du site, récupérable), ou restaure un
// article archivé en brouillon. Réservé aux Head of et à la direction.
export async function archiverArticle(formData) {
  const { supabase, niveau } = await verifierAccesAdmin();

  const idArticle = String(formData.get("id") ?? "");
  if (!FORMAT_UUID.test(idArticle)) redirect("/admin/articles");

  let etat;
  try {
    const article = await lireArticle(supabase, idArticle);
    if (!article || !(await droitsSur(supabase, niveau, article)).archiver) {
      etat = "refuse";
    } else {
      const restaurer = article.statut === "ARCHIVE";
      const resultat = await changerStatutArticle(
        supabase,
        idArticle,
        restaurer ? "BROUILLON" : "ARCHIVE"
      );
      etat = !resultat ? "refuse" : restaurer ? "restaure" : "archive";
      if (resultat) rafraichirApresEcriture();
    }
  } catch (erreur) {
    console.error("Archivage d'un article en échec :", erreur.message);
    etat = "echec-archive";
  }

  redirect(`/admin/articles?etat=${etat}`);
}
