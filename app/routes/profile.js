const { Router, } = require('express');
const { signup, } = require('../controllers/profileControllers');

// eslint-disable-next-line new-cap
const router = Router();

router.post(`/signup`, signup);

module.exports = router;

