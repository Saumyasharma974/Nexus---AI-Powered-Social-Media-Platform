import jwt from 'jsonwebtoken';

/**
 * Generates a signed JWT token for a user.
 * @param {string} id - MongoDB user ID
 * @returns {string} Signed JWT token
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

export default generateToken;
