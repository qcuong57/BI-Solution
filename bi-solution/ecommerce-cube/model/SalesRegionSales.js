cube(`SalesRegionSales`, {
  sql: `SELECT * FROM ecommerce_bi.sales_region_sales`,

  measures: {
    count: {
      type: `count`,
      drillMembers: [regionName]
    },

    totalSales: {
      sql: `total_sales`,
      type: `sum`,
      title: `Tổng Doanh Thu`
    },

    totalOrders: {
      sql: `total_orders`,
      type: `sum`,
      title: `Tổng Đơn Hàng`
    },

    totalCustomers: {
      sql: `total_customers`,
      type: `sum`,
      title: `Tổng Khách Hàng`
    }
  },

  dimensions: {
    regionId: {
      sql: `region_id`,
      type: `number`,
      primaryKey: true
    },

    regionName: {
      sql: `region_name`,
      type: `string`
    },

    centerLatitude: {
      sql: `center_latitude`,
      type: `number`
    },

    centerLongitude: {
      sql: `center_longitude`,
      type: `number`
    },

    regionGeoJSON: {
      sql: `region_geojson`,
      type: `string`
    }
  }
});
