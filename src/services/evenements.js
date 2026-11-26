import { cacheLife, cacheTag } from "next/cache";
import { creerClientSupabase } from "@/lib/supabase/server";
import { estSlugValide } from "@/lib/articles";
import { aujourdhui, partiesDate } from "@/lib/dates";
import { ETIQUETTE_CACHE_EVENEMENTS, adressePhoto, insecables, lignes } from "@/lib/evenements";

// Service « événements » du site public : lecture des événements publiés.
//
// Ces lectures se font sans session, avec les droits d'un visiteur : la
// base ne renvoie que les événements publiés (y compris annulés ou
// terminés) et leurs photos validées (règles RLS). Un brouillon ne peut
// donc jamais sortir d'ici.
//
// « use cache » garde les résultats en mémoire. L'espace équipe vide cette
// mémoire (étiquette « evenements ») à chaque modification : le site
// public est alors à jour immédiatement. Le classement « à venir » ou
// « passé » est en plus recalculé environ toutes les heures.
//
// En cas d'échec, les lectures lèvent une erreur : une erreur n'est jamais
// mise en mémoire, la lecture sera donc retentée.

const COLONNES = `id_evenement, slug, titre, resume, description, categorie, lieu_nom, lieu_ville,
  debut, fin, prix, invites, inscription_requise, lien_inscription, statut, mise_en_avant,
  published_at, updated_at,
  photo_evenement ( chemin, texte_alternatif, legende, credit, ordre, est_couverture )`;

// Une ligne de la base → l'événement tel que les composants l'affichent.
function versEvenement(ligne) {
  const debut = partiesDate(ligne.debut);
  const fin = ligne.fin ? partiesDate(ligne.fin) : null;

  const photos = [...(ligne.photo_evenement ?? [])]
    .sort((a, b) => a.ordre - b.ordre)
    .map((photo) => ({
      src: adressePhoto(photo.chemin),
      alt: photo.texte_alternatif,
      legende: photo.legende ?? undefined,
      credit: photo.credit ?? undefined,
      couverture: photo.est_couverture,
    }));

  return {
    id: ligne.id_evenement,
    slug: ligne.slug,
    titre: insecables(ligne.titre),
    resume: insecables(ligne.resume),
    description: insecables(ligne.description) ?? undefined,
    categorie: ligne.categorie ?? undefined,
    date: debut.date,
    heure: debut.heure,
    dateFin: fin && fin.date !== debut.date ? fin.date : undefined,
    heureFin: fin?.heure,
    debut: ligne.debut,
    fin: ligne.fin,
    lieu: { nom: ligne.lieu_nom, ville: ligne.lieu_ville },
    prix: ligne.prix,
    invites: lignes(ligne.invites),
    inscriptionRequise: ligne.inscription_requise,
    lienInscription: ligne.lien_inscription,
    statut: ligne.statut,
    annule: ligne.statut === "ANNULE",
    miseEnAvant: ligne.mise_en_avant,
    couverture: photos.find((photo) => photo.couverture) ?? null,
    photos,
    publieLe: ligne.published_at,
    modifieLe: ligne.updated_at,
  };
}

// Passé : terminé à la main, ou dont le dernier jour est derrière nous.
const estPasse = (evenement, ceJour) =>
  evenement.statut === "TERMINE" || (evenement.dateFin ?? evenement.date) < ceJour;

async function lireEvenementsPublies() {
  "use cache";
  cacheLife("hours");
  cacheTag(ETIQUETTE_CACHE_EVENEMENTS);

  const { data, error } = await creerClientSupabase()
    .from("evenement")
    .select(COLONNES)
    .neq("statut", "BROUILLON")
    .not("published_at", "is", null)
    .order("debut");

  if (error) throw new Error(error.message);
  return data.map(versEvenement);
}

async function classerEvenements() {
  "use cache";
  cacheLife("hours");
  cacheTag(ETIQUETTE_CACHE_EVENEMENTS);

  const evenements = await lireEvenementsPublies();
  const ceJour = aujourdhui(new Date());

  const aVenir = evenements.filter((evenement) => !estPasse(evenement, ceJour));
  const passes = evenements.filter((evenement) => estPasse(evenement, ceJour)).reverse();

  // À la une : le premier événement à venir marqué « mis en avant », sauf
  // s'il est annulé.
  const miseEnAvant =
    aVenir.find((evenement) => evenement.miseEnAvant && !evenement.annule) ?? null;

  return {
    miseEnAvant,
    aVenir: aVenir.filter((evenement) => evenement !== miseEnAvant),
    passes,
  };
}

// Les événements de la page « Événements » : { miseEnAvant, aVenir, passes }.
// Si la base est injoignable, la page reste affichable (sans événement).
export async function getPageEvenements() {
  try {
    return await classerEvenements();
  } catch (erreur) {
    console.error("Lecture des événements impossible :", erreur.message);
    return { miseEnAvant: null, aVenir: [], passes: [] };
  }
}

// Tous les événements publiés (plan du site).
export async function getEvenementsPublies() {
  try {
    return await lireEvenementsPublies();
  } catch (erreur) {
    console.error("Lecture des événements impossible :", erreur.message);
    return [];
  }
}

async function lireEvenementPublie(slug) {
  "use cache";
  // L'ouverture des inscriptions dépend de l'heure : relue souvent.
  cacheLife("minutes");
  cacheTag(ETIQUETTE_CACHE_EVENEMENTS);

  const { data, error } = await creerClientSupabase()
    .from("evenement")
    .select(COLONNES)
    .neq("statut", "BROUILLON")
    .not("published_at", "is", null)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const evenement = versEvenement(data);
  const maintenant = new Date();

  return {
    ...evenement,
    passe: estPasse(evenement, aujourdhui(maintenant)),
    // Même règle que la fonction inscrire_evenement de la base.
    inscriptionsOuvertes:
      data.statut === "PUBLIE" &&
      data.inscription_requise &&
      new Date(data.fin ?? data.debut) > maintenant,
  };
}

// Un événement publié, d'après son slug, ou null s'il n'existe pas (ou
// n'est pas publié). Un slug mal formé n'interroge pas la base.
export async function getEvenementPublie(slug) {
  if (!estSlugValide(slug)) return null;
  return lireEvenementPublie(slug);
}
