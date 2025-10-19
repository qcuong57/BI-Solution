// cube.js
module.exports = {
  driverFactory: ({ dataSource }) => {
    const ds = dataSource || "default";

    const commonConfig = {
      type: "trino",
      host: process.env.CUBEJS_DB_HOST,
      port: process.env.CUBEJS_DB_PORT,
      user: process.env.CUBEJS_DB_USER,
      ...(process.env.CUBEJS_DB_PASS ? { password: process.env.CUBEJS_DB_PASS } : {}),
      customHeaders: {
        "X-Trino-User": process.env.CUBEJS_DB_USER,
      },
    };

    if (ds === "default" || ds === "trino_mysql") {
      return {
        ...commonConfig,
        catalog: process.env.CUBEJS_DB_PRESTO_CATALOG || "mysql",
        schema: process.env.CUBEJS_DB_NAME || "ecommerce_bi",
      };
    }

    if (ds === "postgres") {
      return {
        ...commonConfig,
        catalog: "postgres",
        schema: "public",
      };
    }

    if (ds === "mongodb") {
      return {
        ...commonConfig,
        catalog: "mongodb",
        schema: "salesdb", // hoặc schema/DB bạn đặt trong init-mongo.js
      };
    }

    throw new Error(`Unknown dataSource: ${ds}`);
  },
};
