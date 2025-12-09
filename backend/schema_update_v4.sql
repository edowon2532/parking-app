-- Add reporter_name column to history table
alter table history add column if not exists reporter_name text;
