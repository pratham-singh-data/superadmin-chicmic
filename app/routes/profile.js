const { Router, } = require('express');
const { signup, login, update, } = require('../controllers/profileControllers');
const { checkToken, } = require('../middleware/checkToken');

// eslint-disable-next-line new-cap
const router = Router();

router.post(`/signup`, signup);
router.post(`/login`, login);
router.post(`/update`, checkToken, update);

module.exports = router;

