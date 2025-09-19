-- Function: book_search_posts_by_embedding
-- 查询指定用户的帖子向量，返回按余弦相似度排序的结果
create or replace function public.book_search_posts_by_embedding(
  input_user_id uuid,
  query_embedding vector,
  match_count integer default 3,
  match_threshold double precision default 0
)
returns table (
  id uuid,
  user_id uuid,
  title text,
  content_type text,
  content text,
  author text,
  tags text[],
  score double precision
)
language plpgsql
as $$
begin
  if input_user_id is null then
    raise exception 'input_user_id is required';
  end if;

  if query_embedding is null then
    raise exception 'query_embedding is required';
  end if;

  return query
  select
    kb.id,
    kb.user_id,
    kb.title,
    kb.content_type,
    kb.content,
    kb.author,
    kb.tags,
    1 - (kb.embedding <=> query_embedding) as score
  from knowledge_base kb
  where kb.user_id = input_user_id
    and kb.embedding is not null
    and (kb.embedding <=> query_embedding) <= 1 - least(greatest(coalesce(match_threshold, 0), 0), 0.999999)
  order by kb.embedding <=> query_embedding
  limit greatest(1, coalesce(match_count, 3));
end;
$$;

comment on function public.book_search_posts_by_embedding(uuid, vector, integer, double precision)
  is '按余弦相似度检索指定用户的帖子，返回 score=cosine_similarity';
