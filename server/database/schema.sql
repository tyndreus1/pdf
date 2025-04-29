-- Müşteriler Tablosu
CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ürünler Tablosu
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    image_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Faturalar Tablosu
CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT NOT NULL,
    type TEXT NOT NULL,  -- 'invoice' veya 'proforma'
    customer_id INTEGER NOT NULL,
    currency TEXT NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    discount_type TEXT,  -- 'percentage' veya 'value' veya NULL (indirim yoksa)
    discount_amount DECIMAL(15,2),
    discount_total DECIMAL(15,2),
    advance_payment DECIMAL(15,2),
    total DECIMAL(15,2) NOT NULL,
    warranty TEXT,
    shipping TEXT,
    payment_terms TEXT,
    delivery_terms TEXT,
    extra_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers (id)
);

-- Fatura Öğeleri Tablosu
CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id INTEGER NOT NULL,
    product_id INTEGER,  -- Manuel girilen öğeler için NULL olabilir
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices (id),
    FOREIGN KEY (product_id) REFERENCES products (id)
);