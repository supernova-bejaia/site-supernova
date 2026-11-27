"use client";

import {
  startTransition,
  useActionState,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { archiverArticle, enregistrerArticle, supprimerArticle } from "@/actions/articles";
import ContenuMarkdown from "@/components/articles/ContenuMarkdown";
import { adresseCouverture, tempsDeLecture } from "@/lib/articles";
import { dateEnLettres } from "@/lib/dates";
import { OUTILS, appliquerEntree, appliquerOutil } from "./outils-markdown";
import lecture from "@/components/articles/Articles.module.css";
import styles from "./Articles.module.css";

const ETAT_INITIAL = { ok: false, message: "", erreurs: {} };

// Mêmes limites que sur le serveur, pour prévenir avant l'envoi.
const TAILLE_MAX_IMAGE = 2 * 1024 * 1024;
const FORMATS_IMAGE = ["image/jpeg", "image/png", "image/webp"];
const LONGUEUR_MAX = { titre: 200, resume: 500, contenu: 100000 };

const MESSAGE_ENVOI =
  "L'envoi a échoué. Vérifiez votre connexion et le poids de l'image, puis réessayez : votre saisie est conservée.";

// Appelle la Server Action en se protégeant des pannes (réseau coupé,
// envoi trop lourd) : la page ne plante pas et la saisie reste en place.
async function envoyer(etatPrecedent, donnees) {
  try {
    return await enregistrerArticle(etatPrecedent, donnees);
  } catch {
    return { ok: false, message: MESSAGE_ENVOI, erreurs: {} };
  }
}

const compterMots = (texte) => texte.trim().split(/\s+/).filter(Boolean).length;

// Formulaire d'écriture d'un article : création (sans « article ») ou
// modification.
//
// À gauche, l'écriture : l'essentiel, le texte (avec sa barre d'outils) et
// l'image de couverture. À droite, l'aperçu en direct, avec la mise en page
// du site. Sur téléphone, les deux côtés deviennent deux onglets.
//
// Deux boutons d'envoi : enregistrer en brouillon (invisible du public) ou
// publier. L'archivage et la suppression sont des formulaires à part, en
// bas de page. « droits » (lib/droits.js) dit lesquels afficher : un
// membre enregistre des brouillons, un Head of publie et archive, la
// direction supprime. La base vérifie de toute façon chaque opération.
export default function FormulaireArticle({ article = null, droits }) {
  const [etat, soumettreAction, enCours] = useActionState(envoyer, ETAT_INITIAL);

  // Ce que la personne écrit, suivi en direct pour l'aperçu et les compteurs.
  const [titre, setTitre] = useState(article?.titre ?? "");
  const [resume, setResume] = useState(article?.resume ?? "");
  const [contenu, setContenu] = useState(article?.contenu ?? "");
  // L'aperçu suit la frappe avec un léger différé : écrire reste fluide
  // même sur un long article.
  const contenuAffiche = useDeferredValue(contenu);

  // Image choisie mais pas encore envoyée : { adresse (locale), nom, poids }.
  const [imageChoisie, setImageChoisie] = useState(null);
  const [erreurImage, setErreurImage] = useState("");
  const [retirerImage, setRetirerImage] = useState(false);

  // Sur téléphone : « ecrire » ou « apercu ».
  const [onglet, setOnglet] = useState("ecrire");

  const formulaire = useRef(null);
  const zoneTexte = useRef(null);
  const champImage = useRef(null);

  const erreurs = { ...(etat.erreurs ?? {}), ...(erreurImage ? { image: erreurImage } : {}) };
  const publie = article?.statut === "PUBLIE";
  const archive = article?.statut === "ARCHIVE";
  const couvertureActuelle = adresseCouverture(article?.image_couverture);
  const mots = compterMots(contenu);

  // Le serveur a signalé des erreurs : on revient sur l'onglet d'écriture
  // (ajustement fait pendant le rendu, à chaque nouvelle réponse).
  const [etatVu, setEtatVu] = useState(etat);
  if (etat !== etatVu) {
    setEtatVu(etat);
    if (!etat.ok && Object.keys(etat.erreurs ?? {}).length > 0) setOnglet("ecrire");
  }

  function soumettre(evenement) {
    // On envoie nous-mêmes les données : le formulaire garde ainsi la
    // saisie si le serveur signale une erreur. Le bouton cliqué
    // (« submitter ») indique l'intention : brouillon ou publier.
    evenement.preventDefault();
    if (enCours) return;
    const donnees = new FormData(evenement.currentTarget, evenement.nativeEvent.submitter);
    startTransition(() => soumettreAction(donnees));
  }

  // Après la réponse du serveur.
  useEffect(() => {
    if (etat.ok) {
      // Enregistré : on affiche la page de l'article par un vrai
      // rechargement, pour repartir de ses données à jour.
      const resultat = etat.statut === "PUBLIE" ? "publie" : "brouillon";
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- rechargement complet voulu
      window.location.assign(`/admin/articles/${etat.id}?etat=${resultat}`);
      return;
    }
    const premierChampEnErreur = Object.keys(etat.erreurs ?? {})[0];
    if (premierChampEnErreur) {
      formulaire.current?.elements.namedItem(premierChampEnErreur)?.focus();
    }
  }, [etat]);

  // L'aperçu local d'une image occupe de la mémoire : on la libère quand
  // l'image change ou que l'on quitte la page.
  const adresseLocale = imageChoisie?.adresse;
  useEffect(() => {
    return () => {
      if (adresseLocale) URL.revokeObjectURL(adresseLocale);
    };
  }, [adresseLocale]);

  function choisirImage(evenement) {
    const fichier = evenement.target.files?.[0];
    setErreurImage("");
    setImageChoisie(null);
    if (!fichier) return;

    // Contrôle immédiat (le serveur revérifie de toute façon).
    let probleme = "";
    if (!FORMATS_IMAGE.includes(fichier.type)) {
      probleme = "Format d'image non accepté : utilisez un fichier JPEG, PNG ou WebP.";
    } else if (fichier.size > TAILLE_MAX_IMAGE) {
      probleme = "Cette image est trop lourde (2 Mo au plus).";
    }
    if (probleme) {
      evenement.target.value = "";
      setErreurImage(probleme);
      return;
    }

    setImageChoisie({
      adresse: URL.createObjectURL(fichier),
      nom: fichier.name,
      poids: fichier.size,
    });
    setRetirerImage(false);
  }

  function annulerImageChoisie() {
    if (champImage.current) champImage.current.value = "";
    setImageChoisie(null);
    setErreurImage("");
  }

  // Raccourcis clavier de la barre d'outils (Ctrl ou Cmd + touche).
  function surToucheTexte(evenement) {
    // Entrée dans une liste ou une citation : la ligne suivante reçoit la
    // même marque. (« isComposing » : saisie en cours sur certains
    // claviers, à ne pas interrompre.)
    const modificateur = evenement.ctrlKey || evenement.metaKey || evenement.altKey || evenement.shiftKey;
    if (evenement.key === "Enter" && !modificateur && !evenement.nativeEvent.isComposing) {
      if (appliquerEntree(zoneTexte.current, setContenu)) evenement.preventDefault();
      return;
    }

    if (!(evenement.ctrlKey || evenement.metaKey) || evenement.altKey) return;
    const outil = OUTILS.find((o) => o.raccourci === evenement.key.toLowerCase());
    if (!outil) return;
    evenement.preventDefault();
    appliquerOutil(zoneTexte.current, outil.id, setContenu);
  }

  // Image montrée dans l'aperçu : celle qui vient d'être choisie, sinon
  // celle déjà enregistrée (sauf si elle va être retirée).
  const imageApercu = imageChoisie
    ? { locale: true, adresse: imageChoisie.adresse }
    : couvertureActuelle && !retirerImage
      ? { locale: false, adresse: couvertureActuelle }
      : null;

  return (
    <>
      <form ref={formulaire} className={styles.editeur} onSubmit={soumettre}>
        <input type="hidden" name="id" value={article?.id_article ?? ""} />

        {/* Onglets : visibles sur téléphone seulement. */}
        <div className={styles.onglets} role="tablist" aria-label="Écrire ou prévisualiser">
          {[
            ["ecrire", "Écrire"],
            ["apercu", "Aperçu"],
          ].map(([id, libelle]) => (
            <button
              key={id}
              type="button"
              role="tab"
              id={`onglet-${id}`}
              aria-selected={onglet === id}
              aria-controls={`panneau-${id}`}
              className={styles.onglet}
              onClick={() => setOnglet(id)}
            >
              {libelle}
            </button>
          ))}
        </div>

        <div className={styles.grille}>
          {/* =============== Écrire =============== */}
          <div
            id="panneau-ecrire"
            role="tabpanel"
            aria-labelledby="onglet-ecrire"
            className={`${styles.panneau} ${styles.ecriture}`}
            hidden={onglet !== "ecrire"}
          >
            {/* ---------- 01 — L'essentiel ---------- */}
            <section className={styles.bloc} aria-labelledby="titre-essentiel">
              <h2 id="titre-essentiel" className="annotation annotation-section">
                <span className="numero">01</span> L&apos;essentiel
              </h2>

              <Champ
                nom="titre"
                libelle="Titre"
                erreur={erreurs.titre}
                compteur={`${titre.length} / ${LONGUEUR_MAX.titre}`}
              >
                <input
                  id="titre"
                  name="titre"
                  type="text"
                  className={styles.champTitre}
                  maxLength={LONGUEUR_MAX.titre}
                  value={titre}
                  onChange={(evenement) => setTitre(evenement.target.value)}
                  placeholder="Le titre de l'article"
                  required
                />
              </Champ>

              <Champ
                nom="resume"
                libelle="Résumé"
                facultatif
                erreur={erreurs.resume}
                compteur={`${resume.length} / ${LONGUEUR_MAX.resume}`}
                aide="Une ou deux phrases, affichées sous le titre, dans la liste des articles et lors d'un partage."
              >
                <textarea
                  id="resume"
                  name="resume"
                  rows={3}
                  maxLength={LONGUEUR_MAX.resume}
                  value={resume}
                  onChange={(evenement) => setResume(evenement.target.value)}
                />
              </Champ>

              <Champ
                nom="slug"
                libelle="Adresse de l'article"
                facultatif
                erreur={erreurs.slug}
                aide={
                  publie
                    ? "Attention : modifier l'adresse d'un article publié casse les liens déjà partagés."
                    : "Laissez vide pour la déduire du titre."
                }
              >
                <div className={styles.champAdresse}>
                  <span aria-hidden="true">/articles/</span>
                  <input
                    id="slug"
                    name="slug"
                    type="text"
                    maxLength={120}
                    defaultValue={article?.slug ?? ""}
                    placeholder="retour-sur-la-masterclass"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </div>
              </Champ>
            </section>

            {/* ---------- 02 — Le texte ---------- */}
            <section className={styles.bloc} aria-labelledby="titre-texte">
              <h2 id="titre-texte" className="annotation annotation-section">
                <span className="numero">02</span> Le texte
              </h2>

              <div className={styles.champ} data-invalide={erreurs.contenu ? "true" : undefined}>
                <label htmlFor="contenu" className="lecteur-ecran">
                  Texte de l&apos;article
                </label>

                <div className={styles.redaction}>
                  <div className={styles.barreOutils} role="toolbar" aria-label="Mise en forme">
                    {OUTILS.map((outil) => (
                      <button
                        key={outil.id}
                        type="button"
                        className={styles.outil}
                        data-style={outil.style}
                        title={
                          outil.raccourci
                            ? `${outil.nom} (Ctrl + ${outil.raccourci.toUpperCase()})`
                            : outil.nom
                        }
                        aria-label={outil.nom}
                        onClick={() => appliquerOutil(zoneTexte.current, outil.id, setContenu)}
                      >
                        {outil.symbole}
                      </button>
                    ))}
                  </div>

                  <textarea
                    ref={zoneTexte}
                    id="contenu"
                    name="contenu"
                    className={styles.zoneTexte}
                    rows={18}
                    maxLength={LONGUEUR_MAX.contenu}
                    value={contenu}
                    onChange={(evenement) => setContenu(evenement.target.value)}
                    onKeyDown={surToucheTexte}
                    placeholder="Écrivez ici. Sélectionnez un passage, puis utilisez la barre d'outils pour le mettre en forme."
                  />

                  <p className={styles.compteurs}>
                    <span>
                      {mots} mot{mots > 1 ? "s" : ""}
                    </span>
                    <span>{tempsDeLecture(contenu)} min de lecture</span>
                    <span>
                      {contenu.length.toLocaleString("fr-FR")} /{" "}
                      {LONGUEUR_MAX.contenu.toLocaleString("fr-FR")} caractères
                    </span>
                  </p>
                </div>

                {erreurs.contenu && <p className={styles.erreur}>{erreurs.contenu}</p>}
              </div>

              <details className={styles.aideMemoire}>
                <summary>Écrire la mise en forme à la main (Markdown)</summary>
                <ul>
                  <li>
                    <code>## Intertitre</code> — un intertitre (<code>###</code> pour un niveau en
                    dessous)
                  </li>
                  <li>
                    <code>**gras**</code> et <code>*italique*</code>
                  </li>
                  <li>
                    <code>[texte du lien](https://adresse.com)</code> — un lien
                  </li>
                  <li>
                    <code>- élément</code> — une liste à puces ; <code>1. élément</code> — une liste
                    numérotée
                  </li>
                  <li>
                    <code>&gt; citation</code> — une citation ; <code>---</code> — un séparateur
                  </li>
                  <li>Une ligne vide sépare deux paragraphes.</li>
                </ul>
              </details>
            </section>

            {/* ---------- 03 — L'image de couverture ---------- */}
            <section className={styles.bloc} aria-labelledby="titre-image">
              <h2 id="titre-image" className="annotation annotation-section">
                <span className="numero">03</span> L&apos;image de couverture
              </h2>

              <div className={styles.champ} data-invalide={erreurs.image ? "true" : undefined}>
                {/* Image choisie, pas encore envoyée */}
                {imageChoisie && (
                  <div className={styles.vignette}>
                    <div className={styles.cadreVignette}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- aperçu d'un fichier local, pas encore en ligne */}
                      <img src={imageChoisie.adresse} alt="Aperçu de l'image choisie" />
                    </div>
                    <div className={styles.infosVignette}>
                      <p className={styles.nomFichier}>{imageChoisie.nom}</p>
                      <p className={styles.aide}>
                        {(imageChoisie.poids / 1024 / 1024).toLocaleString("fr-FR", {
                          maximumFractionDigits: 2,
                        })}{" "}
                        Mo · sera envoyée à l&apos;enregistrement
                      </p>
                      <button type="button" className={styles.lienAction} onClick={annulerImageChoisie}>
                        Annuler ce choix
                      </button>
                    </div>
                  </div>
                )}

                {/* Image déjà enregistrée */}
                {!imageChoisie && couvertureActuelle && (
                  <div className={styles.vignette} data-retiree={retirerImage ? "true" : undefined}>
                    <div className={styles.cadreVignette}>
                      <Image
                        src={couvertureActuelle}
                        alt="Image de couverture actuelle"
                        width={0}
                        height={0}
                        sizes="320px"
                      />
                    </div>
                    <div className={styles.infosVignette}>
                      <p className={styles.nomFichier}>Image actuelle</p>
                      <label className={styles.case}>
                        <input
                          type="checkbox"
                          name="retirer_image"
                          checked={retirerImage}
                          onChange={(evenement) => setRetirerImage(evenement.target.checked)}
                        />
                        <span>Retirer cette image</span>
                      </label>
                    </div>
                  </div>
                )}

                <label htmlFor="image" className={styles.choixFichier}>
                  <span className={styles.boutonFichier}>
                    {imageChoisie || couvertureActuelle ? "Choisir une autre image" : "Choisir une image"}
                  </span>
                  <input
                    ref={champImage}
                    id="image"
                    name="image"
                    type="file"
                    accept={FORMATS_IMAGE.join(",")}
                    className={styles.champFichier}
                    aria-invalid={erreurs.image ? true : undefined}
                    aria-describedby="image-aide"
                    onChange={choisirImage}
                  />
                </label>
                <p className={styles.aide} id="image-aide">
                  Facultative. JPEG, PNG ou WebP, 2 Mo au plus. Format paysage conseillé : elle est
                  recadrée en 16/9 dans la liste, et affichée entière sur l&apos;article.
                </p>
                {erreurs.image && <p className={styles.erreur}>{erreurs.image}</p>}
              </div>
            </section>
          </div>

          {/* =============== Aperçu =============== */}
          <div
            id="panneau-apercu"
            role="tabpanel"
            aria-labelledby="onglet-apercu"
            className={`${styles.panneau} ${styles.apercu}`}
            hidden={onglet !== "apercu"}
          >
            <p className={`annotation ${styles.titreApercu}`}>
              <span className={styles.pastilleDirect} aria-hidden="true" />
              Aperçu en direct
            </p>

            <div className={styles.cadreApercu}>
              <div className={lecture.entete}>
                <p className={`annotation ${lecture.meta}`}>
                  <span>
                    {article?.published_at ? dateEnLettres(article.published_at) : "Date de publication"}
                  </span>
                  <span className={lecture.separateur} aria-hidden="true" />
                  <span>{tempsDeLecture(contenu)} min de lecture</span>
                </p>
                <p className={`${styles.titreApercuArticle} ${lecture.titreArticle}`}>
                  {titre.trim() || "Titre de l'article"}
                </p>
                {resume.trim() && <p className={lecture.chapeauArticle}>{resume}</p>}
              </div>

              {imageApercu && (
                <figure className={lecture.couverture}>
                  {imageApercu.locale ? (
                    // eslint-disable-next-line @next/next/no-img-element -- aperçu d'un fichier local, pas encore en ligne
                    <img src={imageApercu.adresse} alt="" />
                  ) : (
                    <Image src={imageApercu.adresse} alt="" width={0} height={0} sizes="600px" />
                  )}
                </figure>
              )}

              {contenuAffiche.trim() ? (
                <ContenuMarkdown texte={contenuAffiche} />
              ) : (
                <p className={styles.apercuVide}>Le texte de l&apos;article apparaîtra ici.</p>
              )}
            </div>
          </div>
        </div>

        {/* =============== Enregistrer =============== */}
        <div className={styles.barreActions}>
          <p className={styles.message} role="alert">
            {etat.ok ? "" : etat.message}
          </p>
          {!droits.publier && !etat.message && (
            <p className={styles.aide}>Un Head of ou la direction relira et publiera votre article.</p>
          )}
          <div className={styles.actions}>
            <span className={styles.statut} data-statut={article?.statut ?? "NOUVEAU"}>
              {publie ? "Publié" : archive ? "Archivé" : article ? "Brouillon" : "Nouvel article"}
            </span>
            {droits.publier ? (
              <>
                <button
                  type="submit"
                  name="intention"
                  value="brouillon"
                  className="bouton bouton-secondaire"
                  disabled={enCours}
                >
                  {publie ? "Dépublier" : "Enregistrer le brouillon"}
                </button>
                <button type="submit" name="intention" value="publier" className="bouton" disabled={enCours}>
                  {enCours ? "Enregistrement…" : publie ? "Mettre à jour" : "Publier"}
                </button>
              </>
            ) : (
              <button type="submit" name="intention" value="brouillon" className="bouton" disabled={enCours}>
                {enCours ? "Enregistrement…" : "Enregistrer le brouillon"}
              </button>
            )}
          </div>
        </div>
      </form>

      {article && droits.archiver && (
        <form action={archiverArticle} className={`${styles.zoneSuppression} ${styles.zoneArchivage}`}>
          <input type="hidden" name="id" value={article.id_article} />
          <p className={styles.aide}>
            {archive
              ? "Archivé : invisible sur le site. Restaurer le remet en brouillon."
              : "Archiver retire l'article du site sans le supprimer : il reste récupérable."}
          </p>
          <button type="submit" className="bouton bouton-secondaire">
            {archive ? "Restaurer en brouillon" : "Archiver l'article"}
          </button>
        </form>
      )}

      {article && droits.supprimer && (
        <form
          action={supprimerArticle}
          className={styles.zoneSuppression}
          onSubmit={(evenement) => {
            if (!window.confirm("Supprimer définitivement cet article ? Cette action est irréversible.")) {
              evenement.preventDefault();
            }
          }}
        >
          <input type="hidden" name="id" value={article.id_article} />
          <button type="submit" className={styles.boutonSupprimer}>
            Supprimer l&apos;article
          </button>
        </form>
      )}
    </>
  );
}

// Un champ : libellé (avec compteur éventuel), champ, aide et erreur.
// Également utilisé par le formulaire des événements.
export function Champ({ nom, libelle, facultatif = false, compteur, aide, erreur, children }) {
  return (
    <div className={styles.champ} data-invalide={erreur ? "true" : undefined}>
      <div className={styles.enteteChamp}>
        <label htmlFor={nom}>
          {libelle}
          {facultatif && <span className={styles.facultatif}> (facultatif)</span>}
        </label>
        {compteur && <span className={styles.compteur}>{compteur}</span>}
      </div>
      {children}
      {aide && <p className={styles.aide}>{aide}</p>}
      {erreur && <p className={styles.erreur}>{erreur}</p>}
    </div>
  );
}
