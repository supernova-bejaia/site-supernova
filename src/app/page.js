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

// Projets de la saison. Pour en ajouter un, ajouter une ligne ; quand un
// projet a eu lieu, passer « passe » à true et ajouter ses photos (rangées
// dans public/evenements/<identifiant>/, la première sert de couverture).
const PROJETS = [
  {
    titre: "Green Quest",
    statut: "Réalisé · 20 novembre",
    passe: true,
    etiquettes: ["Impact local", "Jeu par équipes", "Gouraya"],
    texte:
      "Avec l'association Perle d'Afrique, on a cartographié Gouraya et ses alentours sur Google Maps, tout en nettoyant. Un jeu par équipes, avec des points et des récompenses.",
    photos: [
      { src: "/evenements/green-quest-2026/01.jpg", largeur: 1600, hauteur: 901, alt: "L'équipe de Green Quest réunie au parc de Gouraya, la ville de Béjaïa en contrebas." },
      { src: "/evenements/green-quest-2026/02.jpg", largeur: 1600, hauteur: 1200, alt: "Des participants ramassent des déchets dans une ancienne bâtisse de Gouraya." },
      { src: "/evenements/green-quest-2026/03.jpg", largeur: 1600, hauteur: 1200, alt: "Les grandes lettres BEJAIA sur le flanc de la montagne de Gouraya." },
      { src: "/evenements/green-quest-2026/04.jpg", largeur: 1600, hauteur: 901, alt: "Quatre participants de Green Quest posent ensemble à la fin de la journée." },
    ],
  },
  {
    titre: "Caravane ORS",
    statut: "Réalisé · 7 novembre",
    passe: true,
    etiquettes: ["Entreprises", "Défis réels", "Masterclass"],
    texte:
      "Des entreprises arrivent avec leurs vraies problématiques, des jeunes talents proposent des solutions. Un événement soutenu par le ministère de l'Économie de la connaissance et des Startups, en collaboration avec DELTALOG.",
    photos: [
      { src: "/evenements/masterclass-7-novembre-2026/01.jpg", largeur: 1600, hauteur: 901, alt: "Une salle pleine d'étudiants pendant la masterclass du 7 novembre." },
      { src: "/evenements/masterclass-7-novembre-2026/02.jpg", largeur: 901, hauteur: 1600, alt: "L'intervenant de la masterclass explique un point, le bras levé." },
      { src: "/evenements/masterclass-7-novembre-2026/03.jpg", largeur: 901, hauteur: 1600, alt: "Des étudiants attentifs autour des tables de la salle." },
    ],
  },
  {
    titre: "Conférence de Saïd Djellab",
    statut: "À venir · Décembre",
    etiquettes: ["Conférence", "Export"],
    texte:
      "Ancien ministre du Commerce, il a participé aux négociations des accords de libre-échange africains et accompagne aujourd'hui les entreprises algériennes à l'export.",
  },
];

// Les trois niveaux d'engagement (documentation Supernova : Noyau / Orbite).
const NIVEAUX = [
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
          <p className="annotation">Une histoire en deux lignes</p>
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
        <Apparition>
          <p className="annotation annotation-section">
            <span className="numero">01</span> Concrètement
          </p>
          <h2 id="titre-piliers" className="titre-section">
            C&apos;est quoi, <span className="accent">Supernova</span> ?
          </h2>
          <p className="chapeau">Un collectif d&apos;étudiants qui fait trois choses, ensemble.</p>
        </Apparition>

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
          <Apparition className={styles.enteteActions}>
            <p className="annotation annotation-section">
              <span className="numero">02</span> Sur le terrain
            </p>
            <h2 id="titre-actions" className="titre-section">
              Des idées, mais surtout <span className="accent">des actions</span>
            </h2>
            <p className="chapeau">Ce qu&apos;on a déjà fait sur le terrain, et ce qui arrive.</p>
          </Apparition>

          <ul className={styles.listeProjets}>
            {PROJETS.map((projet, index) => (
              <Apparition as="li" key={projet.titre} delai={index * 80} className={styles.projet}>
                <span className={styles.indexProjet} aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {projet.photos && (
                  <div className={styles.photosProjet}>
                    {projet.photos.map((photo, rang) => (
                      <Image
                        key={photo.src}
                        src={photo.src}
                        alt={photo.alt}
                        width={photo.largeur}
                        height={photo.hauteur}
                        sizes={rang === 0 ? "(min-width: 900px) 60vw, 100vw" : "(min-width: 900px) 20vw, 33vw"}
                        className={rang === 0 ? styles.couverture : styles.vignette}
                      />
                    ))}
                  </div>
                )}
                <div className={styles.corpsProjet}>
                  <p className={`${styles.statutProjet} ${projet.passe ? styles.statutPasse : ""}`}>
                    {projet.statut}
                  </p>
                  <h3 className="titre-element">{projet.titre}</h3>
                  <p className="texte">{projet.texte}</p>
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
        <Apparition>
          <p className="annotation annotation-section">
            <span className="numero">03</span> Une communauté avant tout
          </p>
          <h2 id="titre-communaute" className="declaration">
            Les événements, c&apos;est ce qu&apos;on voit. Ce qui reste, ce sont{" "}
            <span className="accent">les gens</span>.
          </h2>
        </Apparition>

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
        <div className={`conteneur ${styles.grilleObjection}`}>
          <Apparition className={styles.texteObjection}>
            <p className="annotation annotation-section">
              <span className="numero">04</span> Et si j&apos;ai pas le temps ?
            </p>
            <h2 id="titre-objection" className="titre-section">
              Les cours, les examens, un job, la famille…
            </h2>
            <p className="chapeau">
              On connaît. Beaucoup d&apos;étudiants aimeraient s&apos;impliquer, mais
              n&apos;ont pas des heures à donner chaque semaine. C&apos;est pour eux qu&apos;on a
              créé l&apos;Orbite.
            </p>
            <p className={styles.phraseCle}>
              Tu n&apos;as pas besoin d&apos;organiser les événements pour pouvoir{" "}
              <span className="accent">les vivre</span>.
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
        <Apparition className={styles.entetePlaces}>
          <p className="annotation annotation-section">
            <span className="numero">05</span> Rejoindre
          </p>
          <h2 id="titre-places" className="titre-section">
            À chacun sa place dans <span className="accent">Supernova</span>
          </h2>
          <p className="chapeau">
            Trois façons d&apos;en faire partie, selon le temps que tu as et ce que tu veux en
            tirer.
          </p>
        </Apparition>

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
        <Apparition className={styles.enteteFaq}>
          <p className="annotation annotation-section">
            <span className="numero">06</span> Questions fréquentes
          </p>
          <h2 id="titre-faq" className="titre-section">
            Tu te demandes sûrement…
          </h2>
        </Apparition>
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
              Dans trois ans, tu repars avec quoi ?
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
