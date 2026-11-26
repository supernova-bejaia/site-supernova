// Service « carnet de contacts » de l'espace équipe.
//
// Toutes les fonctions reçoivent le client Supabase de la session du
// membre connecté. C'est la base qui décide de ce qu'il voit : un contact
// privé n'apparaît qu'à son référent, et les coordonnées d'un contact
// restreint seulement au référent et aux membres qu'il a autorisés
// (règles RLS, migration carnet_contacts).

const FICHE = `
  id_contact, nom, lieu_rencontre, date_rencontre, raison_rencontre,
  visibilite, partenaire, conditions, notes, archive_le, created_at,
  referent:personne!contact_referent_fkey ( id_personne, prenom, nom ),
  ajoute_par:personne!contact_ajoute_par_fkey ( prenom, nom ),
  contact_organisation ( organisation, poste, principale, actuel )
`;

// Codes d'erreur de Postgres.
const CONTRAINTE_NON_RESPECTEE = "23514";
const ACCES_REFUSE = "42501";

// L'organisation à afficher sous le nom : la principale, sinon la première.
function organisationPrincipale(contact) {
  const liens = contact.contact_organisation ?? [];
  return liens.find((lien) => lien.principale) ?? liens[0] ?? null;
}

// Tous les contacts visibles (hors archivés), du plus récent au plus ancien.
export async function listerContacts(supabase) {
  const { data, error } = await supabase
    .from("contact")
    .select(FICHE)
    .is("archive_le", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return data.map((contact) => ({
    ...contact,
    organisation: organisationPrincipale(contact),
  }));
}

// Une fiche, avec les coordonnées que le compte connecté a le droit de voir.
// Renvoie null si le contact n'existe pas ou n'est pas visible.
export async function lireContact(supabase, idContact) {
  const { data: contact, error } = await supabase
    .from("contact")
    .select(FICHE)
    .eq("id_contact", idContact)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!contact) return null;

  const [{ data: coordonnees, error: erreurCoordonnees }, { data: autorise, error: erreurDroit }] =
    await Promise.all([
      supabase
        .from("coordonnee_contact")
        .select("id_coordonnee, type, valeur, libelle, principal")
        .eq("id_contact", idContact)
        .order("principal", { ascending: false })
        .order("created_at", { ascending: true }),
      supabase.rpc("peut_voir_coordonnees", { p_contact: idContact }),
    ]);

  if (erreurCoordonnees) throw new Error(erreurCoordonnees.message);
  if (erreurDroit) throw new Error(erreurDroit.message);

  // Ce que le compte connecté peut modifier (la base le revérifie).
  const [{ data: moi }, { data: gererFiche }, { data: gererCoordonnees }] = await Promise.all([
    supabase.rpc("ma_personne"),
    supabase.rpc("peut_gerer_contact", { p_contact: idContact }),
    supabase.rpc("peut_gerer_coordonnees", { p_contact: idContact }),
  ]);

  const organisations = [...(contact.contact_organisation ?? [])].sort(
    (a, b) => Number(b.principale) - Number(a.principale)
  );

  return {
    ...contact,
    organisations,
    coordonnees: coordonnees ?? [],
    peutVoirCoordonnees: autorise === true,
    estReferent: Boolean(moi) && contact.referent?.id_personne === moi,
    peutModifier: gererFiche === true,
    peutModifierCoordonnees: gererCoordonnees === true,
  };
}

// Noms d'organisations déjà saisis (contacts visibles), pour les suggérer.
export async function listerOrganisations(supabase) {
  const { data, error } = await supabase
    .from("contact_organisation")
    .select("organisation")
    .order("organisation");

  if (error) throw new Error(error.message);

  const vus = new Map();
  for (const { organisation } of data) {
    const cle = organisation.toLowerCase();
    if (!vus.has(cle)) vus.set(cle, organisation);
  }
  return [...vus.values()];
}

// Enregistre une fiche complète en une seule opération (fonction
// ajouter_contact de la base : tout ou rien). Le membre connecté en
// devient le référent.
// Renvoie { id } ou { refus: "coordonnees" | "droits" }.
export async function ajouterContact(supabase, valeurs) {
  const { data, error } = await supabase.rpc("ajouter_contact", {
    p_nom: valeurs.nom,
    p_lieu_rencontre: valeurs.lieu_rencontre,
    p_date_rencontre: valeurs.date_rencontre,
    p_visibilite: valeurs.visibilite,
    p_organisation: valeurs.organisation || null,
    p_poste: valeurs.poste || null,
    p_raison_rencontre: valeurs.raison_rencontre || null,
    p_conditions: valeurs.conditions || null,
    p_notes: valeurs.notes || null,
    p_partenaire: valeurs.partenaire,
    p_telephones: valeurs.telephones,
    p_emails: valeurs.emails,
  });

  if (error?.code === CONTRAINTE_NON_RESPECTEE) return { refus: "coordonnees" };
  // 42501 : règle d'accès ; 23502 : compte relié à aucune fiche (pas de référent).
  if (error?.code === ACCES_REFUSE || error?.code === "23502") return { refus: "droits" };
  if (error) throw new Error(error.message);

  return { id: data };
}

// Modifie une fiche en une seule opération (fonction modifier_contact de
// la base : tout ou rien). Les coordonnées ne sont remplacées que si
// « modifierCoordonnees » est vrai.
// Renvoie {} ou { refus: "coordonnees" | "droits" }.
export async function modifierContact(supabase, idContact, valeurs, { modifierCoordonnees }) {
  const { error } = await supabase.rpc("modifier_contact", {
    p_contact: idContact,
    p_nom: valeurs.nom,
    p_lieu_rencontre: valeurs.lieu_rencontre,
    p_date_rencontre: valeurs.date_rencontre,
    p_visibilite: valeurs.visibilite,
    p_raison_rencontre: valeurs.raison_rencontre || null,
    p_conditions: valeurs.conditions || null,
    p_notes: valeurs.notes || null,
    p_partenaire: valeurs.partenaire,
    p_organisations: valeurs.organisations,
    p_modifier_coordonnees: modifierCoordonnees,
    p_telephones: valeurs.telephones,
    p_emails: valeurs.emails,
  });

  if (error?.code === CONTRAINTE_NON_RESPECTEE) return { refus: "coordonnees" };
  if (error?.code === ACCES_REFUSE) return { refus: "droits" };
  if (error) throw new Error(error.message);

  return {};
}
