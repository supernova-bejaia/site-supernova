import { connection } from "next/server";
import { dateCourte } from "@/lib/dates";

// Service « tableau de bord » : les indicateurs de l'espace équipe.
//
// Toutes les valeurs sont calculées à partir des données réelles de la
// base, lues avec la session de la personne connectée (« supabase » vient
// de lib/acces-admin.js). La base ne livre ces données qu'aux comptes
// autorisés.
//
// Aucun cache : les chiffres sont recalculés à chaque affichage.

const NOMBRE_DERNIERES = 20;
const UN_JOUR_MS = 24 * 60 * 60 * 1000;

export async function obtenirTableauDeBord(supabase) {
  // Les chiffres dépendent de l'heure actuelle (« 7 derniers jours ») :
  // on indique à Next.js de ne les calculer qu'au moment de la visite.
  await connection();

  // Saison active
  const { data: saison, error: erreurSaison } = await supabase
    .from("saison")
    .select("id_saison, nom, date_debut")
    .eq("statut", "ACTIVE")
    .maybeSingle();

  if (erreurSaison) throw new Error(erreurSaison.message);
  if (!saison) return { saison: null };

  // Toutes les adhésions de la saison, avec la personne et ses centres d'intérêt
  const { data: adhesions, error } = await supabase
    .from("adhesion")
    .select(
      `id_adhesion, type, statut, created_at, consentement_newsletter,
       personne ( nom, prenom, etablissement, filiere, annee ),
       interet_adhesion ( centre_interet ( nom ) )`
    )
    .eq("id_saison", saison.id_saison)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const maintenant = Date.now();
  const depuis = (jours) => (adhesion) =>
    maintenant - new Date(adhesion.created_at).getTime() <= jours * UN_JOUR_MS;

  const actives = adhesions.filter((adhesion) => adhesion.statut === "ACTIVE");
  const orbite = actives.filter((adhesion) => adhesion.type === "ORBITE");
  const noyau = actives.filter((adhesion) => adhesion.type === "NOYAU");

  return {
    saison,
    membresOrbite: orbite.length,
    membresNoyau: noyau.length,
    inscriptions7Jours: orbite.filter(depuis(7)).length,
    inscriptions30Jours: orbite.filter(depuis(30)).length,
    abonnesNewsletter: orbite.filter((adhesion) => adhesion.consentement_newsletter).length,
    parEtablissement: compter(orbite.map((adhesion) => adhesion.personne?.etablissement)),
    centresInteret: compter(
      orbite.flatMap((adhesion) =>
        adhesion.interet_adhesion.map((lien) => lien.centre_interet?.nom)
      )
    ).slice(0, 6),
    dernieresInscriptions: orbite.slice(0, NOMBRE_DERNIERES).map((adhesion) => ({
      id: adhesion.id_adhesion,
      nom: adhesion.personne?.nom ?? "",
      prenom: adhesion.personne?.prenom ?? "",
      filiere: adhesion.personne?.filiere ?? "",
      annee: adhesion.personne?.annee ?? "",
      date: dateCourte(adhesion.created_at),
    })),
  };
}

// ["ESTIN", "ESTIN", "Aboudaou"] → [{ nom: "ESTIN", nombre: 2 }, { nom: "Aboudaou", nombre: 1 }]
function compter(valeurs) {
  const totaux = new Map();
  for (const valeur of valeurs) {
    if (!valeur) continue;
    totaux.set(valeur, (totaux.get(valeur) ?? 0) + 1);
  }
  return [...totaux.entries()]
    .map(([nom, nombre]) => ({ nom, nombre }))
    .sort((a, b) => b.nombre - a.nombre || a.nom.localeCompare(b.nom));
}
