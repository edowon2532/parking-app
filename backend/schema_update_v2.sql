-- Add new columns to history table
alter table history add column if not exists description text;
alter table history add column if not exists image text;
alter table history add column if not exists thumbnail text;
