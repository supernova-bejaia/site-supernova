import { Suspense } from "react";
import Link from "next/link";
import { verifierAccesAdmin } from "@/lib/acces-admin";
import { listerContacts, listerOrganisations } from "@/services/contacts";
import FormulaireContact from "@/components/contacts/FormulaireContact";
import pageStyles from "../../admin.module.css";
import styles from "@/components/admin/Articles.module.css";

export const metadata = {
  title: "Ajouter un contact — Espace équipe",
};

export default function PageNouveauContact() {
  return (
    <div className={`conteneur ${pageStyles.page}`}>
      <Suspense fallback={<p className={pageStyles.chargement}>Chargement…</p>}>
        <NouveauContact />
      </Suspense>
    </div>
  );
}

// Date du jour à Béjaïa, au format des champs de date (AAAA-MM-JJ).
function aujourdhuiABejaia() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Algiers" }).format(new Date());
}

async function NouveauContact() {
  // Contrôle d'accès avant d'afficher le formulaire (redirige si refusé).
  const { supabase } = await verifierAccesAdmin();

  // Suggestions d'organisations et repérage des doublons. Si la lecture
  // échoue, le formulaire reste utilisable, simplement sans ces aides.
  let organisations = [];
  let contactsConnus = [];
  try {
    const [noms, contacts] = await Promise.all([
      listerOrganisations(supabase),
      listerContacts(supabase),
    ]);
    organisations = noms;
    contactsConnus = contacts.map((contact) => ({ id: contact.id_contact, nom: contact.nom }));
  } catch (erreur) {
    console.error("Aides du formulaire de contact indisponibles :", erreur.message);
  }

  return (
    <>
      <header className={pageStyles.entete}>
        <div className={pageStyles.titres}>
          <Link prefetch={false} href="/admin/contacts" className={styles.retour}>
            <span aria-hidden="true">←</span> Contacts
          </Link>
          <h1 className={pageStyles.titre}>Ajouter un contact</h1>
        </div>
      </header>

      <FormulaireContact
        organisations={organisations}
        contactsConnus={contactsConnus}
        aujourdhui={aujourdhuiABejaia()}
      />
    </>
  );
}
