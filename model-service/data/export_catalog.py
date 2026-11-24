"""
Exports the live product catalogue from the MallMind Postgres database to
data/catalog.csv for the Data Science notebooks/pipelines to consume.

This is the SAME catalogue the Java backend serves (data/seed/02_seed_products.sql
-- itself clearly-labeled synthetic demo data, see Part 17 rule #7). We train
on it as-is rather than fabricating a separate "research" dataset, so the
recommendation engine's results are directly checkable against what the
app actually shows.

Run (from model-service/, with the venv's python and the Postgres
container from docker-compose.yml running):
    .venv/Scripts/python.exe data/export_catalog.py
"""
import csv
import os

import psycopg2

DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "5433")
DB_NAME = os.environ.get("DB_NAME", "mallmind")
DB_USER = os.environ.get("DB_USERNAME", "mallmind")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "mallmind_dev_password")

QUERY = """
    select
        p.id as product_id,
        p.name,
        p.brand,
        p.color,
        coalesce(p.discount_price, p.price) as effective_price,
        p.price,
        p.available,
        p.stock_quantity,
        pc.name as category,
        s.id as shop_id,
        s.name as shop_name,
        f.floor_number
    from products p
    join product_categories pc on pc.id = p.category_id
    join shops s on s.id = p.shop_id
    join floors f on f.id = s.floor_id
    order by p.id
"""


def main():
    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD
    )
    try:
        with conn.cursor() as cur:
            cur.execute(QUERY)
            rows = cur.fetchall()
            columns = [desc[0] for desc in cur.description]
    finally:
        conn.close()

    out_path = os.path.join(os.path.dirname(__file__), "catalog.csv")
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(columns)
        writer.writerows(rows)

    print(f"Exported {len(rows)} products to {out_path}")


if __name__ == "__main__":
    main()
