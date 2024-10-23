const http = require('http');
const fs = require('fs');
const path = require('path');

const productsFilePath = path.join(__dirname, 'products.json');

let products = [];
if (fs.existsSync(productsFilePath)) {
    const data = fs.readFileSync(productsFilePath);
    products = JSON.parse(data);
}

const requestHandler = (req, res) => {
    console.log(`Request received for: ${req.url}`);

    if (req.method === 'GET' && req.url === '/') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Erreur interne du serveur');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data);
        });

    } else if (req.method === 'POST' && req.url === '/add-product') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            const params = new URLSearchParams(body);
            const newProduct = {
                id: products.length + 1,
                name: params.get('name'),
                price: parseFloat(params.get('price')),
                description: params.get('description'),
                brand: params.get('brand')
            };
            products.push(newProduct);

            fs.writeFileSync(productsFilePath, JSON.stringify(products, null, 2));

            res.writeHead(302, { Location: '/products' });
            res.end();
        });

    } else if (req.method === 'GET' && req.url === '/products') {
        let productHtml = `
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <title>Liste des Produits</title>
            <style>
body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f0f0f0;
    margin: 0;
    padding: 20px;
    transition: background-color 0.3s, color 0.3s; 
}

.product-list {
    max-width: 900px;
    margin: 20px auto;
    background-color: #ffffff;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    transition: background-color 0.3s, color 0.3s; 
}

.product-list h1 {
    text-align: center;
    color: #007BFF;
    margin-bottom: 20px;
    font-size: 28px;
}

.search-bar {
    margin-bottom: 20px;
    text-align: center;
}

.search-bar input {
    padding: 10px;
    width: 80%;
    max-width: 400px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 16px;
}

table {
    width: 100%;
    border-collapse: collapse;
}

thead {
    background-color: #007BFF;
    color: white;
}

th, td {
    padding: 15px;
    text-align: left;
    border-bottom: 1px solid #ddd;
}

th {
    font-weight: bold;
    font-size: 16px;
}

td {
    font-size: 14px;
}

tbody tr:hover {
    background-color: #e1f5fe;
}

.delete-button, .update-button {
    border: none;
    padding: 8px 12px;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
}

.delete-button {
    background-color: #dc3545;
    color: white;
}

.delete-button:hover {
    background-color: #e15664;
}

.update-button {
    background-color: #28a745;
    color: white;
}

.update-button:hover {
    background-color: #218838;
}

.footer {
    text-align: center;
    margin-top: 20px;
}

.back-button {
    display: inline-block;
    margin-top: 20px;
    padding: 12px 20px;
    background-color: #28a745;
    color: white;
    text-decoration: none;
    border-radius: 5px;
    font-weight: bold;
    transition: background-color 0.3s, transform 0.2s;
}

.back-button:hover {
    background-color: #218838;
    transform: translateY(-2px);
}

.hidden {
    display: none;
}

.edit-form {
    margin-top: 10px;
}

input[type="text"],
input[type="number"] {
    padding: 10px;
    margin-right: 10px;
    margin-bottom: 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    width: calc(20% - 12px);
    font-size: 14px;
}

input[type="submit"] {
    background-color: #28a745;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
}

input[type="submit"]:hover {
    background-color: #218838;
}

#toggle-dark-mode {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px 15px;
    border: none;
    border-radius: 5px;
    background-color: #767f89;
    color: white;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s, transform 0.3s;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    z-index: 1000; 
}

#toggle-dark-mode i {
    margin-right: 5px; 
}

#toggle-dark-mode:hover {
    background-color: #303337; 
    transform: scale(1.05); 
}

.dark-mode {
    background-color: #1a1a1a;
    color: #f0f0f0;
}

.dark-mode .product-list {
    background-color: #333; 
}

.dark-mode #toggle-dark-mode {
    background-color: yellow; 
    color: black; 
}

.dark-mode #toggle-dark-mode:hover {
    background-color: #fbff00; 
}

.dark-mode thead {
    background-color: #007BFF; 
    color: white; 
}

.dark-mode tbody tr:hover {
    background-color: #555; 
}


.search-button {
    display: inline-flex;                 
    align-items: center;                  
    justify-content: center;              
    width: 30px;                          
    height: 30px;                         
    background-color: #007bff;           
    color: white;                         
    border: none;                         
    border-radius: 5px;                  
    cursor: pointer;                      
    transition: background-color 0.3s;   
}

.search-button:hover {
    background-color: #0056b3;           
}

.search-button i {
    font-size: 15px;                     
}

            </style>
        </head>
        <body>
            <div class="product-list">
                <h1>Liste des Produits</h1>
                <div class="search-bar">
    <input type="text" id="search" placeholder="Rechercher un produit..." onkeyup="filterProducts()">
<button class="search-button">
    <i class="fas fa-search"></i>
</button></div>
                <table id="product-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Libellé</th>
                            <th>Prix (€)</th>
                            <th>Description</th>
                            <th>Marque</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map(product => `
                            <tr id="product-${product.id}">
                                <td>${product.id}</td>
                                <td>${product.name}</td>
                                <td>${product.price.toFixed(2)}</td>
                                <td>${product.description}</td>
                                <td>${product.brand}</td>
                                <td>
                                    <button class="delete-button" onclick="deleteProduct(${product.id})">Supprimer</button>
                                    <button class="update-button" onclick="showUpdateForm(${product.id})">Modifier</button>
                                </td>
                            </tr>
                            <tr id="edit-form-${product.id}" class="hidden">
                                <td colspan="6">
                                    <form onsubmit="updateProduct(event, ${product.id})" class="edit-form">
                                        <input type="text" name="name" value="${product.name}" required>
                                        <input type="number" name="price" value="${product.price}" required>
                                        <input type="text" name="description" value="${product.description}" required>
                                        <input type="text" name="brand" value="${product.brand}" required>
                                        <input type="submit" value="Mettre à jour">
                                    </form>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <a href="/" class="back-button">Retour à l'accueil</a>
                <button id="toggle-dark-mode"><i class="fas fa-sun"></i></button>
            </div>
            <script>
                function filterProducts() {
                    const searchInput = document.getElementById('search').value.toLowerCase();
                    const rows = document.querySelectorAll('#product-table tbody tr:not(.hidden)');
                    rows.forEach(row => {
                        const cells = row.getElementsByTagName('td');
                        const productName = cells[1].textContent.toLowerCase();
                        if (productName.includes(searchInput)) {
                            row.style.display = '';
                        } else {
                            row.style.display = 'none';
                        }
                    });
                }

                function deleteProduct(id) {
                    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
                        const row = document.getElementById('product-' + id);
                        row.style.display = 'none'; 
                    }
                }

                function showUpdateForm(id) {
                    const form = document.getElementById('edit-form-' + id);
                    form.classList.toggle('hidden');
                }

                function updateProduct(event, id) {
                    event.preventDefault();
                    const form = event.target;
                    const updatedProduct = {
                        id: id,
                        name: form.name.value,
                        price: parseFloat(form.price.value),
                        description: form.description.value,
                        brand: form.brand.value
                    };
                    const row = document.getElementById('product-' + id);
                    row.cells[1].textContent = updatedProduct.name;
                    row.cells[2].textContent = updatedProduct.price.toFixed(2);
                    row.cells[3].textContent = updatedProduct.description;
                    row.cells[4].textContent = updatedProduct.brand;

                    showUpdateForm(id); 
                }

                document.getElementById('toggle-dark-mode').addEventListener('click', () => {
                    const buttonIcon = document.querySelector('#toggle-dark-mode i');
                    document.body.classList.toggle('dark-mode');
                    buttonIcon.classList.toggle('fa-sun');
                    buttonIcon.classList.toggle('fa-moon');
                });
            </script>
        </body>
        </html>
        `;
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(productHtml);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Page non trouvée');
    }
};

const server = http.createServer(requestHandler);
const PORT = 3000;

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
