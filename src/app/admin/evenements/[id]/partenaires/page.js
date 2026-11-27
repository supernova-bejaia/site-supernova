import { Suspense } from "react";
import Link from "next/link";
import { ajouterPartenaire, retirerPartenaire } from "@/actions/evenements";
import CadreEvenement from "@/components/admin/CadreEvenement";
import FormulaireConfirme from "@/components/admin/FormulaireConfirme";
import { ROLES_PARTENAIRE } from "@/lib/validation-evenement";
import { listerContacts } from "@/services/contacts";
import pageStyles from "../../../admin.module.css";
import articles from "@/components/admin/Articles.module.css";
import styles from "@/components/admin/Evenements.module.css";

export const metadata = {
  title: "Partenaires — Espace équipe",
};

const MESSAGES = {
  "partenaire-ajoute": "Partenaire ajouté.",
  "partenaire-retire": "Partenaire retiré de l'événement (le contact reste dans le carnet).",
};
const ERREURS = {
  "partenaire-vide": "Choisissez un contact du carnet, ou indiquez le nom d'une organisation.",
  "partenaire-role": "Choisissez le rôle du partenaire.",
  "partenaire-note":
    "Note refusée : 500 caractères au plus, et jamais de numéro ni d'email (ils vont dans le carnet).",
  refuse: "Seuls l'auteur du brouillon, les Head of et la direction modifient les partenaires.",
};

// Onglet « Partenaires » : partenaires, sponsors, intervenants et lieux liés
// à l'événement. Interne à l'équipe : rien n'apparaît sur le site, aucun
// nom ni logo n'y est affiché sans l'accord du partenaire.
export default function PagePartenaires({ params, searchParams }) {
  return (
    <div className={`conteneur ${pageStyles.page}`}>
      <Suspense fallback={<p className={pageStyles.chargement}>Chargement des partenaires…</p>}>
        <CadreEvenement
          params={params}
          searchParams={searchParams}
          onglet="partenaires"
          messages={MESSAGES}
          erreurs={ERREURS}
        >
          {async ({ evenement, supabase, droits }) => {
            // Les contacts que l'on peut voir, pour les lier à l'événement.
            let contacts = [];
            if (droits.modifier) {
              try {
                contacts = await listerContacts(supabase);
              } catch (erreur) {
                console.error("Contacts indisponibles :", erreur.message);
              }
            }
            return <Partenaires evenement={evenement} contacts={contacts} modifiable={droits.modifier} />;
          }}
        </CadreEvenement>
      </Suspense>
    </div>
  );
}

function Partenaires({ evenement, contacts, modifiable }) {
  return (
    <>
      <p className={articles.aide}>
        Réservé à l&apos;équipe : rien de cet onglet n&apos;apparaît sur le site. Les coordonnées
        restent dans le carnet de contacts.
      </p>

      {evenement.partenaires.length === 0 ? (
        <p className={pageStyles.vide}>Aucun partenaire lié pour le moment.</p>
      ) : (
        <ul className={styles.listePartenaires}>
          {evenement.partenaires.map((lien) => (
            <li key={lien.id_lien} className={styles.lignePartenaire}>
              <span className={styles.nomPartenaire}>
                <strong>
                  {lien.contact ? (
                    <Link prefetch={false} href={`/admin/contacts/${lien.contact.id_contact}`}>
                      {lien.contact.nom}
                    </Link>
                  ) : (
                    lien.organisation
                  )}
                </strong>
                <span className={styles.notePartenaire}>
                  {ROLES_PARTENAIRE[lien.role]}
                  {lien.contact && lien.organisation ? ` · ${lien.organisation}` : ""}
                  {lien.note ? ` · ${lien.note}` : ""}
                </span>
              </span>
              {modifiable && (
                <FormulaireConfirme action={retirerPartenaire} message="Retirer ce partenaire de l'événement ?">
                  <input type="hidden" name="id" value={evenement.id_evenement} />
                  <input type="hidden" name="id_lien" value={lien.id_lien} />
                  <button type="submit" className={`${styles.lienBouton} ${styles.lienBoutonDanger}`}>
                    Retirer
                  </button>
                </FormulaireConfirme>
              )}
            </li>
          ))}
        </ul>
      )}

      {modifiable && (
        <form action={ajouterPartenaire} className={styles.formulairePartenaire}>
          <h2 className="annotation annotation-section">Ajouter un partenaire</h2>
          <input type="hidden" name="id" value={evenement.id_evenement} />

          <div className={articles.champ}>
            <label htmlFor="id_contact">Contact du carnet</label>
            <select id="id_contact" name="id_contact" defaultValue="">
              <option value="">Aucun : saisir une organisation</option>
              {contacts.map((contact) => (
                <option key={contact.id_contact} value={contact.id_contact}>
                  {contact.nom}
                  {contact.organisation?.organisation ? ` (${contact.organisation.organisation})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className={articles.champ}>
            <label htmlFor="organisation">
              Organisation <span className={articles.facultatif}>(si aucun contact)</span>
            </label>
            <input id="organisation" name="organisation" type="text" maxLength={150} autoComplete="off" />
          </div>

          <div className={articles.champ}>
            <label htmlFor="role">Rôle</label>
            <select id="role" name="role" defaultValue="PARTENAIRE">
              {Object.entries(ROLES_PARTENAIRE).map(([valeur, libelle]) => (
                <option key={valeur} value={valeur}>
                  {libelle}
                </option>
              ))}
            </select>
          </div>

          <div className={articles.champ}>
            <label htmlFor="note">
              Note <span className={articles.facultatif}>(facultatif)</span>
            </label>
            <input id="note" name="note" type="text" maxLength={500} autoComplete="off" />
            <p className={articles.aide}>Par exemple : « prête la salle », « offre les prix ». Jamais de numéro.</p>
          </div>

          <button type="submit" className="bouton">
            Ajouter
          </button>
        </form>
      )}
    </>
  );
}
