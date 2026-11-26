import { Suspense } from "react";
import Link from "next/link";
import { verifierAccesAdmin } from "@/lib/acces-admin";
import { lireContact, listerContacts, listerOrganisations } from "@/services/contacts";
import FormulaireContact from "@/components/contacts/FormulaireContact";
import pageStyles from "../../../admin.module.css";
import styles from "@/components/admin/Articles.module.css";

export const metadata = {
  title: "Modifier un contact — Espace équipe",
};

const FORMAT_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function PageModifierContact({ params }) {
  return (
    <div className={`conteneur ${pageStyles.page}`}>
      <Suspense fallback={<p className={pageStyles.chargement}>Chargement du contact…</p>}>
        <ModifierContact params={params} />
      </Suspense>
    </div>
  );
}

function aujourdhuiABejaia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Algiers" }).format(new Date());
}

async function ModifierContact({ params }) {
  // Contrôle d'accès avant toute lecture (redirige si refusé).
  const { supabase } = await verifierAccesAdmin();
  const { id } = await params;

  let contact = null;
  let organisations = [];
  let contactsConnus = [];
  let panne = false;
  if (FORMAT_UUID.test(id)) {
    try {
      const [lu, noms, contacts] = await Promise.all([
        lireContact(supabase, id),
        listerOrganisations(supabase),
        listerContacts(supabase),
      ]);
      contact = lu;
      organisations = noms;
      contactsConnus = contacts.map((connu) => ({ id: connu.id_contact, nom: connu.nom }));
    } catch (erreur) {
      console.error("Lecture d'un contact à modifier impossible :", erreur.message);
      panne = true;
    }
  }

  const entete = (
    <header className={pageStyles.entete}>
      <div className={pageStyles.titres}>
        <Link prefetch={false} href={contact ? `/admin/contacts/${contact.id_contact}` : "/admin/contacts"} className={styles.retour}>
          <span aria-hidden="true">←</span> {contact ? contact.nom : "Contacts"}
        </Link>
        <h1 className={pageStyles.titre}>Modifier le contact</h1>
      </div>
    </header>
  );

  if (!contact || !contact.peutModifier) {
    return (
      <>
        {entete}
        <p className={pageStyles.erreur} role="alert">
          {panne
            ? "Ce contact n'a pas pu être chargé. Rechargez la page dans un instant."
            : !contact
              ? "Ce contact n'existe pas, ou vous n'avez pas accès à sa fiche."
              : "Seul le référent de ce contact (ou un Head of, sauf contact privé) peut le modifier."}
        </p>
      </>
    );
  }

  // Seules les données utiles au formulaire partent vers le navigateur.
  const valeurs = {
    id: contact.id_contact,
    nom: contact.nom,
    lieu_rencontre: contact.lieu_rencontre,
    date_rencontre: contact.date_rencontre,
    raison_rencontre: contact.raison_rencontre,
    visibilite: contact.visibilite,
    conditions: contact.conditions,
    notes: contact.notes,
    partenaire: contact.partenaire,
    organisations: contact.organisations.map((lien) => ({
      organisation: lien.organisation,
      poste: lien.poste ?? "",
      actuel: lien.actuel,
    })),
    telephones: contact.peutModifierCoordonnees
      ? contact.coordonnees.filter((c) => c.type === "TELEPHONE").map((c) => c.valeur)
      : [],
    emails: contact.peutModifierCoordonnees
      ? contact.coordonnees.filter((c) => c.type === "EMAIL").map((c) => c.valeur)
      : [],
    estReferent: contact.estReferent,
    peutModifierCoordonnees: contact.peutModifierCoordonnees,
  };

  return (
    <>
      {entete}
      <FormulaireContact
        contact={valeurs}
        organisations={organisations}
        contactsConnus={contactsConnus}
        aujourdhui={aujourdhuiABejaia()}
      />
    </>
  );
}
