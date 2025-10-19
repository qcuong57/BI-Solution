cube(`PgCustomers`, {
  sql: `SELECT * FROM postgres.public.customers`,
  dataSource: `postgres`,

  measures: {
    count: { type: `count` }
  },

  dimensions: {
    id: { sql: `customer_id`, type: `number`, primaryKey: true },
    name: { sql: `CONCAT(${CUBE}.first_name, ' ', ${CUBE}.last_name)`, type: `string` },
    city: { sql: `city`, type: `string` },
    country: { sql: `country`, type: `string` }
  }
});