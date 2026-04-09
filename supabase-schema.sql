create table if not exists sources (
  id text primary key,
  name text not null,
  domain text not null,
  feed_url text,
  source_type text not null,
  active boolean not null default true
);

create table if not exists raw_articles (
  id text primary key,
  source_id text references sources(id),
  external_id text,
  original_title text not null,
  original_url text not null,
  raw_summary text,
  raw_content text,
  published_at timestamptz,
  fetched_at timestamptz,
  hash text
);

create table if not exists articles (
  id text primary key,
  raw_article_id text references raw_articles(id),
  slug text unique not null,
  title text not null,
  excerpt text,
  body_html text,
  category text not null,
  image_url text,
  seo_title text,
  seo_description text,
  status text not null,
  score integer,
  published_at timestamptz,
  created_at timestamptz,
  validation jsonb
);

create table if not exists article_sources (
  id text primary key,
  article_id text references articles(id),
  source_name text not null,
  source_url text not null,
  attribution_text text
);

create table if not exists images (
  id text primary key,
  article_id text references articles(id),
  provider text,
  image_url text,
  alt_text text,
  credit_text text
);

create table if not exists jobs (
  id text primary key,
  job_type text not null,
  status text not null,
  started_at timestamptz,
  ended_at timestamptz,
  meta_json jsonb
);
