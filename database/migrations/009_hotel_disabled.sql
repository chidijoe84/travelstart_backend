-- =====================================================================
-- Migration 009: disable flag on hotels
-- Safe to run on an existing database — adds one column with a default.
--
--   node scripts/applyMigrations.js
-- =====================================================================

USE travelstart;

ALTER TABLE hotels
  ADD COLUMN is_disabled TINYINT(1) NOT NULL DEFAULT 0 AFTER total_ratings;
