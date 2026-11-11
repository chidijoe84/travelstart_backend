-- =====================================================================
-- Migration 010: featured flag on hotels
-- Safe to run on an existing database — adds one column with a default.
--
--   node scripts/applyMigrations.js
-- =====================================================================

USE travelstart;

ALTER TABLE hotels
  ADD COLUMN is_featured TINYINT(1) NOT NULL DEFAULT 0 AFTER is_disabled;
