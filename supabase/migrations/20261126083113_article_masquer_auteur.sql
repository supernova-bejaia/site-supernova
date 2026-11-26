-- =====================================================================
-- Supernova — Migration 5 : l'auteur d'un article n'est plus lisible
--
-- Constat (tests de sécurité du 16 novembre 2026) : la colonne
-- article.id_auteur — l'identifiant du compte qui a écrit l'article —
-- pouvait être lue par n'importe quel visiteur sur un article publié.
-- Ce n'est qu'un identifiant technique, mais il n'a pas à être public.
--
-- Correction : les rôles du site (visiteur et compte connecté) ne
-- peuvent plus lire cette colonne. Elle reste remplie automatiquement à
-- la création, et consultable depuis le tableau de bord Supabase.
--
-- Rien d'autre ne change : les règles d'accès aux lignes (RLS), la
-- lecture publique des articles publiés et l'écriture par l'équipe
-- autorisée restent identiques.
-- =====================================================================

-- Le droit de lecture sur toute la table est remplacé par un droit de
-- lecture colonne par colonne, sans id_auteur.
revoke select on public.article from anon, authenticated;

grant select (
  id_article,
  titre,
  slug,
  resume,
  contenu,
  image_couverture,
  statut,
  published_at,
  created_at,
  updated_at
) on public.article to anon, authenticated;

-- À retenir : une colonne ajoutée plus tard à la table article ne sera
-- lisible par le site que si elle est ajoutée à cette liste.
