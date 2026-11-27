import { Inter, Sora } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PauseEnArrierePlan from "@/components/mouvement/PauseEnArrierePlan";
import { URL_SITE } from "@/lib/site";
import "./globals.css";

// Polices de la charte (Brand Official) : Sora (primaire : titres,
// annotations, boutons) et Inter (secondaire : texte courant).
// Hébergées avec le site par next/font (aucune requête vers Google au
// moment de la visite).
const policeTitre = Sora({
  subsets: ["latin"],
  variable: "--police-titre",
});

const policeTexte = Inter({
  subsets: ["latin"],
  variable: "--police-texte",
});

// Titre et description par défaut (ceux de l'accueil). Chaque page définit
// les siens. « metadataBase » : l'adresse du site, pour les liens complets
// des aperçus de partage et des adresses canoniques.
export const metadata = {
  metadataBase: new URL(URL_SITE),
  title: {
    default: "Supernova — Collectif étudiant à Béjaïa",
    template: "%s — Supernova",
  },
  description:
    "Supernova, collectif étudiant indépendant de Béjaïa : rencontres, masterclass et ateliers pour relier les étudiants à l'écosystème entrepreneurial algérien.",
  openGraph: {
    type: "website",
    siteName: "Supernova",
    locale: "fr_FR",
  },
};

export const viewport = {
  themeColor: "#0d0b0b",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${policeTitre.variable} ${policeTexte.variable}`}
    >
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
        <PauseEnArrierePlan />
      </body>
    </html>
  );
}
