// Cube configuration options: https://cube.dev/docs/config
/** @type{ import('@cubejs-backend/server-core').CreateOptions } */
module.exports = {
  driverFactory: ({ dataSource }) => {
    // If it's not the default dataSource, fall back to built-in resolution
    if (dataSource && dataSource !== "default") {
      return null;
    }
    // Resolve catalog and schema/name with backward compatibility
    const catalog =
      process.env.CUBEJS_DB_CATALOG || process.env.CUBEJS_DB_PRESTO_CATALOG;
    const schema = process.env.CUBEJS_DB_NAME || process.env.CUBEJS_DB_SCHEMA;

    if (!catalog || !schema) {
      throw new Error(
        `Missing required Cube.js env vars: CUBEJS_DB_CATALOG (${catalog}), CUBEJS_DB_NAME (${schema})`
      );
    }

    const config = {
      type: "trino",
      host: process.env.CUBEJS_DB_HOST,
      port: process.env.CUBEJS_DB_PORT,
      catalog,
      schema,
      user: process.env.CUBEJS_DB_USER,
      ...(process.env.CUBEJS_DB_PASS
        ? { password: process.env.CUBEJS_DB_PASS }
        : {}),
      customHeaders: {
        "X-Trino-User": process.env.CUBEJS_DB_USER,
      },
    };

    console.log("Final Trino config:", JSON.stringify(config, null, 2));
    return config;
  },
};
