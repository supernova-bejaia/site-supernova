import { STOCKAGE_EVENEMENTS } from "@/lib/evenements";
import { FORMATS_IMAGE } from "@/lib/validation-article";

// Service « événements » de l'espace équipe : tous les événements
// (brouillons compris), leurs photos, leur suivi et leurs inscriptions.
//
// Toutes les fonctions reçoivent le client Supabase de la session du
// membre connecté. C'est la base qui autorise ou refuse chaque opération
// (règles RLS, fonction est_admin) : la clé secrète n'est jamais utilisée.

const COLONNES = `id_evenement, slug, titre, resume, description, categorie, lieu_nom, lieu_ville,
  debut, fin, prix, invites, inscription_requise, lien_inscription, statut, mise_en_avant,
  published_at, updated_at`;

// Code d'erreur de Postgres quand une valeur unique existe déjà.
const VALEUR_DEJA_PRISE = "23505";

function verifier({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

// Tous les événements, du plus récent au plus ancien, avec leur nombre
// d'inscrits.
export async function listerEvenements(supabase) {
  const data = verifier(
    await supabase
      .from("evenement")
      .select("id_evenement, titre, slug, debut, statut, published_at, inscription_evenement ( count )")
      .order("debut", { ascending: false })
  );
  return data.map(({ inscription_evenement: compte, ...evenement }) => ({
    ...evenement,
    nombreInscrits: compte?.[0]?.count ?? 0,
  }));
}

// Un événement, avec son suivi et ses photos, ou null s'il n'existe pas.
export async function lireEvenement(supabase, idEvenement) {
  const data = verifier(
    await supabase
      .from("evenement")
      .select(
        `${COLONNES},
         suivi_evenement ( responsable, ce_qui_a_marche, difficultes, a_ameliorer, ressources ),
         photo_evenement ( id_photo, chemin, texte_alternatif, legende, credit, ordre, est_couverture, validee )`
      )
      .eq("id_evenement", idEvenement)
      .maybeSingle()
  );
  if (!data) return null;

  const { suivi_evenement: suivi, photo_evenement: photos, ...evenement } = data;
  return {
    ...evenement,
    // Lien un-à-un : selon les versions, un objet ou une liste d'un élément.
    suivi: (Array.isArray(suivi) ? suivi[0] : suivi) ?? null,
    photos: [...(photos ?? [])].sort((a, b) => a.ordre - b.ordre),
  };
}

// Crée un événement, ou le modifie si « idEvenement » est fourni.
// Renvoie { evenement }, ou { slugDejaPris: true }.
export async function enregistrerEvenement(supabase, idEvenement, valeurs) {
  const requete = idEvenement
    ? supabase.from("evenement").update(valeurs).eq("id_evenement", idEvenement)
    : supabase.from("evenement").insert(valeurs);

  const { data, error } = await requete.select(COLONNES).maybeSingle();

  if (error?.code === VALEUR_DEJA_PRISE) return { slugDejaPris: true };
  if (error) throw new Error(error.message);
  // Aucune ligne : écriture refusée (accès retiré) ou événement supprimé.
  if (!data) throw new Error("Événement introuvable ou écriture refusée.");

  return { evenement: data };
}

// Identifiant de la saison active, ou null.
export async function lireSaisonActive(supabase) {
  const data = verifier(
    await supabase.from("saison").select("id_saison").eq("statut", "ACTIVE").maybeSingle()
  );
  return data?.id_saison ?? null;
}

// Responsable et bilan (crée la ligne de suivi si besoin).
export async function enregistrerSuivi(supabase, idEvenement, valeurs) {
  const data = verifier(
    await supabase
      .from("suivi_evenement")
      .upsert({ id_evenement: idEvenement, ...valeurs })
      .select("id_evenement")
      .maybeSingle()
  );
  if (!data) throw new Error("Écriture du bilan refusée.");
}

// ---------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------

// Envoie une photo (déjà validée) puis l'enregistre à la suite des autres.
// La première photo d'un événement devient sa couverture. Une photo
// ajoutée n'est pas encore validée : le public ne la voit pas.
export async function ajouterPhoto(supabase, idEvenement, fichier, details) {
  const chemin = `${idEvenement}/${crypto.randomUUID()}.${FORMATS_IMAGE[fichier.type]}`;

  const { error: erreurEnvoi } = await supabase.storage
    .from(STOCKAGE_EVENEMENTS)
    .upload(chemin, fichier, { contentType: fichier.type, cacheControl: "31536000" });
  if (erreurEnvoi) throw new Error(erreurEnvoi.message);

  try {
    const derniere = verifier(
      await supabase
        .from("photo_evenement")
        .select("ordre")
        .eq("id_evenement", idEvenement)
        .order("ordre", { ascending: false })
        .limit(1)
        .maybeSingle()
    );
    verifier(
      await supabase.from("photo_evenement").insert({
        id_evenement: idEvenement,
        chemin,
        ...details,
        ordre: (derniere?.ordre ?? -1) + 1,
        est_couverture: !derniere,
      })
    );
  } catch (erreur) {
    await retirerFichier(supabase, chemin);
    throw erreur;
  }
}

// Valide ou masque une photo.
export async function changerValidationPhoto(supabase, idPhoto, validee) {
  verifier(await supabase.from("photo_evenement").update({ validee }).eq("id_photo", idPhoto));
}

// Fait d'une photo la couverture de son événement (une seule à la fois).
export async function definirCouverture(supabase, idEvenement, idPhoto) {
  verifier(
    await supabase
      .from("photo_evenement")
      .update({ est_couverture: false })
      .eq("id_evenement", idEvenement)
      .eq("est_couverture", true)
  );
  verifier(
    await supabase
      .from("photo_evenement")
      .update({ est_couverture: true })
      .eq("id_evenement", idEvenement)
      .eq("id_photo", idPhoto)
  );
}

// Supprime une photo et son fichier.
export async function supprimerPhoto(supabase, idPhoto) {
  const data = verifier(
    await supabase.from("photo_evenement").delete().eq("id_photo", idPhoto).select("chemin").maybeSingle()
  );
  await retirerFichier(supabase, data?.chemin);
}

// Un échec n'est pas bloquant : il laisse seulement un fichier orphelin.
async function retirerFichier(supabase, chemin) {
  if (!chemin) return;
  const { error } = await supabase.storage.from(STOCKAGE_EVENEMENTS).remove([chemin]);
  if (error) console.error("Suppression d'une photo impossible :", error.message);
}

// ---------------------------------------------------------------------
// Inscriptions
// ---------------------------------------------------------------------

// Les personnes inscrites ou présentes, dans l'ordre d'arrivée.
export async function listerInscriptions(supabase, idEvenement) {
  return verifier(
    await supabase
      .from("inscription_evenement")
      .select("id_inscription, statut, origine, created_at, personne ( nom, prenom, email, tel )")
      .eq("id_evenement", idEvenement)
      .order("created_at")
  );
}

// Pointage : INSCRIT, PRESENT, ABSENT ou DESISTE.
export async function changerStatutInscription(supabase, idInscription, statut) {
  const data = verifier(
    await supabase
      .from("inscription_evenement")
      .update({ statut })
      .eq("id_inscription", idInscription)
      .select("id_inscription")
      .maybeSingle()
  );
  if (!data) throw new Error("Inscription introuvable ou écriture refusée.");
}

// Ajoute une personne (nouvelle ou déjà connue) avec le statut donné.
// La fonction de la base ne modifie jamais une fiche existante.
export async function ajouterParticipant(supabase, idEvenement, participant, statut) {
  const { error } = await supabase.rpc("ajouter_participant", {
    p_id_evenement: idEvenement,
    p_nom: participant.nom,
    p_prenom: participant.prenom,
    p_email: participant.email,
    p_tel: participant.tel,
    p_statut: statut,
  });
  if (error) throw new Error(error.message);
}
