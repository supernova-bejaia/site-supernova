import Image from "next/image";
import Link from "next/link";
import Apparition from "@/components/mouvement/Apparition";
import EmblemeOrbite from "@/components/emblemes/EmblemeOrbite";
import { RESEAUX } from "@/lib/site";
import styles from "./page.module.css";

// Page d'accueil (landing page). Elle suit le brief « FrontEND Supernova
// site » : curiosité → compréhension → envie → inscription.
//   01 Ouverture        : l'accroche, centrée sur l'étudiant
//   02 Deux étudiants   : le contraste diplôme seul / diplôme + le reste
//   03 Concrètement     : Vivre, Construire, Grandir
//   04 Des actions      : les projets de la saison (PROJETS, plus bas)
//   05 La communauté    : les gens qu'on y croise
//   06 Pas le temps ?   : l'objection, et l'Orbite comme réponse
//   07 Ta place         : Noyau, Orbite, Spectateur (NIVEAUX, plus bas)
//   08 FAQ              : les questions fréquentes (FAQ, plus bas)
//   09 Appel final
//
// Règle : aucun chiffre, témoignage ou avantage inventé. Tout ce qui est
// écrit ici vient des documents de Supernova.

const INSTAGRAM = RESEAUX.find((reseau) => reseau.nom === "Instagram");

// Projets de la saison. Pour en ajouter un, ajouter une ligne. Les photos
// sont rangées dans public/evenements/<identifiant>/ ; la première sert de
// couverture. « legende » (facultatif) s'affiche sur la photo, « cadrage »
// (facultatif) choisit la partie gardée quand la vignette est recadrée.
// « etat » : "passe" (réalisé) ou "en-cours".
const PROJETS = [
  {
    titre: "Green Quest",
    statut: "Réalisé · 20 novembre",
    etat: "passe",
    etiquettes: ["Parc national de Gouraya", "Jeu par équipes", "Impact local"],
    texte:
      "Une journée pour nettoyer le parc national de Gouraya et le cartographier sur Google Maps, en équipes, avec des points à la clé. Les gagnants sont repartis avec un compte Netflix, et chaque participant avec un prix de participation.",
    partenaires:
      "En collaboration avec le Parc national de Gouraya, l'EPIC Bougie Provert et la direction des transports.",
    photos: [
      { src: "/evenements/green-quest-2026/01-groupe-gardes.jpg", largeur: 1600, hauteur: 901, alt: "Les participants de Green Quest réunis avec les gardes du parc national de Gouraya." },
      { src: "/evenements/green-quest-2026/02-prix-netflix.jpg", largeur: 1080, hauteur: 1350, cadrage: "center 62%", legende: "Prix Netflix", alt: "Une enveloppe Supernova marquée Netflix, devant l'entrée du parc national de Gouraya." },
      { src: "/evenements/green-quest-2026/03-avant.jpg", largeur: 1200, hauteur: 1600, legende: "Avant", alt: "Un local du parc rempli de bouteilles et de déchets, avant le nettoyage." },
      { src: "/evenements/green-quest-2026/04-apres.jpg", largeur: 1200, hauteur: 1600, legende: "Après", alt: "Le même local, vidé de ses déchets après le passage des équipes." },
      { src: "/evenements/green-quest-2026/05-sacs-collectes.jpg", largeur: 1080, hauteur: 810, alt: "Les sacs de déchets collectés, alignés devant le panneau du parc." },
      { src: "/evenements/green-quest-2026/06-ramassage-baie.jpg", largeur: 1080, hauteur: 810, alt: "Des participants ramassent des déchets, avec la baie de Béjaïa en fond." },
      { src: "/evenements/green-quest-2026/07-lettres-bejaia.jpg", largeur: 1600, hauteur: 901, alt: "Les grandes lettres BEJAIA sur la montagne de Gouraya, avec l'équipe au pied." },
    ],
  },
  {
    titre: "Caravane ORS",
    statut: "En cours · Prochaine masterclass le 5 décembre",
    etat: "en-cours",
    etiquettes: ["Entreprises", "Défis réels", "Masterclass"],
    texte:
      "Des entreprises arrivent avec leurs vraies problématiques, des jeunes talents proposent des solutions. La Caravane passe par plusieurs masterclass : celle du 7 novembre a eu lieu, la prochaine se tient le 5 décembre.",
    partenaires:
      "Soutenue par le ministère de l'Économie de la connaissance et des Startups, en collaboration avec DELTALOG.",
    photos: [
      { src: "/evenements/masterclass-7-novembre-2026/01.jpg", largeur: 1600, hauteur: 901, alt: "Une salle pleine d'étudiants pendant la masterclass du 7 novembre." },
      { src: "/evenements/masterclass-7-novembre-2026/02.jpg", largeur: 901, hauteur: 1600, alt: "L'intervenant de la masterclass explique un point, le bras levé." },
      { src: "/evenements/masterclass-7-novembre-2026/04.jpg", largeur: 901, hauteur: 1600, alt: "L'intervenant présente devant l'écran, face aux étudiants." },
      { src: "/evenements/masterclass-7-novembre-2026/03.jpg", largeur: 901, hauteur: 1600, alt: "Des étudiants attentifs autour des tables de la salle." },
    ],
  },
];

// Les trois niveaux d'engagement (documentation Supernova : Noyau / Orbite),
// du plus léger au plus engagé : ils s'affichent dans cet ordre.
const NIVEAUX = [
  {
    id: "spectateur",
    nom: "Spectateur",
    role: "Suivre Supernova",
    reperes: "Sans adhésion",
    points: [
      "Nos contenus, en accès libre",
      "Les événements ouverts au public",
    ],
    condition: "Pas d'accès aux avantages réservés à la communauté.",
    acces: "Rien à remplir.",
    cta: INSTAGRAM
      ? { libelle: "Suivre sur Instagram", href: INSTAGRAM.url, externe: true }
      : { libelle: "Voir les événements", href: "/evenements" },
  },
  {
    id: "orbite",
    nom: "Orbite",
    role: "Vivre Supernova",
    reperes: "Ouvert toute l'année",
    points: [
      "Accès prioritaire aux événements",
      "La liste email privée : coulisses et prochains rendez-vous",
      "L'accès au canal de la communauté",
      "Des places réservées sur certaines sorties du Noyau",
    ],
    condition: "Aucun engagement fixe : tu participes quand tu peux.",
    acces: "Gratuit, sur simple inscription.",
    cta: { libelle: "Rejoindre l'Orbite", href: "/rejoindre#formulaire-orbite" },
  },
  {
    id: "noyau",
    nom: "Noyau",
    role: "Construire Supernova",
    reperes: "Le plus engagé",
    points: [
      "Tu organises les projets et les événements",
      "Tu as un rôle et des responsabilités dans l'équipe",
      "Tu es aux premières loges des opportunités internes",
    ],
    condition: "Environ 3 h par semaine et ta présence aux événements, sur une saison de 6 mois.",
    acces: "Sur candidature, puis 20 minutes pour faire connaissance.",
    cta: { libelle: "Candidater au Noyau", href: "/rejoindre#titre-noyau" },
  },
];

const FAQ = [
  {
    question: "Est-ce que c'est gratuit ?",
    reponse:
      "Oui. Rejoindre Supernova ne coûte rien, et l'Orbite restera gratuite : on ne fait jamais payer l'appartenance au collectif.",
  },
  {
    question: "Faut-il avoir de l'expérience ?",
    reponse:
      "Pour l'Orbite, non : une inscription suffit. Pour le Noyau, on commence par un formulaire, puis on prend 20 minutes pour faire connaissance.",
  },
  {
    question: "Est-ce ouvert à toutes les filières ?",
    reponse:
      "Oui. Université, ESTIN ou autre établissement : toutes les filières sont les bienvenues.",
  },
  {
    question: "Combien de temps faut-il y consacrer ?",
    reponse:
      "Ça dépend de ta place. Dans le Noyau, compte environ 3 heures par semaine et ta présence aux événements. Dans l'Orbite, aucun engagement fixe : tu viens quand tu peux.",
  },
  {
    question: "Comment se passe le recrutement ?",
    reponse:
      "L'Orbite est ouverte en continu, sur simple inscription. Le Noyau recrute une fois par saison : tu remplis un formulaire, on te recontacte sous quelques jours si ton profil correspond, puis on se rencontre 20 minutes.",
  },
  {
    question: "Peut-on passer de l'Orbite au Noyau ?",
    reponse:
      "Oui. Tu peux candidater au Noyau à chaque nouvelle saison. Et l'inverse existe aussi : un membre du Noyau trop chargé peut passer une saison en Orbite, sans perdre le lien.",
  },
  {
    question: "Peut-on participer sans être membre ?",
    reponse:
      "Oui. Les événements ouverts au public sont accessibles à tous, et nos contenus sont en accès libre.",
  },
  {
    question: "Supernova est-elle une association ?",
    reponse:
      "Supernova est un collectif étudiant indépendant, né à Béjaïa. Il n'est rattaché à aucune université ni à aucune autre organisation.",
  },
];

export default function PageAccueil() {
  return (
    <>
      {/* ---------- 01 — Ouverture ---------- */}
      <section className={styles.ouverture} aria-labelledby="titre-accueil">
        <div className={styles.decorOuverture} aria-hidden="true">
          <span className={styles.halo} />
          <Image
            src="/marque/comete.png"
            alt=""
            width={520}
            height={371}
            priority
            className={styles.cometeOuverture}
          />
        </div>

        <div className={`conteneur ${styles.contenuOuverture}`}>
          <p className={`annotation ${styles.entree}`}>
            <span className={styles.pastille} aria-hidden="true" />
            Collectif étudiant · Béjaïa
          </p>
          <h1 id="titre-accueil" className={`${styles.titreOuverture} ${styles.entree}`}>
            Tes années étudiantes méritent <span className="accent">plus que des cours.</span>
          </h1>
          <p className={`chapeau ${styles.entree}`}>
            Supernova, c&apos;est un collectif d&apos;étudiants qui organise des sorties et des
            événements, monte des projets concrets et fait se rencontrer des gens qui ne se
            seraient jamais croisés.
          </p>
          <div className={`${styles.actions} ${styles.entree}`}>
            <a href="#ta-place" className="bouton">
              Trouver ma place
              <span className="fleche" aria-hidden="true">
                →
              </span>
            </a>
            <a href="#concretement" className={styles.lienDiscret}>
              C&apos;est quoi, Supernova ?
            </a>
          </div>
        </div>
      </section>

      {/* ---------- 02 — Deux étudiants ---------- */}
      <section className={`conteneur ${styles.recit}`} aria-labelledby="titre-recit">
        <Apparition className={styles.texteRecit}>
          <h2 id="titre-recit" className={styles.titreRecit}>
            Deux étudiants entrent à l&apos;université la même année.
          </h2>
          <p className="texte">
            Même filière, même amphi, à peu près les mêmes notes.
          </p>
          <p className="texte">
            Le premier fait exactement ce qu&apos;on attend de lui. Cours, TD, révisions,
            examens. Trois ans plus tard, il repart avec un diplôme.
          </p>
          <p className="texte">
            Le second fait la même chose. Mais entre deux partiels, il a aidé à monter un
            événement, rencontré des gens d&apos;autres filières, appris à aller voir une
            entreprise, vécu des journées qu&apos;il racontera encore dans dix ans.
          </p>
          <p className={styles.chuteRecit}>Lui aussi repart avec un diplôme. Et avec tout le reste.</p>
        </Apparition>

        <Apparition delai={120} className={styles.bilan}>
          <div className={styles.colonneBilan}>
            <p className="annotation">Le premier repart avec</p>
            <ul>
              <li>Un diplôme</li>
            </ul>
          </div>
          <div className={`${styles.colonneBilan} ${styles.colonneBilanForte}`}>
            <p className="annotation">Le second repart avec</p>
            <ul>
              <li>Un diplôme</li>
              <li>Des rencontres</li>
              <li>Des compétences</li>
              <li>Des expériences</li>
              <li>Des souvenirs</li>
            </ul>
          </div>
        </Apparition>

        <Apparition className={styles.morale}>
          <p className="declaration">
            La différence, ce n&apos;est pas le talent. Ce sont les{" "}
            <span className="accent">occasions</span>.
          </p>
          <p className="chapeau">Supernova existe pour les créer.</p>
        </Apparition>
      </section>

      {/* ---------- 03 — Concrètement ---------- */}
      <section
        id="concretement"
        className={`conteneur ${styles.piliers} ${styles.ancre}`}
        aria-labelledby="titre-piliers"
      >
        <Entete id="titre-piliers" chapeau="Un collectif d'étudiants qui fait trois choses, ensemble.">
          C&apos;est quoi, <span className={styles.lueur}>Supernova</span> ?
        </Entete>

        <ol className={styles.listePiliers}>
          <Apparition as="li" className={styles.pilier}>
            <span className={styles.motPilier}>Vivre</span>
            <p className="texte">
              Des événements, des sorties, des expériences. Le genre de moments qu&apos;aucun
              emploi du temps ne te donnera.
            </p>
          </Apparition>
          <Apparition as="li" delai={80} className={styles.pilier}>
            <span className={styles.motPilier}>Construire</span>
            <p className="texte">
              Des projets concrets, avec un vrai impact à Béjaïa. Tu ne regardes pas les choses
              se faire : tu les fais.
            </p>
          </Apparition>
          <Apparition as="li" delai={160} className={styles.pilier}>
            <span className={styles.motPilier}>Grandir</span>
            <p className="texte">
              Des compétences que les cours ne t&apos;apprennent pas, des rencontres en dehors de
              ta promo, et un réseau qui compte pour la suite.
            </p>
          </Apparition>
        </ol>
      </section>

      {/* ---------- 04 — Des actions ---------- */}
      <section className={styles.actionsSaison} aria-labelledby="titre-actions">
        <div className="conteneur">
          <Entete
            id="titre-actions"
            alignement="gauche"
            chapeau="Ce qu'on a déjà fait sur le terrain, et ce qui arrive."
          >
            Des idées, mais surtout des actions
          </Entete>

          <ul className={styles.listeProjets}>
            {PROJETS.map((projet, index) => (
              <Apparition as="li" key={projet.titre} delai={index * 80} className={styles.projet}>
                <span className={styles.indexProjet} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {projet.photos && (
                  <div className={styles.photosProjet}>
                    {projet.photos.map((photo, rang) => (
                      <figure
                        key={photo.src}
                        className={rang === 0 ? styles.couverture : styles.vignette}
                      >
                        <Image
                          src={photo.src}
                          alt={photo.alt}
                          width={photo.largeur}
                          height={photo.hauteur}
                          sizes={rang === 0 ? "(min-width: 900px) 1200px, 100vw" : "(min-width: 900px) 220px, 33vw"}
                          style={photo.cadrage ? { objectPosition: photo.cadrage } : undefined}
                        />
                        {photo.legende && <figcaption>{photo.legende}</figcaption>}
                      </figure>
                    ))}
                  </div>
                )}
                <div className={styles.corpsProjet}>
                  <p className={`${styles.statutProjet} ${projet.etat === "passe" ? styles.statutPasse : ""}`}>
                    {projet.statut}
                  </p>
                  <h3 className="titre-element">{projet.titre}</h3>
                  <p className="texte">{projet.texte}</p>
                  {projet.partenaires && <p className={styles.partenaires}>{projet.partenaires}</p>}
                  <ul className={styles.etiquettes}>
                    {projet.etiquettes.map((etiquette) => (
                      <li key={etiquette}>{etiquette}</li>
                    ))}
                  </ul>
                </div>
              </Apparition>
            ))}
          </ul>

          <Apparition className={styles.suiteActions}>
            <p className="texte">Photos et résultats arrivent ici après chaque événement.</p>
            <Link href="/evenements" className="bouton bouton-secondaire">
              Voir les événements
              <span className="fleche" aria-hidden="true">
                →
              </span>
            </Link>
          </Apparition>
        </div>
      </section>

      {/* ---------- 05 — La communauté ---------- */}
      <section className={`conteneur ${styles.communaute}`} aria-labelledby="titre-communaute">
        <Entete
          id="titre-communaute"
          chapeau="Les événements, c'est ce qu'on voit. Ce qui reste, ce sont les gens."
        >
          Une communauté avant tout
        </Entete>

        <Apparition delai={100} className={styles.profils}>
          <p className="chapeau">Dans Supernova, tu croises celles et ceux qui…</p>
          <ul className={styles.nuageProfils}>
            <li>filment et montent</li>
            <li>démarchent les entreprises</li>
            <li>codent</li>
            <li>gèrent la logistique le jour J</li>
            <li>font vivre les réseaux</li>
            <li>accueillent les nouveaux</li>
            <li>veulent faire bouger Béjaïa</li>
          </ul>
          <p className="texte">
            De toutes les filières, de l&apos;université comme de l&apos;ESTIN. Des gens que tu
            n&apos;aurais pas croisés en restant dans ta promo.
          </p>
          {INSTAGRAM && (
            <a
              href={INSTAGRAM.url}
              className={styles.lienInstagram}
              target="_blank"
              rel="noopener noreferrer"
            >
              Voir les coulisses sur Instagram
              <span aria-hidden="true">↗</span>
              <span className="lecteur-ecran"> (s&apos;ouvre dans un nouvel onglet)</span>
            </a>
          )}
        </Apparition>
      </section>

      {/* ---------- 06 — Pas le temps ? ---------- */}
      <section className={styles.objection} aria-labelledby="titre-objection">
        <div className="conteneur">
          <Entete
            id="titre-objection"
            alignement="gauche"
            chapeau="Beaucoup d'étudiants aimeraient s'impliquer, mais n'ont pas des heures à donner chaque semaine. C'est pour eux qu'on a créé l'Orbite."
          >
            Et si j&apos;ai pas le temps ?
          </Entete>
        </div>
        <div className={`conteneur ${styles.grilleObjection}`}>
          <Apparition className={styles.texteObjection}>
            <p className={styles.phraseCle}>
              Tu n&apos;as pas besoin d&apos;organiser les événements pour pouvoir{" "}
              les vivre.
            </p>
            <p className="texte">
              L&apos;Orbite, c&apos;est faire partie de Supernova sans engagement fixe. Tu profites
              des avantages de la communauté et tu participes selon tes envies et tes
              disponibilités.
            </p>
            <a href="#ta-place" className={styles.lienDiscret}>
              Voir les trois façons d&apos;en faire partie ↓
            </a>
          </Apparition>
          <Apparition delai={120} className={styles.emblemeObjection}>
            <EmblemeOrbite />
          </Apparition>
        </div>
      </section>

      {/* ---------- 07 — Ta place ---------- */}
      <section
        id="ta-place"
        className={`conteneur ${styles.places} ${styles.ancre}`}
        aria-labelledby="titre-places"
      >
        <Entete
          id="titre-places"
          chapeau="Trois façons d'en faire partie, selon le temps que tu as et ce que tu veux en tirer."
        >
          À chacun sa place dans Supernova
        </Entete>

        <div className={styles.grillePlaces}>
          {NIVEAUX.map((niveau, index) => (
            <Apparition
              as="article"
              key={niveau.id}
              delai={index * 90}
              className={`${styles.carte} ${styles[`carte_${niveau.id}`]}`}
            >
              <p className={styles.repereCarte}>{niveau.reperes}</p>
              <h3 className={styles.nomCarte}>{niveau.nom}</h3>
              <p className={styles.roleCarte}>{niveau.role}</p>
              <ul className={styles.pointsCarte}>
                {niveau.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <dl className={styles.conditions}>
                <div>
                  <dt>Engagement</dt>
                  <dd>{niveau.condition}</dd>
                </div>
                <div>
                  <dt>Accès</dt>
                  <dd>{niveau.acces}</dd>
                </div>
              </dl>
              {niveau.cta.externe ? (
                <a
                  href={niveau.cta.href}
                  className={`bouton bouton-secondaire ${styles.boutonCarte}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {niveau.cta.libelle}
                  <span className="fleche" aria-hidden="true">
                    ↗
                  </span>
                  <span className="lecteur-ecran"> (s&apos;ouvre dans un nouvel onglet)</span>
                </a>
              ) : (
                <Link
                  href={niveau.cta.href}
                  className={`bouton ${niveau.id === "noyau" ? "" : "bouton-secondaire"} ${styles.boutonCarte}`}
                >
                  {niveau.cta.libelle}
                  <span className="fleche" aria-hidden="true">
                    →
                  </span>
                </Link>
              )}
            </Apparition>
          ))}
        </div>
        <p className={styles.notePlaces}>
          L&apos;Orbite est ouverte en continu. Le Noyau recrute une fois par saison : rejoindre
          l&apos;Orbite est le meilleur moyen d&apos;être prévenu.
        </p>
      </section>

      {/* ---------- 08 — FAQ ---------- */}
      <section className={`conteneur ${styles.faq}`} aria-labelledby="titre-faq">
        <Entete id="titre-faq" alignement="gauche">
          Questions fréquentes
        </Entete>
        <div className={styles.listeFaq}>
          {FAQ.map((item) => (
            <details key={item.question} className={styles.question}>
              <summary>
                {item.question}
                <span className={styles.signe} aria-hidden="true" />
              </summary>
              <p className="texte">{item.reponse}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ---------- 09 — Appel final ---------- */}
      <section className={styles.final} aria-labelledby="titre-final">
        <div className={`conteneur ${styles.contenuFinal}`}>
          <Apparition>
            <h2 id="titre-final" className={styles.titreFinal}>
              Dans trois ans, tu repars <span className={styles.lueur}>avec quoi</span> ?
            </h2>
            <p className="chapeau">
              Un diplôme, c&apos;est certain. Pour tout le reste, ta place t&apos;attend.
            </p>
            <div className={styles.actions}>
              <Link href="/rejoindre#formulaire-orbite" className="bouton">
                Rejoindre l&apos;Orbite
                <span className="fleche" aria-hidden="true">
                  →
                </span>
              </Link>
              <Link href="/rejoindre#titre-noyau" className="bouton bouton-secondaire">
                Candidater au Noyau
              </Link>
            </div>
          </Apparition>
        </div>
      </section>
    </>
  );
}

// Titre de section : grand, sans numéro ni surtitre.
//   alignement « centre » (défaut) : titre et chapeau centrés ;
//   alignement « gauche »          : titre à gauche, chapeau à sa droite
//                                    sur ordinateur (mise en page éditoriale).
// On alterne les deux d'une section à l'autre pour casser la répétition.
// La lueur rouge (styles.lueur) est réservée à deux moments de la page :
// « C'est quoi, Supernova ? » et l'appel final.
function Entete({ id, chapeau, alignement = "centre", children }) {
  return (
    <Apparition className={alignement === "gauche" ? styles.enteteGauche : styles.entete}>
      <h2 id={id} className={styles.titreMajeur}>
        {children}
      </h2>
      {chapeau && <p className="chapeau">{chapeau}</p>}
    </Apparition>
  );
}
