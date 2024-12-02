// server.js
const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');

const app = express();
app.use(bodyParser.json());

let menuItems = [];
let orders = [];

// Endpoint to add or update menu items
app.post('/menu', (req, res) => {
    const { id, name, price, category } = req.body;

    // Validate input
    if (price <= 0 || !category) {
        return res.status(400).json({ error: "Invalid menu item data." });
    }

    // Add or update menu item
    const existingItemIndex = menuItems.findIndex(item => item.id === id);
    if (existingItemIndex > -1) {
        menuItems[existingItemIndex] = { id, name, price, category };
    } else {
        menuItems.push({ id, name, price, category });
    }

    res.status(200).json({ message: "Menu item added/updated successfully." });
});

// Endpoint to get menu items
app.get('/menu', (req, res) => {
    res.status(200).json(menuItems);
});

// Endpoint to place an order
app.post('/orders', (req, res) => {
    const { items } = req.body;

    // Validate order request
    if (!Array.isArray(items) || items.length === 0 || !items.every(itemId => menuItems.some(item => item.id === itemId))) {
        return res.status(400).json({ error: "Invalid order request." });
    }

    const orderId = orders.length + 1;
    const newOrder = { id: orderId, items, status: 'Preparing' };
    orders.push(newOrder);

    res.status(201).json({ message: "Order placed successfully.", orderId });
});

// Endpoint to get order details
app.get('/orders/:id', (req, res) => {
    const orderId = parseInt(req.params.id);
    const order = orders.find(o => o.id === orderId);

    if (!order) {
        return res.status(404).json({ error: "Order not found." });
    }

    res.status(200).json(order);
});

// CRON job to update order status periodically
cron.schedule('* * * * *', () => {
    orders.forEach(order => {
        if (order.status === 'Preparing') {
            order.status = 'Out for Delivery';
        } else if (order.status === 'Out for Delivery') {
            order.status = 'Delivered';
        }
    });
    console.log('Order statuses updated.');
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
