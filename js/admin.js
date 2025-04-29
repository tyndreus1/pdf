// admin.js - Yeni dosya
document.addEventListener('DOMContentLoaded', function() {
    // Admin panel initialization
    const adminApp = {
        init: function() {
            this.displayCustomers();
            this.displayProducts();
            this.bindEvents();
        },
        
        displayCustomers: function() {
            const customerTable = document.getElementById('customer-table-body');
            customerTable.innerHTML = '';
            
            const customers = InvoiceDB.customers.getAll();
            
            customers.forEach(customer => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${customer.id}</td>
                    <td><input type="text" class="form-control customer-name" data-id="${customer.id}" value="${customer.name}"></td>
                    <td><textarea class="form-control customer-address" data-id="${customer.id}">${customer.address}</textarea></td>
                    <td><input type="email" class="form-control customer-email" data-id="${customer.id}" value="${customer.email || ''}"></td>
                    <td><input type="text" class="form-control customer-phone" data-id="${customer.id}" value="${customer.phone || ''}"></td>
                    <td>
                        <button class="btn btn-sm btn-primary save-customer" data-id="${customer.id}">Kaydet</button>
                        <button class="btn btn-sm btn-danger delete-customer" data-id="${customer.id}">Sil</button>
                    </td>
                `;
                customerTable.appendChild(row);
            });
        },
        
        displayProducts: function() {
            const productTable = document.getElementById('product-table-body');
            productTable.innerHTML = '';
            
            const products = InvoiceDB.products.getAll();
            
            products.forEach(product => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${product.id}</td>
                    <td><input type="text" class="form-control product-name" data-id="${product.id}" value="${product.name}"></td>
                    <td><textarea class="form-control product-description" data-id="${product.id}">${product.description}</textarea></td>
                    <td><input type="text" class="form-control product-image" data-id="${product.id}" value="${product.image}"></td>
                    <td><input type="text" class="form-control product-category" data-id="${product.id}" value="${product.category}"></td>
                    <td>
                        <button class="btn btn-sm btn-primary save-product" data-id="${product.id}">Kaydet</button>
                        <button class="btn btn-sm btn-danger delete-product" data-id="${product.id}">Sil</button>
                    </td>
                `;
                productTable.appendChild(row);
            });
        },
        
        bindEvents: function() {
            // Save customer changes
            document.querySelectorAll('.save-customer').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.target.dataset.id);
                    const row = e.target.closest('tr');
                    
                    const updatedCustomer = {
                        name: row.querySelector(`.customer-name[data-id="${id}"]`).value,
                        address: row.querySelector(`.customer-address[data-id="${id}"]`).value,
                        email: row.querySelector(`.customer-email[data-id="${id}"]`).value,
                        phone: row.querySelector(`.customer-phone[data-id="${id}"]`).value
                    };
                    
                    InvoiceDB.customers.update(id, updatedCustomer);
                    alert('Müşteri başarıyla güncellendi!');
                });
            });
            
            // Delete customer
            document.querySelectorAll('.delete-customer').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    if (confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) {
                        const id = parseInt(e.target.dataset.id);
                        InvoiceDB.customers.delete(id);
                        this.displayCustomers();
                    }
                });
            });
            
            // Save product changes
            document.querySelectorAll('.save-product').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.target.dataset.id);
                    const row = e.target.closest('tr');
                    
                    const updatedProduct = {
                        name: row.querySelector(`.product-name[data-id="${id}"]`).value,
                        description: row.querySelector(`.product-description[data-id="${id}"]`).value,
                        image: row.querySelector(`.product-image[data-id="${id}"]`).value,
                        category: row.querySelector(`.product-category[data-id="${id}"]`).value
                    };
                    
                    InvoiceDB.products.update(id, updatedProduct);
                    alert('Ürün başarıyla güncellendi!');
                });
            });
            
            // Delete product
            document.querySelectorAll('.delete-product').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    if (confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
                        const id = parseInt(e.target.dataset.id);
                        InvoiceDB.products.delete(id);
                        this.displayProducts();
                    }
                });
            });
            
            // Add new customer
            document.getElementById('add-customer-form').addEventListener('submit', (e) => {
                e.preventDefault();
                
                const newCustomer = {
                    name: document.getElementById('new-customer-name').value,
                    address: document.getElementById('new-customer-address').value,
                    email: document.getElementById('new-customer-email').value,
                    phone: document.getElementById('new-customer-phone').value
                };
                
                InvoiceDB.customers.add(newCustomer);
                
                // Clear form and refresh display
                e.target.reset();
                this.displayCustomers();
            });
            
            // Add new product
            document.getElementById('add-product-form').addEventListener('submit', (e) => {
                e.preventDefault();
                
                const newProduct = {
                    name: document.getElementById('new-product-name').value,
                    description: document.getElementById('new-product-description').value,
                    image: document.getElementById('new-product-image').value,
                    category: document.getElementById('new-product-category').value
                };
                
                InvoiceDB.products.add(newProduct);
                
                // Clear form and refresh display
                e.target.reset();
                this.displayProducts();
            });
        }
    };
    
    // Initialize the admin panel
    adminApp.init();
});