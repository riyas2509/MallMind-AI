-- Alpha One Mall (Nexus Ahmedabad One, Vastrapur, Ahmedabad, Gujarat)
-- Digital Twin Seed Data for MallMind AI (5-Floor Architectural Model)

begin;

truncate table
    order_items, orders, cart_items, carts, wishlist_items, wishlists, offers,
    search_events, products, product_categories, shops, facilities,
    navigation_edges, navigation_nodes, floors, malls, user_roles, users, roles
restart identity cascade;

-- ===== Roles & Users =====
insert into roles (id, name) values (1, 'ADMIN'), (2, 'RETAILER'), (3, 'VISITOR');

insert into users (id, full_name, email, password_hash, enabled, created_at) values
  (1, 'MallMind Admin', 'admin@mallmind.local',
   '$2b$10$6QCr48A3JY6GaDPjMKAXu.7zfxj00pYowOW11h4tRU6B6KazmxvSi', true, now()),
  (2, 'Nexus Retailer (Zara Manager)', 'retailer@mallmind.local',
   '$2b$10$xe8BuLG9FyM59DxYdsGKX.X4szgKQqON7FHTf352yO.//8Qkx04x.', true, now());

insert into user_roles (user_id, role_id) values (1, 1), (2, 2);
select setval('roles_id_seq', 3);
select setval('users_id_seq', 2);

-- ===== Mall & Floors (Nexus Ahmedabad One / Alpha One Mall) =====
insert into malls (id, name, address, description, total_floors) values
  (1, 'Nexus Ahmedabad One (Alpha One Mall)', 'TP 261, Near Vastrapur Lake, Vastrapur, Ahmedabad, Gujarat 380015',
   'Ahmedabad premier commercial destination with 1.2M sq. ft. of international shopping, dining, and Cinepolis multiplex.', 5);

insert into floors (id, mall_id, floor_number, label, plan_width, plan_height) values
  (1, 1, -1, 'Lower Ground (LG)',      1000, 600),
  (2, 1,  0, 'Ground Floor (G)',       1000, 600),
  (3, 1,  1, 'First Floor (1F)',       1000, 600),
  (4, 1,  2, 'Second Floor (2F)',      1000, 600),
  (5, 1,  3, 'Third Floor (3F - Food & Cinema)', 1000, 600);

select setval('malls_id_seq', 1);
select setval('floors_id_seq', 5);

-- =========================================================================
-- NAVIGATION NODES (5 Floors: -1 to 3)
-- Standard layout: West Junction (100,300), Stairs (300,300), Escalator (500,300),
-- Elevator (700,300), East Junction (900,300)
-- 6 Shop nodes per floor (North aisle: y=150, South aisle: y=450)
-- =========================================================================

-- LOWER GROUND FLOOR (floor_id = 1, floor_number = -1) -- Nodes 1-14
insert into navigation_nodes (id, floor_id, type, x, y, label, qr_code) values
  (1,  1, 'ENTRANCE_EXIT',     100, 300, 'LG Parking & Valet Entrance',   'QR-LG-ENTRANCE'),
  (2,  1, 'STAIRCASE',         300, 300, 'Staircase A (Lower Ground)',    'QR-LG-STAIRS'),
  (3,  1, 'ESCALATOR',         500, 300, 'Central Escalator (LG)',        'QR-LG-ESCALATOR'),
  (4,  1, 'ELEVATOR',          700, 300, 'Glass Elevator A (LG)',         'QR-LG-ELEVATOR'),
  (5,  1, 'CORRIDOR_JUNCTION', 900, 300, 'East Junction (LG)',             'QR-LG-EAST'),
  (6,  1, 'SHOP_ENTRANCE',     200, 150, 'Smart Bazaar Entrance',          null),
  (7,  1, 'SHOP_ENTRANCE',     450, 150, 'The Body Shop Entrance',         null),
  (8,  1, 'SHOP_ENTRANCE',     700, 150, 'Miniso Entrance',                null),
  (9,  1, 'SHOP_ENTRANCE',     200, 450, 'Bata Footwear Entrance',         null),
  (10, 1, 'SHOP_ENTRANCE',     450, 450, 'Lenskart Entrance',              null),
  (11, 1, 'SHOP_ENTRANCE',     700, 450, 'Apollo Pharmacy Entrance',       null),
  (12, 1, 'FACILITY',          850, 450, 'Washroom (Lower Ground)',       'QR-LG-WASHROOM'),
  (13, 1, 'FACILITY',          850, 150, 'ATM (Lower Ground)',            'QR-LG-ATM'),
  (14, 1, 'FACILITY',           50, 300, 'Valet Parking Desk',            'QR-LG-PARKING');

-- GROUND FLOOR (floor_id = 2, floor_number = 0) -- Nodes 21-34
insert into navigation_nodes (id, floor_id, type, x, y, label, qr_code) values
  (21, 2, 'ENTRANCE_EXIT',     100, 300, 'Main Grand Entrance (Vastrapur Gate)', 'QR-G-ENTRANCE'),
  (22, 2, 'STAIRCASE',         300, 300, 'Staircase A (Ground Floor)',     'QR-G-STAIRS'),
  (23, 2, 'ESCALATOR',         500, 300, 'Central Escalator (Ground Floor)','QR-G-ESCALATOR'),
  (24, 2, 'ELEVATOR',          700, 300, 'Glass Elevator A (Ground Floor)', 'QR-G-ELEVATOR'),
  (25, 2, 'CORRIDOR_JUNCTION', 900, 300, 'Central Atrium East (Ground)',    'QR-G-EAST'),
  (26, 2, 'SHOP_ENTRANCE',     200, 150, 'Zara Entrance',                  null),
  (27, 2, 'SHOP_ENTRANCE',     450, 150, 'H&M Entrance',                   null),
  (28, 2, 'SHOP_ENTRANCE',     700, 150, 'Shoppers Stop Entrance',         null),
  (29, 2, 'SHOP_ENTRANCE',     200, 450, 'Lifestyle Entrance',             null),
  (30, 2, 'SHOP_ENTRANCE',     450, 450, 'Starbucks Coffee Entrance',      null),
  (31, 2, 'SHOP_ENTRANCE',     700, 450, 'Sephora Entrance',               null),
  (32, 2, 'FACILITY',          850, 450, 'Washroom (Ground Floor)',        'QR-G-WASHROOM'),
  (33, 2, 'FACILITY',          850, 150, 'ATM (Ground Floor)',             'QR-G-ATM'),
  (34, 2, 'FACILITY',           50, 300, 'Information & Concierge Desk',   'QR-G-HELP');

-- FIRST FLOOR (floor_id = 3, floor_number = 1) -- Nodes 41-53
insert into navigation_nodes (id, floor_id, type, x, y, label, qr_code) values
  (41, 3, 'CORRIDOR_JUNCTION', 100, 300, 'West Balcony (First Floor)',     'QR-F1-WEST'),
  (42, 3, 'STAIRCASE',         300, 300, 'Staircase A (First Floor)',      'QR-F1-STAIRS'),
  (43, 3, 'ESCALATOR',         500, 300, 'Central Escalator (First Floor)','QR-F1-ESCALATOR'),
  (44, 3, 'ELEVATOR',          700, 300, 'Glass Elevator A (First Floor)', 'QR-F1-ELEVATOR'),
  (45, 3, 'CORRIDOR_JUNCTION', 900, 300, 'East Balcony (First Floor)',     'QR-F1-EAST'),
  (46, 3, 'SHOP_ENTRANCE',     200, 150, 'Reliance Digital Entrance',      null),
  (47, 3, 'SHOP_ENTRANCE',     450, 150, 'Westside Entrance',              null),
  (48, 3, 'SHOP_ENTRANCE',     700, 150, 'Pantaloons Entrance',            null),
  (49, 3, 'SHOP_ENTRANCE',     200, 450, 'Nike Store Entrance',            null),
  (50, 3, 'SHOP_ENTRANCE',     450, 450, 'Skechers Entrance',              null),
  (51, 3, 'SHOP_ENTRANCE',     700, 450, 'Puma Athletic Entrance',         null),
  (52, 3, 'FACILITY',          850, 450, 'Washroom (First Floor)',         'QR-F1-WASHROOM'),
  (53, 3, 'FACILITY',          850, 150, 'First Aid & Nursing Room',       'QR-F1-CARE');

-- SECOND FLOOR (floor_id = 4, floor_number = 2) -- Nodes 61-73
insert into navigation_nodes (id, floor_id, type, x, y, label, qr_code) values
  (61, 4, 'CORRIDOR_JUNCTION', 100, 300, 'West Corridor (Second Floor)',   'QR-F2-WEST'),
  (62, 4, 'STAIRCASE',         300, 300, 'Staircase A (Second Floor)',     'QR-F2-STAIRS'),
  (63, 4, 'ESCALATOR',         500, 300, 'Central Escalator (Second Floor)','QR-F2-ESCALATOR'),
  (64, 4, 'ELEVATOR',          700, 300, 'Glass Elevator A (Second Floor)', 'QR-F2-ELEVATOR'),
  (65, 4, 'CORRIDOR_JUNCTION', 900, 300, 'East Corridor (Second Floor)',   'QR-F2-EAST'),
  (66, 4, 'SHOP_ENTRANCE',     200, 150, 'Hamleys Toys Entrance',          null),
  (67, 4, 'SHOP_ENTRANCE',     450, 150, 'Home Centre Entrance',           null),
  (68, 4, 'SHOP_ENTRANCE',     700, 150, 'Fabindia Ethnic Entrance',       null),
  (69, 4, 'SHOP_ENTRANCE',     200, 450, 'Manyavar Mohey Entrance',        null),
  (70, 4, 'SHOP_ENTRANCE',     450, 450, 'Croma Electronics Entrance',     null),
  (71, 4, 'SHOP_ENTRANCE',     700, 450, 'Crossword Bookstores Entrance',  null),
  (72, 4, 'FACILITY',          850, 450, 'Washroom (Second Floor)',        'QR-F2-WASHROOM'),
  (73, 4, 'FACILITY',          850, 150, 'ATM (Second Floor)',             'QR-F2-ATM');

-- THIRD FLOOR (floor_id = 5, floor_number = 3 - Cinepolis & Food Court) -- Nodes 81-93
insert into navigation_nodes (id, floor_id, type, x, y, label, qr_code) values
  (81, 5, 'CORRIDOR_JUNCTION', 100, 300, 'Cinema Concourse (Third Floor)', 'QR-F3-WEST'),
  (82, 5, 'STAIRCASE',         300, 300, 'Staircase A (Third Floor)',      'QR-F3-STAIRS'),
  (83, 5, 'ESCALATOR',         500, 300, 'Central Escalator (Third Floor)','QR-F3-ESCALATOR'),
  (84, 5, 'ELEVATOR',          700, 300, 'Glass Elevator A (Third Floor)', 'QR-F3-ELEVATOR'),
  (85, 5, 'CORRIDOR_JUNCTION', 900, 300, 'Food Court Hub (Third Floor)',   'QR-F3-EAST'),
  (86, 5, 'SHOP_ENTRANCE',     200, 150, 'Cinepolis 9-Screen Multiplex',   null),
  (87, 5, 'SHOP_ENTRANCE',     450, 150, 'McDonalds & McCafe Entrance',    null),
  (88, 5, 'SHOP_ENTRANCE',     700, 150, 'KFC Express Entrance',           null),
  (89, 5, 'SHOP_ENTRANCE',     200, 450, 'Subway Sandwiches Entrance',     null),
  (90, 5, 'SHOP_ENTRANCE',     450, 450, 'Dosa Plaza & Gujarati Thali',    null),
  (91, 5, 'SHOP_ENTRANCE',     700, 450, 'Timezone Gaming Arcade Entrance',null),
  (92, 5, 'FACILITY',          850, 450, 'Washroom (Third Floor)',         'QR-F3-WASHROOM'),
  (93, 5, 'FACILITY',          850, 150, 'Nexus Central Food Court Seating','QR-F3-FOODCOURT');

select setval('navigation_nodes_id_seq', 100);

-- =========================================================================
-- NAVIGATION EDGES (Walkable corridor connections + Vertical transitions)
-- =========================================================================

-- Lower Ground floor edges
insert into navigation_edges (from_node_id, to_node_id, weight, vertical_connection) values
  (1, 2, 200, false), (2, 3, 200, false), (3, 4, 200, false), (4, 5, 200, false),
  (2, 6, 150, false), (3, 7, 150, false), (4, 8, 150, false),
  (2, 9, 150, false), (3, 10, 150, false), (4, 11, 150, false),
  (5, 12, 100, false), (5, 13, 160, false), (1, 14, 70, false);

-- Ground floor edges
insert into navigation_edges (from_node_id, to_node_id, weight, vertical_connection) values
  (21, 22, 200, false), (22, 23, 200, false), (23, 24, 200, false), (24, 25, 200, false),
  (22, 26, 150, false), (23, 27, 150, false), (24, 28, 150, false),
  (22, 29, 150, false), (23, 30, 150, false), (24, 31, 150, false),
  (25, 32, 100, false), (25, 33, 160, false), (21, 34, 70, false);

-- First floor edges
insert into navigation_edges (from_node_id, to_node_id, weight, vertical_connection) values
  (41, 42, 200, false), (42, 43, 200, false), (43, 44, 200, false), (44, 45, 200, false),
  (42, 46, 150, false), (43, 47, 150, false), (44, 48, 150, false),
  (42, 49, 150, false), (43, 50, 150, false), (44, 51, 150, false),
  (45, 52, 100, false), (45, 53, 160, false);

-- Second floor edges
insert into navigation_edges (from_node_id, to_node_id, weight, vertical_connection) values
  (61, 62, 200, false), (62, 63, 200, false), (63, 64, 200, false), (64, 65, 200, false),
  (62, 66, 150, false), (63, 67, 150, false), (64, 68, 150, false),
  (62, 69, 150, false), (63, 70, 150, false), (64, 71, 150, false),
  (65, 72, 100, false), (65, 73, 160, false);

-- Third floor edges
insert into navigation_edges (from_node_id, to_node_id, weight, vertical_connection) values
  (81, 82, 200, false), (82, 83, 200, false), (83, 84, 200, false), (84, 85, 200, false),
  (82, 86, 150, false), (83, 87, 150, false), (84, 88, 150, false),
  (82, 89, 150, false), (83, 90, 150, false), (84, 91, 150, false),
  (85, 92, 100, false), (85, 93, 160, false);

-- VERTICAL CONNECTORS (Connecting LG <-> G <-> 1F <-> 2F <-> 3F)
-- Staircases
insert into navigation_edges (from_node_id, to_node_id, weight, vertical_connection) values
  (2, 22, 70, true), (22, 42, 70, true), (42, 62, 70, true), (62, 82, 70, true);

-- Central Escalators (Fast 45m weight)
insert into navigation_edges (from_node_id, to_node_id, weight, vertical_connection) values
  (3, 23, 45, true), (23, 43, 45, true), (43, 63, 45, true), (63, 83, 45, true);

-- Glass Elevators (Wheelchair / Accessible)
insert into navigation_edges (from_node_id, to_node_id, weight, vertical_connection) values
  (4, 24, 50, true), (24, 44, 50, true), (44, 64, 50, true), (64, 84, 50, true);

select setval('navigation_edges_id_seq', 120);

-- ===== Product Categories =====
insert into product_categories (id, name) values
  (1, 'Apparel'), (2, 'Footwear'), (3, 'Electronics'), (4, 'Bags & Accessories'),
  (5, 'Books & Stationery'), (6, 'Dining & Food Court'), (7, 'Beauty & Cosmetics'),
  (8, 'Watches & Accessories'), (9, 'Toys & Games'), (10, 'Ethnic Wear'),
  (11, 'Opticals'), (12, 'Home Decor'), (13, 'Sportswear'), (14, 'Entertainment & Cinema'),
  (15, 'Pharmacy & Wellness'), (16, 'Hypermarket & Groceries');

select setval('product_categories_id_seq', 16);

-- =========================================================================
-- SHOPS (30 Verified Real Stores at Nexus Ahmedabad One)
-- =========================================================================

-- Lower Ground (floor_id = 1)
insert into shops (id, floor_id, name, category, description, navigation_node_id, active) values
  (1, 1, 'Smart Bazaar (Hypermarket)', 'Hypermarket & Groceries', 'Fresh vegetables, grocery, home essentials and daily food items.', 6, true),
  (2, 1, 'The Body Shop',              'Beauty & Cosmetics',       'Cruelty-free botanical skincare, body butters and fragrances.', 7, true),
  (3, 1, 'Miniso',                     'Bags & Accessories',       'Japanese designer lifestyle products, travel plushies and organizers.', 8, true),
  (4, 1, 'Bata Footwear',              'Footwear',                 'Comfortable leather shoes, formal footwear and school shoes.', 9, true),
  (5, 1, 'Lenskart Opticals',          'Opticals',                 'Trendy eyeglasses, prescription frames, sunglasses and eye checkups.', 10, true),
  (6, 1, 'Apollo Pharmacy',            'Pharmacy & Wellness',      'Medicines, first-aid, healthcare monitors and wellness vitamins.', 11, true);

-- Ground Floor (floor_id = 2)
insert into shops (id, floor_id, name, category, description, navigation_node_id, active) values
  (7,  2, 'Zara',                      'Apparel',                  'European high-street fashion, blazers, trendy coats and denim.', 26, true),
  (8,  2, 'H&M',                       'Apparel',                  'Global affordable fashion, youth streetwear and conscious basics.', 27, true),
  (9,  2, 'Shoppers Stop',             'Apparel',                  'Luxury department store with premium perfumes, watches and apparel.', 28, true),
  (10, 2, 'Lifestyle Store',           'Apparel',                  'Contemporary fashion brands, handbags, footwear and beauty accessories.', 29, true),
  (11, 2, 'Starbucks Coffee',          'Dining & Food Court',      'Artisanal handcrafted coffees, cold brews, pastries and cheesecakes.', 30, true),
  (12, 2, 'Sephora Beauty',            'Beauty & Cosmetics',       'International prestige cosmetics, designer fragrances and skincare.', 31, true);

-- First Floor (floor_id = 3)
insert into shops (id, floor_id, name, category, description, navigation_node_id, active) values
  (13, 3, 'Reliance Digital',          'Electronics',              'Laptops, flagship smartphones, QLED TVs and smart home appliances.', 46, true),
  (14, 3, 'Westside',                  'Apparel',                  'Modern Indian apparel, western workwear, footwear and home goods.', 47, true),
  (15, 3, 'Pantaloons',                'Apparel',                  'Festive family wear, casual t-shirts, dresses and ethnic collections.', 48, true),
  (16, 3, 'Nike Store',                'Sportswear',               'Performance running shoes, Air Max sneakers and training dri-fit wear.', 49, true),
  (17, 3, 'Skechers Footwear',         'Footwear',                 'Comfort slip-ins, arch-fit walking sneakers and running shoes.', 50, true),
  (18, 3, 'Puma Athletic',             'Sportswear',               'Motorsport sneakers, training gym gear, track pants and backpacks.', 51, true);

-- Second Floor (floor_id = 4)
insert into shops (id, floor_id, name, category, description, navigation_node_id, active) values
  (19, 4, 'Hamleys Toys',              'Toys & Games',             'Finest toy shop in the world: Lego, Barbie, RC cars and plush animals.', 66, true),
  (20, 4, 'Home Centre',               'Home Decor',               'Modern modular furniture, decorative lamps, cushions and kitchenware.', 67, true),
  (21, 4, 'Fabindia Ethnic',           'Ethnic Wear',              'Handcrafted traditional kurtas, dupattas, linen shirts and organic food.', 68, true),
  (22, 4, 'Manyavar Mohey',            'Ethnic Wear',              'Royal wedding sherwanis, festive kurtas and bridal lehengas.', 69, true),
  (23, 4, 'Croma Electronics',         'Electronics',              'Apple authorised retailer, soundbars, cameras and computer gadgets.', 70, true),
  (24, 4, 'Crossword Bookstores',      'Books & Stationery',       'Bestsellers, fiction, Gujarati literature, journals and board games.', 71, true);

-- Third Floor (floor_id = 5)
insert into shops (id, floor_id, name, category, description, navigation_node_id, active) values
  (25, 5, 'Cinepolis 9-Screen Multiplex','Entertainment & Cinema',  'State-of-the-art 9 screen luxury multiplex with recliner seating and IMAX.', 86, true),
  (26, 5, 'McDonalds & McCafe',        'Dining & Food Court',      'World-famous burgers, crispy French fries, shakes and wraps.', 87, true),
  (27, 5, 'KFC Express',               'Dining & Food Court',      'Original recipe fried chicken, zinger burgers and popcorn rice bowls.', 88, true),
  (28, 5, 'Subway Sandwiches',         'Dining & Food Court',      'Freshly baked footlong subs, toasted wraps and customized salads.', 89, true),
  (29, 5, 'Dosa Plaza & Gujarati Thali','Dining & Food Court',     '104 varieties of fusion dosas, authentic Gujarati farsan and meals.', 90, true),
  (30, 5, 'Timezone Gaming Arcade',    'Entertainment & Cinema',   'Family entertainment centre with bowling, racing simulators and arcade.', 91, true);

select setval('shops_id_seq', 30);
update shops set owner_user_id = 2 where id = 7; -- Zara owned by demo retailer

-- ===== Facilities across all 5 Floors =====
insert into facilities (floor_id, type, label, navigation_node_id) values
  (1, 'WASHROOM',        'Washroom (Lower Ground)',           12),
  (1, 'ATM',             'State Bank ATM (Lower Ground)',     13),
  (1, 'PARKING_ACCESS',  'Valet & Basement Parking Access',   14),
  (2, 'WASHROOM',        'Washroom (Ground Floor East)',      32),
  (2, 'ATM',             'HDFC Bank ATM (Ground Floor)',      33),
  (2, 'CUSTOMER_SERVICE','Nexus Guest Services Desk',         34),
  (3, 'WASHROOM',        'Washroom (First Floor)',            52),
  (4, 'WASHROOM',        'Washroom (Second Floor)',           72),
  (4, 'ATM',             'ICICI Bank ATM (Second Floor)',     73),
  (5, 'WASHROOM',        'Washroom (Third Floor)',            92),
  (5, 'FOOD_COURT',      'Nexus Central Food Court Seating',  93);

select setval('facilities_id_seq', 11);

commit;
