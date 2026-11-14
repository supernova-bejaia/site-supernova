// Espace équipe : jamais indexé par les moteurs de recherche.
export const metadata = {
  title: "Espace équipe",
  robots: { index: false, follow: false },
};

export default function LayoutAdmin({ children }) {
  return children;
}
