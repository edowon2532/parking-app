-- Create vehicles table
create table if not exists vehicles (
  id text primary key,
  "plateNumber" text not null,
  "ownerName" text not null,
  "unitNumber" text not null,
  "phoneNumber" text,
  type text check (type in ('resident', 'visitor')),
  "registeredAt" timestamp with time zone default timezone('utc'::text, now()),
  violations jsonb default '[]'::jsonb
);

-- Create history table
create table if not exists history (
  id text primary key,
  type text check (type in ('call', 'report')),
  "plateNumber" text not null,
  "ownerName" text,
  "unitNumber" text,
  note text,
  timestamp timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table vehicles enable row level security;
alter table history enable row level security;

-- Create policies to allow public access (since we are in MVP mode without auth)
-- WARNING: This allows anyone with the anon key to read/write. 
-- For production, you should implement proper auth policies.

create policy "Enable read access for all users" on vehicles for select using (true);
create policy "Enable insert access for all users" on vehicles for insert with check (true);
create policy "Enable update access for all users" on vehicles for update using (true);
create policy "Enable delete access for all users" on vehicles for delete using (true);

create policy "Enable read access for all users" on history for select using (true);
create policy "Enable insert access for all users" on history for insert with check (true);
