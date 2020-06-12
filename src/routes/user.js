const express = require('express')
const router = new express.Router()
const User = require('../models/User.js')
const Inventory = require('../models/Inventory.js')
const Cart = require('../models/Cart.js')
const bcrypt = require('bcryptjs')
const passport = require('passport')

const { ensureLoggedIn, ensureNotLoggedIn } = require('../cfg/auth')

router.get('/done', ensureLoggedIn, (req, res) => res.send('DONE'))

router.get('/login', ensureNotLoggedIn, (req, res) => res.render('login', { error: req.flash('error') }))
router.get('/register', ensureNotLoggedIn, (req, res) => res.render('register'))

router.post('/register', ensureNotLoggedIn, (req, res) => {
    const { name, email, password, password2 } = req.body
    let errors = []
    if (!name || !email || !password || !password2) {
        errors.push({msg: 'Please fill all fields'})
    }

    if (password.length < 6) {
        errors.push({ msg: 'Password must be at least 6 characters long'})
    }

    if (password != password2) {
        errors.push({msg: 'Passwords do not match'})
    }
    if (errors.length > 0) {
        res.render('register', {
            errors,
            name,
            email
        })
    }
    else {
        User.findOne({ email })
            .then((user) => {
                if (user) {
                    errors.push({ msg: 'Such email is already registered' })
                    res.render('register', {
                        errors,
                        name,
                        email
                    })
                }
                else {
                    const newUser = new User({
                        name,
                        email,
                        password
                    })

                    bcrypt.genSalt(8, (err, salt) =>
                        bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if (err) throw err
                            newUser.password = hash
                            newUser.save()
                                .then(user => res.redirect('/user/login'))
                                .catch(err => console.log(err))
                        }))
                }
            })
    }
})

router.post('/login', ensureNotLoggedIn, (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/user/login',
        failureFlash: true
    })(req, res, next)
})

router.get('/logout', ensureLoggedIn, (req, res) => {
    req.logout()
    req.session.destroy()
    res.redirect('/user/login')
})

router.get('/profile', ensureLoggedIn, (req, res) => {
    Inventory.findOne({ user: req.user }).then(inventory => {
        if (inventory) {
            var cart = new Cart(inventory.cart)
            inventory.items = cart.generateArray()
        }
       

        res.render('profile', { inventory })
    }).catch(err => console.log(err))
    
})

router.post('/settings', ensureLoggedIn, (req, res) => {
    const { passwordOld, passwordNew, passwordNewRep, email, password } = req.body
    let errors = []
    if (req.body.Change == 1) {
        if (passwordOld === '' || passwordNew === '' || passwordNewRep === '') {
            errors.push({ msg: 'Please fill all fields' })
        } else {
            if (passwordNew.length < 6) {
                errors.push({ msg: 'Password must be at least 6 characters long' })
            }

            if (passwordNew != passwordNewRep) {
                errors.push({ msg: 'Passwords do not match' })
            }
        }
    } else if (req.body.Change == 2) {
        if (email === '' || password === '') {
            errors.push({ msg: 'Please fill all fields' })
        }
        
    }

    if (errors.length > 0) {
        return res.render('settings', {
            errors,
            
        })
    } else {
        User.findById( req.user.id )
            .then(user => {
                if (!user) {
                    return console.log('User not found')
                }
                if (req.body.Change == 1) {
                    bcrypt.compare(passwordOld, user.password, (err, isMatch) => {
                        if (err) throw err

                        if (isMatch) {
                            bcrypt.genSalt(8, (err, salt) =>
                                bcrypt.hash(passwordNew, salt, (err, hash) => {
                                    if (err) throw err
                                    user.password = hash;
                                    user.save()
                                        .then(user => res.render('settings', { success: 'Password changed!', user: req.user }))
                                        .catch(err => console.log(err))
                                }))
                        } else {
                            errors.push({ msg: 'Old password is incorrect' })
                            return res.render('settings', {
                                errors,
                                
                            })
                        }
                    })
                } else {
                    User.findOne({ email }).then(user2 => {
                        if (user2) {
                            errors.push({ msg: 'Email is already taken' })
                            return res.render('settings', {
                                errors,
                                
                            })
                        } else {
                            bcrypt.compare(password, user.password, (err, isMatch) => {
                                if (err) throw err

                                if (isMatch) {
                                    user.email = email;
                                    user.save()
                                        .then(user => res.render('settings', { success: 'Email changed!', user: req.user}))
                                        .catch(err => console.log(err))

                                } else {
                                    errors.push({ msg: 'Old password is incorrect' })
                                    return res.render('settings', {
                                        errors,
                                        
                                    })
                                }
                            })
                        }
                            
                    }).catch(err => console.log(err))
                    
                }
                
            })
            .catch(err => console.log(err))
    }

})

router.get('/settings', ensureLoggedIn, (req, res) => res.render('settings'))

router.get('/settings/add/:amount', ensureLoggedIn, (req, res) => {
    amount = Number(req.params.amount)
    User.findById(req.user.id).then(user => {
        user.coins += amount
        user.save().then(user => res.redirect('/user/settings')).catch(err => console.log(err))
    })

})

module.exports = router