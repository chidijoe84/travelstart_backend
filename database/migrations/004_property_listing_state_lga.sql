-- =====================================================================
-- Migration 004: state and LGA on property listing requests
-- Safe to run on an existing database — only adds columns.
--
--   node scripts/applyMigrations.js
-- =====================================================================

USE travelstart;

ALTER TABLE property_listings
  ADD COLUMN state_name VARCHAR(100) NULL AFTER city,
  ADD COLUMN lga_name   VARCHAR(150) NULL AFTER state_name;
