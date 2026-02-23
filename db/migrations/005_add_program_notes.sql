-- Migration 005: Add admin notes fields to programs table
-- These are case-worker-only freeform notes for edge cases (e.g. "Limited service in some areas")

ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS notes_en TEXT,
  ADD COLUMN IF NOT EXISTS notes_es TEXT;
