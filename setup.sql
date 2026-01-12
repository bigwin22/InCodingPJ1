-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- Create users table
create table if not exists users (
    id uuid default uuid_generate_v4() primary key,
    google_id text unique not null,
    email text not null,
    name text,
    school_code text,
    office_code text,
    school_name text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add user_id to reviews table
-- Note: existing reviews will have user_id as NULL (anonymous)
alter table reviews 
add column if not exists user_id uuid references users(id);

-- Create a unique index to enforce one review per meal type per user
-- This only applies to logged-in users (where user_id is not null)
create unique index if not exists idx_reviews_user_meal 
on reviews(user_id, meal_date, meal_type) 
where user_id is not null;

-- Enable Row Level Security (RLS) is recommended but we will handle logic in backend for now
-- to keep it simple as requested.
