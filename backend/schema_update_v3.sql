-- Corrected Order: Drop constraint first, then update data, then add new constraint

-- 1. Drop the existing constraint so we can use 'unidentified'
alter table vehicles drop constraint if exists vehicles_type_check;

-- 2. Update vehicle types from 'visitor' to 'unidentified'
update vehicles set type = 'unidentified' where type = 'visitor';

-- 3. Add the new constraint including 'unidentified' and 'staff', removing 'visitor'
alter table vehicles add constraint vehicles_type_check check (type in ('resident', 'staff', 'unidentified'));
