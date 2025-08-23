// cube.js
module.exports = {
  driverFactory: ({ dataSource }) => {
    const ds = dataSource || "default";

    // K
    if (ds === "default" || ds === "trino_mysql") {
      return {
        type: "trino",
        host: process.env.CUBEJS_DB_HOST,
        port: process.env.CUBEJS_DB_PORT,
        catalog: process.env.CUBEJS_DB_PRESTO_CATALOG || "mysql",
        schema: process.env.CUBEJS_DB_NAME || "ecommerce_bi",
        user: process.env.CUBEJS_DB_USER,
        ...(process.env.CUBEJS_DB_PASS
          ? { password: process.env.CUBEJS_DB_PASS }
          : {}),
        customHeaders: {
          "X-Trino-User": process.env.CUBEJS_DB_USER,
        },
      };
    }

    // giả lập kết nối với Postgres
    // if (ds === "postgres") {
    //   return {
    //     type: "postgres",
    //     host: process.env.PG_HOST,
    //     port: process.env.PG_PORT || 5432,
    //     database: process.env.PG_DB,
    //     user: process.env.PG_USER,
    //     password: process.env.PG_PASS,
    //   };
    // }

    throw new Error(`Unknown dataSource: ${ds}`);
  },
};
