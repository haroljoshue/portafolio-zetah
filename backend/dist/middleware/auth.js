"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_key_zetah_2026';
    jsonwebtoken_1.default.verify(token, jwtSecret, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido o expirado.' });
        }
        req.user = decoded;
        next();
    });
}
