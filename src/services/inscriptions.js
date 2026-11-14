import { creerClientSupabase } from "@/lib/supabase/server";

// Service « inscriptions » : tout ce qui écrit une inscription dans la base.
// Les Server Actions passent par ici ; elles ne parlent jamais directement
// à Supabase.

// Enregistre une inscription à l'Orbite pour la saison active.
// « valeurs » est l'objet déjà validé par lib/validation.js.
// Lève une erreur si l'enregistrement échoue.
export async function enregistrerInscriptionOrbite(valeurs) {
  const supabase = creerClientSupabase();

  const { error } = await supabase.rpc("inscrire_orbite", {
    p_nom: valeurs.nom,
    p_prenom: valeurs.prenom,
    p_email: valeurs.email,
    p_tel: valeurs.tel,
    p_etablissement: valeurs.etablissement,
    p_filiere: valeurs.filiere,
    p_annee: valeurs.annee,
    p_centres_interet: valeurs.centresInteret,
    p_attentes: valeurs.attentes || null,
    p_consentement_newsletter: valeurs.consentementNewsletter,
  });

  if (error) throw error;
}
