// Veri Yönetimi için JavaScript modülü
document.addEventListener('DOMContentLoaded', function() {
    console.log("Database Manager loaded");
    
    // Veri yönetimi için gerekli öğeleri bulma
    const dbManagerBtn = document.getElementById('show-db-manager');
    if (!dbManagerBtn) {
        console.error("Database manager button not found");
        return; // Buton yoksa işleme gerek yok
    }
    
    console.log("Setting up database manager");
    
    // İlgili DOM elementlerini tanımla
    const dbModalElement = document.getElementById('database-modal');
    const dbModal = new bootstrap.Modal(dbModalElement);
    const customerTableBody = document.getElementById('customer-table-body');
    const productTableBody = document.getElementById('product-table-body');
    const addCustomerBtn = document.getElementById('add-new-customer');
    const addProductBtn = document.getElementById('add-new-product');
    
    // Müşteri düzenleme modalı
    const editCustomerModalElement = document.getElementById('edit-customer-modal');
    const customerModal = new bootstrap.Modal(editCustomerModalElement);
    const customerForm = document.getElementById('customer-form');
    const customerIdInput = document.getElementById('customer-id');
    const customerNameInput = document.getElementById('edit-customer-name'); // ID değişti
    const customerAddressInput = document.getElementById('edit-customer-address'); // ID değişti
    const customerEmailInput = document.getElementById('edit-customer-email'); // ID değişti
    const customerPhoneInput = document.getElementById('edit-customer-phone'); // ID değişti
    const customerNotesInput = document.getElementById('edit-customer-notes'); // ID değişti
    const saveCustomerBtn = document.getElementById('save-customer');
    
    // Ürün düzenleme modalı
    const editProductModalElement = document.getElementById('edit-product-modal');
    const productModal = new bootstrap.Modal(editProductModalElement);
    const productForm = document.getElementById('product-form');
    const productIdInput = document.getElementById('product-id');
    const productNameInput = document.getElementById('edit-product-name'); // ID değişti
    const productDescInput = document.getElementById('edit-product-description'); // ID değişti
    const productImageInput = document.getElementById('edit-product-image'); // ID değişti
    const productCategoryInput = document.getElementById('edit-product-category'); // ID değişti
    const saveProductBtn = document.getElementById('save-product');
    
    // Yedekleme/Geri yükleme
    const exportAllBtn = document.getElementById('export-all-data');
    const exportCustomersBtn = document.getElementById('export-customers');
    const exportProductsBtn = document.getElementById('export-products');
    const importFileInput = document.getElementById('import-file');
    const importDataBtn = document.getElementById('import-data');
    
    // Veri yönetimi modalını açma
    dbManagerBtn.addEventListener('click', function() {
        console.log("Database manager button clicked");
        refreshCustomerTable();
        refreshProductTable();
        dbModal.show();
    });
    
    // Modalın gösterildiği anda tabloları yenile
    dbModalElement.addEventListener('shown.bs.modal', function () {
        console.log("Modal shown, refreshing tables");
        refreshCustomerTable();
        refreshProductTable();
    });
    
    // Müşteri tablosunu güncelleme
    function refreshCustomerTable() {
        console.log("Refreshing customer table");
        
        if (!customerTableBody) {
            console.error("Customer table body not found");
            return;
        }
        
        customerTableBody.innerHTML = '';
        
        if (!InvoiceDB || !InvoiceDB.customers) {
            console.error("InvoiceDB or InvoiceDB.customers not available");
            customerTableBody.innerHTML = `<tr><td colspan="6" class="text-center">Veritabanı erişimi sağlanamadı.</td></tr>`;
            return;
        }
        
        const customers = InvoiceDB.customers.getAll();
        console.log(`Found ${customers.length} customers`);
        
        if (customers.length === 0) {
            customerTableBody.innerHTML = `<tr><td colspan="6" class="text-center">Henüz müşteri eklenmemiş.</td></tr>`;
            return;
        }
        
        customers.forEach(customer => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${customer.id}</td>
                <td>${escapeHtml(customer.name)}</td>
                <td>${escapeHtml(customer.address)}</td>
                <td>${escapeHtml(customer.email || '')}</td>
                <td>${escapeHtml(customer.phone || '')}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-customer" data-id="${customer.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-customer ms-2" data-id="${customer.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            customerTableBody.appendChild(row);
        });
        
        // Düzenleme ve silme butonlarına olaylar ekleme
        document.querySelectorAll('.edit-customer').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                editCustomer(id);
            });
        });
        
        document.querySelectorAll('.delete-customer').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                deleteCustomer(id);
            });
        });
    }
    
    // Ürün tablosunu güncelleme
    function refreshProductTable() {
        console.log("Refreshing product table");
        
        if (!productTableBody) {
            console.error("Product table body not found");
            return;
        }
        
        productTableBody.innerHTML = '';
        
        if (!InvoiceDB || !InvoiceDB.products) {
            console.error("InvoiceDB or InvoiceDB.products not available");
            productTableBody.innerHTML = `<tr><td colspan="6" class="text-center">Veritabanı erişimi sağlanamadı.</td></tr>`;
            return;
        }
        
        const products = InvoiceDB.products.getAll();
        console.log(`Found ${products.length} products`);
        
        if (products.length === 0) {
            productTableBody.innerHTML = `<tr><td colspan="6" class="text-center">Henüz ürün eklenmemiş.</td></tr>`;
            return;
        }
        
        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${escapeHtml(product.name)}</td>
                <td>${escapeHtml(product.description)}</td>
                <td>${escapeHtml(product.image)}</td>
                <td>${escapeHtml(product.category || '')}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-product" data-id="${product.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-product ms-2" data-id="${product.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            productTableBody.appendChild(row);
        });
        
        // Düzenleme ve silme butonlarına olaylar ekleme
        document.querySelectorAll('.edit-product').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                editProduct(id);
            });
        });
        
        document.querySelectorAll('.delete-product').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                deleteProduct(id);
            });
        });
    }
    
    // Müşteri düzenleme
    function editCustomer(id) {
        console.log(`Editing customer ${id}`);
        const customer = InvoiceDB.customers.get(id);
        if (customer) {
            document.getElementById('customer-modal-title').textContent = 'Müşteri Düzenle';
            customerIdInput.value = customer.id;
            customerNameInput.value = customer.name || '';
            customerAddressInput.value = customer.address || '';
            customerEmailInput.value = customer.email || '';
            customerPhoneInput.value = customer.phone || '';
            customerNotesInput.value = customer.notes || '';
            customerModal.show();
        }
    }
    
    // Yeni müşteri ekleme
    if (addCustomerBtn) {
        addCustomerBtn.addEventListener('click', function() {
            console.log("Add new customer clicked");
            document.getElementById('customer-modal-title').textContent = 'Yeni Müşteri Ekle';
            customerForm.reset();
            customerIdInput.value = '';
            customerModal.show();
        });
    }
    
    // Müşteri kaydetme
    if (saveCustomerBtn) {
        saveCustomerBtn.addEventListener('click', function() {
            console.log("Save customer clicked");
            // Form doğrulama
            if (!customerNameInput.value || !customerAddressInput.value) {
                alert('İsim ve adres alanları zorunludur!');
                return;
            }
            
            const customerData = {
                name: customerNameInput.value,
                address: customerAddressInput.value,
                email: customerEmailInput.value,
                phone: customerPhoneInput.value,
                notes: customerNotesInput.value
            };
            
            const id = customerIdInput.value ? parseInt(customerIdInput.value) : null;
            
            if (id) {
                // Mevcut müşteriyi güncelleme
                InvoiceDB.customers.update(id, customerData);
            } else {
                // Yeni müşteri ekleme
                InvoiceDB.customers.add(customerData);
            }
            
            customerModal.hide();
            refreshCustomerTable();
        });
    }
    
    // Müşteri silme
    function deleteCustomer(id) {
        if (confirm('Bu müşteriyi silmek istediğinize emin misiniz?')) {
            console.log(`Deleting customer ${id}`);
            InvoiceDB.customers.delete(id);
            refreshCustomerTable();
        }
    }
    
    // Ürün düzenleme
    function editProduct(id) {
        console.log(`Editing product ${id}`);
        const product = InvoiceDB.products.get(id);
        if (product) {
            document.getElementById('product-modal-title').textContent = 'Ürün Düzenle';
            productIdInput.value = product.id;
            productNameInput.value = product.name || '';
            productDescInput.value = product.description || '';
            productImageInput.value = product.image || '';
            productCategoryInput.value = product.category || '';
            productModal.show();
        }
    }
    
    // Yeni ürün ekleme
    if (addProductBtn) {
        addProductBtn.addEventListener('click', function() {
            console.log("Add new product clicked");
            document.getElementById('product-modal-title').textContent = 'Yeni Ürün Ekle';
            productForm.reset();
            productIdInput.value = '';
            productImageInput.value = 'images/product.jpg'; // Varsayılan değer
            productModal.show();
        });
    }
    
    // Ürün kaydetme
    if (saveProductBtn) {
        saveProductBtn.addEventListener('click', function() {
            console.log("Save product clicked");
            // Form doğrulama
            if (!productNameInput.value || !productDescInput.value) {
                alert('Ürün adı ve açıklama alanları zorunludur!');
                return;
            }
            
            const productData = {
                name: productNameInput.value,
                description: productDescInput.value,
                image: productImageInput.value,
                category: productCategoryInput.value
            };
            
            const id = productIdInput.value ? parseInt(productIdInput.value) : null;
            
            if (id) {
                // Mevcut ürünü güncelleme
                InvoiceDB.products.update(id, productData);
            } else {
                // Yeni ürün ekleme
                InvoiceDB.products.add(productData);
            }
            
            productModal.hide();
            refreshProductTable();
        });
    }
    
    // Ürün silme
    function deleteProduct(id) {
        if (confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
            console.log(`Deleting product ${id}`);
            InvoiceDB.products.delete(id);
            refreshProductTable();
        }
    }
    
    // Tüm verileri dışa aktarma
    if (exportAllBtn) {
        exportAllBtn.addEventListener('click', function() {
            console.log("Exporting all data");
            const data = {
                customers: InvoiceDB.customers.getAll(),
                products: InvoiceDB.products.getAll(),
                invoices: InvoiceDB.invoices.getAll()
            };
            
            downloadJSON(data, 'invoice-data-backup.json');
        });
    }
    
    // Yalnızca müşterileri dışa aktarma
    if (exportCustomersBtn) {
        exportCustomersBtn.addEventListener('click', function() {
            console.log("Exporting customers");
            downloadJSON(InvoiceDB.customers.getAll(), 'invoice-customers.json');
        });
    }
    
    // Yalnızca ürünleri dışa aktarma
    if (exportProductsBtn) {
        exportProductsBtn.addEventListener('click', function() {
            console.log("Exporting products");
            downloadJSON(InvoiceDB.products.getAll(), 'invoice-products.json');
        });
    }
    
    // JSON verilerini indirme yardımcı fonksiyonu
    function downloadJSON(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    // İçe aktarma dosyası seçimi
    if (importFileInput) {
        importFileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                importDataBtn.disabled = false;
            } else {
                importDataBtn.disabled = true;
            }
        });
    }
    
    // Verileri içe aktarma
    if (importDataBtn) {
        importDataBtn.addEventListener('click', function() {
            console.log("Importing data");
            const file = importFileInput.files[0];
            if (!file) {
                alert('Lütfen bir JSON dosyası seçin!');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Hangi verilerin yükleneceğini kontrol et
                    if (Array.isArray(data)) {
                        // Dosya sadece dizi içeriyorsa, müşteriler veya ürünler olabilir
                        const firstItem = data[0];
                        if (firstItem && (firstItem.hasOwnProperty('email') || firstItem.hasOwnProperty('address'))) {
                            // Muhtemelen müşteri verisi
                            InvoiceDB.customers.importData(JSON.stringify(data));
                            refreshCustomerTable();
                            alert('Müşteri verileri başarıyla içe aktarıldı!');
                        } else if (firstItem && (firstItem.hasOwnProperty('description') || firstItem.hasOwnProperty('image'))) {
                            // Muhtemelen ürün verisi
                            InvoiceDB.products.importData(JSON.stringify(data));
                            refreshProductTable();
                            alert('Ürün verileri başarıyla içe aktarıldı!');
                        } else {
                            alert('Veri formatı tanımlanamadı!');
                        }
                    } else {
                        // Nesne verisi, muhtemelen tam yedekleme
                        if (data.customers && Array.isArray(data.customers)) {
                            InvoiceDB.customers.importData(JSON.stringify(data.customers));
                            refreshCustomerTable();
                        }
                        
                        if (data.products && Array.isArray(data.products)) {
                            InvoiceDB.products.importData(JSON.stringify(data.products));
                            refreshProductTable();
                        }
                        
                        if (data.invoices && Array.isArray(data.invoices)) {
                            InvoiceDB.invoices.importData(JSON.stringify(data.invoices));
                        }
                        
                        alert('Veriler başarıyla içe aktarıldı!');
                    }
                    
                    // Dosya seçimini sıfırla
                    importFileInput.value = '';
                    importDataBtn.disabled = true;
                    
                } catch (error) {
                    console.error('Veri içe aktarma hatası:', error);
                    alert('Dosya içe aktarılırken bir hata oluştu. Doğru bir JSON dosyası seçtiğinize emin olun.');
                }
            };
            reader.readAsText(file);
        });
    }
    
    // HTML öğelerini güvenli şekilde manipüle etmek için
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    console.log("Database manager setup completed");
});