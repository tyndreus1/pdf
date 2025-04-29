from flask import Flask, request, jsonify, render_template, send_from_directory
import sqlite3
import os
import json
from datetime import datetime
import uuid

app = Flask(__name__, static_folder='../static', template_folder='../')

# Veritabanı yolu
DB_PATH = os.path.join('database', 'invoice_app.db')

# Veritabanını başlat
def init_db():
    if not os.path.exists(os.path.dirname(DB_PATH)):
        os.makedirs(os.path.dirname(DB_PATH))
        
    with sqlite3.connect(DB_PATH) as conn:
        with open(os.path.join('database', 'schema.sql'), 'r') as f:
            conn.executescript(f.read())
            
# Satırları sözlüğe dönüştüren yardımcı fonksiyon
def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

# Ana sayfa
@app.route('/')
def index():
    return render_template('index.html')

# Statik dosyalar
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('../', path)

# API yolları
@app.route('/api/customers', methods=['GET'])
def get_customers():
    try:
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = dict_factory
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM customers ORDER BY name')
            customers = cursor.fetchall()
        return jsonify({'customers': customers})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/customers', methods=['POST'])
def add_customer():
    try:
        data = request.json
        with sqlite3.connect(DB_PATH) as conn:
            cursor = conn.cursor()
            cursor.execute(
                'INSERT INTO customers (name, address, email, phone, notes) VALUES (?, ?, ?, ?, ?)',
                (data['name'], data['address'], data['email'], data['phone'], data.get('notes', ''))
            )
            conn.commit()
            customer_id = cursor.lastrowid
        
        # Yeni oluşturulan müşteriyi getir
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = dict_factory
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM customers WHERE id = ?', (customer_id,))
            customer = cursor.fetchone()
            
        return jsonify({'customer': customer}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = dict_factory
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM products ORDER BY name')
            products = cursor.fetchall()
        return jsonify({'products': products})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/invoices', methods=['POST'])
def create_invoice():
    try:
        data = request.json
        
        # Benzersiz bir fatura numarası oluştur
        invoice_number = f"{data['type'][0].upper()}-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = dict_factory
            cursor = conn.cursor()
            
            # Faturayı ekle
            cursor.execute(
                '''INSERT INTO invoices 
                (invoice_number, type, customer_id, currency, subtotal, 
                discount_type, discount_amount, discount_total, advance_payment, 
                total, warranty, shipping, payment_terms, delivery_terms, extra_info)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                (
                    invoice_number, data['type'], data['customer']['id'], data['currency'],
                    data['subtotal'], data.get('discount_type'), data.get('discount_amount'),
                    data.get('discount_total'), data.get('advance_payment'), data['grandTotal'],
                    data.get('warranty'), data.get('shipping'), data.get('paymentTerms'),
                    data.get('deliveryTerms'), data.get('extraInfo')
                )
            )
            
            invoice_id = cursor.lastrowid
            
            # Fatura öğelerini ekle
            for item in data['items']:
                cursor.execute(
                    '''INSERT INTO invoice_items
                    (invoice_id, product_id, product_name, quantity, unit_price, total_price)
                    VALUES (?, ?, ?, ?, ?, ?)''',
                    (
                        invoice_id, item.get('productId'), item['name'],
                        item['quantity'], item['unitPrice'], item['totalPrice']
                    )
                )
            
            conn.commit()
            
            # Oluşturulan faturayı öğelerle birlikte getir
            cursor.execute('SELECT * FROM invoices WHERE id = ?', (invoice_id,))
            invoice = cursor.fetchone()
            
            cursor.execute('SELECT * FROM invoice_items WHERE invoice_id = ?', (invoice_id,))
            items = cursor.fetchall()
            
            invoice['items'] = items
            invoice['invoiceNumber'] = invoice_number
            
        return jsonify({'invoice': invoice}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Veritabanını başlat (eğer yoksa)
init_db()

# Demo verileri ekle
def add_demo_data():
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.cursor()
        
        # Tablo boş mu kontrol et
        cursor.execute('SELECT COUNT(*) FROM customers')
        customer_count = cursor.fetchone()[0]
        
        if customer_count == 0:
            # Demo müşterileri ekle
            customers = [
                ('Acme Corporation', '123 Main St, New York, NY 10001', 'info@acme.com', '+1 555-123-4567', ''),
                ('Globex Industries', '456 Tech Park, San Francisco, CA 94107', 'contact@globex.com', '+1 555-987-6543', ''),
                ('Stark Enterprises', '10880 Malibu Point, Malibu, CA 90265', 'info@stark.com', '+1 555-789-4561', ''),
                ('Wayne Enterprises', '1007 Mountain Drive, Gotham, NJ 07101', 'info@wayne.com', '+1 555-456-7890', ''),
                ('Umbrella Corporation', '857 Bristol Ave, Raccoon City, OH 43001', 'contact@umbrella.com', '+1 555-234-5678', '')
            ]
            
            for customer in customers:
                cursor.execute(
                    'INSERT INTO customers (name, address, email, phone, notes) VALUES (?, ?, ?, ?, ?)',
                    customer
                )
        
        # Ürün tablosu boş mu kontrol et
        cursor.execute('SELECT COUNT(*) FROM products')
        product_count = cursor.fetchone()[0]
        
        if product_count == 0:
            # Demo ürünleri ekle
            products = [
                ('Standart Makine', 'Temel işlemler için standart makine', 'images/product-placeholder.png'),
                ('Premium Makine', 'Gelişmiş özellikli premium makine', 'images/product-placeholder.png'),
                ('Ekonomik Model', 'Ekonomik çözüm', 'images/product-placeholder.png'),
                ('Endüstriyel Model', 'Ağır iş yükleri için', 'images/product-placeholder.png'),
                ('Kompakt Model', 'Küçük alanlar için özel tasarım', 'images/product-placeholder.png'),
                ('Profesyonel Seri', 'Profesyoneller için özel seri', 'images/product-placeholder.png')
            ]
            
            for product in products:
                cursor.execute(
                    'INSERT INTO products (name, description, image_path) VALUES (?, ?, ?)',
                    product
                )
        
        conn.commit()

# Demo verileri ekle
add_demo_data()

if __name__ == '__main__':
    app.run(debug=True)