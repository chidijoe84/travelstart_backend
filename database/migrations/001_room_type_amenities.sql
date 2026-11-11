-- =====================================================================
-- Migration 001: room type amenities
-- Safe to run on an existing database — uses IF NOT EXISTS and does not
-- touch any existing data.
--
--   mysql -u root -p < backend/database/migrations/001_room_type_amenities.sql
-- =====================================================================

USE travelstart;

CREATE TABLE IF NOT EXISTS room_type_amenities (
  amenity_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  room_type_id VARCHAR(40)  NOT NULL,
  amenity      VARCHAR(150) NOT NULL,
  PRIMARY KEY (amenity_id),
  KEY idx_room_amenities_type (room_type_id),
  CONSTRAINT fk_room_amenities_type FOREIGN KEY (room_type_id)
    REFERENCES room_types (room_type_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
