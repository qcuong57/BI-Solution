cube(`PgOrders`, {
  sql: `SELECT * FROM postgres.public.orders`,
  dataSource: `postgres`,

  measures: {
    totalAmount: { sql: `total_amount`, type: `sum` },
    count: { type: `count` }
  },

  dimensions: {
    id: { sql: `order_id`, type: `number`, primaryKey: true },
    status: { sql: `status`, type: `string` },
    orderDate: { sql: `order_date`, type: `time` }
  }
});