require('dotenv').config();
const { Sequelize } = require('sequelize');

const isProduction = process.env.NODE_ENV === 'production';

// Support Railway MySQL variables or custom DB_* variables
const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE;
const dbUser = process.env.DB_USER || process.env.MYSQLUSER;
const dbPassword = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '';
const dbHost = process.env.DB_HOST || process.env.MYSQLHOST || 'localhost';
const dbPort = process.env.DB_PORT || process.env.MYSQLPORT || 3306;

// Determine if SSL is needed (default true for external prod like Aiven, false for local/Railway internal MySQL unless DB_SSL=true)
const enableSSL = process.env.DB_SSL === 'true' || 
    (isProduction && process.env.DB_SSL !== 'false' && !process.env.MYSQLHOST && !process.env.RAILWAY_ENVIRONMENT);

const commonOptions = {
    dialect: 'mysql',
    logging: isProduction ? false : console.log,
    timezone: '+07:00',
    ...(enableSSL && {
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    }),
    define: {
        timestamps: true,
        underscored: true,
        createdAt: 'dibuat_pada',
        updatedAt: 'diperbarui_pada'
    },
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
};

const sequelize = connectionUrl
    ? new Sequelize(connectionUrl, commonOptions)
    : new Sequelize(dbName, dbUser, dbPassword, {
        host: dbHost,
        port: dbPort,
        ...commonOptions
    });

module.exports = sequelize;
