const express = require('express')
const router = new express.Router()
const Inventory = require('../models/Inventory.js')
const User = require('../models/User.js')
const Product = require('../models/Product.js')
const Cart = require('../models/Cart.js')

router.get('/', (req, res) => {
    Product.find(function (err, docs) {
        if (err)
            console.log(err)
        var productChunk = []
        var chunkSize = 4
        for (var i = 0; i < docs.length; i += chunkSize) {
            productChunk.push(docs.slice(i,i+chunkSize))
        }
        res.render('shop', { products: productChunk, error: req.flash('error'), success: req.flash('success') })
    })
})

router.get('/add-to-cart/:id', (req, res) => {
    var prodId = req.params.id
    var cart = new Cart(req.session.cart ? req.session.cart : {})

    Product.findById(prodId, function (err, prod) {
        if (err) {
            return res.redirect('/shop/')
        }

        cart.add(prod, prod.id)

        req.session.cart = cart
        req.flash('success', prod.title+' added to cart')
        res.redirect('/shop/')
    })
})

router.get('/reduce/:id', (req, res) => {
    var prodId = req.params.id
    var cart = new Cart(req.session.cart ? req.session.cart : {})

    cart.reduceByOne(prodId)
    req.session.cart = cart
    res.redirect('/shop/cart')
})

router.get('/remove/:id', (req, res) => {
    var prodId = req.params.id
    var cart = new Cart(req.session.cart ? req.session.cart : {})

    cart.removeItem(prodId)
    req.session.cart = cart
    res.redirect('/shop/cart')
})

router.get('/cart', (req, res) => {
    if (!req.session.cart) {
        return res.render('cart', { products: null, error: req.flash('error'), success:req.flash('success')})
    }

    var cart = new Cart(req.session.cart)
    res.render('cart', { products: cart.generateArray(), totalPrice: cart.totalPrice, error: req.flash('error'), success: req.flash('success')})
})

router.get('/checkout', (req, res) => {
    if (!req.session.cart)
        return res.redirect('/shop/')

    var cart = new Cart(req.session.cart)

    User.findById(req.user.id).then((user) => {
        if (user.coins - cart.totalPrice < 0) {
            req.flash('error', 'Not enough coins')
            return res.redirect('/shop/cart')
        }

        
        Inventory.findOne({ user }).then(inventory => {
            user.coins -= cart.totalPrice
            if (!inventory) {
                var inventory = new Inventory({
                user,
                cart,
                paymentId:1
            })
            inventory.save((err, result) => {
                user.save((err, result) =>{
                    req.flash('success', 'Successfully bought items')
                    req.session.cart = null
                    res.redirect('/shop/')
                })
                })
            }
            else {
                
                var userCart = new Cart(inventory.cart)
                
                cart.generateArray().forEach(item => {
                    userCart.add(item.item, item.item._id, item.qty, item.item.price*item.qty)
                })

                inventory.cart = userCart
                
                inventory.save((err, result) => {
                    req.flash('success', 'Successfully bought items')
                    req.session.cart = null
                    res.redirect('/shop/')
                })
            }
        }).catch(err=>console.log(err))
        
    })

})

module.exports = router