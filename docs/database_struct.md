## 表结构

### book_user_custom_fields
- 表结构及索引结构
create table public.book_user_custom_fields (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  created_user_id uuid not null,
  app_code text not null,
  type text not null,
  extended_field jsonb null,
  amount bigint null default 0,
  post_ids uuid[] null,
  is_deleted boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  visibility boolean not null default true,
  is_public boolean not null default false,
  example_data text null,
  readme text not null,
  table_name text null,
  source text null,
  note_ids uuid[] null,
  is_deletable boolean not null default true,
  projectid uuid[] null,
  brand_name text null,
  constraint book_user_custom_fields_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_book_user_custom_fields_user_id on public.book_user_custom_fields using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_book_user_custom_fields_app_code on public.book_user_custom_fields using btree (app_code) TABLESPACE pg_default;

create index IF not exists idx_book_user_custom_fields_is_deleted on public.book_user_custom_fields using btree (is_deleted) TABLESPACE pg_default;

create index IF not exists idx_book_user_custom_fields_extended_field_gin on public.book_user_custom_fields using gin (extended_field) TABLESPACE pg_default;

create index IF not exists idx_book_user_custom_fields_post_ids_gin on public.book_user_custom_fields using gin (post_ids) TABLESPACE pg_default;

create index IF not exists idx_book_user_custom_fields_type on public.book_user_custom_fields using btree (type) TABLESPACE pg_default;

create index IF not exists idx_book_user_custom_fields_projectid_gin on public.book_user_custom_fields using gin (projectid) TABLESPACE pg_default;

create trigger set_timestamp BEFORE
update on book_user_custom_fields for EACH row
execute FUNCTION trigger_set_timestamp ();

### user_profiles
- 表结构及索引
create table public.book_user_custom_fields (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  created_user_id uuid not null,
  app_code text not null,
  type text not null,
  extended_field jsonb null,
  amount bigint null default 0,
  post_ids uuid[] null,
  is_deleted boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  visibility boolean not null default true,
  is_public boolean not null default false,
  example_data text null,
  readme text not null,
  table_name text null,
  source text null,
  note_ids uuid[] null,
  is_deletable boolean not null default true,
  projectid uuid[] null,
  brand_name text null,
  constraint book_user_custom_fields_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_book_user_custom_fields_user_id on public.book_user_custom_fields using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_book_user_custom_fields_app_code on public.book_user_custom_fields using btree (app_code) TABLESPACE pg_default;

create index IF not exists idx_book_user_custom_fields_is_deleted on public.book_user_custom_fields using btree (is_deleted) TABLESPACE pg_default;

create index IF not exists idx_book_user_custom_fields_extended_field_gin on public.book_user_custom_fields using gin (extended_field) TABLESPACE pg_default;

create index IF not exists idx_book_user_custom_fields_post_ids_gin on public.book_user_custom_fields using gin (post_ids) TABLESPACE pg_default;

create index IF not exists idx_book_user_custom_fields_type on public.book_user_custom_fields using btree (type) TABLESPACE pg_default;

create index IF not exists idx_book_user_custom_fields_projectid_gin on public.book_user_custom_fields using gin (projectid) TABLESPACE pg_default;

create trigger set_timestamp BEFORE
update on book_user_custom_fields for EACH row
execute FUNCTION trigger_set_timestamp ();

### book_notes
- 表结构及索引结构
create table public.book_notes (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  created_user_id uuid not null,
  fold_id uuid null,
  post_ids uuid[] null,
  is_deleted boolean not null default false,
  note_name text null,
  note text null,
  share_url text null,
  source text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint book_notes_pkey primary key (id),
  constraint book_notes_created_user_id_fkey foreign KEY (created_user_id) references auth.users (id),
  constraint book_notes_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_book_notes_user_id on public.book_notes using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_book_notes_fold_id on public.book_notes using btree (fold_id) TABLESPACE pg_default;

create index IF not exists idx_book_notes_created_user_id on public.book_notes using btree (created_user_id) TABLESPACE pg_default;

create index IF not exists idx_book_notes_is_deleted on public.book_notes using btree (is_deleted) TABLESPACE pg_default;

create index IF not exists idx_book_notes_post_ids_gin on public.book_notes using gin (post_ids) TABLESPACE pg_default;

### book_folds
- 表结构及索引
create table public.book_folds (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  fold_structure jsonb not null default '[]'::jsonb,
  type text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint book_folds_pkey primary key (id),
  constraint book_folds_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_book_folds_user_id on public.book_folds using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_book_folds_structure_gin on public.book_folds using gin (fold_structure) TABLESPACE pg_default;

### knowledge_base
- 表结构及索引
create table public.knowledge_base (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  title text not null,
  content text not null,
  content_type text not null default 'xiaohongshu'::text,
  author text null,
  tags text[] null,
  meta_data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  url text null,
  fold_id uuid null,
  project_id uuid null,
  constraint knowledge_base_pkey primary key (id),
  constraint knowledge_base_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_knowledge_base_created_at on public.knowledge_base using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_knowledge_base_url on public.knowledge_base using btree (url) TABLESPACE pg_default;

create index IF not exists idx_knowledge_base_user_id on public.knowledge_base using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_knowledge_base_content_type on public.knowledge_base using btree (content_type) TABLESPACE pg_default;

create index IF not exists idx_knowledge_base_tags on public.knowledge_base using gin (tags) TABLESPACE pg_default;

create index IF not exists idx_knowledge_base_meta_data on public.knowledge_base using gin (meta_data) TABLESPACE pg_default;

create trigger update_knowledge_base_updated_at_trigger BEFORE
update on knowledge_base for EACH row
execute FUNCTION update_knowledge_base_updated_at ();

### book_user_memory
create table public.book_user_memory (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  memory jsonb null,
  memory_name text not null,
  level text null,
  is_deleted boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint book_user_memory_pkey primary key (id),
  constraint book_user_memory_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_book_user_memory_user_id on public.book_user_memory using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_book_user_memory_memory_gin on public.book_user_memory using gin (memory) TABLESPACE pg_default;

create index IF not exists idx_book_user_memory_is_deleted on public.book_user_memory using btree (is_deleted) TABLESPACE pg_default;

create trigger set_timestamp BEFORE
update on book_user_memory for EACH row
execute FUNCTION trigger_set_timestamp ();

