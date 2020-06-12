module.exports = function Cart(oldCart) {
    this.items = oldCart.items || {}
    this.totalQlty = oldCart.totalQlty || 0
    this.totalPrice = oldCart.totalPrice || 0

    this.add = function (item, id, qty = 1, price = 0) {
        var storedItem = this.items[id]
        if (!storedItem) {
            storedItem = this.items[id] = {item: item, qty:0, price:0}
        }
        storedItem.qty += qty
        storedItem.price = storedItem.item.price * storedItem.qty
        this.totalQlty += qty
        if (price == 0)
            this.totalPrice += storedItem.item.price
        else
            this.totalPrice +=price
    }

    this.reduceByOne = function (id) {
        this.items[id].qty--
        this.items[id].price -= this.items[id].item.price
        this.totalQlty--
        this.totalPrice -= this.items[id].item.price

        if (this.items[id].qty <= 0) {
            delete this.items[id]
        }
    }

    this.addCart = function (otherCart) {
        Array.prototype.forEach.call(otherCart.items, item => {
            this.add(item, item.id)
        })
    }

    this.removeItem = function (id) {
        this.totalQlty -= this.items[id].qty
        this.totalPrice -= this.items[id].price;
        delete this.items[id]
    }

    this.generateArray = function () {
        var arr = []
        for (var id in this.items) {
            arr.push(this.items[id])
        }
        return arr
    }
}