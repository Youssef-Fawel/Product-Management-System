const http = require('http');
const fs = require('fs');
const path = require('path');

const productsFilePath = path.join(__dirname, 'products.json');
let products = [];

function loadProducts() {
    try {
        const data = fs.readFileSync(productsFilePath, 'utf8');
        products = JSON.parse(data);
        console.log('Products loaded successfully:', products.length, 'items');
    } catch (error) {
        products = [];
        console.log('Starting with empty products array');
    }
}

loadProducts();

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'GET' && req.url === '/') {
        serveFile('index.html', res);
    } else if (req.method === 'GET' && req.url === '/products') {
        serveFile('products.html', res);
    } else if (req.method === 'GET' && req.url === '/api/products') {
        handleGetProducts(res);
    } else if (req.method === 'POST' && req.url === '/api/products') {
        handleAddProduct(req, res);
    } else if (req.method === 'PUT' && req.url.startsWith('/api/products/')) {
        handleUpdateProduct(req, res);
    } else if (req.method === 'DELETE' && req.url.startsWith('/api/products/')) {
        handleDeleteProduct(req, res);
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

function serveFile(filename, res) {
    fs.readFile(path.join(__dirname, filename), (err, data) => {
        if (err) {
            res.writeHead(500);
            res.end('Server Error');
            return;
        }
        const contentType = filename.endsWith('.html') ? 'text/html' : 'text/plain';
        res.writeHead(200, { 'Content-Type': `${contentType}; charset=utf-8` });
        res.end(data);
    });
}

function handleAddProduct(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const product = JSON.parse(body);
            product.id = Date.now();
            products.push(product);
            saveProducts();
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(product));
        } catch (error) {
            res.writeHead(400);
            res.end('Invalid product data');
        }
    });
}

function handleGetProducts(res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(products));
}

function handleUpdateProduct(req, res) {
    const id = parseInt(req.url.split('/').pop());
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        try {
            const updatedProduct = JSON.parse(body);
            const index = products.findIndex(p => p.id === id);
            if (index === -1) {
                res.writeHead(404);
                res.end('Product not found');
                return;
            }
            products[index] = { ...products[index], ...updatedProduct };
            saveProducts();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(products[index]));
        } catch (err) {
            res.writeHead(400);
            res.end('Bad Request');
        }
    });
}

function handleDeleteProduct(req, res) {
    const id = parseInt(req.url.split('/').pop());
    const index = products.findIndex(p => p.id === id);
    if (index === -1) {
        res.writeHead(404);
        res.end('Product not found');
        return;
    }
    products.splice(index, 1);
    saveProducts();
    res.writeHead(204);
    res.end();
}

function saveProducts() {
    fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2));
}

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
