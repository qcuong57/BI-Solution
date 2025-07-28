cube('OrderItems', {
  sql: 'SELECT * FROM ecommerce_bi.order_items',
  
  joins: {
    Orders: {
      relationship: 'belongsTo',
      sql: `${CUBE}.order_id = ${Orders}.order_id`
    },
    
    Products: {
      relationship: 'belongsTo',
      sql: `${CUBE}.product_id = ${Products}.product_id`
    }
  },
  
  measures: {
    count: {
      type: 'count',
      title: 'Tổng số mặt hàng'
    },
    
    totalQuantity: {
      sql: 'quantity',
      type: 'sum',
      title: 'Tổng số lượng bán ra'
    },
    
    totalItemRevenue: {
      sql: `quantity * unit_price`,
      type: 'sum',
      title: 'Tổng doanh thu mặt hàng'
    }
  },
  
  dimensions: {
    orderItemId: {
      sql: 'order_item_id',
      type: 'number',
      primaryKey: true
    },
    
    orderId: {
      sql: 'order_id',
      type: 'number'
    },
    
    productId: {
      sql: 'product_id',
      type: 'number'
    },
    
    quantity: {
      sql: 'quantity',
      type: 'number'
    },
    
    unitPrice: {
      sql: 'unit_price',
      type: 'number'
    }
  }
});