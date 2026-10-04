begin;
alter table public.lessons add column homework_file_name text;
alter table public.lessons add column homework_uploaded_at timestamptz;
-- Existing public homework URLs must be moved into private Storage first.
alter table public.lessons add constraint lessons_private_homework check (
  homework_pdf_url is null or homework_pdf_url ~ '^storage://(homework|course-media)/.+[.]pdf$'
);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('homework','homework',false,10485760,array['application/pdf'])
on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['application/pdf'];
create policy homework_admin_manage on storage.objects for all to authenticated
using (bucket_id='homework' and (select private.is_admin()))
with check (bucket_id='homework' and (select private.is_admin()));
create policy homework_student_read on storage.objects for select to authenticated
using (bucket_id='homework' and exists (
  select 1 from public.lessons l join public.modules m on m.id=l.module_id
  join public.courses c on c.id=m.course_id
  where c.is_published and l.is_published and private.has_course_access(c.id)
    and l.homework_pdf_url='storage://homework/' || storage.objects.name
));
commit;
