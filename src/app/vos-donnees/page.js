import Link from "next/link";
import { EMAIL_CONTACT } from "@/lib/site";
import styles from "./page.module.css";

export const metadata = {
  title: "Vos données",
  description:
    "Quelles informations Supernova collecte, pourquoi, qui y accède et comment demander leur suppression.",
};

// Affiche l'adresse de contact, ou un emplacement bien visible tant
// qu'elle n'a pas été renseignée dans lib/site.js.
function Contact() {
  if (!EMAIL_CONTACT) {
    return <span className={styles.aCompleter}>[adresse de contact à compléter]</span>;
  }
  return <a href={`mailto:${EMAIL_CONTACT}`}>{EMAIL_CONTACT}</a>;
}

// Page « Vos données » : une explication simple, sans jargon.
// Mise en page éditoriale : chaque rubrique est une section numérotée,
// le titre à gauche et le texte à droite sur ordinateur.
// Toute évolution de la collecte (nouveau champ, nouvel outil) doit être
// reportée ici.
export default function PageVosDonnees() {
  return (
    <div className={`conteneur ${styles.page}`}>
      <header className={styles.ouverture}>
        <p className={`annotation ${styles.entree}`}>Confidentialité</p>
        <h1 className={`titre-ouverture ${styles.entree}`}>
          Vos <span className="accent">données</span>
        </h1>
        <p className={`chapeau ${styles.entree}`}>
          Ce que Supernova sait de vous quand vous rejoignez l&apos;Orbite, et ce que nous en
          faisons.
        </p>
      </header>

      <Rubrique numero="01" id="titre-collecte" titre="Ce que nous collectons">
        <p>Uniquement ce que vous saisissez dans le formulaire d&apos;inscription à l&apos;Orbite :</p>
        <ul>
          <li>votre nom et votre prénom ;</li>
          <li>votre adresse email et votre numéro de téléphone ;</li>
          <li>votre établissement, votre filière et votre niveau d&apos;études ;</li>
          <li>
            vos centres d&apos;intérêt et, si vous l&apos;écrivez, ce que vous aimeriez vivre avec
            Supernova ;
          </li>
          <li>votre choix de recevoir ou non la newsletter, avec la date de ce choix.</li>
        </ul>
        <p>
          Le site n&apos;utilise ni cookie de suivi ni outil de mesure d&apos;audience, et ne
          demande pas de créer un compte.
        </p>
      </Rubrique>

      <Rubrique numero="02" id="titre-usage" titre="Pourquoi nous les collectons">
        <ul>
          <li>Enregistrer votre inscription à l&apos;Orbite.</li>
          <li>
            Vous contacter au sujet des activités de Supernova : événements, rencontres, appels
            à renfort, missions relayées.
          </li>
          <li>
            Vous proposer des opportunités qui correspondent à votre profil et à vos centres
            d&apos;intérêt.
          </li>
          <li>Vous envoyer la newsletter, uniquement si vous avez coché la case prévue.</li>
        </ul>
      </Rubrique>

      <Rubrique numero="03" id="titre-acces" titre="Qui peut y accéder">
        <p>
          Seuls les membres autorisés du Noyau de Supernova consultent ces informations. Elles
          ne sont ni vendues, ni publiées, ni transmises à des entreprises ou à d&apos;autres
          organisations.
        </p>
        <p>
          Elles sont enregistrées dans une base de données hébergée par notre prestataire
          technique, Supabase, dans l&apos;Union européenne.
        </p>
      </Rubrique>

      <Rubrique numero="04" id="titre-droits" titre="Supprimer vos données ou vous désinscrire">
        <p>
          Vous pouvez à tout moment demander à consulter, corriger ou supprimer vos
          informations, ou à ne plus recevoir la newsletter. Il suffit de nous écrire depuis
          l&apos;adresse email utilisée lors de votre inscription.
        </p>
      </Rubrique>

      <Rubrique numero="05" id="titre-contact" titre="Nous contacter">
        <p>
          Pour toute question ou demande concernant vos données : <Contact />
        </p>
      </Rubrique>

      <div className={styles.retour}>
        <Link href="/rejoindre" className="bouton bouton-secondaire">
          Retour à l&apos;inscription
        </Link>
      </div>
    </div>
  );
}

// Une rubrique : le repère numéroté et le titre, puis le texte.
function Rubrique({ numero, id, titre, children }) {
  return (
    <section className={styles.rubrique} aria-labelledby={id}>
      <div className={styles.enteteRubrique}>
        <p className="annotation">
          <span className="numero">{numero}</span>
        </p>
        <h2 id={id} className={styles.titreRubrique}>
          {titre}
        </h2>
      </div>
      <div className={styles.texteRubrique}>{children}</div>
    </section>
  );
}
