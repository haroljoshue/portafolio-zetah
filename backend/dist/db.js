"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
const pg_1 = __importDefault(require("pg"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load env variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../.env') });
const { Pool } = pg_1.default;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('DATABASE_URL is not defined in the environment variables!');
    process.exit(1);
}
exports.pool = new Pool({
    connectionString,
    ssl: false // Disable SSL for local database connection
});
exports.pool.on('connect', (client) => {
    client.query("SET client_encoding TO 'UTF8'")
        .catch(err => console.error('Error setting client encoding to UTF8', err));
});
exports.pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
    process.exit(-1);
});
