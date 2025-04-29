// Lokal veritabanı için geliştirilmiş database.js
const InvoiceDB = {
    customers: {
        data: [],
        
        // Veriler tamamen local storage'da saklanacak
        init: function() {
            // LocalStorage'dan müşterileri yükle
            const storedCustomers = localStorage.getItem('invoice_customers');
            if (storedCustomers) {
                try {
                    this.data = JSON.parse(storedCustomers);
                    console.log(`${this.data.length} müşteri yüklendi.`);
                } catch (e) {
                    console.error("Müşteri verileri yüklenirken hata:", e);
                    this.data = this.getDefaultCustomers();
                    this.saveToStorage();
                }
            } else {
                // İlk kez çalıştırılıyorsa varsayılan veriler
                this.data = this.getDefaultCustomers();
                this.saveToStorage();
            }
        },
        
        // Varsayılan müşteriler
        getDefaultCustomers: function() {
            return [
                {
                    id: 1,
                    name: "Acme Corporation",
                    address: "123 Main St, Anytown, AT 12345",
                    email: "contact@acmecorp.com",
                    phone: "+1 (555) 123-4567",
                    notes: "Key account, requires special packaging."
                },
                {
                    id: 2,
                    name: "Global Industries Ltd.",
                    address: "456 Market Ave, Metropolis, MP 67890",
                    email: "orders@globalind.com",
                    phone: "+1 (555) 987-6543",
                    notes: ""
                }
            ];
        },
        
        // Local Storage'a kayıt
        saveToStorage: function() {
            localStorage.setItem('invoice_customers', JSON.stringify(this.data));
            console.log(`${this.data.length} müşteri kaydedildi.`);
        },
        
        getAll: function() {
            return this.data;
        },
        
        get: function(id) {
            return this.data.find(customer => customer.id === id);
        },
        
        add: function(customer) {
            const newId = this.data.length > 0 ? Math.max(...this.data.map(c => c.id)) + 1 : 1;
            const newCustomer = {
                id: newId,
                ...customer
            };
            this.data.push(newCustomer);
            this.saveToStorage();
            return newCustomer;
        },
        
        update: function(id, updatedCustomer) {
            const index = this.data.findIndex(customer => customer.id === id);
            if (index !== -1) {
                this.data[index] = {
                    id,
                    ...updatedCustomer
                };
                this.saveToStorage();
                return this.data[index];
            }
            return null;
        },
        
        delete: function(id) {
            const index = this.data.findIndex(customer => customer.id === id);
            if (index !== -1) {
                this.data.splice(index, 1);
                this.saveToStorage();
                return true;
            }
            return false;
        },
        
        // Toplu veri içe aktarma
        importData: function(jsonData) {
            try {
                this.data = JSON.parse(jsonData);
                this.saveToStorage();
                return true;
            } catch (e) {
                console.error("Veri içe aktarma hatası:", e);
                return false;
            }
        },
        
        // Veri dışa aktarma
        exportData: function() {
            return JSON.stringify(this.data, null, 2);
        }
    },
    
    products: {
        data: [],
        
        init: function() {
            const storedProducts = localStorage.getItem('invoice_products');
            if (storedProducts) {
                try {
                    this.data = JSON.parse(storedProducts);
                    console.log(`${this.data.length} ürün yüklendi.`);
                } catch (e) {
                    console.error("Ürün verileri yüklenirken hata:", e);
                    this.data = this.getDefaultProducts();
                    this.saveToStorage();
                }
            } else {
                this.data = this.getDefaultProducts();
                this.saveToStorage();
            }
        },
        
        getDefaultProducts: function() {
            return [
                {
                    id: 1,
                    name: "Industrial Mixer",
                    description: "Heavy duty industrial mixer for manufacturing",
                    image: "images/product1.jpg",
                    category: "Equipment"
                },
                {
                    id: 2,
                    name: "Pressure Sensor",
                    description: "High precision pressure sensor for industrial applications",
                    image: "images/product2.jpg",
                    category: "Components"
                }
            ];
        },
        
        saveToStorage: function() {
            localStorage.setItem('invoice_products', JSON.stringify(this.data));
            console.log(`${this.data.length} ürün kaydedildi.`);
        },
        
        getAll: function() {
            return this.data;
        },
        
        get: function(id) {
            return this.data.find(product => product.id === id);
        },
        
        add: function(product) {
            const newId = this.data.length > 0 ? Math.max(...this.data.map(p => p.id)) + 1 : 1;
            const newProduct = {
                id: newId,
                ...product
            };
            this.data.push(newProduct);
            this.saveToStorage();
            return newProduct;
        },
        
        update: function(id, updatedProduct) {
            const index = this.data.findIndex(product => product.id === id);
            if (index !== -1) {
                this.data[index] = {
                    id,
                    ...updatedProduct
                };
                this.saveToStorage();
                return this.data[index];
            }
            return null;
        },
        
        delete: function(id) {
            const index = this.data.findIndex(product => product.id === id);
            if (index !== -1) {
                this.data.splice(index, 1);
                this.saveToStorage();
                return true;
            }
            return false;
        },
        
        importData: function(jsonData) {
            try {
                this.data = JSON.parse(jsonData);
                this.saveToStorage();
                return true;
            } catch (e) {
                console.error("Veri içe aktarma hatası:", e);
                return false;
            }
        },
        
        exportData: function() {
            return JSON.stringify(this.data, null, 2);
        }
    },
    
    invoices: {
        data: [],
        
        init: function() {
            const storedInvoices = localStorage.getItem('invoice_invoices');
            if (storedInvoices) {
                try {
                    this.data = JSON.parse(storedInvoices);
                } catch (e) {
                    console.error("Fatura verileri yüklenirken hata:", e);
                    this.data = [];
                    this.saveToStorage();
                }
            }
        },
        
        saveToStorage: function() {
            localStorage.setItem('invoice_invoices', JSON.stringify(this.data));
        },
        
        getAll: function() {
            return this.data;
        },
        
        get: function(id) {
            return this.data.find(invoice => invoice.id === id);
        },
        
        add: function(invoice) {
            const newId = this.data.length > 0 ? Math.max(...this.data.map(i => i.id)) + 1 : 1;
            const newInvoice = {
                id: newId,
                ...invoice,
                createdAt: new Date().toISOString()
            };
            this.data.push(newInvoice);
            this.saveToStorage();
            return newInvoice;
        },
        
        update: function(id, updatedInvoice) {
            const index = this.data.findIndex(invoice => invoice.id === id);
            if (index !== -1) {
                this.data[index] = {
                    id,
                    ...updatedInvoice,
                    updatedAt: new Date().toISOString()
                };
                this.saveToStorage();
                return this.data[index];
            }
            return null;
        },
        
        delete: function(id) {
            const index = this.data.findIndex(invoice => invoice.id === id);
            if (index !== -1) {
                this.data.splice(index, 1);
                this.saveToStorage();
                return true;
            }
            return false;
        },
        
        importData: function(jsonData) {
            try {
                this.data = JSON.parse(jsonData);
                this.saveToStorage();
                return true;
            } catch (e) {
                console.error("Veri içe aktarma hatası:", e);
                return false;
            }
        },
        
        exportData: function() {
            return JSON.stringify(this.data, null, 2);
        }
    }
};

// database.js dosyasının sonunda eklenecek
// Veritabanını başlat
document.addEventListener('DOMContentLoaded', function() {
    console.log("Initializing database");
    InvoiceDB.customers.init();
    InvoiceDB.products.init();
    InvoiceDB.invoices.init();
    console.log("Database initialization complete");
});


