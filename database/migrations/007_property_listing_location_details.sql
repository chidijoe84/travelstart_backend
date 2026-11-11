-- =====================================================================
-- Migration 007: nearest landmark + coordinates on property listings
-- Safe to run on an existing database — only adds nullable columns.
--
--   node scripts/applyMigrations.js
-- =====================================================================

USE travelstart;

ALTER TABLE property_listings
  ADD COLUMN nearest_landmark VARCHAR(191) NULL AFTER lga_name,
  ADD COLUMN latitude         DECIMAL(10,7) NULL AFTER nearest_landmark,
  ADD COLUMN longitude        DECIMAL(10,7) NULL AFTER latitude;
