const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcryptjs')

const User = require('../models/User.js')

module.exports = function (passport) {
    passport.use(new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
        User.findOne({ email: email })
            .then(user => {
                if (!user) {
                    return done(null, false, {message: 'That email does not exist'})
                }

                bcrypt.compare(password, user.password, (err, isMatch) => {
                    if (err) throw err

                    if (isMatch) {
                        return done(null, user)
                    } else {
                        return done(null, false, { message: 'Passwords do not match' })
                    }
                })
            })
            .catch(err=>console.log(err))
        })
    )

    passport.serializeUser((user, done)=> {
        done(null, user.id)
    })

    passport.deserializeUser((id, done)=> {
        User.findById(id,  (err, user)=> {
            done(err, user)
        })
    })
}