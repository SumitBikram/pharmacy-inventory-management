-- Migration: Add packing, discount, GST%, schedule%, old_mrp to purchase flow
-- Run this in your Supabase SQL Editor

-- 1. Add packing to medicines (auto-fill source)
ALTER TABLE public.medicines ADD COLUMN IF NOT EXISTS packing TEXT;

-- 2. Add new columns to purchase_items
ALTER TABLE public.purchase_items
  ADD COLUMN IF NOT EXISTS packing TEXT,
  ADD COLUMN IF NOT EXISTS discount NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS schedule_percent NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gst_percent NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS old_mrp NUMERIC(10,2);

-- 3. Add packing and gst_percent to stock_batches
ALTER TABLE public.stock_batches
  ADD COLUMN IF NOT EXISTS packing TEXT,
  ADD COLUMN IF NOT EXISTS gst_percent NUMERIC(5,2) DEFAULT 0;
