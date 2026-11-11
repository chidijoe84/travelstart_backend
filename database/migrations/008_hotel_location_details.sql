-- =====================================================================
-- Migration 008: nearest landmark + coordinates on hotels
-- Safe to run on an existing database — only adds nullable columns.
--
--   node scripts/applyMigrations.js
-- =====================================================================

USE travelstart;

ALTER TABLE hotels
  ADD COLUMN nearest_landmark VARCHAR(191) NULL AFTER address,
  ADD COLUMN latitude         DECIMAL(10,7) NULL AFTER nearest_landmark,
  ADD COLUMN longitude        DECIMAL(10,7) NULL AFTER latitude;
