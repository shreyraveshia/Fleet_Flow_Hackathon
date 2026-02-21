import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { ApiError, ApiResponse } from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

// ─── Private Helpers ──────────────────────────────────────────────────────────

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};

/**
 * Send token in httpOnly cookie + JSON response
 */
const sendTokenResponse = (res, statusCode, user) => {
    const token = generateToken(user._id);

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    // Strip password from user object
    const userObj = user.toObject ? user.toObject() : { ...user };
    delete userObj.password;

    res.status(statusCode).cookie('token', token, cookieOptions).json({
        success: true,
        data: { token, user: userObj },
        message: statusCode === 201 ? 'Registration successful' : 'Login successful',
    });
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    // Check all fields present
    if (!name || !email || !password || !role) {
        throw new ApiError(400, 'Please provide name, email, password, and role');
    }

    // Validate role
    const validRoles = ['fleet_manager', 'dispatcher', 'safety_officer', 'financial'];
    if (!validRoles.includes(role)) {
        throw new ApiError(400, `Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    // Check email not already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        throw new ApiError(400, 'Email is already registered');
    }

    // Create user (password auto-hashed by model pre-save hook)
    const user = await User.create({ name, email, password, role });

    sendTokenResponse(res, 201, user);
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, 'Please provide email and password');
    }

    // Find user WITH password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
        throw new ApiError(401, 'Invalid email or password');
    }

    if (!user.isActive) {
        throw new ApiError(401, 'Account deactivated, contact admin');
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new ApiError(401, 'Invalid email or password');
    }

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(res, 200, user);
});

/**
 * @desc    Logout user — clear cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = asyncHandler(async (req, res) => {
    res.cookie('token', 'none', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        expires: new Date(0), // Expire immediately
    });

    res.status(200).json({
        success: true,
        data: null,
        message: 'Logged out successfully',
    });
});

/**
 * @desc    Get current logged-in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.status(200).json({
        success: true,
        data: user,
        message: 'User fetched successfully',
    });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        throw new ApiError(400, 'Please provide current password and new password');
    }

    if (newPassword.length < 6) {
        throw new ApiError(400, 'New password must be at least 6 characters');
    }

    // Find user WITH password
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    // Compare current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
        throw new ApiError(400, 'Current password is incorrect');
    }

    // Set new password (model pre-save will hash it)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
        success: true,
        data: null,
        message: 'Password changed successfully',
    });
});

/**
 * @desc    Update profile (name, avatar only)
 * @route   PUT /api/auth/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res) => {
    const { name, avatar } = req.body;

    const fieldsToUpdate = {};
    if (name !== undefined) fieldsToUpdate.name = name;
    if (avatar !== undefined) fieldsToUpdate.avatar = avatar;

    if (Object.keys(fieldsToUpdate).length === 0) {
        throw new ApiError(400, 'Please provide at least one field to update (name or avatar)');
    }

    const user = await User.findByIdAndUpdate(req.user._id, fieldsToUpdate, {
        new: true,
        runValidators: true,
    });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    res.status(200).json({
        success: true,
        data: user,
        message: 'Profile updated successfully',
    });
});
