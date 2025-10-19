-- Create database if it does not exist
CREATE DATABASE IF NOT EXISTS ecommerce_bi;

USE ecommerce_bi;

DROP TABLE IF EXISTS order_items;

DROP TABLE IF EXISTS orders;

DROP TABLE IF EXISTS products;

DROP TABLE IF EXISTS customers;

-- Create Customers table
CREATE TABLE customers (
    customer_id INT PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100),
    city VARCHAR(50),
    country VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    product_id INT PRIMARY KEY,
    product_name VARCHAR(100),
    category VARCHAR(50),
    price DECIMAL(10, 2),
    cost DECIMAL(10, 2)
);

-- Orders table
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_id INT,
    order_date DATE,
    status VARCHAR(20),
    total_amount DECIMAL(10, 2),
    FOREIGN KEY (customer_id) REFERENCES customers (customer_id)
);

-- Order items table
CREATE TABLE order_items (
    order_item_id INT PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT,
    unit_price DECIMAL(10, 2),
    FOREIGN KEY (order_id) REFERENCES orders (order_id),
    FOREIGN KEY (product_id) REFERENCES products (product_id)
);

INSERT INTO
    customers
VALUES (
        1,
        'John',
        'Doe',
        'john@email.com',
        'New York',
        'USA',
        '2023-01-15'
    ),
    (
        2,
        'Jane',
        'Smith',
        'jane@email.com',
        'London',
        'UK',
        '2023-02-20'
    ),
    (
        3,
        'Bob',
        'Johnson',
        'bob@email.com',
        'Toronto',
        'Canada',
        '2023-03-10'
    ),
    (
        4,
        'Alice',
        'Brown',
        'alice@email.com',
        'Sydney',
        'Australia',
        '2023-04-05'
    ),
    (
        5,
        'Charlie',
        'Wilson',
        'charlie@email.com',
        'Berlin',
        'Germany',
        '2023-05-12'
    ),
    (
        6,
        'David',
        'Lee',
        'david@email.com',
        'New York',
        'USA',
        '2023-06-10'
    ),
    (
        7,
        'Emma',
        'Taylor',
        'emma@email.com',
        'London',
        'UK',
        '2023-07-15'
    ),
    (
        8,
        'Lucas',
        'Martin',
        'lucas@email.com',
        'Toronto',
        'Canada',
        '2023-08-20'
    ),
    (
        9,
        'Olivia',
        'Davis',
        'olivia@email.com',
        'Sydney',
        'Australia',
        '2023-09-25'
    ),
    (
        10,
        'Ethan',
        'White',
        'ethan@email.com',
        'Berlin',
        'Germany',
        '2023-10-05'
    );

INSERT INTO
    products
VALUES (
        1,
        'Laptop Pro',
        'Electronics',
        1299.99,
        800.00
    ),
    (
        2,
        'Wireless Mouse',
        'Electronics',
        29.99,
        15.00
    ),
    (
        3,
        'Desk Chair',
        'Furniture',
        199.99,
        120.00
    ),
    (
        4,
        'Coffee Mug',
        'Home',
        12.99,
        5.00
    ),
    (
        5,
        'Phone Case',
        'Accessories',
        24.99,
        8.00
    );

INSERT INTO
    orders
VALUES (
        1,
        1,
        '2024-01-15',
        'completed',
        1329.98
    ),
    (
        2,
        2,
        '2024-01-20',
        'completed',
        229.98
    ),
    (
        3,
        3,
        '2024-02-01',
        'pending',
        54.98
    ),
    (
        4,
        1,
        '2024-02-15',
        'completed',
        199.99
    ),
    (
        5,
        4,
        '2024-03-01',
        'shipped',
        37.98
    ),
    (
        6,
        6,
        '2024-03-05',
        'completed',
        1550.00
    ),
    (
        7,
        7,
        '2024-03-07',
        'completed',
        230.00
    ),
    (
        8,
        8,
        '2024-03-10',
        'completed',
        320.00
    ),
    (
        9,
        9,
        '2024-03-15',
        'completed',
        450.00
    ),
    (
        10,
        10,
        '2024-03-18',
        'completed',
        89.97
    );

INSERT INTO
    order_items
VALUES (1, 1, 1, 1, 1299.99),
    (2, 1, 2, 1, 29.99),
    (3, 2, 3, 1, 199.99),
    (4, 2, 2, 1, 29.99),
    (5, 3, 4, 2, 12.99),
    (6, 3, 2, 1, 29.99),
    (7, 4, 3, 1, 199.99),
    (8, 5, 4, 1, 12.99),
    (9, 5, 5, 1, 24.99),
    (10, 6, 1, 1, 1299.99),
    (11, 6, 2, 5, 29.99),
    (12, 7, 3, 1, 199.99),
    (13, 7, 2, 1, 29.99),
    (14, 8, 1, 1, 1299.99),
    (15, 8, 5, 2, 24.99),
    (16, 9, 3, 2, 199.99),
    (17, 9, 4, 5, 12.99),
    (18, 10, 4, 3, 12.99),
    (19, 10, 5, 1, 24.99);

CREATE TABLE poi_locations (
    poi_id INT PRIMARY KEY,
    poi_name VARCHAR(100),
    city VARCHAR(50),
    country VARCHAR(50),
    latitude DECIMAL(9, 6),
    longitude DECIMAL(9, 6)
);

CREATE TABLE country_region_map (
    country VARCHAR(50),
    region_name VARCHAR(50)
);

INSERT INTO
    country_region_map
VALUES ('USA', 'North America'),
    ('Canada', 'North America'),
    ('UK', 'Europe'),
    ('Germany', 'Europe'),
    (
        'Australia',
        'Australia Region'
    );

INSERT INTO
    poi_locations
VALUES (
        1,
        'New York Branch',
        'New York',
        'USA',
        40.712776,
        -74.005974
    ),
    (
        2,
        'London Office',
        'London',
        'UK',
        51.507351,
        -0.127758
    ),
    (
        3,
        'Toronto Hub',
        'Toronto',
        'Canada',
        43.653225,
        -79.383186
    ),
    (
        4,
        'Sydney Store',
        'Sydney',
        'Australia',
        -33.868820,
        151.209290
    ),
    (
        5,
        'Berlin Branch',
        'Berlin',
        'Germany',
        52.520008,
        13.404954
    );

-- Sales regions
CREATE TABLE sales_regions (
    region_id INT PRIMARY KEY,
    region_name VARCHAR(50),
    center_latitude DECIMAL(9, 6),
    center_longitude DECIMAL(9, 6)
);

INSERT INTO
    sales_regions
VALUES (
        1,
        'North America',
        40.000000,
        -100.000000
    ),
    (
        2,
        'Europe',
        54.000000,
        15.000000
    ),
    (
        3,
        'Australia Region',
        -25.000000,
        133.000000
    );

-- Employee counts per POI
CREATE TABLE employee_counts (
    poi_id INT,
    employee_count INT,
    FOREIGN KEY (poi_id) REFERENCES poi_locations (poi_id)
);

INSERT INTO
    employee_counts
VALUES (1, 50),
    (2, 40),
    (3, 35),
    (4, 25),
    (5, 30);

-- =========================
-- Analytics View
-- =========================
CREATE OR REPLACE VIEW poi_sales_analysis AS
SELECT
    p.poi_id,
    p.poi_name,
    p.city,
    p.country,
    p.latitude,
    p.longitude,
    MAX(e.employee_count) AS employee_count,
    SUM(o.total_amount) AS total_sales,
    COUNT(DISTINCT o.order_id) AS total_orders,
    (
        SELECT pr2.product_name
        FROM
            order_items oi2
            JOIN products pr2 ON pr2.product_id = oi2.product_id
            JOIN orders o2 ON o2.order_id = oi2.order_id
            JOIN customers c2 ON c2.customer_id = o2.customer_id
        WHERE
            c2.city = p.city
            AND c2.country = p.country
        GROUP BY
            pr2.product_name
        ORDER BY SUM(oi2.quantity) DESC
        LIMIT 1
    ) AS top_selling_product
FROM
    poi_locations p
    LEFT JOIN employee_counts e ON p.poi_id = e.poi_id
    LEFT JOIN customers c ON c.city = p.city
    AND c.country = p.country
    LEFT JOIN orders o ON o.customer_id = c.customer_id
GROUP BY
    p.poi_id,
    p.poi_name,
    p.city,
    p.country,
    p.latitude,
    p.longitude
ORDER BY total_sales DESC;

-- Thêm cột GeoJSON vào sales_regions
ALTER TABLE sales_regions ADD COLUMN region_geojson JSON;

UPDATE sales_regions
SET
    region_geojson = '{
  "type": "Polygon",
  "coordinates": [[
    [-130, 55], [-60, 55], [-60, 20], [-130, 20], [-130, 55]
  ]]
}'
WHERE
    region_name = 'North America';

UPDATE sales_regions
SET
    region_geojson = '{
  "type": "Polygon",
  "coordinates": [[
    [-10, 70], [40, 70], [40, 35], [-10, 35], [-10, 70]
  ]]
}'
WHERE
    region_name = 'Europe';

UPDATE sales_regions
SET
    region_geojson = '{
  "type": "Polygon",
  "coordinates": [[
    [110, -10], [155, -10], [155, -45], [110, -45], [110, -10]
  ]]
}'
WHERE
    region_name = 'Australia Region';

w   INSERT INTO
    sales_regions (
        region_id,
        region_name,
        center_latitude,
        center_longitude,
        region_geojson
    )
VALUES (
        4,
        'Asia',
        30.0,
        100.0,
        '{
    "type": "Polygon",
    "coordinates": [[
      [60, 55], [150, 55], [150, 5], [60, 5], [60, 55]
    ]]
  }'
    );

-- Thêm South America Region
INSERT INTO
    sales_regions (
        region_id,
        region_name,
        center_latitude,
        center_longitude,
        region_geojson
    )
VALUES (
        5,
        'South America',
        -15.0,
        -60.0,
        '{
    "type": "Polygon",
    "coordinates": [[
      [-85, 15], [-35, 15], [-35, -55], [-85, -55], [-85, 15]
    ]]
  }'
    );

CREATE OR REPLACE VIEW sales_region_sales AS
SELECT
    r.region_id,
    r.region_name,
    r.center_latitude,
    r.center_longitude,
    r.region_geojson,
    COALESCE(SUM(o.total_amount), 0) AS total_sales,
    COALESCE(COUNT(DISTINCT o.order_id), 0) AS total_orders,
    COALESCE(
        COUNT(DISTINCT c.customer_id),
        0
    ) AS total_customers
FROM
    sales_regions r
    JOIN country_region_map m ON r.region_name = m.region_name
    LEFT JOIN customers c ON c.country = m.country
    LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY
    r.region_id,
    r.region_name,
    r.center_latitude,
    r.center_longitude,
    r.region_geojson;