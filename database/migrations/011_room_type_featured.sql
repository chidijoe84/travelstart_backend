-- =====================================================================
-- Migration 011: featured flag on room types
-- Controls which rooms appear in the homepage Accommodation carousel.
-- Safe to run on an existing database — adds one column with a default.
--
--   node scripts/applyMigrations.js
-- =====================================================================

USE travelstart;

ALTER TABLE room_types
  ADD COLUMN is_featured TINYINT(1) NOT NULL DEFAULT 0 AFTER short_description;
