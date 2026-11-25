import { Inter, Sora } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PauseEnArrierePlan from "@/components/mouvement/PauseEnArrierePlan";
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

export const metadata = {
  title: {
    default: "Supernova — Collectif étudiant à Béjaïa",
    template: "%s — Supernova",
  },
  description:
    "Supernova est un collectif étudiant indépendant basé à Béjaïa, en Algérie.",
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
