-- =====================================================================
-- Migration 012: state and LGA on hotels
-- Safe to run on an existing database — only adds nullable columns.
--
--   node scripts/applyMigrations.js
-- =====================================================================

USE travelstart;

ALTER TABLE hotels
  ADD COLUMN state_name VARCHAR(100) NULL AFTER location,
  ADD COLUMN lga_name   VARCHAR(150) NULL AFTER state_name;
