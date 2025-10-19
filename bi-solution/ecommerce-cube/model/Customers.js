cube(`Customers`, {
  sql: `SELECT * FROM ecommerce_bi.customers`,

  measures: {
    count: {
      type: `count`
    },

    totalCustomers: {
      sql: `customer_id`,
      type: `countDistinct`,
      title: `Tổng số khách hàng`
    }
  },

  dimensions: {
    customerId: {
      sql: `customer_id`,
      type: `number`,
      primaryKey: true
    },

    firstName: {
      sql: `first_name`,
      type: `string`
    },

    lastName: {
      sql: `last_name`,
      type: `string`
    },

    fullName: {
      sql: `CONCAT(first_name, ' ', last_name)`,
      type: `string`
    },

    email: {
      sql: `email`,
      type: `string`
    },

    city: {
      sql: `city`,
      type: `string`
    },

    country: {
      sql: `country`,
      type: `string`
    },

    createdAt: {
      sql: `created_at`,
      type: `time`
    }
  }
});
