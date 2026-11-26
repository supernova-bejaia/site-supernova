"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { normaliserNom, VISIBILITES } from "@/lib/validation-contact";
import styles from "./Contacts.module.css";

// Liste du carnet, avec une recherche instantanée (nom, organisation,
// poste, lieu de rencontre). Les contacts arrivent déjà filtrés par la
// base : chacun ne voit que ce qu'il a le droit de voir.
export default function ListeContacts({ contacts }) {
  const [recherche, setRecherche] = useState("");
  const rechercheDifferee = useDeferredValue(recherche);

  const terme = normaliserNom(rechercheDifferee);
  const affiches = terme
    ? contacts.filter((contact) => contact.texteRecherche.includes(terme))
    : contacts;

  return (
    <div className={styles.liste}>
      <label className={styles.recherche}>
        <span className="lecteur-ecran">Rechercher un contact</span>
        <input
          type="search"
          value={recherche}
          onChange={(evenement) => setRecherche(evenement.target.value)}
          placeholder="Nom, organisation, poste, lieu…"
          autoComplete="off"
          enterKeyHint="search"
        />
      </label>

      <p className={styles.compte} aria-live="polite">
        {affiches.length} contact{affiches.length > 1 ? "s" : ""}
        {terme ? ` sur ${contacts.length}` : ""}
      </p>

      {affiches.length === 0 ? (
        <p className={styles.vide}>
          {contacts.length === 0
            ? "Le carnet est vide pour le moment. Ajoutez la première personne rencontrée."
            : "Aucun contact ne correspond à cette recherche."}
        </p>
      ) : (
        <ul className={styles.lignes}>
          {affiches.map((contact) => (
            <li key={contact.id}>
              <Link prefetch={false} href={`/admin/contacts/${contact.id}`} className={styles.ligne}>
                <span className={styles.nomLigne}>
                  {contact.nom}
                  {contact.partenaire && <span className={styles.badgePartenaire}>Partenaire</span>}
                </span>
                {contact.sousTitre && <span className={styles.sousTitre}>{contact.sousTitre}</span>}
                <span className={styles.infosLigne}>
                  <span className={styles.visibilite} data-visibilite={contact.visibilite}>
                    {VISIBILITES[contact.visibilite]?.libelle}
                  </span>
                  <span>{contact.estMoi ? "Suivi par vous" : `Suivi par ${contact.referent}`}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
