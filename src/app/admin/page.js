import { Suspense } from "react";
import Link from "next/link";
import { verifierAccesAdmin } from "@/lib/acces-admin";
import { obtenirTableauDeBord } from "@/services/tableau-de-bord";
import { dateLongue } from "@/lib/dates";
import Indicateur from "@/components/admin/Indicateur";
import TableauInscriptions from "@/components/admin/TableauInscriptions";
import Repartition from "@/components/admin/Repartition";
import styles from "./admin.module.css";
import contactsStyles from "@/components/contacts/Contacts.module.css";

export const metadata = {
  title: "Tableau de bord — Espace équipe",
};

// Tableau de bord de l'espace équipe.
// Tout ce qui dépend de la session est rendu à la demande, derrière
// <Suspense> : rien n'est préparé à l'avance ni mis en cache.
export default function PageTableauDeBord() {
  return (
    <div className={`conteneur ${styles.page}`}>
      <Suspense fallback={<p className={styles.chargement}>Chargement du tableau de bord…</p>}>
        <TableauDeBord />
      </Suspense>
    </div>
  );
}

async function TableauDeBord() {
  // 1. Contrôle d'accès, avant toute lecture (redirige si refusé).
  const { supabase, email } = await verifierAccesAdmin();

  // 2. Lecture des indicateurs.
  let donnees;
  try {
    donnees = await obtenirTableauDeBord(supabase);
  } catch (erreur) {
    console.error("Tableau de bord indisponible :", erreur.message);
    return (
      <>
        <Entete email={email} />
        <p className={styles.erreur} role="alert">
          Les données n&apos;ont pas pu être chargées. Rechargez la page dans un instant.
        </p>
      </>
    );
  }

  if (!donnees.saison) {
    return (
      <>
        <Entete email={email} />
        <p className={styles.vide}>Aucune saison n&apos;est active pour le moment.</p>
      </>
    );
  }

  return (
    <>
      <Entete email={email} saison={donnees.saison} />

      {/* ---------- 01 — Vue d'ensemble ---------- */}
      <section className={styles.section} aria-labelledby="titre-vue">
        <h2 id="titre-vue" className="annotation annotation-section">
          <span className="numero">01</span> Vue d&apos;ensemble
        </h2>
        <div className={styles.grilleIndicateurs}>
          <Indicateur libelle="Membres Orbite" valeur={donnees.membresOrbite} precision="Saison en cours" accent />
          <Indicateur libelle="7 derniers jours" valeur={donnees.inscriptions7Jours} precision="Nouvelles inscriptions" />
          <Indicateur libelle="30 derniers jours" valeur={donnees.inscriptions30Jours} precision="Nouvelles inscriptions" />
          <Indicateur
            libelle="Newsletter"
            valeur={donnees.abonnesNewsletter}
            precision={`sur ${donnees.membresOrbite} membre${donnees.membresOrbite > 1 ? "s" : ""} Orbite`}
          />
        </div>
        <dl className={styles.complements}>
          <div>
            <dt>Membres du Noyau</dt>
            <dd>{donnees.membresNoyau}</dd>
          </div>
          <div>
            <dt>Candidatures Noyau</dt>
            <dd className={styles.nonSuivi}>Non suivies pour le moment</dd>
          </div>
        </dl>
      </section>

      {/* ---------- 02 — Dernières inscriptions ---------- */}
      <section className={styles.section} aria-labelledby="titre-inscriptions">
        <h2 id="titre-inscriptions" className="annotation annotation-section">
          <span className="numero">02</span> Dernières inscriptions
        </h2>
        <TableauInscriptions lignes={donnees.dernieresInscriptions} />
      </section>

      {/* ---------- 03 — Répartition ---------- */}
      <section className={styles.section} aria-labelledby="titre-repartition">
        <h2 id="titre-repartition" className="annotation annotation-section">
          <span className="numero">03</span> Répartition des membres Orbite
        </h2>
        <div className={styles.grilleRepartitions}>
          <Repartition
            titre="Par établissement"
            elements={donnees.parEtablissement}
            vide="Pas encore de données."
          />
          <Repartition
            titre="Centres d'intérêt les plus choisis"
            elements={donnees.centresInteret}
            vide="Aucun centre d'intérêt choisi pour l'instant."
          />
        </div>
      </section>
    </>
  );
}

// En-tête : titre, saison, compte connecté et accès à l'écriture.
// (La déconnexion est dans la barre de navigation de l'espace équipe.)
function Entete({ email, saison }) {
  return (
    <header className={styles.entete}>
      <div className={styles.titres}>
        <p className="annotation">Espace équipe</p>
        <h1 className={styles.titre}>Tableau de bord</h1>
        {saison && (
          <p className={styles.saison}>
            {saison.nom} · depuis le {dateLongue(saison.date_debut)}
          </p>
        )}
      </div>
      <div className={styles.compte}>
        <span className={styles.email}>{email}</span>
        {/* Le carnet d'abord : c'est l'outil qu'on ouvre sur téléphone,
            juste après une rencontre. */}
        <nav className={contactsStyles.acces} aria-label="Raccourcis">
          <Link href="/admin/contacts/nouveau" prefetch={false} className="bouton">
            Ajouter un contact
          </Link>
          <Link href="/admin/contacts" prefetch={false} className="bouton bouton-secondaire">
            Contacts
          </Link>
          <Link href="/admin/articles/nouveau" prefetch={false} className="bouton bouton-secondaire">
            Écrire un article
          </Link>
        </nav>
      </div>
    </header>
  );
}
