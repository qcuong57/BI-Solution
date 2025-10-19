// Sales.js
cube(`Sales`, {
  sql: `SELECT * FROM mongodb.salesdb.sales`,
  dataSource: `mongodb`,

  measures: {
    total: { sql: `total`, type: `sum` },
    count: { type: `count` }
  },

  dimensions: {
    orderId: { sql: `order_id`, type: `number`, primaryKey: true },
    customer: { sql: `customer`, type: `string` },
    region: { sql: `region`, type: `string` }
  }
});
