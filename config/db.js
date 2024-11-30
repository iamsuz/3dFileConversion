'use strict';

const Sequelize = require('sequelize');
// let config = require('../../config/config');
const path = require('path');
const fs = require('fs');
// let env = config.db.env;

/**
 * Keeping dialect option optional using project environments
 */
let dialectOptions = {};

let db = {
  DATABASE_HOST: process.env.DATABASE_HOST || 'localhost', // or the socket path
  DATABASE_NAME: process.env.DATABASE_NAME || '3dCompression',
  DATABASE_USERNAME: process.env.DATABASE_USERNAME || 'compression',
  DATABASE_PASSWORD: process.env.DATABASE_PASSWORD || 'Co0kies!',
  DATABASE_PORT: process.env.DATABASE_PORT || 5432,
  DATABASE_DIALECT: process.env.DATABASE_DIALECT || 'postgres',
  NODE_ENV: process.env.NODE_ENV || 'development',
  SCHEMA: 'public',
};

const sequelize = new Sequelize(db.DATABASE_NAME, db.DATABASE_USERNAME, db.DATABASE_PASSWORD, {
  host: db.DATABASE_HOST,
  port: db.DATABASE_PORT,
  dialect: db.DATABASE_DIALECT,
  schema: db.SCHEMA,
  define: {
    underscored: true,
  },

  // Connection pooling
  pool: {
    max: 10,
    min: 0,
    idle: 200000,
    // @note https://github.com/sequelize/sequelize/issues/8133#issuecomment-359993057
    acquire: 60000,
  },

  dialectOptions: dialectOptions,

  // socketPath : env.SOCKET_PATH,
  // dialectOptions: env.DIALECT_OPTIONS
  //  logging: false
});