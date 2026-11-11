-- =====================================================================
-- Travel Start Hotels - seed data
-- Run AFTER schema.sql:
--   mysql -u root -p < backend/database/schema.sql
--   mysql -u root -p < backend/database/seed.sql
--
-- Hotel / room ids match the ids the frontend already hard-codes in
-- src/Components/hero/HotelRooms.jsx so room lookups resolve correctly.
-- =====================================================================

USE travelstart;

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE room_type_images;
TRUNCATE TABLE room_types;
TRUNCATE TABLE tax_levies;
TRUNCATE TABLE hotel_images;
TRUNCATE TABLE hotel_amenities;
TRUNCATE TABLE hotels;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- Hotels
-- ---------------------------------------------------------------------
INSERT INTO hotels
  (hotel_id, hotel_name, hotel_group_name, source_type, location, address,
   hotel_description, short_hotel_description, picture, hotel_minimum_price,
   hotel_rating, total_ratings)
VALUES
  ('1', 'Residency Hotel Ogidi Anambra', 'Residency', 'showInCompanySite', 'Anambra',
   'Ogidi, Anambra State',
   'Residency Hotel Ogidi offers world-class hospitality with fully air-conditioned rooms, an outdoor pool, a restaurant and bar, and spacious event halls in the heart of Anambra.',
   'Comfortable rooms, pool, restaurant and event halls in Ogidi, Anambra.',
   '/hotels/ogidi/hotel-outside-view/ogidi_building3.jpg', 45000.00, 3.9, 309),

  ('2', 'Residency Hotel Guzape Abuja', 'Residency', 'showInCompanySite', 'Abuja',
   'Plot 740, Nasir El Rufai Crescent, Guzape Hills, Abuja',
   'Set on the scenic Guzape Hills, Residency Hotel Guzape combines luxury accommodation, fine dining, a pool and conference facilities for business and leisure travellers.',
   'Luxury rooms with hill views, dining, pool and conference facilities in Guzape, Abuja.',
   '/hotels/guzape/hotel-outside-view/guzape_main_building.jpg', 57000.00, 4.1, 650),

  ('3', 'Residency Hotel Area 11 Abuja', 'Residency', 'showInCompanySite', 'Abuja',
   'Area 11, Garki, Abuja',
   'Residency Hotel Area 11 places you minutes from the city centre with elegant rooms, a restaurant and bar, and versatile event spaces for weddings and conferences.',
   'Elegant city-centre rooms and event spaces in Area 11, Abuja.',
   '/hotels/guzape/hotel-outside-view/guzape_building.jpg', 48000.00, 4.0, 180),

  ('4', 'Residency Hotel Independence Layout Enugu', 'Residency', 'showInCompanySite', 'Enugu',
   'Independence Layout, Enugu',
   'Residency Hotel Enugu offers spacious rooms, a pool, restaurant and multi-purpose halls in the serene Independence Layout, ideal for business and family stays.',
   'Spacious rooms, pool and halls in Independence Layout, Enugu.',
   '/hotels/enugu/hotel-outside-view/main_building_image.jpg', 47500.00, 4.2, 322),

  ('5', 'Residency Hotel Lekki Osapa London Lagos', 'Residency', 'showInCompanySite', 'Lagos',
   'Osapa London, Lekki, Lagos',
   'Residency Hotel Lekki Osapa London delivers premium comfort with deluxe rooms, executive suites, an outdoor pool, gym and on-site dining on the Lagos Island.',
   'Premium deluxe rooms and executive suites in Lekki Osapa London, Lagos.',
   '/hotels/chevron/hotel-daytime-view/chevron_hotel.jpg', 52500.00, 4.1, 209),

  ('6', 'Residency Hotel Chevron Lagos', 'Residency', 'showInCompanySite', 'Lagos',
   'Chevron Drive, Lekki, Lagos',
   'Residency Hotel Chevron is a stylish retreat near Chevron Drive featuring contemporary rooms, a pool, restaurant and lounge for a relaxed Lagos stay.',
   'Contemporary rooms and suites near Chevron Drive, Lekki, Lagos.',
   '/hotels/chevron/hotel-daytime-view/chevron_hotel_front.jpg', 50000.00, 4.0, 128),

  ('7', 'Residency Hotel Ajao Estate Lagos', 'Residency', 'showInCompanySite', 'Lagos',
   'Ajao Estate, Ikeja, Lagos',
   'Conveniently located near the airport, Residency Hotel Ajao Estate offers comfortable rooms, a pool, gym and banquet facilities for travellers and events.',
   'Airport-close comfort with pool, gym and banquet halls in Ajao Estate, Lagos.',
   '/hotels/ajao/hotel-exterior/ajao_hotel_building2.jpg', 50000.00, 4.2, 362),

  ('NMcOxFCq1krkU6o', 'Residency Hotel Lekki Phase 1', 'Residency', 'showInCompanySite', 'Lagos',
   'Lekki Phase 1, Lagos',
   'Residency Hotel Lekki Phase 1 is a luxury address with tastefully furnished rooms and suites, a pool, gym, restaurant and lounge in the heart of Lekki Phase 1.',
   'Luxury rooms and suites with pool, gym and dining in Lekki Phase 1, Lagos.',
   '/hotels/lekki-phase-1/hotel-outside-view/lekki_building1.jpg', 60000.00, 4.2, 69);

-- ---------------------------------------------------------------------
-- Hotel amenities
-- ---------------------------------------------------------------------
INSERT INTO hotel_amenities (hotel_id, amenity) VALUES
  ('1', 'Free WiFi'), ('1', 'Swimming pool'), ('1', 'Restaurant'),
  ('1', 'Parking'), ('1', 'Bar/Lounge'), ('1', 'Room service'),
  ('2', 'Free WiFi'), ('2', 'Swimming pool'), ('2', 'Restaurant'),
  ('2', 'Parking'), ('2', 'Bar/Lounge'), ('2', 'Air conditioning'), ('2', 'Airport shuttle'),
  ('3', 'Free WiFi'), ('3', 'Restaurant'), ('3', 'Parking'),
  ('3', 'Bar/Lounge'), ('3', 'Air conditioning'), ('3', 'Room service'),
  ('4', 'Free WiFi'), ('4', 'Swimming pool'), ('4', 'Restaurant'),
  ('4', 'Parking'), ('4', 'Bar/Lounge'), ('4', 'Room service'),
  ('5', 'Free WiFi'), ('5', 'Swimming pool'), ('5', 'Restaurant'),
  ('5', 'Parking'), ('5', 'Gym'), ('5', 'Bar/Lounge'),
  ('6', 'Free WiFi'), ('6', 'Swimming pool'), ('6', 'Restaurant'),
  ('6', 'Parking'), ('6', 'Bar/Lounge'), ('6', 'Room service'),
  ('7', 'Free WiFi'), ('7', 'Swimming pool'), ('7', 'Restaurant'),
  ('7', 'Parking'), ('7', 'Gym'), ('7', 'Bar/Lounge'), ('7', 'Airport shuttle'),
  ('NMcOxFCq1krkU6o', 'Free WiFi'), ('NMcOxFCq1krkU6o', 'Swimming pool'),
  ('NMcOxFCq1krkU6o', 'Restaurant'), ('NMcOxFCq1krkU6o', 'Parking'),
  ('NMcOxFCq1krkU6o', 'Gym'), ('NMcOxFCq1krkU6o', 'Bar/Lounge');

-- ---------------------------------------------------------------------
-- Room types
-- ---------------------------------------------------------------------
INSERT INTO room_types
  (room_type_id, hotel_id, room_type_name, room_cost, total_rooms, capacity, short_description)
VALUES
  -- Ogidi (1)
  ('1-EXEC-DLX', '1', 'Executive Deluxe', 45000.00, 8, 2,
   '6x6 king-sized bed, air conditioning, flat-screen TV, bedside drawers, walk-in shower.'),
  ('1-RES-DLX', '1', 'Residency Deluxe', 47000.00, 6, 2,
   'King-sized bed, high-speed Wi-Fi, flat-screen TV, full air conditioning, mini fridge, walk-in shower.'),
  ('1-RES-SUITE', '1', 'Residency Suite', 62000.00, 3, 3,
   'Tastefully decorated suite with separate seating area, king bed, lounge and large bathroom.'),

  -- Guzape (2)
  ('2-EXEC-LUX', '2', 'Residency Executive Luxury', 57000.00, 6, 2,
   'City view, spacious layout, full air conditioning, king-sized bed, flat-screen TV, walk-in shower.'),
  ('2-EXEC-PLUS', '2', 'Residency Executive Plus', 57000.00, 5, 3,
   'Separate living and sleeping areas, apartment-like experience ideal for extended stays.'),
  ('2-SUITE', '2', 'Residency Suite', 65000.00, 4, 3,
   'Expansive suite with lounge, king-sized bed, mini bar and premium bathroom.'),

  -- Area 11 (3)
  ('3-RES-DLX', '3', 'Residency Deluxe', 48000.00, 10, 2,
   'Comfortable deluxe room with king bed, air conditioning, Wi-Fi and flat-screen TV.'),
  ('3-EXEC', '3', 'Residency Executive', 55000.00, 6, 2,
   'Executive room with workspace, king bed, mini fridge and city views.'),

  -- Enugu (4)
  ('4-RES-DLX', '4', 'Residency Deluxe', 47500.00, 12, 2,
   'Luxurious king-sized bed, high-speed Wi-Fi, flat-screen TV, air conditioning and walk-in shower.'),
  ('4-RES-SUITE', '4', 'Residency Suite', 60000.00, 5, 3,
   'Spacious suite with separate lounge, king bed and generous bathroom.'),

  -- Lekki Osapa London (5)
  ('5-RES-DLX', '5', 'Residency Deluxe', 52500.00, 10, 2,
   'King-sized bed, high-speed Wi-Fi, flat-screen TV, full air conditioning, mini fridge and scenic views.'),
  ('5-EXEC-SUITE', '5', 'Residency Executive Suite', 52500.00, 6, 3,
   'Atlantic Ocean view, king bed, separate lounge and walk-in shower.'),
  ('5-SUITE-PLUS', '5', 'Residency Suite Plus', 60000.00, 4, 3,
   'Premium suite with lounge, dining nook and panoramic views.'),

  -- Chevron (6)
  ('6-RES-DLX', '6', 'Residency Deluxe', 50000.00, 10, 2,
   'Modern deluxe room with king bed, air conditioning, Wi-Fi and flat-screen TV.'),
  ('6-RES-SUITE', '6', 'Residency Suite', 58000.00, 5, 3,
   'Contemporary suite with lounge area, king bed and premium amenities.'),

  -- Ajao Estate (7)
  ('7-RES-DLX', '7', 'Residency Deluxe', 50000.00, 12, 2,
   'King-sized bed, Wi-Fi, flat-screen TV, air conditioning and walk-in shower.'),
  ('7-SUITE-PLUS', '7', 'Residency Suite Plus', 60000.00, 6, 3,
   'King-sized bed, mini fridge, wardrobe, separate lounge and walk-in shower.'),

  -- Lekki Phase 1 (NMcOxFCq1krkU6o)
  ('LEKKI1-EXEC-DLX', 'NMcOxFCq1krkU6o', 'Residency Executive Deluxe', 75000.00, 8, 2,
   'Tastefully decorated king-sized bed, separate lounge and large bathroom with walk-in shower.'),
  ('LEKKI1-RES-DLX', 'NMcOxFCq1krkU6o', 'Residency Deluxe', 60000.00, 10, 2,
   'Elegant deluxe room with king bed, work desk, Wi-Fi and air conditioning.'),
  ('LEKKI1-SUITE', 'NMcOxFCq1krkU6o', 'Residency Suite', 85000.00, 4, 3,
   'Luxury suite with separate lounge, king bed, mini bar and marble bathroom.');

-- ---------------------------------------------------------------------
-- Room type images (paths served from the frontend public/ folder)
-- ---------------------------------------------------------------------
INSERT INTO room_type_images (room_type_id, room_type_picture) VALUES
  ('1-EXEC-DLX', '/hotels/ogidi/executive-deluxe-room/ogidi_executive_deluxe1.jpg'),
  ('1-RES-DLX', '/hotels/ogidi/residency-deluxe-room/ogidi_deluxe1.jpg'),
  ('1-RES-SUITE', '/hotels/ogidi/residency-suite-room/ogidi_suite1.jpg'),

  ('2-EXEC-LUX', '/hotels/guzape/executive-deluxe/guzape_executive_deluxe.jpg'),
  ('2-EXEC-PLUS', '/hotels/guzape/executive-plus/guzape_executive_plus.jpg'),
  ('2-SUITE', '/hotels/guzape/suite/guzape_suite.jpg'),

  ('3-RES-DLX', '/hotels/guzape/deluxe-room/guzape_deluxe1.jpg'),
  ('3-EXEC', '/hotels/guzape/executive-deluxe/guzape_executive_deluxe2.jpg'),

  ('4-RES-DLX', '/hotels/enugu/deluxe-room/enugu_deluxe.jpg'),
  ('4-RES-SUITE', '/hotels/enugu/residency-suite/enugu_suite1.jpg'),

  ('5-RES-DLX', '/hotels/chevron/deluxe-room/chevron_deluxe1.jpg'),
  ('5-EXEC-SUITE', '/hotels/chevron/suite/chevron_suit1.jpg'),
  ('5-SUITE-PLUS', '/hotels/chevron/suite-plus/chevron_suitplus1.jpg'),

  ('6-RES-DLX', '/hotels/chevron/deluxe-room/chevron_deluxe2.jpg'),
  ('6-RES-SUITE', '/hotels/chevron/suite/chevron_suit2.jpg'),

  ('7-RES-DLX', '/hotels/ajao/deluxe-room/ajao_deluxe.jpg'),
  ('7-SUITE-PLUS', '/hotels/ajao/executive-suite-plus/ajao_executive_suite_plus.jpg'),

  ('LEKKI1-EXEC-DLX', '/hotels/lekki-phase-1/executive-deluxe/lekki_phase1_executive_deluxe.jpg'),
  ('LEKKI1-RES-DLX', '/hotels/lekki-phase-1/deluxe-room/lekki_phase1_deluxe1.jpg'),
  ('LEKKI1-SUITE', '/hotels/lekki-phase-1/suite/lekki_phase1_suite.jpg');

-- ---------------------------------------------------------------------
-- Tax levies (5% VAT + flat consumption tax per hotel)
-- ---------------------------------------------------------------------
INSERT INTO tax_levies
  (levy_id, hotel_id, tax_label, tax_category, tax_type, flat_amount, tax_percentage, tax_applicable)
VALUES
  ('LEV-1-VAT', '1', 'VAT', 'Government', 'percentage', NULL, 7.50, 'fd'),
  ('LEV-1-CON', '1', 'Consumption Tax', 'State', 'flatAmount', 1000.00, NULL, 'fd'),
  ('LEV-2-VAT', '2', 'VAT', 'Government', 'percentage', NULL, 7.50, 'fd'),
  ('LEV-2-CON', '2', 'Consumption Tax', 'State', 'flatAmount', 1500.00, NULL, 'fd'),
  ('LEV-3-VAT', '3', 'VAT', 'Government', 'percentage', NULL, 7.50, 'fd'),
  ('LEV-3-CON', '3', 'Consumption Tax', 'State', 'flatAmount', 1500.00, NULL, 'fd'),
  ('LEV-4-VAT', '4', 'VAT', 'Government', 'percentage', NULL, 7.50, 'fd'),
  ('LEV-4-CON', '4', 'Consumption Tax', 'State', 'flatAmount', 1000.00, NULL, 'fd'),
  ('LEV-5-VAT', '5', 'VAT', 'Government', 'percentage', NULL, 7.50, 'fd'),
  ('LEV-5-CON', '5', 'Service Charge', 'Hotel', 'percentage', NULL, 10.00, 'fd'),
  ('LEV-6-VAT', '6', 'VAT', 'Government', 'percentage', NULL, 7.50, 'fd'),
  ('LEV-6-CON', '6', 'Consumption Tax', 'State', 'flatAmount', 1000.00, NULL, 'fd'),
  ('LEV-7-VAT', '7', 'VAT', 'Government', 'percentage', NULL, 7.50, 'fd'),
  ('LEV-7-CON', '7', 'Consumption Tax', 'State', 'flatAmount', 1500.00, NULL, 'fd'),
  ('LEV-NMC-VAT', 'NMcOxFCq1krkU6o', 'VAT', 'Government', 'percentage', NULL, 7.50, 'fd'),
  ('LEV-NMC-CON', 'NMcOxFCq1krkU6o', 'Service Charge', 'Hotel', 'percentage', NULL, 10.00, 'fd');

-- =====================================================================
-- End of seed data
-- =====================================================================
