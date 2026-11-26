import Link from "next/link";
import { dateLongue, horaire } from "@/lib/dates";
import { prixLisible } from "@/lib/evenements";
import BlocDate from "./BlocDate";
import EtiquettesEvenement from "./EtiquettesEvenement";
import Visuel from "./Visuel";
import styles from "./Evenements.module.css";

// L'événement mis en avant : la composition la plus importante de la page.
export default function EvenementALaUne({ evenement }) {
  const heures = horaire(evenement.heure, evenement.heureFin);

  return (
    <article className={styles.aLaUne} aria-labelledby={`titre-${evenement.id}`}>
      <Visuel
        image={evenement.couverture}
        texte={evenement.categorie}
        sizes="(min-width: 900px) 58vw, 100vw"
        priority
        className={styles.visuelUne}
      />

      <div className={styles.texteUne}>
        <div className={styles.enteteUne}>
          <BlocDate date={evenement.date} taille="grande" />
          <EtiquettesEvenement evenement={evenement} />
        </div>

        <h3 id={`titre-${evenement.id}`} className={styles.titreUne}>
          <Link href={`/evenements/${evenement.slug}`} className={styles.lienTitre}>
            {evenement.titre}
          </Link>
        </h3>

        <dl className={styles.infos}>
          <div>
            <dt>Date</dt>
            <dd>
              {dateLongue(evenement.date)}
              {heures && <>, {heures}</>}
            </dd>
          </div>
          <div>
            <dt>Lieu</dt>
            <dd>
              {evenement.lieu.nom}, {evenement.lieu.ville}
            </dd>
          </div>
          <div>
            <dt>Entrée</dt>
            <dd>{prixLisible(evenement.prix)}</dd>
          </div>
        </dl>

        <p className={styles.description}>{evenement.description ?? evenement.resume}</p>

        <Link href={`/evenements/${evenement.slug}`} className={styles.lienEvenement}>
          {evenement.inscriptionRequise ? "Voir le programme et s'inscrire" : "Voir l'événement"}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
