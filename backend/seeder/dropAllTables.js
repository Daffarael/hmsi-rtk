require('dotenv').config();
const sequelize = require('../config/database');

async function dropAllTables() {
    try {
        // Disable FK checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        // Get all tables
        const [tables] = await sequelize.query('SHOW TABLES');
        const tableKey = Object.keys(tables[0] || {})[0];

        // Drop each table
        for (const table of tables) {
            const tableName = table[tableKey];
            console.log(`Dropping table: ${tableName}`);
            await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);
        }

        // Re-enable FK checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('✅ All tables dropped successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

dropAllTables();
