-- V24.21 step 1: add the business account role in its own transaction.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'business';
