// Invoice Generator Ana Uygulaması
document.addEventListener('DOMContentLoaded', function() {
    console.log("Document loaded - Versiyon 5.1 (Modified v2)"); // Indicate modified version
    
    // InvoiceDB kontrolü
    if (typeof InvoiceDB === 'undefined') {
        console.error("HATA: InvoiceDB bulunamadı! database.js yüklenmemiş olabilir.");
        alert("Veritabanı modülü yüklenemedi. Lütfen sayfayı yenileyin ve tekrar deneyin.");
        return;
    }
    
    // Global değişkenler
    let currentStep = 1;
    const totalSteps = 9;
    
    // Seçilen değerler
    const invoice = {
        type: '',
        currency: '',
        customer: null,
        products: [], // Stores { id, name, description, category, quantity }
        prices: {}, // Stores { productId: price }
        discount: {
            apply: false,
            type: 'percentage', // 'percentage' or 'value'
            amount: 0, // The input amount (e.g., 10 for 10% or 10 for $10)
            value: 0 // The calculated discount value in the invoice currency
        },
        advancePayment: {
            apply: false,
            amount: 0
        },
        warranty: '1 year',
        shipping: 'included',
        paymentTerms: '',
        deliveryTerms: '',
        extraInfo: ''
    };
    
    // Para birimi sembolleri
    const currencySymbols = {
        'USD': '$',
        'EUR': '€',
        'TL': '₺'
    };
    
    // DOM elementleri
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progressBar = document.querySelector('.progress-bar');
    const currentStepEl = document.querySelector('.current-step');
    const totalStepsEl = document.querySelector('.total-steps');
    
    // Modal nesneleri (Initialized using Bootstrap's JS)
    let quantityModalInstance = null; // Initialize later
    let successModalInstance = null; // Initialize later
    const quantityModalEl = document.getElementById('quantity-modal');
    const successModalEl = document.getElementById('success-modal');
    if (quantityModalEl) {
        quantityModalInstance = new bootstrap.Modal(quantityModalEl);
    }
    if (successModalEl) {
        successModalInstance = new bootstrap.Modal(successModalEl);
    }

    // Ürün seçim modal değişkenleri
    let selectedProductForModal = null;
    
    // Uygulama başlatma
    function initApp() {
        console.log("App initialized");
        
        // Toplam adım sayısını ayarla
        if (totalStepsEl) totalStepsEl.textContent = totalSteps;
        
        // Event listeners
        bindNavigationEvents();
        bindStepEvents();
        
        // İlk adımı göster
        showStep(currentStep);
    }
    
    // Navigasyon butonlarına event listener ekleme
    function bindNavigationEvents() {
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                if (currentStep > 1) {
                    showStep(currentStep - 1);
                }
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                 if (validateStep(currentStep)) { // Validate *before* moving
                    if (currentStep < totalSteps) {
                        showStep(currentStep + 1);
                    } else {
                        // Son adım, butona basıldığında finalize etme (artık save butonuna taşındı)
                        // finalizeInvoice(); // Finalize is now triggered by the dedicated button in step 9
                        console.log("Finalize button should be used in Step 9.");
                    }
                 }
            });
        }
    }
    
    // Adımları değiştirme ve UI güncelleme
    function showStep(stepNumber) {
        // Mevcut adımı gizle
        document.querySelectorAll('.step-container').forEach(step => {
            step.classList.remove('active-step');
        });
        
        // Yeni adımı göster
        const newStep = document.getElementById(`step-${stepNumber}`);
        if (newStep) {
            newStep.classList.add('active-step');
        } else {
            console.error(`Step container not found for step ${stepNumber}`);
            return; // Stop if step container doesn't exist
        }
        
        // Güncellenen adımı kaydet
        currentStep = stepNumber;
        
        // Navigasyon butonlarını güncelle
        updateNavigationButtons();
        
        // İlerleme çubuğunu güncelle
        updateProgressBar();
        
        // Adım içeriğini güncelle (ihtiyaç duyulan verileri yükle vb.)
        updateStepContent(stepNumber);
        
        console.log(`Step changed to: ${stepNumber}`);
    }
    
    // Navigasyon butonlarını güncelleme
    function updateNavigationButtons() {
        if (prevBtn) {
            prevBtn.disabled = currentStep === 1;
        }
        
        if (nextBtn) {
             // Show/hide Next button based on step
             // nextBtn.style.display = currentStep === totalSteps ? 'none' : ''; // Hide on last step
             nextBtn.innerHTML = currentStep === totalSteps ? 'Finalize <i class="fas fa-check ms-2"></i>' : 'Next <i class="fas fa-arrow-right ms-2"></i>';
             nextBtn.disabled = currentStep === totalSteps; // Disable Next on last step, use dedicated buttons
        }
        
        // Güncel adım sayısını güncelle
        if (currentStepEl) {
            currentStepEl.textContent = currentStep;
        }
    }
    
    // İlerleme çubuğunu güncelleme
    function updateProgressBar() {
        if (progressBar) {
            const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
            progressBar.style.width = `${progress}%`;
            progressBar.setAttribute('aria-valuenow', progress);
        }
    }
    
    // Adım içeriklerini güncelleme (Veri yükleme vb.)
    function updateStepContent(stepNumber) {
        console.log(`Updating content for step ${stepNumber}`);
        switch (stepNumber) {
            case 1:
                // Fatura tipi seçimi - sadece vurgulamayı kontrol et
                highlightSelectedCard('invoice type', invoice.type);
                break;
            case 2:
                // Para birimi seçimi - sadece vurgulamayı kontrol et
                highlightSelectedCard('currency', invoice.currency);
                break;
            case 3:
                // Müşteri seçimi
                loadCustomers(); // Load or reload customer list
                break;
            case 4:
                // Ürün seçimi
                renderProductList(); // Load/reload products into categories
                setupProductSearch(); // Re-bind search listener
                activateProductTabs(); // Ensure the first tab is active and listeners are good
                updateSelectedProductsTable(); // Update the table of already selected products
                break;
            case 5:
                // Fiyat belirleme
                renderPriceTable();
                break;
            case 6:
                // İndirim
                updateDiscountSection(); // Recalculate and display discount info
                break;
            case 7:
                // Avans ödemesi
                updateAdvanceSection(); // Recalculate and display advance/total info
                break;
            case 8:
                // Ek bilgiler - Form elemanlarındaki değerleri invoice objesine yansıt
                // (Bu genellikle input/change event'lerinde yapılır, ama burada tekrar kontrol edilebilir)
                invoice.warranty = document.getElementById('warranty-period')?.value || '1 year';
                invoice.shipping = document.getElementById('shipping-included')?.value || 'included';
                invoice.paymentTerms = document.getElementById('payment-terms')?.value || '';
                invoice.deliveryTerms = document.getElementById('delivery-terms')?.value || '';
                invoice.extraInfo = document.getElementById('extra-info')?.value || '';
                break;
            case 9:
                // Önizleme
                renderInvoicePreview(); // Generate the preview HTML
                break;
        }
    }
    
    // Bootstrap 5 tab sistemini düzgün çalıştırmak için yardımcı fonksiyon
    function activateProductTabs() {
        console.log("Ensuring product tabs are correctly initialized...");
        
        const firstTabButton = document.querySelector('#productCategoryTabs .nav-link'); // Get the first tab button
        const firstTabPaneId = firstTabButton?.getAttribute('data-bs-target'); // Get its target pane ID (e.g., '#all-products')
        const firstTabPane = firstTabPaneId ? document.querySelector(firstTabPaneId) : null;

        // Check if the first tab is already active
        if (firstTabButton && firstTabPane && !firstTabButton.classList.contains('active')) {
            console.log("First product tab is not active, activating it.");

             // Deactivate all other tabs and panes first
            document.querySelectorAll('#productCategoryTabs .nav-link').forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
             document.querySelectorAll('#productCategoryTabContent .tab-pane').forEach(pane => {
                pane.classList.remove('show', 'active');
             });

            // Activate the first tab and its pane
            firstTabButton.classList.add('active');
            firstTabButton.setAttribute('aria-selected', 'true');
            firstTabPane.classList.add('show', 'active');

        } else if (!firstTabButton || !firstTabPane) {
             console.warn("Could not find the first product tab or its pane to activate.");
        } else {
            console.log("First product tab is already active or initialization seems correct.");
            // Ensure the corresponding pane is also visible (sometimes needed if manually hidden)
            if(firstTabButton.classList.contains('active') && !firstTabPane.classList.contains('show')){
                 firstTabPane.classList.add('show', 'active');
            }
        }
    }

    // Adım doğrulama
    function validateStep(stepNumber) {
        switch (stepNumber) {
            case 1:
                if (!invoice.type) {
                    alert("Please select an invoice type.");
                    return false;
                }
                return true;
            case 2:
                if (!invoice.currency) {
                    alert("Please select a currency.");
                    return false;
                }
                return true;
            case 3:
                if (!invoice.customer) {
                    alert("Please select a customer or add a new one.");
                    return false;
                }
                return true;
            case 4:
                if (invoice.products.length === 0) {
                    alert("Please select at least one product.");
                    return false;
                }
                return true;
            case 5:
                const allPricesSet = invoice.products.every(product => {
                    // Check if price exists and is a valid, non-negative number
                    return invoice.prices.hasOwnProperty(product.id) &&
                           typeof invoice.prices[product.id] === 'number' &&
                           invoice.prices[product.id] >= 0;
                });
                if (!allPricesSet) {
                    alert("Please set a valid price (0 or more) for all selected products.");
                    return false;
                }
                return true;
            case 6: // Discount step validation (optional, e.g., check amount if 'yes')
                if (invoice.discount.apply) {
                    const amount = parseFloat(document.getElementById('discount-amount')?.value || 0);
                    if (isNaN(amount) || amount < 0) {
                        alert("Please enter a valid discount amount (0 or more).");
                        return false;
                    }
                    // Check percentage bounds if needed
                    if (invoice.discount.type === 'percentage' && (amount < 0 || amount > 100)) {
                         alert("Discount percentage must be between 0 and 100.");
                         return false;
                    }
                }
                return true;
             case 7: // Advance Payment step validation (optional)
                if (invoice.advancePayment.apply) {
                    const amount = parseFloat(document.getElementById('advance-amount')?.value || 0);
                     const grandTotalBeforeAdvance = calculateGrandTotal(false); // Calculate total before advance
                    if (isNaN(amount) || amount < 0) {
                        alert("Please enter a valid advance payment amount (0 or more).");
                        return false;
                    }
                    if (amount > grandTotalBeforeAdvance) {
                         alert(`Advance payment (${formatCurrency(amount)}) cannot be greater than the total amount due (${formatCurrency(grandTotalBeforeAdvance)}).`);
                         return false;
                    }
                }
                return true;
            // Steps 8 and 9 usually don't need validation before proceeding *to* them
            default:
                return true; // Allow proceeding for other steps
        }
    }
    
    // Adım event listener'ları
    function bindStepEvents() {
        console.log("Binding step events");
        
        // Adım 1: Fatura tipi seçimi
        bindInvoiceTypeSelection();
        
        // Adım 2: Para birimi seçimi
        bindCurrencySelection();
        
        // Adım 3: Müşteri seçimi
        bindCustomerEvents();
        
        // Adım 4: Ürün seçimi
        bindProductEvents();
        
        // Adım 5: Fiyat belirleme
        bindPriceEvents();
        
        // Adım 6: İndirim
        bindDiscountEvents();
        
        // Adım 7: Avans ödemesi
        bindAdvancePaymentEvents();
        
        // Adım 8: Ek bilgiler
        bindAdditionalInfoEvents();
        
        // Adım 9: Önizleme ve tamamlama
        bindPreviewEvents();
    }
    
    // Fatura tipi seçimi
    function bindInvoiceTypeSelection() {
        console.log("Binding invoice type selection events");
        const invoiceTypeCards = document.querySelectorAll('#step-1 .selection-card');
        
        invoiceTypeCards.forEach(card => {
            card.addEventListener('click', function() {
                const value = this.getAttribute('data-value');
                invoice.type = value;
                highlightSelectedCard('invoice type', value); // Update visual selection
                console.log(`Invoice type selected: ${value}`);
            });
        });
    }
    
    // Para birimi seçimi
    function bindCurrencySelection() {
        console.log("Binding currency selection events");
        const currencyCards = document.querySelectorAll('#step-2 .selection-card');
        
        currencyCards.forEach(card => {
            card.addEventListener('click', function() {
                const value = this.getAttribute('data-value');
                invoice.currency = value;
                 highlightSelectedCard('currency', value); // Update visual selection
                console.log(`Currency selected: ${value}`);
                 // Update currency symbols throughout the form if currency changes mid-way
                 updateAllCurrencySymbols();
            });
        });
    }
    
    // Seçilen kartları vurgulama (Helper)
    function highlightSelectedCard(type, value) {
        let selector;
        let containerId;
        
        switch (type) {
            case 'invoice type':
                selector = '#step-1 .selection-card';
                containerId = 'step-1';
                break;
            case 'currency':
                selector = '#step-2 .selection-card';
                 containerId = 'step-2';
                break;
            default:
                return;
        }
        
        const container = document.getElementById(containerId);
        if (!container) return;

        const cards = container.querySelectorAll('.selection-card'); // Query within the specific step
        cards.forEach(card => {
            if (card.getAttribute('data-value') === value) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }

     // Helper to update all currency symbols if currency changes
    function updateAllCurrencySymbols() {
        const symbol = currencySymbols[invoice.currency] || '';
        const elementsToUpdate = {
            'currency-symbol-1': symbol, // Subtotal (Step 6)
            'currency-symbol-2': symbol, // Discount total (Step 6)
            'currency-symbol-3': symbol, // Total after discount (Step 6)
            'discount-symbol': invoice.discount.type === 'percentage' ? '%' : symbol, // Discount input symbol (Step 6)
            'currency-symbol-4': symbol, // AP Subtotal (Step 7)
            'currency-symbol-5': symbol, // AP Discount total (Step 7)
            'currency-symbol-6': symbol, // Advance total (Step 7)
            'currency-symbol-7': symbol, // Grand total (Step 7)
            'advance-currency-symbol': symbol // Advance input symbol (Step 7)
        };

        for (const id in elementsToUpdate) {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elementsToUpdate[id]; // FIX: Assign to textContent
            } else {
                 // console.warn(`Element with ID ${id} not found for currency symbol update.`);
            }
        }

        // Update symbols in price table (needs re-rendering or specific updates)
        renderPriceTable(); // Re-render price table to show new symbols in input groups and totals
    }
    
    // Müşteri olayları
    function bindCustomerEvents() {
        // Tab butonlarına olay ekle (Existing/New Customer)
        const tabBtns = document.querySelectorAll('#step-3 .tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                
                tabBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                document.querySelectorAll('#step-3 .tab-content').forEach(content => {
                    if(content.id === tabId) {
                        content.classList.add('active');
                    } else {
                        content.classList.remove('active');
                    }
                });
            });
        });
        
        // Müşteri arama
        const customerSearch = document.getElementById('customer-search');
        if (customerSearch) {
            customerSearch.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                filterCustomers(searchTerm);
            });
        }
        
        // Yeni müşteri formu
        const newCustomerForm = document.getElementById('new-customer-form');
        if (newCustomerForm) {
            newCustomerForm.addEventListener('submit', function(e) {
                e.preventDefault();
                addNewCustomer();
            });
        }

        // Event delegation for customer list item clicks
        const customerListContainer = document.getElementById('customer-list');
        if (customerListContainer) {
             customerListContainer.addEventListener('click', function(e) {
                 const targetItem = e.target.closest('.customer-item');
                 if (targetItem && targetItem.dataset.customerId) {
                     const customerId = parseInt(targetItem.dataset.customerId);
                     // FIX: Use .get instead of .getById
                     const selectedCustomer = InvoiceDB.customers.get(customerId); 

                     if (selectedCustomer) {
                         invoice.customer = selectedCustomer;
                         document.querySelectorAll('.customer-item').forEach(item => {
                             item.classList.remove('selected');
                         });
                         targetItem.classList.add('selected');
                         console.log(`Customer selected: ID ${selectedCustomer.id}, Name: ${selectedCustomer.name}`);
                     } else {
                          console.warn(`Customer with ID ${customerId} not found in DB.`);
                     }
                 }
             });
        }
    }
    
    // Müşterileri yükleme
    function loadCustomers() {
        const customerList = document.getElementById('customer-list');
        if (!customerList) {
            console.error("Customer list element not found.");
            return;
        }
        
        customerList.innerHTML = ''; 
        
        try {
            const customers = InvoiceDB.customers.getAll();
            console.log(`Loaded ${customers.length} customers from DB.`);
            
            if (customers.length === 0) {
                customerList.innerHTML = '<div class="alert alert-info">No customers found. Add a new customer using the "New Customer" tab.</div>';
                return;
            }
            
            customers.forEach(customer => {
                const customerItem = document.createElement('div');
                customerItem.className = 'customer-item';
                customerItem.dataset.customerId = customer.id; 

                if (invoice.customer && invoice.customer.id === customer.id) {
                    customerItem.classList.add('selected'); 
                }
                
                customerItem.innerHTML = `
                    <div class="customer-name">${escapeHtml(customer.name)}</div>
                    <div class="customer-details">
                        <div>${escapeHtml(customer.address)}</div>
                        ${customer.email ? `<div><i class="fas fa-envelope me-1"></i>${escapeHtml(customer.email)}</div>` : ''}
                        ${customer.phone ? `<div><i class="fas fa-phone me-1"></i>${escapeHtml(customer.phone)}</div>` : ''}
                    </div>
                `;
                
                customerList.appendChild(customerItem);
            });

        } catch (error) {
             console.error("Error loading customers:", error);
             customerList.innerHTML = '<div class="alert alert-danger">Error loading customer data.</div>';
        }
    }
    
    // Müşteri filtreleme
    function filterCustomers(searchTerm) {
        const customerItems = document.querySelectorAll('.customer-item');
        let matchFound = false;
        customerItems.forEach(item => {
            const name = item.querySelector('.customer-name')?.textContent.toLowerCase() || '';
            const details = item.querySelector('.customer-details')?.textContent.toLowerCase() || '';
            
            if (name.includes(searchTerm) || details.includes(searchTerm)) {
                item.style.display = '';
                matchFound = true;
            } else {
                item.style.display = 'none';
            }
        });
         const noMatchMsg = document.getElementById('customer-no-match');
         if (!matchFound && searchTerm) {
             if (!noMatchMsg) {
                 const msgDiv = document.createElement('div');
                 msgDiv.id = 'customer-no-match';
                 msgDiv.className = 'alert alert-warning mt-2';
                 msgDiv.textContent = 'No customers match your search.';
                 document.getElementById('customer-list').parentNode.appendChild(msgDiv);
             }
         } else if (noMatchMsg) {
             noMatchMsg.remove();
         }
    }
    
    // Yeni müşteri ekleme
    function addNewCustomer() {
        const nameInput = document.getElementById('customer-name');
        const addressInput = document.getElementById('customer-address');
        const emailInput = document.getElementById('customer-email');
        const phoneInput = document.getElementById('customer-phone');
        const notesInput = document.getElementById('customer-notes');
        
        if (!nameInput?.value || !addressInput?.value) {
             alert("Customer Name and Address are required.");
             return;
        }
        
        const customerData = {
            name: nameInput.value.trim(),
            address: addressInput.value.trim(),
            email: emailInput ? emailInput.value.trim() : '',
            phone: phoneInput ? phoneInput.value.trim() : '',
            notes: notesInput ? notesInput.value.trim() : ''
        };
        
        try {
            const newCustomer = InvoiceDB.customers.add(customerData);
            console.log(`New customer added: ID ${newCustomer.id}, Name: ${newCustomer.name}`);
            
            invoice.customer = newCustomer;
            document.getElementById('new-customer-form').reset();
            
            const existingCustomerTabBtn = document.querySelector('#step-3 .tab-btn[data-tab="existing-customer"]');
            if (existingCustomerTabBtn) {
                 existingCustomerTabBtn.click(); 
            }
            loadCustomers(); 

            const newItemElement = document.querySelector(`.customer-item[data-customer-id="${newCustomer.id}"]`);
            newItemElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        } catch (error) {
            console.error("Error adding customer:", error);
            alert("Error adding customer: " + error.message);
        }
    }
    
    // Ürün olayları
    function bindProductEvents() {
        // Manuel ürün ekleme formu
        const manualProductForm = document.getElementById('manual-product-form');
        if (manualProductForm) {
            manualProductForm.addEventListener('submit', function(e) {
                e.preventDefault();
                addManualProduct();
            });
        }
        
        // Miktar modalındaki ekle butonu
        const addToInvoiceBtn = document.getElementById('add-to-invoice');
        if (addToInvoiceBtn) {
            addToInvoiceBtn.addEventListener('click', function() {
                const quantityInput = document.getElementById('modal-quantity');
                if (!quantityInput || !selectedProductForModal) return;
                
                const quantity = parseInt(quantityInput.value);
                if (isNaN(quantity) || quantity < 1) {
                    alert("Please enter a valid quantity (1 or more).");
                    return;
                }
                
                addProductToInvoice(selectedProductForModal, quantity);
                if (quantityModalInstance) {
                    quantityModalInstance.hide();
                } else {
                     console.error("Quantity modal instance not found to hide.");
                }
            });
        }

        // Event delegation for removing products from the selected list
        const selectedProductsTableBody = document.getElementById('selected-products-tbody');
        if (selectedProductsTableBody) {
             selectedProductsTableBody.addEventListener('click', function(e){
                 const removeButton = e.target.closest('.btn-remove');
                 if (removeButton && removeButton.dataset.index) {
                     const index = parseInt(removeButton.dataset.index);
                     removeProductFromInvoice(index);
                 }
             });
        }

        // Event delegation for clicking product items in the lists
        const productTabContent = document.getElementById('productCategoryTabContent');
         if (productTabContent) {
             productTabContent.addEventListener('click', function(e) {
                 const targetItem = e.target.closest('.product-item');
                 if (targetItem && targetItem.dataset.id) {
                     const productId = targetItem.dataset.id;
                     // FIX: Use .get instead of .getById
                     // Need to parse ID if it's stored as a number in DB
                     const product = InvoiceDB.products.get(parseInt(productId)); 
                     if (product) {
                         showQuantityModal(product);
                     } else {
                          console.warn(`Product with ID ${productId} not found in DB.`);
                     }
                 }
             });
         }
    }
    
    // Ürünleri gösterme işlevi - Kategorilere ayırır ve renderProductItems'ı çağırır
    function renderProductList() {
        console.log("Rendering product list by category...");
        
        const listContainers = {
            'all': document.getElementById('all-product-list'),
            'Rainbo Series': document.getElementById('rainbo-product-list'),
            'Laser Series': document.getElementById('laser-product-list'),
            'Combine Series': document.getElementById('combine-product-list'),
            'Mould': document.getElementById('mould-product-list'),
            'Other': document.getElementById('other-product-list')
        };

        if (!listContainers['all']) {
            console.error("Element with ID 'all-product-list' not found. Cannot render products.");
            return;
        }

        for (const key in listContainers) {
            if (listContainers[key]) {
                listContainers[key].innerHTML = '';
            } else {
                 console.warn(`Container for category '${key}' not found.`);
            }
        }
        
        let products = [];
        try {
            products = InvoiceDB.products.getAll();
            console.log(`Loaded ${products.length} products from database.`);
        } catch(error) {
            console.error("Error getting products from DB:", error);
            listContainers['all'].innerHTML = '<div class="col-12 alert alert-danger">Error loading products.</div>';
            return;
        }
        
        if (products.length === 0) {
            listContainers['all'].innerHTML = '<div class="col-12 alert alert-info text-center py-4">No products available in the database. You can add them manually or manage data via Veri Yönetimi.</div>';
            return;
        }
        
        const categories = {
            'all': [],
            'Rainbo Series': [],
            'Laser Series': [],
            'Combine Series': [],
            'Mould': [],
            'Other': []
        };
        
        products.forEach(product => {
            categories['all'].push(product);
            const category = (product.category || '').trim().toLowerCase();
            let assigned = false;

            if (category === 'rainbo series' || category === 'rainbo') {
                categories['Rainbo Series'].push(product);
                assigned = true;
            } else if (category === 'laser series' || category === 'laser') {
                categories['Laser Series'].push(product);
                assigned = true;
            } else if (category === 'combine series' || category === 'combine') {
                categories['Combine Series'].push(product);
                assigned = true;
            } else if (category === 'mould') {
                categories['Mould'].push(product);
                assigned = true;
            }
            
            if (!assigned) {
                categories['Other'].push(product);
            }
        });
        
        console.log("Categorized products:", categories);
        
        for (const key in categories) {
            if (listContainers[key]) {
                renderProductItems(listContainers[key], categories[key], key); 
            }
        }
    }

    // Ürün öğelerini (kartları) belirli bir container'a ekler
    function renderProductItems(container, products, categoryKey) {
        if (!container) {
             console.warn(`Container for category ${categoryKey} is null or undefined.`);
             return;
        }
        container.innerHTML = ''; 
        if (products.length === 0) {
            container.innerHTML = `<div class="col-12 text-center py-4 alert alert-light">No products found in the '${categoryKey}' category.</div>`;
            return;
        }
        
        const rowDiv = document.createElement('div');
        rowDiv.className = 'row'; 

        products.forEach(product => {
             const colDiv = document.createElement('div');
             colDiv.className = 'col-md-6 mb-3'; 
             colDiv.appendChild(createProductItem(product)); 
             rowDiv.appendChild(colDiv); 
        });
        container.appendChild(rowDiv); 
    }
    
    // Tekil ürün öğesi (kart) oluşturur
    function createProductItem(product) {
        const productItem = document.createElement('div');
        productItem.className = 'product-item h-100'; 
        productItem.dataset.id = product.id; 
        
        const category = (product.category || '').trim().toLowerCase();
        let categoryClass = 'other';
        if (category === 'rainbo series' || category === 'rainbo') categoryClass = 'rainbo';
        else if (category === 'laser series' || category === 'laser') categoryClass = 'laser';
        else if (category === 'combine series' || category === 'combine') categoryClass = 'combine';
        else if (category === 'mould') categoryClass = 'mould';
        
        productItem.innerHTML = `
            <div class="product-name">${escapeHtml(product.name)}</div>
            <div class="product-description">${escapeHtml(product.description || '-')}</div>
            <div class="product-category ${categoryClass}">${escapeHtml(product.category || 'Other')}</div>
        `;
        
        return productItem;
    }
    
    // Miktar seçme modalını göster
    function showQuantityModal(product) {
        const modalProductName = document.getElementById('modal-product-name');
        const modalQuantity = document.getElementById('modal-quantity');
        
        if (!modalProductName || !modalQuantity || !quantityModalInstance) {
            console.error("Modal elements or instance not found for quantity selection.");
            return;
        }
        
        selectedProductForModal = product;
        modalProductName.textContent = product.name;
        modalQuantity.value = 1; 
        modalQuantity.min = 1; 
        
        quantityModalInstance.show();
    }
    
    // Ürün arama işlevi (sadece 'All Products' sekmesinde çalışır)
    function setupProductSearch() {
        const productSearch = document.getElementById('product-search');
        const allProductListContainer = document.getElementById('all-product-list'); 

        if (!productSearch || !allProductListContainer) {
             console.warn("Product search input or container not found.");
             return;
        }
        
        productSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            const productCols = allProductListContainer.querySelectorAll('.col-md-6'); 
            let matchFound = false;

            productCols.forEach(col => {
                 const item = col.querySelector('.product-item'); 
                 if (!item) return;

                const productName = item.querySelector('.product-name')?.textContent.toLowerCase() || '';
                const productDescription = item.querySelector('.product-description')?.textContent.toLowerCase() || '';
                const productCategory = item.querySelector('.product-category')?.textContent.toLowerCase() || '';
                
                if (productName.includes(searchTerm) || productDescription.includes(searchTerm) || productCategory.includes(searchTerm)) {
                    col.style.display = ''; 
                    matchFound = true;
                } else {
                    col.style.display = 'none'; 
                }
            });

             const noMatchMsg = document.getElementById('product-no-match');
             if (!matchFound && searchTerm) {
                 if (!noMatchMsg) {
                     const msgDiv = document.createElement('div');
                     msgDiv.id = 'product-no-match';
                     msgDiv.className = 'col-12 alert alert-warning mt-2'; 
                     msgDiv.textContent = 'No products match your search.';
                     const searchInputGroup = productSearch.closest('.input-group');
                      if(searchInputGroup && searchInputGroup.parentNode) {
                           searchInputGroup.parentNode.insertBefore(msgDiv, searchInputGroup.nextSibling);
                      } else {
                           allProductListContainer.prepend(msgDiv); 
                      }
                 }
             } else if (noMatchMsg) {
                 noMatchMsg.remove();
             }
        });
    }
    
    // Manuel ürün ekleme
    function addManualProduct() {
        const nameInput = document.getElementById('manual-product-name'); 
        const quantityInput = document.getElementById('manual-product-quantity'); 
        
        if (!nameInput || !quantityInput) {
             console.error("Manual product form elements not found.");
             return;
        }
        
        const name = nameInput.value.trim();
        const quantity = parseInt(quantityInput.value);
        
        if (!name) {
            alert("Please enter a product name.");
            return;
        }
        if (isNaN(quantity) || quantity < 1) {
            alert("Please enter a valid quantity (1 or more).");
            return;
        }
        
        const manualProduct = {
            id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`, 
            name: name,
            description: 'Manually added product',
            category: 'Manual', 
            isManual: true 
        };
        
        addProductToInvoice(manualProduct, quantity);
        nameInput.value = '';
        quantityInput.value = 1;
        alert(`"${name}" (Quantity: ${quantity}) added to the invoice.`);
    }
    
    // Ürünü faturaya ekle (invoice.products listesine)
    function addProductToInvoice(product, quantity) {
        if (!product || !product.id || !quantity || quantity < 1) {
             console.error("Invalid product or quantity for adding to invoice.");
             return;
        }
        const existingProductIndex = invoice.products.findIndex(p => p.id === product.id);
        
        if (existingProductIndex !== -1) {
            invoice.products[existingProductIndex].quantity += quantity;
             console.log(`Updated quantity for product: ${product.name}, New quantity: ${invoice.products[existingProductIndex].quantity}`);
        } else {
            const productWithQuantity = {
                id: product.id,
                name: product.name,
                description: product.description || '',
                category: product.category || 'Other',
                quantity: quantity,
                isManual: product.isManual || false 
            };
            invoice.products.push(productWithQuantity);
             if (!invoice.prices.hasOwnProperty(product.id)) {
                 invoice.prices[product.id] = 0; 
             }
             console.log(`Product added to invoice: ${product.name}, quantity: ${quantity}`);
        }
        
        updateSelectedProductsTable();
    }
    
    // Seçilen ürünler tablosunu güncelle (Adım 4 altındaki tablo)
    function updateSelectedProductsTable() {
        const selectedProductsTbody = document.getElementById('selected-products-tbody');
        if (!selectedProductsTbody) return;
        
        selectedProductsTbody.innerHTML = '';
        
        if (invoice.products.length === 0) {
            selectedProductsTbody.innerHTML = '<tr class="no-products-row"><td colspan="3" class="text-center text-muted py-3">No products selected yet</td></tr>';
        } else {
            invoice.products.forEach((product, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${escapeHtml(product.name)}</td>
                    <td class="text-center">${product.quantity}</td>
                    <td class="table-action">
                        <button type="button" class="btn-remove" data-index="${index}" title="Remove ${escapeHtml(product.name)}">
                            <i class="fas fa-times fa-fw"></i>
                        </button>
                    </td>
                `;
                selectedProductsTbody.appendChild(row);
            });
        }
    }
    
    // Ürünü faturadan kaldır (invoice.products listesinden)
    function removeProductFromInvoice(index) {
        if (index < 0 || index >= invoice.products.length) {
             console.warn(`Invalid index ${index} for removing product.`);
             return;
        }
        
        const removedProduct = invoice.products[index];
        invoice.products.splice(index, 1); 
        console.log(`Product removed from invoice: ${removedProduct.name}`);
        
        if (invoice.prices.hasOwnProperty(removedProduct.id)) {
            delete invoice.prices[removedProduct.id];
            console.log(`Price removed for product ID: ${removedProduct.id}`);
        }
        
        updateSelectedProductsTable();
        renderPriceTable();
        updateDiscountValue();
        updateAdvanceValue();
    }
    
    // Fiyat olayları (Adım 5)
    function bindPriceEvents() {
        const priceTableBody = document.getElementById('price-table-tbody');
        if (priceTableBody) {
             priceTableBody.addEventListener('input', function(e) {
                 if (e.target && e.target.classList.contains('price-input') && e.target.dataset.productId) {
                     const productId = e.target.dataset.productId;
                     const priceValue = parseFloat(e.target.value);
                     
                     if (!isNaN(priceValue) && priceValue >= 0) {
                         invoice.prices[productId] = priceValue; 
                         updatePriceRowTotal(productId); 
                         updateDiscountValue();
                         updateAdvanceValue();
                     } else if (e.target.value === '') {
                          invoice.prices[productId] = 0;
                          updatePriceRowTotal(productId);
                          updateDiscountValue();
                          updateAdvanceValue();
                     } else {
                         console.warn(`Invalid price input for product ID ${productId}: ${e.target.value}`);
                     }
                 }
             });
        }
    }
    
    // Fiyat tablosunu oluştur (Adım 5)
    function renderPriceTable() {
        const priceTableBody = document.getElementById('price-table-tbody');
        if (!priceTableBody) return;
        
        priceTableBody.innerHTML = ''; 
        
        if (invoice.products.length === 0) {
            priceTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">No products selected. Go back to Step 4 to add products.</td></tr>'; 
            return;
        }
        
        const currencySymbol = currencySymbols[invoice.currency] || '';
        
        invoice.products.forEach(product => {
            const row = document.createElement('tr');
            row.id = `price-row-${product.id}`; 
            
            const currentPrice = invoice.prices.hasOwnProperty(product.id) ? invoice.prices[product.id] : 0; 
            const totalForRow = currentPrice * product.quantity;

            row.innerHTML = `
                <td>${escapeHtml(product.name)}</td>
                <td class="text-center">${product.quantity}</td>
                <td class="text-end"> 
                    <div class="input-group input-group-sm"> 
                        <span class="input-group-text">${currencySymbol}</span>
                        <input type="number" class="form-control price-input text-end" data-product-id="${product.id}" value="${currentPrice.toFixed(2)}" min="0" step="0.01" aria-label="Unit price for ${escapeHtml(product.name)}">
                    </div>
                </td>
                <td class="price-total text-end">${currencySymbol}${totalForRow.toFixed(2)}</td>
            `;
            
            priceTableBody.appendChild(row);
            
            if (!invoice.prices.hasOwnProperty(product.id)) {
                invoice.prices[product.id] = 0;
            }
        });
    }
    
    // Fiyat satırı toplamını güncelle (Helper for Adım 5)
    function updatePriceRowTotal(productId) {
        const row = document.getElementById(`price-row-${productId}`);
        if (!row) return;
        
        const product = invoice.products.find(p => p.id === productId);
        if (!product) return;
        
        const price = invoice.prices[productId] || 0;
        const total = price * product.quantity;
        const currencySymbol = currencySymbols[invoice.currency] || '';
        
        const totalCell = row.querySelector('.price-total');
        if (totalCell) {
            totalCell.textContent = `${currencySymbol}${total.toFixed(2)}`;
        }
    }
    
    // İndirim olayları (Adım 6)
    function bindDiscountEvents() {
        const discountRadios = document.querySelectorAll('input[name="discount-apply"]');
        discountRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                invoice.discount.apply = this.value === 'yes';
                const discountFields = document.getElementById('discount-fields');
                discountFields?.classList.toggle('d-none', !invoice.discount.apply);
                updateDiscountValue();
                updateAdvanceValue(); 
            });
        });
        
        const discountTypeRadios = document.querySelectorAll('input[name=\"discount-type\"]');
        discountTypeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                invoice.discount.type = this.value;
                const discountSymbolEl = document.getElementById('discount-symbol');
                if (discountSymbolEl) {
                    discountSymbolEl.textContent = invoice.discount.type === 'percentage' ? '%' : (currencySymbols[invoice.currency] || '');
                }
                updateDiscountValue();
                updateAdvanceValue();
            });
        });
        
        const discountAmountInput = document.getElementById('discount-amount');
        if (discountAmountInput) {
            discountAmountInput.addEventListener('input', function() {
                const amount = parseFloat(this.value);
                invoice.discount.amount = (isNaN(amount) || amount < 0) ? 0 : amount;
                updateDiscountValue();
                updateAdvanceValue();
            });
        }
    }
    
    // İndirim bölümünü güncelle (Adım 6 UI)
    function updateDiscountSection() {
        const currencySymbol = currencySymbols[invoice.currency] || '';
        
        // FIX: Use textContent assignment in the loop within updateAllCurrencySymbols
        // updateAllCurrencySymbols(); // Call this to update symbols correctly

        const subtotal = calculateSubtotal();
        document.getElementById('subtotal')?.(subtotal.toFixed(2));
        
        const discountSymbolEl = document.getElementById('discount-symbol');
        if (discountSymbolEl) {
            discountSymbolEl.textContent = invoice.discount.type === 'percentage' ? '%' : currencySymbol;
        }
        
        document.getElementById('discount-yes').checked = invoice.discount.apply;
        document.getElementById('discount-no').checked = !invoice.discount.apply;
        document.getElementById('discount-fields')?.classList.toggle('d-none', !invoice.discount.apply);
        document.getElementById('discount-percentage').checked = invoice.discount.type === 'percentage';
        document.getElementById('discount-value').checked = invoice.discount.type === 'value';
        
        const discountAmountInput = document.getElementById('discount-amount');
        if (discountAmountInput) {
            discountAmountInput.value = invoice.discount.amount.toString();
        }
        
        updateDiscountValue(); 
    }
    
    // İndirim değerini hesapla ve UI'da göster (Helper for Adım 6)
    function updateDiscountValue() {
        const subtotal = calculateSubtotal();
        let calculatedDiscountValue = 0; 
        
        if (invoice.discount.apply && invoice.discount.amount > 0) {
            if (invoice.discount.type === 'percentage') {
                 const percentage = Math.max(0, Math.min(100, invoice.discount.amount)); 
                calculatedDiscountValue = (subtotal * percentage) / 100;
            } else { 
                calculatedDiscountValue = Math.max(0, invoice.discount.amount); 
                calculatedDiscountValue = Math.min(calculatedDiscountValue, subtotal); // Cap discount at subtotal
            }
        }
        
        // Hesaplanan indirim değerini sakla
        invoice.discount.value = calculatedDiscountValue;
        
        // UI'daki indirim ve indirim sonrası toplamı güncelle
        const discountTotalEl = document.getElementById('discount-total');
        if (discountTotalEl) {
             discountTotalEl.textContent = calculatedDiscountValue.toFixed(2); // FIX: Use textContent
        }

        const totalAfterDiscount = subtotal - calculatedDiscountValue;
        const totalAfterDiscountEl = document.getElementById('total-after-discount');
         if (totalAfterDiscountEl) {
            totalAfterDiscountEl.textContent = totalAfterDiscount.toFixed(2); // FIX: Use textContent
         }

        // Also update dependent values in the next step (Advance Payment)
        updateAdvanceSectionDisplay(); // Update totals shown in step 7
    }
    
    // Avans ödemesi olayları (Adım 7)
    function bindAdvancePaymentEvents() {
        const advanceRadios = document.querySelectorAll('input[name=\"advance-apply\"]');
        advanceRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                invoice.advancePayment.apply = this.value === 'yes';
                document.getElementById('advance-fields')?.classList.toggle('d-none', !invoice.advancePayment.apply);
                document.querySelectorAll('.advance-row')?.forEach(row => row.classList.toggle('d-none', !invoice.advancePayment.apply));
                updateAdvanceValue();
            });
        });
        
        const advanceAmountInput = document.getElementById('advance-amount');
        if (advanceAmountInput) {
            advanceAmountInput.addEventListener('input', function() {
                const amount = parseFloat(this.value);
                invoice.advancePayment.amount = (isNaN(amount) || amount < 0) ? 0 : amount;
                updateAdvanceValue();
            });
        }
    }
    
    // Avans ödemesi bölümünü ve toplamları güncelle (Adım 7 UI)
    function updateAdvanceSection() {
        document.getElementById('advance-yes').checked = invoice.advancePayment.apply;
        document.getElementById('advance-no').checked = !invoice.advancePayment.apply;
        document.getElementById('advance-fields')?.classList.toggle('d-none', !invoice.advancePayment.apply);
        document.querySelectorAll('.advance-row')?.forEach(row => row.classList.toggle('d-none', !invoice.advancePayment.apply));

        const advanceAmountInput = document.getElementById('advance-amount');
        if (advanceAmountInput) {
            advanceAmountInput.value = invoice.advancePayment.amount.toString();
        }
        updateAdvanceSectionDisplay();
    }

    // Helper to update the display elements within the Advance Payment step (Adım 7)
    function updateAdvanceSectionDisplay() {
        // FIX: Use textContent assignment in the loop within updateAllCurrencySymbols
        // updateAllCurrencySymbols(); // Call this to update symbols correctly

        const subtotal = calculateSubtotal();
        document.getElementById('ap-subtotal')?.(subtotal.toFixed(2));
        
        const discountRow = document.querySelector('.discount-row'); 
        const hasDiscount = invoice.discount.apply && invoice.discount.value > 0;
        if (discountRow) {
            discountRow.classList.toggle('d-none', !hasDiscount);
             const apDiscountTotalEl = document.getElementById('ap-discount-total');
             if (apDiscountTotalEl) {
                apDiscountTotalEl.textContent = invoice.discount.value.toFixed(2); // Use textContent
             }
        }
        
        updateAdvanceValue(); 
    }

    // Avans değerini hesapla ve UI'da göster (Helper for Adım 7)
    function updateAdvanceValue() {
        const grandTotal = calculateGrandTotal(true); 
        const advancePaymentValue = (invoice.advancePayment.apply && invoice.advancePayment.amount > 0)
                                    ? Math.max(0, invoice.advancePayment.amount)
                                    : 0;

        const advanceTotalEl = document.getElementById('advance-total');
        if(advanceTotalEl) advanceTotalEl.textContent = advancePaymentValue.toFixed(2); // Use textContent

        const grandTotalEl = document.getElementById('grand-total');
        if(grandTotalEl) grandTotalEl.textContent = grandTotal.toFixed(2); // Use textContent
    }
    
    // Ek bilgiler olayları (Adım 8)
    function bindAdditionalInfoEvents() {
        const warrantySelect = document.getElementById('warranty-period');
        const shippingSelect = document.getElementById('shipping-included');
        const paymentTermsInput = document.getElementById('payment-terms');
        const deliveryTermsInput = document.getElementById('delivery-terms');
        const extraInfoInput = document.getElementById('extra-info');

        warrantySelect?.addEventListener('change', function() { invoice.warranty = this.value; });
        shippingSelect?.addEventListener('change', function() { invoice.shipping = this.value; });
        paymentTermsInput?.addEventListener('input', function() { invoice.paymentTerms = this.value; });
        deliveryTermsInput?.addEventListener('input', function() { invoice.deliveryTerms = this.value; });
        extraInfoInput?.addEventListener('input', function() { invoice.extraInfo = this.value; });
    }
    
    // Önizleme olayları (Adım 9)
    function bindPreviewEvents() {
        const editBtn = document.getElementById('edit-btn');
        const saveBtn = document.getElementById('save-btn'); 
        const generatePdfBtn = document.getElementById('generate-pdf-btn');
        const downloadPdfBtn = document.getElementById('download-pdf'); 

        editBtn?.addEventListener('click', function() {
            showStep(1);
        });
        
        saveBtn?.addEventListener('click', function() {
            finalizeInvoice();
        });
        
        generatePdfBtn?.addEventListener('click', function() {
            generatePDF();
        });
        
        downloadPdfBtn?.addEventListener('click', function() {
            generatePDF();
             if (successModalInstance) successModalInstance.hide(); 
        });
    }
    
     // Fatura önizlemesi oluştur (Adım 9 HTML - pdfgenerator.js düzenine göre ayarlandı)
    function renderInvoicePreview() {
        const previewElement = document.getElementById('invoice-preview');
        if (!previewElement) {
            console.error("Invoice preview element not found.");
            return;
        }

        // Calculate totals needed for preview
        const currencySymbol = PDFGenerator.getCurrencySymbol(invoice.currency); // Use generator's function
        const subtotal = calculateSubtotal();
        const discountValue = invoice.discount.apply ? invoice.discount.value : 0;
        const totalAfterDiscount = subtotal - discountValue;
        const advanceValue = invoice.advancePayment.apply ? invoice.advancePayment.amount : 0;
        const grandTotal = calculateGrandTotal(true); // Final total

        // Tarih ve Fatura Numarası (Geçici - finalize'da kesinleşir)
        const now = new Date();
        // Match PDF date format if possible, otherwise use a clear format
        const dateStr = now.toLocaleDateString('en-CA'); // YYYY-MM-DD format is clear
        const tempInvoiceNumber = document.getElementById('invoice-number')?.textContent || // Use finalized number if available
                                   `PREVIEW-${Date.now().toString().slice(-6)}`; // Or use a preview number

        const invoiceTypeText = invoice.type === 'proforma' ? 'PROFORMA INVOICE' : 'INVOICE';

        // --- Get Company and Bank Details (Match pdfgenerator.js) ---
        const companyAddress = "Seyitnizam Mh. Demirciler Sitesi 9.Cd. No26<br>Zeytinburnu Istanbul Turkiye";
        const companyContactFooter = "E-mail: alp@alpress.com.tr Web: alpress.com.tr Phone: +90 212 416 65 05 / +90 549 712 16 68";
        const companyLogoUrl = "images/logo.jpg"; // Match PDF
        const stampImageUrl = "images/damga.jpg"; // Match PDF

        // Get Bank Info using the function from pdfgenerator.js
        let bankInfo = { bank: 'N/A', iban: 'N/A' }; // Default
        if (typeof PDFGenerator !== 'undefined' && typeof PDFGenerator.getBankInfoForCurrency === 'function') {
             bankInfo = PDFGenerator.getBankInfoForCurrency(invoice.currency);
        } else {
            console.warn("PDFGenerator or getBankInfoForCurrency not found. Cannot display bank details in preview.");
        }

        // --- Müşteri bilgileri ---
        const customer = invoice.customer;
        let customerHtml = '<span class="text-danger">No Customer Selected</span>';
        if (customer) {
             customerHtml = `
                 <strong>${escapeHtml(customer.name)}</strong><br>
                 ${escapeHtml(customer.address).replace(/\n/g, '<br>')}<br>
                 ${customer.email ? `E-mail: ${escapeHtml(customer.email)}<br>` : ''}
                 ${customer.phone ? `Phone: ${escapeHtml(customer.phone)}` : ''}
             `;
        }

        // --- Ürün tablosu HTML ---
        // Use jsPDF AutoTable structure for consistency in data mapping
        const tableColumns = ["#", "Description", "Quantity", `Unit Price (${currencySymbol})`, `Total (${currencySymbol})`];
        const itemsForTable = invoice.products.map((product, index) => {
             const unitPrice = invoice.prices[product.id] || 0;
             const totalPrice = unitPrice * product.quantity;
             return [
                 index + 1,
                 `${escapeHtml(product.name)}${product.description ? `<br><small style='color:#555'>${escapeHtml(product.description)}</small>` : ''}`, // Combine name/desc
                 product.quantity,
                 formatCurrency(unitPrice), // Use app's formatting helper
                 formatCurrency(totalPrice)
             ];
        });

        let productsTableHTML = `
            <table style="width: 190mm; /* 210mm - 10mm margins */ border-collapse: collapse; margin-top: 0; font-size: 9pt; border: 1px solid #ddd;">
                <thead>
                    <tr style="background-color: #DC143C; color: white; font-weight: bold; border: 1px solid #DC143C;">
                        <th style="border: 1px solid #ddd; padding: 3px; text-align: center; width: 10mm;">${tableColumns[0]}</th>
                        <th style="border: 1px solid #ddd; padding: 3px; text-align: left; width: 80mm;">${tableColumns[1]}</th>
                        <th style="border: 1px solid #ddd; padding: 3px; text-align: center; width: 20mm;">${tableColumns[2]}</th>
                        <th style="border: 1px solid #ddd; padding: 3px; text-align: right; width: 40mm;">${tableColumns[3]}</th>
                        <th style="border: 1px solid #ddd; padding: 3px; text-align: right; width: 40mm;">${tableColumns[4]}</th>
                    </tr>
                </thead>
                <tbody>
        `;

        if (itemsForTable.length > 0) {
            itemsForTable.forEach(row => {
                productsTableHTML += `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 3px; text-align: center;">${row[0]}</td>
                        <td style="border: 1px solid #ddd; padding: 3px; text-align: left;">${row[1]}</td>
                        <td style="border: 1px solid #ddd; padding: 3px; text-align: center;">${row[2]}</td>
                        <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${row[3]}</td>
                        <td style="border: 1px solid #ddd; padding: 3px; text-align: right;">${row[4]}</td>
                    </tr>
                `;
            });
        } else {
             productsTableHTML += `<tr><td colspan="5" style="border: 1px solid #ddd; padding: 10px; text-align: center; color: #777;">No products selected.</td></tr>`;
        }

        // --- Toplam satırları (Align right, match PDF structure) ---
         productsTableHTML += `
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="4" style="border-top: 1px solid #aaa; padding: 5px 8px; text-align: right; font-weight: normal;">Subtotal:</td>
                        <td style="border-top: 1px solid #aaa; padding: 5px 8px; text-align: right;">${formatCurrency(subtotal)}</td>
                    </tr>
        `;
        if (invoice.discount.apply && discountValue > 0) {
            productsTableHTML += `
                <tr>
                    <td colspan="4" style="padding: 5px 8px; text-align: right; font-weight: normal;">Discount:</td>
                    <td style="padding: 5px 8px; text-align: right;">-${formatCurrency(discountValue)}</td>
                </tr>`;
        }
        if (invoice.advancePayment.apply && advanceValue > 0) {
            productsTableHTML += `
                <tr>
                    <td colspan="4" style="padding: 5px 8px; text-align: right; font-weight: normal;">Advance Payment:</td>
                    <td style="padding: 5px 8px; text-align: right;">-${formatCurrency(advanceValue)}</td>
                </tr>`;
        }
         productsTableHTML += `
                    <tr style="font-weight: bold; font-size: 11pt; background-color: #f2f2f2;">
                        <td colspan="4" style="border-top: 2px solid #000; padding: 8px; text-align: right;">GRAND TOTAL:</td>
                        <td style="border-top: 2px solid #000; padding: 8px; text-align: right;">${formatCurrency(grandTotal)}</td>
                    </tr>
                </tfoot>
            </table>
        `;

        // --- HTML içeriği (Absolute Positioning Matching PDF) ---
        previewElement.innerHTML = `
            <!-- Logo -->
            <img src="${companyLogoUrl}" alt="Company Logo" style="position: absolute; top: 0mm; left: 0mm; width: 210mm; height: 60mm; object-fit: contain; object-position: left top;">

             <!-- Stamp -->
             <img src="${stampImageUrl}" alt="Stamp" style="position: absolute; top: 255mm; left: 55mm; width: 50mm; height: 35mm; object-fit: contain;">

            <!-- Title -->
            <div style="position: absolute; top: 30mm; left: 135mm; font-size: 20pt; color: #DC143C; font-weight: bold;">
                ${invoiceTypeText}
            </div>

            <!-- Invoice Info -->
            <div style="position: absolute; top: 50mm; left: 140mm; font-size: 11pt; color: black;">
                Invoice No: ${escapeHtml(tempInvoiceNumber)}
            </div>
            <div style="position: absolute; top: 60mm; left: 140mm; font-size: 11pt; color: black;">
                Date: ${escapeHtml(dateStr)}
            </div>

            <!-- Customer Info -->
            <div style="position: absolute; top: 50mm; left: 10mm; width: 90mm;">
                 <div style="font-size: 12pt; color: #DC143C; margin-bottom: 3mm; font-weight: bold;">Customer Information</div>
                 <div style="font-size: 10pt; line-height: 1.4;">
                     ${customerHtml}
                 </div>
            </div>

            <!-- Products Table -->
            <div style="position: absolute; top: 82mm; left: 10mm; width: 190mm;">
                ${productsTableHTML}
                <!-- Note: Totals are part of the table HTML generated above -->
            </div>

            <!-- Terms Section -->
            <div style="position: absolute; top: 237mm; left: 8mm; width: 100mm; font-size: 9pt; line-height: 1.4;">
                 <div style="font-size: 12pt; color: #DC143C; margin-bottom: 3mm; font-weight: bold;">Terms and Conditions</div>
                 <div>
                     <strong>Warranty Period:</strong> ${escapeHtml(invoice.warranty)}<br>
                     <strong>Shipping:</strong> ${escapeHtml(invoice.shipping === 'included' ? 'Included' : 'Not Included')}<br>
                     ${invoice.paymentTerms ? `<strong>Payment Terms:</strong> ${escapeHtml(invoice.paymentTerms)}<br>` : ''}
                     ${invoice.deliveryTerms ? `<strong>Delivery Terms:</strong> ${escapeHtml(invoice.deliveryTerms)}<br>` : ''}
                     ${invoice.extraInfo ? `<br><strong>Additional Info:</strong><br>${escapeHtml(invoice.extraInfo).replace(/\n/g, '<br>')}` : ''}
                 </div>
            </div>

            <!-- Company & Bank Info Section -->
             <div style="position: absolute; top: 237mm; left: 110mm; width: 95mm; font-size: 9pt; line-height: 1.4;">
                 <!-- Company Address -->
                 <div style="margin-bottom: 8mm;">
                      <div style="font-size: 12pt; color: #DC143C; margin-bottom: 2mm; font-weight: bold;">Company Address</div>
                      ${companyAddress}
                 </div>

                 <!-- Bank Info -->
                  <div>
                      <div style="font-size: 12pt; color: #DC143C; margin-bottom: 2mm; font-weight: bold;">Bank Information (${escapeHtml(invoice.currency)})</div>
                      Bank Name: Akbank A.S.<br>
                      Branch Name: Seyitnizam<br>
                      Branch Code: 1349<br>
                      Swift Code: AKBKTRIS<br>
                      Account Name: Alpress Kalipcilik Dan. Ith. Ihr. San. ve Tic. Ltd.Sti<br>
                      Account Number: ${escapeHtml(bankInfo.bank)}<br>
                      IBAN: ${escapeHtml(bankInfo.iban)}
                 </div>
            </div>


            <!-- Footer Text -->
            <div style="position: absolute; bottom: 5mm; left: 10mm; right: 10mm; text-align: center; font-size: 8pt; color: #777; border-top: 0.5px solid #ccc; padding-top: 2mm;">
                ${escapeHtml(companyContactFooter)}
            </div>
        `;
    }
    
    // Faturayı tamamla (DB'ye kaydet, başarı modalını göster)
    function finalizeInvoice() {
        console.log("Finalizing invoice...");

         if (!validateStep(totalSteps -1) || !validateStep(totalSteps - 2)) { 
             console.warn("Validation failed before finalizing.");
             return;
         }

        const finalInvoiceNumber = `${invoice.type === 'proforma' ? 'PRO' : 'INV'}-${Date.now().toString().slice(-4)}`; 
        
        try {
            const invoiceDataToSave = {
                number: finalInvoiceNumber,
                date: new Date().toISOString(), 
                type: invoice.type,
                currency: invoice.currency,
                customer: invoice.customer, 
                products: invoice.products, 
                prices: invoice.prices, 
                discount: invoice.discount, 
                advancePayment: invoice.advancePayment, 
                warranty: invoice.warranty,
                shipping: invoice.shipping,
                paymentTerms: invoice.paymentTerms,
                deliveryTerms: invoice.deliveryTerms,
                extraInfo: invoice.extraInfo,
                subtotal: calculateSubtotal(),
                discountValue: invoice.discount.value, 
                totalAfterDiscount: calculateSubtotal() - invoice.discount.value,
                advancePaid: invoice.advancePayment.apply ? invoice.advancePayment.amount : 0,
                grandTotal: calculateGrandTotal(true) 
            };
            
            if (InvoiceDB.invoices && typeof InvoiceDB.invoices.add === 'function') {
                const savedInvoice = InvoiceDB.invoices.add(invoiceDataToSave);
                console.log(`Invoice saved successfully with ID: ${savedInvoice.id}, Number: ${finalInvoiceNumber}`);

                const invoiceNumberElement = document.getElementById('invoice-number');
                if (invoiceNumberElement) {
                    invoiceNumberElement.textContent = finalInvoiceNumber; 
                }
                
                if (successModalInstance) {
                    successModalInstance.show();
                } else {
                    alert(`Invoice ${finalInvoiceNumber} created successfully!`); 
                }

            } else {
                console.error("InvoiceDB.invoices.add function not available. Invoice could not be saved to database.");
                alert("Error: Could not save invoice to the database. Please check console.");
            }
            
        } catch (error) {
            console.error("Error finalizing and saving invoice:", error);
            alert("An error occurred while saving the invoice: " + error.message);
        }
    }
	 // PDF oluşturma (pdfgenerator.js kullanarak)
	function generatePDF() {
		console.log("Generating PDF using PDFGenerator...");

		// 1. Invoice verilerini hazırlayın
		const invoiceData = {
			invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
			type: invoice.type,
			currency: invoice.currency,
			customer: invoice.customer,
			items: invoice.products.map(product => ({
				...product,
				unitPrice: invoice.prices[product.id] || 0,
				totalPrice: (invoice.prices[product.id] || 0) * product.quantity,
				image: product.image || '' // Resim yolunu ekle
			})),
			subtotal: calculateSubtotal(),
			discount: {
				applied: invoice.discount.apply,
				total: invoice.discount.value
			},
			advancePayment: {
				applied: invoice.advancePayment.apply,
				amount: invoice.advancePayment.amount
			},
			grandTotal: calculateGrandTotal(),
			warranty: invoice.warranty,
			shipping: invoice.shipping,
			paymentTerms: invoice.paymentTerms,
			deliveryTerms: invoice.deliveryTerms,
			extraInfo: invoice.extraInfo
		};

		// 2. PDFGenerator ile PDF oluştur
		const result = PDFGenerator.generatePDF(invoiceData);

		// 3. PDF'yi kaydet
		if (result && !result.error) {
			result.doc.save(result.fileName);
		} else {
			console.error("PDF oluşturma hatası:", result.message);
			alert("PDF oluşturulamadı! Hata: " + result.message);
		}
	}
    
    // --- Hesaplama Yardımcıları ---

    function calculateSubtotal() {
        return invoice.products.reduce((total, product) => {
            const price = invoice.prices[product.id] || 0;
            return total + (price * product.quantity);
        }, 0);
    }
    
    function calculateGrandTotal(includeAdvance = true) {
        const subtotal = calculateSubtotal();
        const discountValue = (invoice.discount.apply && invoice.discount.value > 0) ? invoice.discount.value : 0;
        const totalAfterDiscount = subtotal - discountValue;
        let finalTotal = totalAfterDiscount;
        if (includeAdvance) {
             const advanceValue = (invoice.advancePayment.apply && invoice.advancePayment.amount > 0)
                                 ? Math.max(0, invoice.advancePayment.amount)
                                 : 0;
             finalTotal = totalAfterDiscount - Math.min(advanceValue, totalAfterDiscount);
        }
        return Math.max(0, finalTotal); 
    }

     function formatCurrency(value) {
         const symbol = currencySymbols[invoice.currency] || '';
         const numValue = typeof value === 'number' ? value : 0;
         return `${symbol}${numValue.toFixed(2)}`;
     }
    
    // --- HTML Güvenlik Yardımcısı ---
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // --- Uygulamayı Başlat ---
    initApp();
});