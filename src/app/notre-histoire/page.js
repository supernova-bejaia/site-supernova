import PageEnPreparation from "@/components/layout/PageEnPreparation";

export const metadata = {
  title: "Notre histoire",
  description:
    "L'histoire de Supernova, collectif étudiant indépendant né à Béjaïa, et de celles et ceux qui le font vivre.",
  alternates: { canonical: "/notre-histoire" },
};

// Page « Notre histoire » : vierge pour le moment.
// Le contenu sera écrit ici, à la place du gabarit « en préparation ».
export default function PageNotreHistoire() {
  return (
    <PageEnPreparation
      repere="Le collectif"
      titre={
        <>
          Notre <span className="accent">histoire</span>
        </>
      }
      message="Cette page est en cours d'écriture."
    />
  );
}
