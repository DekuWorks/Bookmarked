-- Post image uploads (Supabase Storage + posts.image_url)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-images',
  'post-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.posts
  drop constraint if exists posts_check;

alter table public.posts
  add constraint posts_body_image_or_repost check (
    char_length(trim(body)) > 0
    or image_url is not null
    or repost_of_post_id is not null
  );

create policy "Post images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "Users can upload their own post images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own post images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own post images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
