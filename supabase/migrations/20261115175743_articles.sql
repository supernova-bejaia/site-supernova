-- =====================================================================
-- Supernova — Migration 4 : articles
--
-- Objectif : permettre à l'équipe autorisée d'écrire et de publier des
-- articles depuis l'espace /admin, et aux visiteurs de lire les articles
-- publiés.
--
--   1. article            : la table des articles
--   2. maj_updated_at()   : tient la date de dernière modification à jour
--   3. règles d'accès     : lecture publique des articles publiés,
--                           gestion complète par l'équipe autorisée
--   4. stockage           : les images de couverture
--
-- Nouveauté : c'est la première ÉCRITURE ouverte à l'espace équipe.
-- Elle est limitée à la table article et aux images de couverture, et
-- réservée aux comptes de acces_admin (fonction est_admin()). Les tables
-- des inscriptions restent en lecture seule.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ARTICLE
-- ---------------------------------------------------------------------
create table public.article (
  id_article       uuid primary key default gen_random_uuid(),
  titre            text not null check (char_length(titre) between 1 and 200),
  -- Partie de l'adresse : /articles/<slug>. Minuscules, chiffres, tirets.
  slug             text not null unique
                   check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  resume           text not null default '' check (char_length(resume) <= 500),
  -- Texte au format Markdown.
  contenu          text not null default '' check (char_length(contenu) <= 100000),
  -- Chemin du fichier dans le stockage « articles » (pas une adresse complète).
  image_couverture text,
  statut           text not null default 'BROUILLON'
                   check (statut in ('BROUILLON', 'PUBLIE')),
  -- Compte qui a créé l'article. Non affiché sur le site public.
  id_auteur        uuid default auth.uid() references auth.users (id) on delete set null,
  published_at     timestamptz,     -- vide tant que l'article est un brouillon
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- Un article publié a toujours une date de publication.
  check (statut <> 'PUBLIE' or published_at is not null)
);

comment on table public.article is
  'Articles du site. Seuls ceux au statut PUBLIE sont visibles du public.';

-- La liste publique trie les articles publiés du plus récent au plus ancien.
create index article_publies_par_date
  on public.article (published_at desc)
  where statut = 'PUBLIE';

-- ---------------------------------------------------------------------
-- 2. Date de dernière modification
-- ---------------------------------------------------------------------
create or replace function public.maj_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.maj_updated_at is
  'Déclencheur : met updated_at à la date du jour à chaque modification.';

-- Fonction de déclencheur uniquement : personne ne l'appelle directement.
revoke execute on function public.maj_updated_at() from public, anon, authenticated;

create trigger article_maj_updated_at
  before update on public.article
  for each row
  execute function public.maj_updated_at();

-- ---------------------------------------------------------------------
-- 3. Règles d'accès
-- ---------------------------------------------------------------------
alter table public.article enable row level security;

-- Tout le monde lit les articles publiés, et seulement ceux-là :
-- un brouillon reste invisible même si l'on devine son adresse.
create policy "Lecture publique des articles publies"
  on public.article
  for select
  to anon, authenticated
  using (statut = 'PUBLIE');

-- L'équipe autorisée lit tout (brouillons compris), crée, modifie, supprime.
create policy "Gestion par l'equipe autorisee"
  on public.article
  for all
  to authenticated
  using ((select public.est_admin()))
  with check ((select public.est_admin()));

-- ---------------------------------------------------------------------
-- 4. Stockage des images de couverture
-- Espace public : une image se lit par son adresse, sans compte (y
-- compris celle d'un brouillon, si l'on connaît son adresse exacte ; les
-- noms de fichiers sont aléatoires). Envoi limité à 2 Mo et aux images.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'articles',
  'articles',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
);

-- Seule l'équipe autorisée envoie, remplace, liste ou supprime des images.
create policy "Articles : envoi par l'equipe autorisee"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'articles' and (select public.est_admin()));

create policy "Articles : lecture par l'equipe autorisee"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'articles' and (select public.est_admin()));

create policy "Articles : remplacement par l'equipe autorisee"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'articles' and (select public.est_admin()))
  with check (bucket_id = 'articles' and (select public.est_admin()));

create policy "Articles : suppression par l'equipe autorisee"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'articles' and (select public.est_admin()));
