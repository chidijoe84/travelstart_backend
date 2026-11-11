-- =====================================================================
-- Migration 002: property listing requests
-- Safe to run on an existing database — uses IF NOT EXISTS and does not
-- touch any existing data.
--
--   mysql -u root -p < backend/database/migrations/002_property_listings.sql
-- =====================================================================

USE travelstart;

CREATE TABLE IF NOT EXISTS property_listings (
  listing_id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  property_name VARCHAR(191) NOT NULL,
  property_type VARCHAR(40)  NOT NULL,
  contact_name  VARCHAR(150) NOT NULL,
  email         VARCHAR(191) NOT NULL,
  phone         VARCHAR(40)  NOT NULL,
  city          VARCHAR(100) NOT NULL,
  rooms         INT UNSIGNED NOT NULL DEFAULT 0,
  message       TEXT         NULL,
  images        TEXT         NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'new',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (listing_id),
  KEY idx_property_listings_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
