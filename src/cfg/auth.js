module.exports = {
    ensureLoggedIn: function (req, res, next) {
        if (req.isAuthenticated()) {
            return next()
        }
        res.redirect('/user/login')
    },

    ensureNotLoggedIn: function (req, res, next) {
        if (!req.isAuthenticated()) {
            return next()
        }
        res.redirect('/user/profile')
    }
}