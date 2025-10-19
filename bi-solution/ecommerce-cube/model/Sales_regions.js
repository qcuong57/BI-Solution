cube(`SalesRegions`, {
  sql: `SELECT * FROM ecommerce_bi.sales_regions`,

  joins: {
    Customers: {
      relationship: `hasMany`,
      sql: `${CUBE}.region_name = ${Customers}.country`
    }
  },

  measures: {
    count: {
      type: `count`,
    }
  },

  dimensions: {
    regionId: {
      sql: `region_id`,
      type: `number`,
      primaryKey: true,
    },

    regionName: {
      sql: `region_name`,
      type: `string`,
    },

    centerLatitude: {
      sql: `center_latitude`,
      type: `number`,
    },

    centerLongitude: {
      sql: `center_longitude`,
      type: `number`,
    },

    regionGeoJSON: {
      sql: `region_geojson`,
      type: `string`,
    },
  },
});
