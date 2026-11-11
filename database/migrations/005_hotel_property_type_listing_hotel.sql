-- =====================================================================
-- Migration 005: hotel property type + onboarding link on requests
-- Safe to run on an existing database — only adds nullable columns.
--
--   node scripts/applyMigrations.js
-- =====================================================================

USE travelstart;

ALTER TABLE hotels
  ADD COLUMN property_type VARCHAR(40) NULL AFTER hotel_name;

ALTER TABLE property_listings
  ADD COLUMN hotel_id VARCHAR(40) NULL AFTER status;
