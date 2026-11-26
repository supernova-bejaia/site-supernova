import { Archivo, Manrope, Space_Grotesk } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PauseEnArrierePlan from "@/components/mouvement/PauseEnArrierePlan";
import { URL_SITE } from "@/lib/site";
import "./globals.css";

// Système typographique : trois familles, chacune avec un rôle précis.
// Les polices sont hébergées avec le site par next/font (aucune requête
// vers Google au moment de la visite).

// Titres : Archivo, dont l'axe « largeur » (wdth) donne des capitales
// grasses et élargies, de la même famille visuelle que le logo.
const policeTitre = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--police-titre",
});

// Texte courant : Manrope, chaleureuse et très lisible sur téléphone.
const policeTexte = Manrope({
  subsets: ["latin"],
  variable: "--police-texte",
});

// Annotations, numéros, étiquettes et dates : Space Grotesk, pour sa
// touche technique qui évoque les relevés astronomiques.
const policeAnnotation = Space_Grotesk({
  subsets: ["latin"],
  variable: "--police-annotation",
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
  themeColor: "#080203",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="fr"
      data-scroll-behavior="smooth"
      className={`${policeTitre.variable} ${policeTexte.variable} ${policeAnnotation.variable}`}
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
