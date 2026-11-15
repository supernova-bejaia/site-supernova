import PageEnPreparation from "@/components/layout/PageEnPreparation";

export const metadata = {
  title: "Articles",
  description: "Les articles de Supernova, collectif étudiant indépendant de Béjaïa.",
};

// Page « Articles » : vierge pour le moment.
// Les articles seront affichés ici, à la place du gabarit « en préparation ».
export default function PageArticles() {
  return (
    <PageEnPreparation
      repere="À lire"
      titre={
        <>
          Nos <span className="accent">articles</span>
        </>
      }
      message="Les premiers articles arrivent prochainement."
    />
  );
}
