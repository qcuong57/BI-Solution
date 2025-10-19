db = db.getSiblingDB("salesdb");

db.sales.drop();
db.sales.insertMany([
  {
    order_id: 1,
    customer: "John Doe",
    items: [
      { product: "Laptop Pro", qty: 1, price: 1299.99 },
      { product: "Wireless Mouse", qty: 1, price: 29.99 }
    ],
    total: 1329.98,
    region: "North America"
  },
  {
    order_id: 2,
    customer: "Jane Smith",
    items: [
      { product: "Desk Chair", qty: 1, price: 199.99 },
      { product: "Wireless Mouse", qty: 1, price: 29.99 }
    ],
    total: 229.98,
    region: "Europe"
  },
  {
    order_id: 3,
    customer: "Bob Johnson",
    items: [
      { product: "Coffee Mug", qty: 2, price: 12.99 },
      { product: "Wireless Mouse", qty: 1, price: 29.99 }
    ],
    total: 54.98,
    region: "North America"
  }
]);
