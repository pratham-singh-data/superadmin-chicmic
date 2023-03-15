const { Router, } = require('express');
const { signup,
    login,
    update,
    getUser,
    setPermission,
    deleteUser, } = require('../controllers/profileControllers');
const { checkToken, } = require('../middleware/checkToken');

// eslint-disable-next-line new-cap
const router = Router();

router.post(`/signup`, signup);
router.post(`/login`, login);
router.post(`/update`, checkToken, update);
router.get(`/read/:id`, checkToken, getUser);
router.patch(`/setPermission`, checkToken, setPermission);
router.delete(`/remove/:id`, checkToken, deleteUser);

module.exports = router;

