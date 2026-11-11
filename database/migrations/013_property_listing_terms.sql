-- =====================================================================
-- Migration 013: terms and conditions acceptance on property listings
-- Safe to run on an existing database.
--
--   node scripts/applyMigrations.js
-- =====================================================================

USE travelstart;

ALTER TABLE property_listings
  ADD COLUMN terms_accepted    TINYINT(1) NOT NULL DEFAULT 0 AFTER message,
  ADD COLUMN terms_accepted_at TIMESTAMP  NULL DEFAULT NULL AFTER terms_accepted;
