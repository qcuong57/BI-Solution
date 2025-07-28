cube('Products', {
  sql: 'SELECT * FROM ecommerce_bi.products',
  
  measures: {
    count: {
      type: 'count'
    },
    
    avgPrice: {
      sql: 'price',
      type: 'avg',
      title: 'Giá trung bình'
    },
    
    totalProducts: {
      sql: 'product_id',
      type: 'countDistinct'
    }
  },
  
  dimensions: {
    productId: {
      sql: 'product_id',
      type: 'number',
      primaryKey: true
    },
    
    productName: {
      sql: 'product_name',
      type: 'string'
    },
    
    category: {
      sql: 'category',
      type: 'string'
    },
    
    price: {
      sql: 'price',
      type: 'number'
    },
    
    cost: {
      sql: 'cost',
      type: 'number'
    },
    
    margin: {
      sql: `price - cost`,
      type: 'number'
    },
    
    marginPercent: {
      sql: `ROUND(((price - cost) / price) * 100, 2)`,
      type: 'number'
    }
  }
});