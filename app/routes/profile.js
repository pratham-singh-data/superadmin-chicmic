const { Router, } = require('express');
const { signup, login, update, } = require('../controllers/profileControllers');

// eslint-disable-next-line new-cap
const router = Router();

router.post(`/signup`, signup);
router.post(`/login`, login);
router.post(`/update`, update);

module.exports = router;

