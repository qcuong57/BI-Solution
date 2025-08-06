cube('Orders', {
  sql: 'SELECT * FROM ecommerce_bi.orders',

  joins: {
    Customers: {
      relationship: 'belongsTo',
      sql: `${CUBE}.customer_id = ${Customers}.customer_id`
    }
  },

  measures: {
    count: {
      type: 'count',
      title: 'Tổng số đơn hàng'
    },
    totalRevenue: {
      sql: 'total_amount',
      type: 'sum',
      title: 'Tổng doanh thu'
    },
    avgOrderValue: {
      sql: 'total_amount',
      type: 'avg',
      title: 'Giá trị đơn hàng trung bình'
    },
    completedOrders: {
      sql: 'order_id',
      type: 'count',
      filters: [
        { sql: `${CUBE}.status = 'completed'` }
      ],
      title: 'Đơn hàng hoàn thành'
    }
  },

  dimensions: {
    orderId: {
      sql: 'order_id',
      type: 'number',
      primaryKey: true
    },
    customerId: {
      sql: 'customer_id',
      type: 'number'
    },
    status: {
      sql: 'status',
      type: 'string'
    },
    totalAmount: {
      sql: 'total_amount',
      type: 'number'
    },
    orderDate: {
      sql: `CAST(order_date AS timestamp)`,
      type: 'time'
    },
    orderMonth: {
      sql: `DATE_TRUNC('month', CAST(order_date AS timestamp))`,
      type: 'time'
    }
  }
});
