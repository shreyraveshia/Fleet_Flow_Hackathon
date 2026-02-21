import jwt from 'jsonwebtoken';

/**
 * Generates a signed JWT, sets it as an httpOnly cookie on the response,
 * and returns the raw token string.
 *
 * @param {import('express').Response} res
 * @param {string} userId - MongoDB _id of the user
 * @returns {string} signed JWT token
 */
const generateToken = (res, userId) => {
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });

    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('token', token, {
        httpOnly: true,
        secure: isProduction,         // HTTPS only in prod
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });

    return token;
};

export default generateToken;
