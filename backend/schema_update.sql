-- 1. Add new columns for Dong and Ho
alter table vehicles add column dong text;
alter table vehicles add column ho text;

-- 2. Drop the old unitNumber column (WARNING: Data in this column will be lost)
alter table vehicles drop column "unitNumber";

-- 3. Update the 'type' check constraint to include 'staff'
-- First, drop the existing constraint
alter table vehicles drop constraint vehicles_type_check;

-- Then, add the new constraint
alter table vehicles add constraint vehicles_type_check check (type in ('resident', 'staff', 'visitor'));
