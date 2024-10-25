const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

app.use(express.json());
app.use(express.static('public'));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

const productsFilePath = path.join(__dirname, 'products.json');
const usersFilePath = path.join(__dirname, 'users.json');
let products = [];
let users = [];

function loadData() {
    try {
        const productsData = fs.readFileSync(productsFilePath, 'utf8');
        products = JSON.parse(productsData);
        console.log('Products loaded successfully:', products.length, 'items');

        const usersData = fs.readFileSync(usersFilePath, 'utf8');
        users = JSON.parse(usersData);
        console.log('Users loaded successfully:', users.length, 'accounts');
    } catch (error) {
        console.log('Starting with empty arrays');
    }
}

loadData();

const verifyToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];
    if (!bearerHeader) return res.status(401).json({ message: 'Access denied' });
    
    const token = bearerHeader.split(' ')[1];
    try {
        const verified = jwt.verify(token, 'your-secret-key');
        req.user = verified;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

app.get('/products', (req, res) => {
    res.sendFile(path.join(__dirname, 'products.html'));
});

app.post('/api/auth/signup', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = {
            id: Date.now(),
            fullName: req.body.fullName,
            email: req.body.email,
            password: hashedPassword
        };
        
        users.push(newUser);
        saveUsers();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(400).json({ message: 'Invalid user data' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = users.find(u => u.email === email);
        
        if (user && await bcrypt.compare(password, user.password)) {
            const token = jwt.sign({ userId: user.id }, 'your-secret-key', { expiresIn: '24h' });
            res.json({ token });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(400).json({ message: 'Bad request' });
    }
});

app.get('/api/auth/verify', verifyToken, (req, res) => {
    const user = users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ email: user.email });
});

app.get('/api/products', verifyToken, (req, res) => {
    res.json(products);
});

app.post('/api/products', verifyToken, (req, res) => {
    try {
        const product = {
            ...req.body,
            id: Date.now()
        };
        products.push(product);
        saveProducts();
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: 'Invalid product data' });
    }
});

app.put('/api/products/:id', verifyToken, (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const index = products.findIndex(p => p.id === id);
        if (index === -1) return res.status(404).json({ message: 'Product not found' });
        
        products[index] = { ...products[index], ...req.body };
        saveProducts();
        res.json(products[index]);
    } catch (error) {
        res.status(400).json({ message: 'Bad request' });
    }
});

app.delete('/api/products/:id', verifyToken, (req, res) => {
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ message: 'Product not found' });
    
    products.splice(index, 1);
    saveProducts();
    res.sendStatus(204);
});

function saveProducts() {
    fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2));
}

function saveUsers() {
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
}

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
