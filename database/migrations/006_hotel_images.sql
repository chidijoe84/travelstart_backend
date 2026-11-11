-- =====================================================================
-- Migration 006: hotel gallery images
-- Safe to run on an existing database — creates a new table only.
--
--   node scripts/applyMigrations.js
-- =====================================================================

USE travelstart;

CREATE TABLE IF NOT EXISTS hotel_images (
  image_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  hotel_id   VARCHAR(40)  NOT NULL,
  image_url  VARCHAR(500) NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (image_id),
  KEY idx_hotel_images_hotel (hotel_id),
  CONSTRAINT fk_hotel_images_hotel FOREIGN KEY (hotel_id)
    REFERENCES hotels (hotel_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
