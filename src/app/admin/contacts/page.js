import { Suspense } from "react";
import Link from "next/link";
import { verifierAccesAdmin } from "@/lib/acces-admin";
import { normaliserNom } from "@/lib/validation-contact";
import { listerContacts } from "@/services/contacts";
import BandeauInstallation from "@/components/contacts/BandeauInstallation";
import ListeContacts from "@/components/contacts/ListeContacts";
import pageStyles from "../admin.module.css";
import styles from "@/components/admin/Articles.module.css";

export const metadata = {
  title: "Contacts — Espace équipe",
};

// Carnet de contacts : la liste, avec recherche. Réservé aux membres du
// Noyau ; la base ne livre que les contacts que chacun a le droit de voir.
export default function PageContacts() {
  return (
    <div className={`conteneur ${pageStyles.page}`}>
      <Suspense fallback={<p className={pageStyles.chargement}>Chargement des contacts…</p>}>
        <Contacts />
      </Suspense>
    </div>
  );
}

async function Contacts() {
  // 1. Contrôle d'accès, avant toute lecture (redirige si refusé).
  const { supabase } = await verifierAccesAdmin();

  // 2. Lecture des contacts, et de la fiche du compte connecté (pour
  //    afficher « Suivi par vous »).
  let contacts;
  let moi;
  try {
    const [liste, { data, error }] = await Promise.all([
      listerContacts(supabase),
      supabase.rpc("ma_personne"),
    ]);
    if (error) throw new Error(error.message);
    contacts = liste;
    moi = data;
  } catch (erreur) {
    console.error("Liste des contacts indisponible :", erreur.message);
    return (
      <>
        <Entete />
        <p className={pageStyles.erreur} role="alert">
          Les contacts n&apos;ont pas pu être chargés. Rechargez la page dans un instant.
        </p>
      </>
    );
  }

  // Seules les données utiles à la liste partent vers le navigateur.
  const lignes = contacts.map((contact) => {
    const sousTitre = [contact.organisation?.poste, contact.organisation?.organisation]
      .filter(Boolean)
      .join(" · ");
    return {
      id: contact.id_contact,
      nom: contact.nom,
      sousTitre,
      visibilite: contact.visibilite,
      partenaire: contact.partenaire,
      estMoi: contact.referent?.id_personne === moi,
      referent: contact.referent ? `${contact.referent.prenom} ${contact.referent.nom}` : "—",
      texteRecherche: normaliserNom(`${contact.nom} ${sousTitre} ${contact.lieu_rencontre}`),
    };
  });

  return (
    <>
      <Entete />
      <BandeauInstallation />
      <ListeContacts contacts={lignes} />
    </>
  );
}

function Entete() {
  return (
    <header className={pageStyles.entete}>
      <div className={pageStyles.titres}>
        <Link prefetch={false} href="/admin" className={styles.retour}>
          <span aria-hidden="true">←</span> Tableau de bord
        </Link>
        <h1 className={pageStyles.titre}>Contacts</h1>
      </div>
      <Link prefetch={false} href="/admin/contacts/nouveau" className="bouton">
        Ajouter un contact
      </Link>
    </header>
  );
}
