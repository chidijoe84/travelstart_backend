-- =====================================================================
-- Migration 003: discounted price for room types
-- Safe to run on an existing database — does not touch existing data.
--
--   node scripts/applyMigrations.js
-- =====================================================================

USE travelstart;

ALTER TABLE room_types
  ADD COLUMN discount_price DECIMAL(12,2) NULL AFTER room_cost;
