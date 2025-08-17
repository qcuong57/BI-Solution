cube("PoiSalesAnalysis", {
  sql: "SELECT * FROM ecommerce_bi.poi_sales_analysis",

  measures: {
    totalSales: {
      sql: "total_sales",
      type: "sum",
      title: "Tổng doanh số",
    },
    totalOrders: {
      sql: "total_orders",
      type: "sum",
      title: "Tổng số đơn hàng",
    },
    employeeCount: {
      sql: "employee_count",
      type: "sum",
      title: "Số nhân viên",
    },
    count: {
      type: "count",
      drillMembers: [poiId, city, country],
    },
  },

  dimensions: {
    poiId: {
      sql: "poi_id",
      type: "number",
      primaryKey: true,
    },
    poiName: {
      sql: "poi_name",
      type: "string",
    },
    city: {
      sql: "city",
      type: "string",
    },
    country: {
      sql: "country",
      type: "string",
    },
    latitude: {
      sql: "latitude",
      type: "number",
    },
    longitude: {
      sql: "longitude",
      type: "number",
    },
    topSellingProduct: {
      sql: "top_selling_product",
      type: "string",
    },
  },
});
