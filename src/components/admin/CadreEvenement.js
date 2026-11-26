import Link from "next/link";
import { verifierAccesAdmin } from "@/lib/acces-admin";
import { dateCourte } from "@/lib/dates";
import { STATUTS_EVENEMENT, insecables } from "@/lib/evenements";
import { FORMAT_UUID } from "@/lib/validation";
import { lireEvenement } from "@/services/evenements-admin";
import pageStyles from "@/app/admin/admin.module.css";
import articles from "./Articles.module.css";
import styles from "./Evenements.module.css";

// Cadre commun aux quatre onglets d'un événement (Informations, Photos,
// Inscrits, Bilan) :
//   1. contrôle d'accès, avant toute lecture ;
//   2. lecture de l'événement ;
//   3. en-tête (titre, statut, date, lien vers le site) et onglets ;
//   4. message après une action (paramètre « etat » de l'adresse) ;
//   5. le contenu de l'onglet : « children » est une fonction qui reçoit
//      { evenement, supabase }.
//
// messages / erreurs : textes affichés selon la valeur de « etat ».
export default async function CadreEvenement({
  params,
  searchParams,
  onglet,
  messages = {},
  erreurs = {},
  children,
}) {
  const { supabase } = await verifierAccesAdmin();
  const { id } = await params;
  const { etat } = await searchParams;

  let evenement = null;
  let panne = false;
  if (FORMAT_UUID.test(id)) {
    try {
      evenement = await lireEvenement(supabase, id);
    } catch (erreur) {
      console.error("Lecture d'un événement impossible :", erreur.message);
      panne = true;
    }
  }

  if (!evenement) {
    return (
      <>
        <Retour />
        <p className={pageStyles.erreur} role="alert">
          {panne
            ? "L'événement n'a pas pu être chargé. Rechargez la page dans un instant."
            : "Cet événement n'existe pas."}
        </p>
      </>
    );
  }

  const visible = evenement.statut !== "BROUILLON" && evenement.published_at;
  const base = `/admin/evenements/${evenement.id_evenement}`;
  const onglets = [
    { id: "informations", href: base, libelle: "Informations" },
    { id: "photos", href: `${base}/photos`, libelle: "Photos", nombre: evenement.photos.length },
    { id: "inscrits", href: `${base}/inscrits`, libelle: "Inscrits", nombre: evenement.nombreInscrits },
    { id: "bilan", href: `${base}/bilan`, libelle: "Bilan" },
  ];

  return (
    <>
      <header className={styles.enteteEvenement}>
        <Retour />
        <h1 className={pageStyles.titre}>{insecables(evenement.titre)}</h1>
        <p className={articles.infosLigne}>
          <span className={articles.statut} data-statut={evenement.statut}>
            {STATUTS_EVENEMENT[evenement.statut]}
          </span>
          <span>Le {dateCourte(evenement.debut)}</span>
          {visible && (
            <a href={`/evenements/${evenement.slug}`} target="_blank" rel="noopener" className={styles.lienSite}>
              Voir sur le site <span aria-hidden="true">↗</span>
            </a>
          )}
        </p>
      </header>

      <nav className={styles.onglets} aria-label="Rubriques de l'événement">
        {onglets.map((element) => (
          <Link
            key={element.id}
            href={element.href}
            prefetch={false}
            className={styles.onglet}
            aria-current={element.id === onglet ? "page" : undefined}
          >
            {element.libelle}
            {element.nombre > 0 && <span className={styles.pastilleNombre}>{element.nombre}</span>}
          </Link>
        ))}
      </nav>

      {messages[etat] && (
        <p className={articles.notification} role="status">
          {messages[etat]}
        </p>
      )}
      {(erreurs[etat] || etat === "echec") && (
        <p className={`${articles.notification} ${articles.notificationErreur}`} role="alert">
          {erreurs[etat] ?? "L'opération a échoué. Réessayez dans un instant."}
        </p>
      )}

      {await children({ evenement, supabase })}
    </>
  );
}

function Retour() {
  return (
    <Link prefetch={false} href="/admin/evenements" className={articles.retour}>
      <span aria-hidden="true">←</span> Événements
    </Link>
  );
}
