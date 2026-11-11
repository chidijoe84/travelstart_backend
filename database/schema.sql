-- =====================================================================
-- Travel Start Hotels - database schema
-- MySQL 8 / MariaDB 10.4+
--
-- Import with:
--   mysql -u root -p < backend/database/schema.sql
--   mysql -u root -p < backend/database/seed.sql
-- =====================================================================

CREATE DATABASE IF NOT EXISTS travelstart
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE travelstart;

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- Guests (customer accounts created from the Register page)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS guests;
CREATE TABLE guests (
  guest_id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  tip_top_go_guest_id VARCHAR(64) NOT NULL,
  guest_title        VARCHAR(16)  NULL,
  first_name         VARCHAR(100) NOT NULL,
  last_name          VARCHAR(100) NOT NULL,
  email_address      VARCHAR(191) NOT NULL,
  phone_number       VARCHAR(30)  NOT NULL,
  password_hash      VARCHAR(255) NOT NULL,
  country            VARCHAR(100) NULL,
  gender             VARCHAR(16)  NULL,
  address            VARCHAR(255) NULL,
  source_type        VARCHAR(50)  NOT NULL DEFAULT 'ResidencyWeb',
  active             TINYINT(1)   NOT NULL DEFAULT 1,
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                  ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (guest_id),
  UNIQUE KEY uq_guests_email (email_address),
  UNIQUE KEY uq_guests_ttg (tip_top_go_guest_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Admins (protected back-office access)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS admins;
CREATE TABLE admins (
  admin_id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(191) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(30)  NOT NULL DEFAULT 'admin',
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (admin_id),
  UNIQUE KEY uq_admins_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Hotels
-- NOTE: the states, lgas and wards tables are created by
-- database/states_lgas_wards.sql, which runs after this file.
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS hotels;
CREATE TABLE hotels (
  hotel_id               VARCHAR(40)  NOT NULL,
  hotel_name             VARCHAR(191) NOT NULL,
  property_type          VARCHAR(40)  NULL,
  hotel_group_name       VARCHAR(100) NOT NULL DEFAULT 'Residency',
  source_type            VARCHAR(100) NOT NULL DEFAULT 'showInCompanySite',
  location               VARCHAR(100) NULL,
  state_name             VARCHAR(100) NULL,
  lga_name               VARCHAR(150) NULL,
  address                VARCHAR(255) NULL,
  nearest_landmark       VARCHAR(191) NULL,
  latitude               DECIMAL(10,7) NULL,
  longitude              DECIMAL(10,7) NULL,
  hotel_description      TEXT         NULL,
  short_hotel_description VARCHAR(500) NULL,
  picture                VARCHAR(500) NULL,
  hotel_minimum_price    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  hotel_rating           DECIMAL(2,1)  NULL,
  total_ratings          INT UNSIGNED  NOT NULL DEFAULT 0,
  is_disabled            TINYINT(1)   NOT NULL DEFAULT 0,
  is_featured            TINYINT(1)   NOT NULL DEFAULT 0,
  created_at             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                      ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (hotel_id),
  KEY idx_hotels_group (hotel_group_name),
  KEY idx_hotels_source (source_type),
  KEY idx_hotels_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Hotel images
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS hotel_images;
CREATE TABLE hotel_images (
  image_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  hotel_id   VARCHAR(40)  NOT NULL,
  image_url  VARCHAR(500) NOT NULL,
  sort_order INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (image_id),
  KEY idx_hotel_images_hotel (hotel_id),
  CONSTRAINT fk_hotel_images_hotel FOREIGN KEY (hotel_id)
    REFERENCES hotels (hotel_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Hotel amenities
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS hotel_amenities;
CREATE TABLE hotel_amenities (
  amenity_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  hotel_id   VARCHAR(40)  NOT NULL,
  amenity    VARCHAR(150) NOT NULL,
  PRIMARY KEY (amenity_id),
  KEY idx_amenities_hotel (hotel_id),
  CONSTRAINT fk_amenities_hotel FOREIGN KEY (hotel_id)
    REFERENCES hotels (hotel_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Room types
-- total_rooms is the physical inventory; availability is derived from
-- reservations, not stored here.
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS room_types;
CREATE TABLE room_types (
  room_type_id      VARCHAR(40)  NOT NULL,
  hotel_id          VARCHAR(40)  NOT NULL,
  room_type_name    VARCHAR(150) NOT NULL,
  room_cost         DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  discount_price    DECIMAL(12,2) NULL,
  total_rooms       INT UNSIGNED NOT NULL DEFAULT 0,
  capacity          INT UNSIGNED NOT NULL DEFAULT 2,
  short_description VARCHAR(500) NULL,
  is_featured       TINYINT(1)   NOT NULL DEFAULT 0,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                 ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (room_type_id),
  KEY idx_room_types_hotel (hotel_id),
  CONSTRAINT fk_room_types_hotel FOREIGN KEY (hotel_id)
    REFERENCES hotels (hotel_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Room type images
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS room_type_images;
CREATE TABLE room_type_images (
  image_id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  room_type_id      VARCHAR(40)  NOT NULL,
  room_type_picture VARCHAR(500) NOT NULL,
  PRIMARY KEY (image_id),
  KEY idx_room_images_type (room_type_id),
  CONSTRAINT fk_room_images_type FOREIGN KEY (room_type_id)
    REFERENCES room_types (room_type_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Room type amenities
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS room_type_amenities;
CREATE TABLE room_type_amenities (
  amenity_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  room_type_id VARCHAR(40)  NOT NULL,
  amenity      VARCHAR(150) NOT NULL,
  PRIMARY KEY (amenity_id),
  KEY idx_room_amenities_type (room_type_id),
  CONSTRAINT fk_room_amenities_type FOREIGN KEY (room_type_id)
    REFERENCES room_types (room_type_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Tax levies applied to rooms
-- tax_applicable: 'fd' = free/always, 'fb' = only when breakfast not free
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS tax_levies;
CREATE TABLE tax_levies (
  levy_id        VARCHAR(40)  NOT NULL,
  hotel_id       VARCHAR(40)  NOT NULL,
  tax_label      VARCHAR(100) NOT NULL,
  tax_category   VARCHAR(50)  NULL,
  tax_type       ENUM('flatAmount','percentage') NOT NULL DEFAULT 'percentage',
  flat_amount    DECIMAL(12,2) NULL,
  tax_percentage DECIMAL(6,2)  NULL,
  tax_applicable ENUM('fd','fb') NOT NULL DEFAULT 'fd',
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (levy_id),
  KEY idx_levies_hotel (hotel_id),
  CONSTRAINT fk_levies_hotel FOREIGN KEY (hotel_id)
    REFERENCES hotels (hotel_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Favourite hotels (per guest)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS favorite_hotels;
CREATE TABLE favorite_hotels (
  favorite_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  guest_id    INT UNSIGNED NOT NULL,
  hotel_id    VARCHAR(40)  NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (favorite_id),
  UNIQUE KEY uq_guest_hotel (guest_id, hotel_id),
  KEY idx_favorites_hotel (hotel_id),
  CONSTRAINT fk_favorites_guest FOREIGN KEY (guest_id)
    REFERENCES guests (guest_id) ON DELETE CASCADE,
  CONSTRAINT fk_favorites_hotel FOREIGN KEY (hotel_id)
    REFERENCES hotels (hotel_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Newsletter subscribers (Footer form)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS subscribers;
CREATE TABLE subscribers (
  subscriber_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email_address VARCHAR(191) NOT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (subscriber_id),
  UNIQUE KEY uq_subscribers_email (email_address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Reservations
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS reservations;
CREATE TABLE reservations (
  reservation_id        INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_code          VARCHAR(40)  NOT NULL,
  guest_id              INT UNSIGNED NULL,
  hotel_id              VARCHAR(40)  NULL,
  hotel_name            VARCHAR(191) NULL,
  paying_guest_title    VARCHAR(16)  NULL,
  paying_guest_first_name VARCHAR(100) NULL,
  paying_guest_last_name  VARCHAR(100) NULL,
  paying_guest_email    VARCHAR(191) NULL,
  paying_guest_phone    VARCHAR(30)  NULL,
  paying_guest_gender   VARCHAR(16)  NULL,
  paying_guest_address  VARCHAR(255) NULL,
  num_of_days           INT UNSIGNED NOT NULL DEFAULT 1,
  check_in_date         DATETIME     NOT NULL,
  check_out_date        DATETIME     NOT NULL,
  total_bill            DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  payment_reference     VARCHAR(100) NULL,
  payment_type          VARCHAR(50)  NULL,
  reservation_type      VARCHAR(50)  NOT NULL DEFAULT 'booked',
  booking_status        VARCHAR(50)  NOT NULL DEFAULT 'unprocessed',
  source_type           VARCHAR(50)  NULL,
  referral_name         VARCHAR(50)  NULL,
  include_breakfast     VARCHAR(50)  NULL,
  has_tax_levies        TINYINT(1)   NOT NULL DEFAULT 0,
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                     ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (reservation_id),
  UNIQUE KEY uq_reservations_code (booking_code),
  KEY idx_reservations_hotel (hotel_id),
  KEY idx_reservations_guest (guest_id),
  KEY idx_reservations_email (paying_guest_email),
  KEY idx_reservations_dates (check_in_date, check_out_date),
  KEY idx_reservations_status (booking_status),
  CONSTRAINT fk_reservations_guest FOREIGN KEY (guest_id)
    REFERENCES guests (guest_id) ON DELETE SET NULL,
  CONSTRAINT fk_reservations_hotel FOREIGN KEY (hotel_id)
    REFERENCES hotels (hotel_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Reservation rooms (line items)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS reservation_rooms;
CREATE TABLE reservation_rooms (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  reservation_id INT UNSIGNED NOT NULL,
  room_type_id   VARCHAR(40)  NULL,
  room_type_name VARCHAR(150) NULL,
  room_cost      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  quantity       INT UNSIGNED  NOT NULL DEFAULT 1,
  length_of_stay INT UNSIGNED  NOT NULL DEFAULT 1,
  total_tax      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_cost     DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (id),
  KEY idx_res_rooms_reservation (reservation_id),
  KEY idx_res_rooms_type (room_type_id),
  CONSTRAINT fk_res_rooms_reservation FOREIGN KEY (reservation_id)
    REFERENCES reservations (reservation_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Reservation taxes (snapshot per booking)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS reservation_taxes;
CREATE TABLE reservation_taxes (
  id                          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  reservation_id              INT UNSIGNED NOT NULL,
  tax_label                   VARCHAR(100) NOT NULL,
  amount                      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  percentage_or_flat_amount   DECIMAL(12,2) NULL,
  type                        VARCHAR(20)  NULL,
  PRIMARY KEY (id),
  KEY idx_res_taxes_reservation (reservation_id),
  CONSTRAINT fk_res_taxes_reservation FOREIGN KEY (reservation_id)
    REFERENCES reservations (reservation_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS payments;
CREATE TABLE payments (
  payment_id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  reservation_id  INT UNSIGNED NOT NULL,
  payment_type    VARCHAR(50)  NULL,
  amount          DECIMAL(14,2) NOT NULL DEFAULT 0.00,
  bank_name       VARCHAR(100) NULL,
  transaction_id  VARCHAR(100) NULL,
  manager_name    VARCHAR(150) NULL,
  reference_number VARCHAR(100) NULL,
  credit_id       VARCHAR(100) NULL,
  created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (payment_id),
  KEY idx_payments_reservation (reservation_id),
  CONSTRAINT fk_payments_reservation FOREIGN KEY (reservation_id)
    REFERENCES reservations (reservation_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Property listing requests (public "List Your Property" form)
-- images is a JSON array of /uploads/<file> paths.
-- status: new | contacted | closed
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS property_listings;
CREATE TABLE property_listings (
  listing_id    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  property_name VARCHAR(191) NOT NULL,
  property_type VARCHAR(40)  NOT NULL,
  contact_name  VARCHAR(150) NOT NULL,
  email         VARCHAR(191) NOT NULL,
  phone         VARCHAR(40)  NOT NULL,
  city          VARCHAR(100) NOT NULL,
  state_name    VARCHAR(100) NULL,
  lga_name      VARCHAR(150) NULL,
  nearest_landmark VARCHAR(191) NULL,
  latitude      DECIMAL(10,7) NULL,
  longitude     DECIMAL(10,7) NULL,
  rooms         INT UNSIGNED NOT NULL DEFAULT 0,
  message       TEXT         NULL,
  terms_accepted    TINYINT(1) NOT NULL DEFAULT 0,
  terms_accepted_at TIMESTAMP  NULL DEFAULT NULL,
  images        TEXT         NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'new',
  hotel_id      VARCHAR(40)  NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (listing_id),
  KEY idx_property_listings_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- End of schema
-- =====================================================================
