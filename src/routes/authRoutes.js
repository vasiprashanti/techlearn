// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authcontroller');
const { rateLimiter } = require('../middleware/rateLimiter');
const { validator, schemas } = require('../middleware/validation');


router.post('/login', 
    rateLimiter.login(),
    validator.validateBody(schemas.login),
    authController.login
);

router.post('/register', 
    validator.validateBody(schemas.register),
    authController.register
);

router.post('/logout', 
    authController.logout
);

router.post('/refresh-token', 
    authController.refreshToken
);

module.exports = router;