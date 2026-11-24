#!/usr/bin/env python3
"""
Generates data/seed/02_seed_products.sql and data/seed/products_import_sample.csv.

IMPORTANT (Part 17 rule #7 / Part 19 limitations): every product here is
SYNTHETIC DEMO DATA, deterministically generated from a fixed seed so the
dataset is reproducible run to run. None of it represents real retailer
inventory, real prices, or real stock levels.

Run:  python generate_products.py
(from data/seed/, with no third-party deps -- stdlib only)
"""
import csv
import random
from pathlib import Path

random.seed(42)  # deterministic / reproducible, per Part 17 rule #12

# shop_id -> (shop category_id, brand pool, category_noun_lookup, price range in INR)
SHOPS = {
    1:  (16, ["SmartChoice", "FreshHarvest", "DailyGold"], "Hypermarket & Groceries", (49, 1999)),
    2:  (7,  ["The Body Shop", "British Rose", "Tea Tree"], "Beauty & Cosmetics", (299, 2999)),
    3:  (4,  ["Miniso", "Sanrio", "Marvel x Miniso"], "Bags & Accessories", (199, 1999)),
    4:  (2,  ["Bata", "Hush Puppies", "Power"], "Footwear", (499, 4999)),
    5:  (11, ["John Jacobs", "Vincent Chase", "Air Flex"], "Opticals", (599, 6999)),
    6:  (15, ["Apollo Life", "Himalaya", "Revital"], "Pharmacy & Wellness", (49, 1499)),
    7:  (1,  ["Zara Man", "Zara Woman", "Zara TRF"], "Apparel", (1299, 9999)),
    8:  (1,  ["H&M Divided", "H&M Conscious", "H&M Studio"], "Apparel", (799, 6999)),
    9:  (1,  ["Stop", "Life", "Fratini"], "Apparel", (999, 8999)),
    10: (1,  ["Ginger", "Code", "Fame Forever"], "Apparel", (699, 5999)),
    11: (6,  ["Starbucks Reserve", "Teavana", "Starbucks Bakery"], "Dining & Food Court", (199, 799)),
    12: (7,  ["Sephora Collection", "Fenty Beauty", "Huda Beauty"], "Beauty & Cosmetics", (799, 8999)),
    13: (3,  ["Apple", "Samsung", "Sony", "HP"], "Electronics", (1499, 89999)),
    14: (1,  ["Nuon", "Wardrobe", "Soleplay"], "Apparel", (599, 4999)),
    15: (1,  ["Rangmanch", "Akkriti", "Ajile"], "Apparel", (499, 4499)),
    16: (13, ["Nike Pro", "Air Jordan", "Dri-FIT"], "Sportswear", (1999, 12999)),
    17: (2,  ["Skechers D-Lites", "GO WALK", "Arch Fit"], "Footwear", (2499, 7999)),
    18: (13, ["Puma Nitro", "Scuderia Ferrari", "Puma Training"], "Sportswear", (1499, 8999)),
    19: (9,  ["Lego", "Barbie", "Nerf", "Hot Wheels"], "Toys & Games", (399, 9999)),
    20: (12, ["Home Centre Elite", "Portico", "Stellar"], "Home Decor", (499, 14999)),
    21: (10, ["Fabindia Organics", "Fabindia Cotton", "Rajwada"], "Ethnic Wear", (999, 8999)),
    22: (10, ["Manyavar Royale", "Mohey Bridal", "Kurta Sets"], "Ethnic Wear", (1999, 29999)),
    23: (3,  ["Croma Basics", "Apple", "Bose", "Dell"], "Electronics", (999, 74999)),
    24: (5,  ["Penguin", "HarperCollins", "Rupa", "Navneet"], "Books & Stationery", (149, 1999)),
    25: (14, ["Cinepolis VIP", "IMAX Recliner", "Club Seating"], "Entertainment & Cinema", (250, 950)),
    26: (6,  ["McAloo Tikki", "Big Spicy Paneer", "McFlurry"], "Dining & Food Court", (99, 599)),
    27: (6,  ["Hot & Crispy", "Zinger Box", "Popcorn Chicken"], "Dining & Food Court", (149, 799)),
    28: (6,  ["Sub of the Day", "Paneer Tikka Sub", "Cookie Combo"], "Dining & Food Court", (129, 499)),
    29: (6,  ["Schezwan Dosa", "Gujarati Special Thali", "Khaman Farsan"], "Dining & Food Court", (120, 450)),
    30: (14, ["Timezone Gold Card", "VR Rollercoaster", "Bowling Pass"], "Entertainment & Cinema", (300, 2000)),
}

PRODUCT_NOUNS = {
    "Apparel": ["T-Shirt", "Shirt", "Jeans", "Jacket", "Hoodie", "Trousers", "Dress", "Kurta", "Sweater", "Shorts"],
    "Footwear": ["Running Shoes", "Formal Shoes", "Sneakers", "Sandals", "Loafers", "Boots", "Flip Flops", "Sports Shoes"],
    "Electronics": ["Laptop", "Bluetooth Headphones", "Smart Speaker", "Power Bank", "Wireless Mouse", "Monitor", "Keyboard", "Tablet"],
    "Bags & Accessories": ["Backpack", "Handbag", "Wallet", "Duffel Bag", "Laptop Sleeve", "Tote Bag", "Travel Bag"],
    "Books & Stationery": ["Notebook", "Novel", "Sketchbook", "Pen Set", "Planner", "Desk Organizer", "Highlighter Pack"],
    "Confectionery": ["Chocolate Box", "Gift Hamper", "Candy Jar", "Cookie Tin", "Truffle Pack"],
    "Mobile & Gadgets": ["Smartphone", "Phone Case", "Screen Protector", "Charging Cable", "Earbuds", "Smartwatch"],
    "Beauty & Cosmetics": ["Face Cream", "Lipstick", "Perfume", "Sunscreen", "Face Wash", "Hair Serum"],
    "Watches & Accessories": ["Analog Watch", "Digital Watch", "Watch Strap", "Cufflinks Set", "Smart Band"],
    "Toys & Games": ["Building Blocks", "Board Game", "Puzzle Set", "RC Car", "Soft Toy", "Action Figure"],
    "Jewelry": ["Necklace", "Earrings", "Bracelet", "Ring", "Pendant Set"],
    "Opticals": ["Sunglasses", "Reading Glasses", "Contact Lens Kit", "Spectacle Frame"],
    "Home Decor": ["Wall Clock", "Table Lamp", "Photo Frame", "Flower Vase", "Cushion Cover", "Wall Art"],
    "Sportswear": ["Track Pants", "Sports Jersey", "Gym Bag", "Yoga Mat", "Training Shoes", "Sports Cap"],
    "Gifts & Novelty": ["Gift Card Holder", "Mug Set", "Keychain", "Scented Candle", "Greeting Card Pack"],
    "Pharmacy & Health": ["Vitamin Tablets", "First Aid Kit", "Hand Sanitizer", "Pain Relief Spray", "Protein Powder"],
    "Hypermarket & Groceries": ["Basmati Rice 5kg", "Pure Olive Oil", "Organic Honey", "California Almonds", "Green Tea", "Rolled Oats"],
    "Pharmacy & Wellness": ["Multivitamin Tablets", "First Aid Kit", "Digital Thermometer", "Whey Protein 1kg", "Herbal Balm"],
    "Dining & Food Court": ["Combo Meal Box", "Artisan Coffee", "Gourmet Burger", "Butter Masala Dosa", "Crispy Fries", "Ice Cream Sundae"],
    "Ethnic Wear": ["Silk Kurta", "Royal Sherwani", "Bandhani Dupatta", "Embroidered Lehenga", "Nehru Jacket", "Linen Kurta"],
    "Entertainment & Cinema": ["VIP Recliner Movie Pass", "IMAX Ticket", "Large Popcorn Combo", "Game Card 100 Credits", "Bowling Alley Pass"],
}

COLORS = ["Black", "White", "Blue", "Red", "Grey", "Green", "Beige", "Navy", None]

OUT_DIR = Path(__file__).parent


def make_price(lo, hi):
    price = random.randint(lo, hi)
    price = round(price / 10) * 10 - 1  # ...X99 style pricing, cosmetic only
    return max(price, lo)


def generate():
    rows = []
    product_id = 1
    for shop_id, (category_id, brands, category_name, (lo, hi)) in SHOPS.items():
        nouns = PRODUCT_NOUNS[category_name]
        count = random.randint(9, 11)  # ~180 products total across 18 shops
        for _ in range(count):
            brand = random.choice(brands)
            noun = random.choice(nouns)
            color = random.choice(COLORS)
            name = f"{brand} {noun}" if color is None else f"{brand} {noun} ({color})"
            price = make_price(lo, hi)
            has_discount = random.random() < 0.3
            discount_price = round(price * random.uniform(0.75, 0.9)) if has_discount else ""
            available = random.random() < 0.92
            stock = random.randint(0, 50) if available else 0
            rows.append({
                "shop_id": shop_id,
                "category_name": category_name,
                "name": name,
                "brand": brand,
                "color": color or "",
                "description": f"{name} from {brand}. Demo catalogue entry.",
                "price": price,
                "discount_price": discount_price,
                "specifications": "",
                "image_url": "",
                "available": "true" if available else "false",
                "stock_quantity": stock,
            })
            product_id += 1
    return rows


def write_csv(rows, path):
    fieldnames = ["shop_id", "category_name", "name", "brand", "color", "description",
                  "price", "discount_price", "specifications", "image_url", "available", "stock_quantity"]
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def sql_escape(value):
    if value == "" or value is None:
        return "null"
    return "'" + str(value).replace("'", "''") + "'"


def write_sql(rows, path):
    lines = [
        "-- Auto-generated by generate_products.py -- SYNTHETIC DEMO DATA, not real inventory.",
        "-- Regenerate with: python generate_products.py",
        "begin;",
        "truncate table products restart identity cascade;",
        "",
    ]
    category_name_to_id = {
        "Apparel": 1, "Footwear": 2, "Electronics": 3, "Bags & Accessories": 4,
        "Books & Stationery": 5, "Dining & Food Court": 6, "Beauty & Cosmetics": 7,
        "Watches & Accessories": 8, "Toys & Games": 9, "Ethnic Wear": 10,
        "Opticals": 11, "Home Decor": 12, "Sportswear": 13, "Entertainment & Cinema": 14,
        "Pharmacy & Wellness": 15, "Hypermarket & Groceries": 16,
    }
    batch = []
    for row in rows:
        category_id = category_name_to_id[row["category_name"]]
        discount = "null" if row["discount_price"] == "" else row["discount_price"]
        values = (
            f"({row['shop_id']}, {category_id}, {sql_escape(row['name'])}, {sql_escape(row['brand'])}, "
            f"{sql_escape(row['color'] or None)}, {sql_escape(row['description'])}, {row['price']}, {discount}, "
            f"{sql_escape(None)}, {sql_escape(None)}, {row['available']}, {row['stock_quantity']}, now(), now())"
        )
        batch.append(values)

    lines.append(
        "insert into products (shop_id, category_id, name, brand, color, description, price, discount_price, "
        "specifications, image_url, available, stock_quantity, created_at, updated_at) values"
    )
    lines.append(",\n".join(batch) + ";")
    lines.append("")
    lines.append("select setval('products_id_seq', (select max(id) from products));")
    lines.append("commit;")

    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


if __name__ == "__main__":
    rows = generate()
    write_sql(rows, OUT_DIR / "02_seed_products.sql")
    # A smaller slice doubles as the sample file for the CSV catalogue
    # importer demo (Part 6: File management -- CSV catalogue import).
    write_csv(rows[:25], OUT_DIR / "products_import_sample.csv")
    print(f"Generated {len(rows)} synthetic products.")
    print("Wrote 02_seed_products.sql and products_import_sample.csv")
