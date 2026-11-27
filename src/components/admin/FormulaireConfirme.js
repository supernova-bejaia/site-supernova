"use client";

// Un formulaire qui demande confirmation avant d'agir (annuler un
// événement, supprimer une photo…). « action » est une Server Action.
export default function FormulaireConfirme({ action, message, children, className }) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(evenement) => {
        if (!window.confirm(message)) evenement.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
