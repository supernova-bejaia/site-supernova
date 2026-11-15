import ReactMarkdown from "react-markdown";
import styles from "./Articles.module.css";

// Affiche le texte d'un article, écrit en Markdown.
//
// Sécurité : le texte n'est jamais interprété comme du HTML. Les balises
// HTML éventuellement saisies sont ignorées (skipHtml) et les adresses
// dangereuses (« javascript: »…) sont neutralisées par la bibliothèque.
//
// Choix de mise en forme :
//   - les images dans le texte sont désactivées (seule l'image de
//     couverture existe pour le moment) ;
//   - le titre de l'article est déjà le titre principal de la page : un
//     « # Titre » dans le texte devient donc un intertitre ;
//   - un lien vers un autre site s'ouvre dans un nouvel onglet.
//
// Le rendu se fait sur le serveur : la bibliothèque n'est pas envoyée au
// navigateur.
export default function ContenuMarkdown({ texte }) {
  return (
    <div className={styles.contenu}>
      <ReactMarkdown
        skipHtml
        disallowedElements={["img"]}
        components={{ h1: "h2", a: Lien }}
      >
        {texte}
      </ReactMarkdown>
    </div>
  );
}

function Lien({ href = "", children }) {
  const externe = /^https?:\/\//i.test(href);

  if (!externe) return <a href={href}>{children}</a>;

  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="lecteur-ecran"> (s&apos;ouvre dans un nouvel onglet)</span>
    </a>
  );
}
