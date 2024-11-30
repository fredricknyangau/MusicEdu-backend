const verifyAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Forbidden: Admins only' });
    }
    next();
};

const verifyUser = (req, res, next) => {
    if (req.user.role !== 'user') {
        return res.status(403).json({ msg: 'Forbidden: Users only' });
    }
    next();
};

module.exports = { verifyAdmin, verifyUser };
