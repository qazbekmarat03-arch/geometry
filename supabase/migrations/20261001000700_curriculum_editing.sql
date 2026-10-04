begin;
create function public.admin_add_curriculum_item(item_kind text, parent_id uuid, item_title text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare result_id uuid;
begin
  if not private.is_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
  if item_title is null or length(btrim(item_title)) = 0 or length(item_title) > 200 then raise exception 'Invalid title'; end if;
  if item_kind = 'module' then
    perform id from public.courses where id = parent_id for update;
    if not found then raise exception 'Course not found'; end if;
    insert into public.modules(course_id,title,position)
      select parent_id,btrim(item_title),coalesce(max(position),-1)+1 from public.modules where course_id=parent_id returning id into result_id;
  elsif item_kind = 'lesson' then
    perform id from public.modules where id = parent_id for update;
    if not found then raise exception 'Module not found'; end if;
    insert into public.lessons(module_id,title,position)
      select parent_id,btrim(item_title),coalesce(max(position),-1)+1 from public.lessons where module_id=parent_id returning id into result_id;
  else raise exception 'Invalid item kind'; end if;
  return result_id;
end;
$$;

create function public.admin_move_curriculum_item(item_kind text, item_id uuid, direction integer)
returns void language plpgsql security definer set search_path = '' as $$
declare parent_id uuid; current_position integer; neighbor_id uuid; neighbor_position integer;
begin
  if not private.is_admin() then raise exception 'Administrator required' using errcode='42501'; end if;
  if direction is null or direction not in (-1,1) then raise exception 'Invalid direction'; end if;
  if item_kind = 'module' then
    select course_id into parent_id from public.modules where id=item_id;
    perform id from public.courses where id=parent_id for update;
    select position into current_position from public.modules where id=item_id and course_id=parent_id for update;
    if not found then raise exception 'Module not found'; end if;
    select id,position into neighbor_id,neighbor_position from public.modules
      where course_id=parent_id and (position-current_position)*direction>0
      order by position*direction limit 1 for update;
    if neighbor_id is null then return; end if;
    set constraints public.modules_course_id_position_key deferred;
    update public.modules set position=case when id=item_id then neighbor_position else current_position end where id in(item_id,neighbor_id);
  elsif item_kind = 'lesson' then
    select module_id into parent_id from public.lessons where id=item_id;
    perform id from public.modules where id=parent_id for update;
    select position into current_position from public.lessons where id=item_id and module_id=parent_id for update;
    if not found then raise exception 'Lesson not found'; end if;
    select id,position into neighbor_id,neighbor_position from public.lessons
      where module_id=parent_id and (position-current_position)*direction>0
      order by position*direction limit 1 for update;
    if neighbor_id is null then return; end if;
    set constraints public.lessons_module_id_position_key deferred;
    update public.lessons set position=case when id=item_id then neighbor_position else current_position end where id in(item_id,neighbor_id);
  else raise exception 'Invalid item kind'; end if;
end;
$$;
revoke all on function public.admin_add_curriculum_item(text,uuid,text), public.admin_move_curriculum_item(text,uuid,integer) from public,anon,authenticated;
grant execute on function public.admin_add_curriculum_item(text,uuid,text), public.admin_move_curriculum_item(text,uuid,integer) to authenticated;
commit;
