DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    email VARCHAR(100),
    city VARCHAR(50),
    country VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    product_name VARCHAR(100),
    category VARCHAR(50),
    price NUMERIC(10, 2),
    cost NUMERIC(10, 2)
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(customer_id),
    order_date DATE,
    status VARCHAR(20),
    total_amount NUMERIC(10, 2)
);

CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(order_id),
    product_id INT REFERENCES products(product_id),
    quantity INT,
    unit_price NUMERIC(10, 2)
);

-- Insert dữ liệu giống MySQL
INSERT INTO customers (customer_id, first_name, last_name, email, city, country, created_at)
VALUES
(1,'John','Doe','john@email.com','New York','USA','2023-01-15'),
(2,'Jane','Smith','jane@email.com','London','UK','2023-02-20'),
(3,'Bob','Johnson','bob@email.com','Toronto','Canada','2023-03-10'),
(4,'Alice','Brown','alice@email.com','Sydney','Australia','2023-04-05'),
(5,'Charlie','Wilson','charlie@email.com','Berlin','Germany','2023-05-12');

INSERT INTO products (product_id, product_name, category, price, cost) VALUES
(1,'Laptop Pro','Electronics',1299.99,800.00),
(2,'Wireless Mouse','Electronics',29.99,15.00),
(3,'Desk Chair','Furniture',199.99,120.00),
(4,'Coffee Mug','Home',12.99,5.00),
(5,'Phone Case','Accessories',24.99,8.00);

INSERT INTO orders (order_id, customer_id, order_date, status, total_amount) VALUES
(1,1,'2024-01-15','completed',1329.98),
(2,2,'2024-01-20','completed',229.98),
(3,3,'2024-02-01','pending',54.98);

INSERT INTO order_items (order_item_id, order_id, product_id, quantity, unit_price) VALUES
(1,1,1,1,1299.99),
(2,1,2,1,29.99),
(3,2,3,1,199.99),
(4,2,2,1,29.99);
