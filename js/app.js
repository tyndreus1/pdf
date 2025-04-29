// Invoice Generator Ana Uygulaması
document.addEventListener('DOMContentLoaded', function() {
    console.log("Document loaded - Versiyon 5.1");
    
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
        products: [],
        prices: {},
        discount: {
            apply: false,
            type: 'percentage',
            amount: 0,
            value: 0
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
    
    // Modal nesneleri
    const quantityModal = new bootstrap.Modal(document.getElementById('quantity-modal'));
    const successModal = new bootstrap.Modal(document.getElementById('success-modal'));
    
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
                if (currentStep < totalSteps) {
                    if (validateStep(currentStep)) {
                        showStep(currentStep + 1);
                    }
                } else {
                    // Son adım, faturayı tamamla
                    finalizeInvoice();
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
        }
        
        // Güncellenen adımı kaydet
        currentStep = stepNumber;
        
        // Navigasyon butonlarını güncelle
        updateNavigationButtons();
        
        // İlerleme çubuğunu güncelle
        updateProgressBar();
        
        // Adım içeriğini güncelle
        updateStepContent(stepNumber);
        
        console.log(`Adım değiştirildi: ${stepNumber}`);
    }
    
    // Navigasyon butonlarını güncelleme
    function updateNavigationButtons() {
        if (prevBtn) {
            prevBtn.disabled = currentStep === 1;
        }
        
        if (nextBtn) {
            if (currentStep === totalSteps) {
                nextBtn.innerHTML = 'Finalize <i class="fas fa-check ms-2"></i>';
            } else {
                nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right ms-2"></i>';
            }
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
    
    // Adım içeriklerini güncelleme
    function updateStepContent(stepNumber) {
        switch (stepNumber) {
            case 1:
                // Fatura tipi seçimi
                highlightSelectedCard('invoice type', invoice.type);
                break;
            case 2:
                // Para birimi seçimi
                highlightSelectedCard('currency', invoice.currency);
                break;
            case 3:
                // Müşteri seçimi
                loadCustomers();
                break;
            case 4:
                // Ürün seçimi
                renderProductList();
                setupProductSearch();
				    // Manuel tab sistemini etkinleştir
				setupManualTabs();
				// Tab sistemini aktifleştir
				activateProductTabs();
                break;
            case 5:
                // Fiyat belirleme
                renderPriceTable();
                break;
            case 6:
                // İndirim
                updateDiscountSection();
                break;
            case 7:
                // Avans ödemesi
                updateAdvanceSection();
                break;
            case 8:
                // Ek bilgiler
                // Bu adım için özel bir güncelleme gerekmez
                break;
            case 9:
                // Önizleme
                renderInvoicePreview();
                break;
        }
    }
    
	// Yeni fonksiyon ekleyin
	function activateProductTabs() {
		console.log("Activating product tabs...");
		
		// İlk sekmeyi aktifleştir - All Products
		const allProductsTab = document.getElementById('all-products');
		const allProductsTabBtn = document.getElementById('all-tab');
		
		if (allProductsTab) {
			// Tüm tab panellerinden active class'ını kaldır
			document.querySelectorAll('.tab-pane').forEach(tab => {
				tab.classList.remove('show', 'active');
			});
			
			// Tüm tab butonlarından active class'ını kaldır
			document.querySelectorAll('[role="tab"]').forEach(tab => {
				tab.classList.remove('active');
				tab.setAttribute('aria-selected', 'false');
			});
			
			// İlk sekme ve butonunu aktif yap
			allProductsTab.classList.add('show', 'active');
			if (allProductsTabBtn) {
				allProductsTabBtn.classList.add('active');
				allProductsTabBtn.setAttribute('aria-selected', 'true');
			}
		}
		
		// Tab butonlarına tekrardan event listener ekle
		document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tabEl => {
			tabEl.addEventListener('click', function(event) {
				event.preventDefault();
				
				// Tıklanan tab'ı al
				const target = document.querySelector(this.getAttribute('data-bs-target') || this.getAttribute('href'));
				
				// Tüm tab'lardan active class'ını kaldır
				document.querySelectorAll('.tab-pane').forEach(tab => {
					tab.classList.remove('show', 'active');
				});
				
				// Tüm tab butonlarından active class'ını kaldır
				document.querySelectorAll('[role="tab"]').forEach(tab => {
					tab.classList.remove('active');
					tab.setAttribute('aria-selected', 'false');
				});
				
				// Hedef tab'ı aktifleştir
				if (target) {
					target.classList.add('show', 'active');
					this.classList.add('active');
					this.setAttribute('aria-selected', 'true');
				}
			});
		});
	}
	
	// Manuel tab sistemi
	function setupManualTabs() {
		console.log("Setting up manual tab system");
		
		const tabButtons = document.querySelectorAll('#product-tabs .nav-link');
		
		tabButtons.forEach(button => {
			button.addEventListener('click', function() {
				// Tüm butonlardan active sınıfını kaldır
				tabButtons.forEach(btn => btn.classList.remove('active'));
				
				// Tıklanan butonu aktifleştir
				this.classList.add('active');
				
				// Tüm tab panellerini gizle
				document.querySelectorAll('.tab-pane').forEach(panel => {
					panel.classList.remove('active');
					panel.style.display = 'none';
				});
				
				// İlgili tab panelini göster
				const targetId = this.getAttribute('data-bs-tab');
				const targetPanel = document.getElementById(targetId);
				if (targetPanel) {
					targetPanel.classList.add('active');
					targetPanel.style.display = 'block';
				}
			});
		});
		
		// İlk sefer sayfa yüklendiğinde ilk tabı aktifleştir
		const firstTab = document.querySelector('#all-products');
		if (firstTab) {
			firstTab.classList.add('active');
			firstTab.style.display = 'block';
		}
	}
	
		// Güçlü tab geçiş sistemi
	function setupRobustTabs() {
		console.log("Setting up robust tab system");
		
		// Tab butonları
		const tabButtons = document.querySelectorAll('[data-bs-toggle="tab"], [data-bs-tab], [role="tab"]');
		
		// Sayfa ilk yüklendiğinde
		window.addEventListener('load', function() {
			// İlk tabı aktifleştir
			activateTab('all-products');
		});
		
		// Tab tıklamalarını dinle
		tabButtons.forEach(button => {
			button.addEventListener('click', function(e) {
				e.preventDefault();
				
				// Hedef tab ID'sini al
				let targetId;
				if (this.hasAttribute('data-bs-target')) {
					targetId = this.getAttribute('data-bs-target').replace('#', '');
				} else if (this.hasAttribute('href')) {
					targetId = this.getAttribute('href').replace('#', '');
				} else if (this.hasAttribute('data-bs-tab')) {
					targetId = this.getAttribute('data-bs-tab');
				}
				
				if (targetId) {
					activateTab(targetId);
				}
			});
		});
		
		// Tab aktifleştirme fonksiyonu
		function activateTab(tabId) {
			console.log(`Activating tab: ${tabId}`);
			
			// Tüm tab panellerini gizle ve aktif sınıfını kaldır
			document.querySelectorAll('.tab-pane').forEach(panel => {
				panel.style.display = 'none';
				panel.classList.remove('active', 'show');
			});
			
			// Tüm tab butonlarını pasif yap
			tabButtons.forEach(btn => {
				btn.classList.remove('active');
				if (btn.hasAttribute('aria-selected')) {
					btn.setAttribute('aria-selected', 'false');
				}
			});
			
			// Hedef paneli göster ve aktifleştir
			const targetPanel = document.getElementById(tabId);
			if (targetPanel) {
				targetPanel.style.display = 'block';
				targetPanel.classList.add('active', 'show');
			}
			
			// İlgili butonu aktifleştir
			const relatedBtn = findTabButtonForPanel(tabId);
			if (relatedBtn) {
				relatedBtn.classList.add('active');
				if (relatedBtn.hasAttribute('aria-selected')) {
					relatedBtn.setAttribute('aria-selected', 'true');
				}
			}
		}
		
		// Panel ID'sine göre ilgili tab butonunu bul
		function findTabButtonForPanel(panelId) {
			let button = null;
			
			// data-bs-target özelliği ile arama
			button = document.querySelector(`[data-bs-target="#${panelId}"]`);
			if (button) return button;
			
			// href özelliği ile arama
			button = document.querySelector(`[href="#${panelId}"]`);
			if (button) return button;
			
			// data-bs-tab özelliği ile arama
			button = document.querySelector(`[data-bs-tab="${panelId}"]`);
			if (button) return button;
			
			return null;
		}
		
		// İlk tab aktifleştirmesini yap
		setTimeout(() => {
			activateTab('all-products');
			console.log('Initial tab activation completed');
		}, 500);
	}
		
	
    // Adım doğrulama
    function validateStep(stepNumber) {
        switch (stepNumber) {
            case 1:
                // Fatura tipi seçilmiş mi?
                if (!invoice.type) {
                    alert("Please select an invoice type.");
                    return false;
                }
                return true;
                
            case 2:
                // Para birimi seçilmiş mi?
                if (!invoice.currency) {
                    alert("Please select a currency.");
                    return false;
                }
                return true;
                
            case 3:
                // Müşteri seçilmiş mi?
                if (!invoice.customer) {
                    alert("Please select a customer or create a new one.");
                    return false;
                }
                return true;
                
            case 4:
                // Ürünler seçilmiş mi?
                if (invoice.products.length === 0) {
                    alert("Please select at least one product.");
                    return false;
                }
                return true;
                
            case 5:
                // Her ürünün fiyatı belirlenmiş mi?
                const allPricesSet = invoice.products.every(product => {
                    return invoice.prices[product.id] && invoice.prices[product.id] > 0;
                });
                
                if (!allPricesSet) {
                    alert("Please set prices for all products.");
                    return false;
                }
                return true;
                
            default:
                return true;
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
        console.log(`Found ${invoiceTypeCards.length} invoice type cards`);
        
        invoiceTypeCards.forEach(card => {
            card.addEventListener('click', function() {
                const value = this.getAttribute('data-value');
                invoice.type = value;
                
                // Seçilen kartı vurgula
                document.querySelectorAll('#step-1 .selection-card').forEach(c => {
                    c.classList.remove('selected');
                });
                this.classList.add('selected');
                
                console.log(`Invoice type selected: ${value}`);
            });
        });
    }
    
    // Para birimi seçimi
    function bindCurrencySelection() {
        console.log("Binding currency selection events");
        const currencyCards = document.querySelectorAll('#step-2 .selection-card');
        console.log(`Found ${currencyCards.length} currency cards`);
        
        currencyCards.forEach(card => {
            card.addEventListener('click', function() {
                const value = this.getAttribute('data-value');
                invoice.currency = value;
                
                // Seçilen kartı vurgula
                document.querySelectorAll('#step-2 .selection-card').forEach(c => {
                    c.classList.remove('selected');
                });
                this.classList.add('selected');
                
                console.log(`Currency selected: ${value}`);
            });
        });
    }
    
    // Seçilen kartları vurgulama
    function highlightSelectedCard(type, value) {
        let selector;
        
        switch (type) {
            case 'invoice type':
                selector = '#step-1 .selection-card';
                break;
            case 'currency':
                selector = '#step-2 .selection-card';
                break;
            default:
                return;
        }
        
        const cards = document.querySelectorAll(selector);
        cards.forEach(card => {
            if (card.getAttribute('data-value') === value) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });
    }
    
    // Müşteri olayları
    function bindCustomerEvents() {
        // Tab butonlarına olay ekle
        const tabBtns = document.querySelectorAll('#step-3 .tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                
                // Sekme butonlarını güncelle
                tabBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                
                // İçeriği göster/gizle
                document.querySelectorAll('#step-3 .tab-content').forEach(tab => {
                    tab.classList.remove('active');
                });
                document.getElementById(tabId).classList.add('active');
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
    }
    
    // Müşterileri yükleme
    function loadCustomers() {
        const customerList = document.getElementById('customer-list');
        if (!customerList) return;
        
        customerList.innerHTML = '';
        
        const customers = InvoiceDB.customers.getAll();
        
        if (customers.length === 0) {
            customerList.innerHTML = '<div class="alert alert-info">No customers found. Create a new customer.</div>';
            return;
        }
        
        customers.forEach(customer => {
            const customerItem = document.createElement('div');
            customerItem.className = 'customer-item';
            if (invoice.customer && invoice.customer.id === customer.id) {
                customerItem.classList.add('selected');
            }
            
            customerItem.innerHTML = `
                <div class="customer-name">${escapeHtml(customer.name)}</div>
                <div class="customer-details">
                    <div>${escapeHtml(customer.address)}</div>
                    ${customer.email ? `<div>${escapeHtml(customer.email)}</div>` : ''}
                    ${customer.phone ? `<div>${escapeHtml(customer.phone)}</div>` : ''}
                </div>
            `;
            
            customerItem.addEventListener('click', function() {
                // Müşteriyi seç
                invoice.customer = customer;
                
                // Seçilen müşteriyi vurgula
                document.querySelectorAll('.customer-item').forEach(item => {
                    item.classList.remove('selected');
                });
                this.classList.add('selected');
                
                console.log(`Customer selected: ${customer.id}`);
            });
            
            customerList.appendChild(customerItem);
        });
    }
    
    // Müşteri filtreleme
    function filterCustomers(searchTerm) {
        const customerItems = document.querySelectorAll('.customer-item');
        
        customerItems.forEach(item => {
            const name = item.querySelector('.customer-name').textContent.toLowerCase();
            const details = item.querySelector('.customer-details').textContent.toLowerCase();
            
            if (name.includes(searchTerm) || details.includes(searchTerm)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    // Yeni müşteri ekleme
    function addNewCustomer() {
        const nameInput = document.getElementById('customer-name');
        const addressInput = document.getElementById('customer-address');
        const emailInput = document.getElementById('customer-email');
        const phoneInput = document.getElementById('customer-phone');
        const notesInput = document.getElementById('customer-notes');
        
        if (!nameInput || !addressInput) return;
        
        const customerData = {
            name: nameInput.value,
            address: addressInput.value,
            email: emailInput ? emailInput.value : '',
            phone: phoneInput ? phoneInput.value : '',
            notes: notesInput ? notesInput.value : ''
        };
        
        try {
            const newCustomer = InvoiceDB.customers.add(customerData);
            console.log(`New customer added: ${newCustomer.id}`);
            
            // Yeni müşteriyi seç
            invoice.customer = newCustomer;
            
            // Formu sıfırla
            document.getElementById('new-customer-form').reset();
            
            // Mevcut müşteri sekmesine geç
            document.querySelector('#step-3 .tab-btn[data-tab="existing-customer"]').click();
            
            // Müşteri listesini yenile
            loadCustomers();
            
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
                    alert("Please enter a valid quantity.");
                    return;
                }
                
                addProductToInvoice(selectedProductForModal, quantity);
                quantityModal.hide();
            });
        }
    }
    
	// Ürünleri gösterme işlevi - Düzeltilmiş versiyon
	function renderProductList() {
		console.log("Rendering product list...");
		
		// Ürünleri kategorilerine göre ayır ve ilgili div'lere ekle
		const allProductList = document.getElementById('all-product-list');
		const rainboProductList = document.getElementById('rainbo-product-list');
		const laserProductList = document.getElementById('laser-product-list');
		const combineProductList = document.getElementById('combine-product-list');
		const mouldProductList = document.getElementById('mould-product-list');
		const otherProductList = document.getElementById('other-product-list');
		
		if (!allProductList) {
			console.error("Element with ID 'all-product-list' not found");
			return;
		}
		
		// Tüm ürün listelerini temizle
		allProductList.innerHTML = '';
		if (rainboProductList) rainboProductList.innerHTML = '';
		if (laserProductList) laserProductList.innerHTML = '';
		if (combineProductList) combineProductList.innerHTML = '';
		if (mouldProductList) mouldProductList.innerHTML = '';
		if (otherProductList) otherProductList.innerHTML = '';
		
		// Ürünleri veritabanından al
		const products = InvoiceDB.products.getAll();
		console.log("Products from database:", products);
		
		if (products.length === 0) {
			allProductList.innerHTML = '<div class="col-12 text-center py-5">No products available.</div>';
			return;
		}
		
		// Kategorilere göre grupla
		const categories = {
			'all': [],
			'Rainbo Series': [],
			'Laser Series': [],
			'Combine Series': [],
			'Mould': [],
			'Other': []
		};
		
		products.forEach(product => {
			// Tüm ürünler listesine ekle
			categories['all'].push(product);
			
			// Kategoriyi normalize et - boşlukları ve büyük/küçük harf farklılıklarını ele almak için
			const category = product.category ? product.category.trim() : '';
			
			// İlgili kategoriye ekle
			if (category === 'Rainbo Series' || category === 'Rainbo' || category === 'rainbo') {
				categories['Rainbo Series'].push(product);
			} else if (category === 'Laser Series' || category === 'Laser' || category === 'laser') {
				categories['Laser Series'].push(product);
			} else if (category === 'Combine Series' || category === 'Combine' || category === 'combine') {
				categories['Combine Series'].push(product);
			} else if (category === 'Mould' || category === 'mould') {
				categories['Mould'].push(product);
			} else {
				categories['Other'].push(product);
			}
		});
		
		console.log("Categorized products:", categories);
		
		// Tüm ürünler için ürün kartları oluştur
		renderProductItems(allProductList, categories['all']);
		
		// Her kategori için ayrı ürün kartları oluştur
		if (rainboProductList) renderProductItems(rainboProductList, categories['Rainbo Series']);
		if (laserProductList) renderProductItems(laserProductList, categories['Laser Series']);
		if (combineProductList) renderProductItems(combineProductList, categories['Combine Series']);
		if (mouldProductList) renderProductItems(mouldProductList, categories['Mould']);
		if (otherProductList) renderProductItems(otherProductList, categories['Other']);
	}

	// Ürün öğelerini oluştur - Düzeltilmiş versiyon
	function renderProductItems(container, products) {
		console.log(`Rendering ${products.length} products to container:`, container);
		
		if (products.length === 0) {
			container.innerHTML = '<div class="col-12 text-center py-5">No products in this category.</div>';
			return;
		}
		
		// Ürünleri iki sütunda listelemek için
		for (let i = 0; i < products.length; i += 2) {
			const rowDiv = document.createElement('div');
			rowDiv.className = 'row mb-3';
			
			// İlk ürün
			const col1 = document.createElement('div');
			col1.className = 'col-md-6';
			col1.appendChild(createProductItem(products[i]));
			rowDiv.appendChild(col1);
			
			// İkinci ürün (eğer varsa)
			if (i + 1 < products.length) {
				const col2 = document.createElement('div');
				col2.className = 'col-md-6';
				col2.appendChild(createProductItem(products[i + 1]));
				rowDiv.appendChild(col2);
			}
			
			container.appendChild(rowDiv);
		}
	}
    
    // Tekil ürün öğesi oluştur
    function createProductItem(product) {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        productItem.dataset.id = product.id;
        
        // Kategori sınıfını belirle
        let categoryClass = 'other';
        if (product.category === 'Rainbo Series') categoryClass = 'rainbo';
        else if (product.category === 'Laser Series') categoryClass = 'laser';
        else if (product.category === 'Combine Series') categoryClass = 'combine';
        else if (product.category === 'Mould') categoryClass = 'mould';
        
        productItem.innerHTML = `
            <div class="product-name">${escapeHtml(product.name)}</div>
            <div class="product-description">${escapeHtml(product.description)}</div>
            <div class="product-category ${categoryClass}">${escapeHtml(product.category || 'Other')}</div>
        `;
        
        // Ürün seçme olayı
        productItem.addEventListener('click', function() {
            showQuantityModal(product);
        });
        
        return productItem;
    }
    
    // Miktar seçme modalını göster
    function showQuantityModal(product) {
        const modalProductName = document.getElementById('modal-product-name');
        const modalQuantity = document.getElementById('modal-quantity');
        
        if (!modalProductName || !modalQuantity) return;
        
        // Global değişkene ürünü kaydet
        selectedProductForModal = product;
        
        // Modal içeriğini güncelle
        modalProductName.textContent = product.name;
        modalQuantity.value = 1;
        
        // Modalı göster
        quantityModal.show();
    }
    
    // Ürün arama işlevi
    function setupProductSearch() {
        const productSearch = document.getElementById('product-search');
        if (!productSearch) return;
        
        productSearch.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const allProductList = document.getElementById('all-product-list');
            
            if (!allProductList) return;
            
            // Tüm ürün öğelerini kontrol et
            const productItems = allProductList.querySelectorAll('.product-item');
            
            productItems.forEach(item => {
                const productName = item.querySelector('.product-name').textContent.toLowerCase();
                const productDescription = item.querySelector('.product-description').textContent.toLowerCase();
                
                if (productName.includes(searchTerm) || productDescription.includes(searchTerm)) {
                    item.closest('.row').style.display = '';
                } else {
                    item.closest('.row').style.display = 'none';
                }
            });
        });
    }
    
    // Manuel ürün ekleme
    function addManualProduct() {
        const nameInput = document.getElementById('product-name');
        const quantityInput = document.getElementById('product-quantity');
        
        if (!nameInput || !quantityInput) return;
        
        const name = nameInput.value.trim();
        const quantity = parseInt(quantityInput.value);
        
        if (!name) {
            alert("Please enter product name.");
            return;
        }
        
        if (isNaN(quantity) || quantity < 1) {
            alert("Please enter a valid quantity.");
            return;
        }
        
        // Manuel ürün oluştur
        const manualProduct = {
            id: `manual-${Date.now()}`, // Benzersiz ID
            name: name,
            description: 'Manually added product',
            isManual: true
        };
        
        // Ürünü faturaya ekle
        addProductToInvoice(manualProduct, quantity);
        
        // Formu sıfırla
        nameInput.value = '';
        quantityInput.value = 1;
    }
    
    // Ürünü faturaya ekle
    function addProductToInvoice(product, quantity) {
        // Ürün zaten ekli mi kontrol et
        const existingProductIndex = invoice.products.findIndex(p => p.id === product.id);
        
        if (existingProductIndex !== -1) {
            // Ürün zaten ekli, miktarını güncelle
            invoice.products[existingProductIndex].quantity += quantity;
        } else {
            // Yeni ürün ekle
            const productWithQuantity = {
                ...product,
                quantity: quantity
            };
            
            invoice.products.push(productWithQuantity);
        }
        
        console.log(`Product added to invoice: ${product.name}, quantity: ${quantity}`);
        
        // Seçilen ürünler tablosunu güncelle
        updateSelectedProductsTable();
    }
    
    // Seçilen ürünler tablosunu güncelle
    function updateSelectedProductsTable() {
        const selectedProductsTable = document.getElementById('selected-products-tbody');
        if (!selectedProductsTable) return;
        
        // Tabloyu temizle
        selectedProductsTable.innerHTML = '';
        
        if (invoice.products.length === 0) {
            selectedProductsTable.innerHTML = '<tr class="no-products-row"><td colspan="3" class="text-center">No products selected yet</td></tr>';
            return;
        }
        
        // Ürünleri tabloya ekle
        invoice.products.forEach((product, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHtml(product.name)}</td>
                <td>${product.quantity}</td>
                <td class="table-action">
                    <button type="button" class="btn-remove" data-index="${index}" title="Remove">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            `;
            selectedProductsTable.appendChild(row);
        });
        
        // Silme butonlarına event listener ekle
        document.querySelectorAll('.btn-remove').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                removeProductFromInvoice(index);
            });
        });
    }
    
    // Ürünü faturadan kaldır
    function removeProductFromInvoice(index) {
        if (index < 0 || index >= invoice.products.length) return;
        
        const removedProduct = invoice.products[index];
        invoice.products.splice(index, 1);
        
        console.log(`Product removed from invoice: ${removedProduct.name}`);
        
        // Ürün fiyatını da kaldır
        if (invoice.prices[removedProduct.id]) {
            delete invoice.prices[removedProduct.id];
        }
        
        // Seçilen ürünler tablosunu güncelle
        updateSelectedProductsTable();
    }
    
    // Fiyat olayları
    function bindPriceEvents() {
        // Fiyat tablosu güncellendiğinde gerekli işlemler
        document.addEventListener('input', function(e) {
            if (e.target && e.target.classList.contains('price-input')) {
                const productId = e.target.getAttribute('data-product-id');
                const price = parseFloat(e.target.value);
                
                if (!isNaN(price) && price >= 0) {
                    invoice.prices[productId] = price;
                    updatePriceRowTotal(productId);
                }
            }
        });
    }
    
    // Fiyat tablosunu oluştur
    function renderPriceTable() {
        const priceTableBody = document.getElementById('price-table-tbody');
        if (!priceTableBody) return;
        
        // Tabloyu temizle
        priceTableBody.innerHTML = '';
        
        if (invoice.products.length === 0) {
            priceTableBody.innerHTML = '<tr><td colspan="4" class="text-center">No products selected</td></tr>';
            return;
        }
        
        // Para birimi sembolü
        const currencySymbol = currencySymbols[invoice.currency] || '';
        
        // Ürünleri tabloya ekle
        invoice.products.forEach(product => {
            const row = document.createElement('tr');
            row.id = `price-row-${product.id}`;
            
            const currentPrice = invoice.prices[product.id] || 0;
            
            row.innerHTML = `
                <td>${escapeHtml(product.name)}</td>
                <td>${product.quantity}</td>
                <td>
                    <div class="input-group">
                        <span class="input-group-text">${currencySymbol}</span>
                        <input type="number" class="form-control price-input" data-product-id="${product.id}" value="${currentPrice}" min="0" step="0.01">
                    </div>
                </td>
                <td class="price-total">${currencySymbol}${(currentPrice * product.quantity).toFixed(2)}</td>
            `;
            
            priceTableBody.appendChild(row);
            
            // Fiyatı kaydet
            if (!invoice.prices[product.id]) {
                invoice.prices[product.id] = 0;
            }
        });
    }
    
    // Fiyat satırı toplamını güncelle
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
    
    // İndirim olayları
    function bindDiscountEvents() {
        // İndirim uygulama radio butonları
        const discountRadios = document.querySelectorAll('input[name="discount-apply"]');
        discountRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                const applyDiscount = this.value === 'yes';
                invoice.discount.apply = applyDiscount;
                
                // İndirim alanlarını göster/gizle
                const discountFields = document.getElementById('discount-fields');
                if (discountFields) {
                    discountFields.classList.toggle('d-none', !applyDiscount);
                }
                
                // İndirim değerini güncelle
                updateDiscountValue();
            });
        });
        
        // İndirim tipi radio butonları
        const discountTypeRadios = document.querySelectorAll('input[name="discount-type"]');
        discountTypeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                invoice.discount.type = this.value;
                
                // Sembolü güncelle
                const discountSymbol = document.getElementById('discount-symbol');
                if (discountSymbol) {
                    discountSymbol.textContent = this.value === 'percentage' ? '%' : currencySymbols[invoice.currency] || '';
                }
                
                // İndirim değerini güncelle
                updateDiscountValue();
            });
        });
        
        // İndirim miktarı input
        const discountAmountInput = document.getElementById('discount-amount');
        if (discountAmountInput) {
            discountAmountInput.addEventListener('input', function() {
                const amount = parseFloat(this.value);
                invoice.discount.amount = isNaN(amount) ? 0 : amount;
                
                // İndirim değerini güncelle
                updateDiscountValue();
            });
        }
    }
    
    // İndirim bölümünü güncelle
    function updateDiscountSection() {
        // Para birimi sembollerini güncelle
        const currencySymbol = currencySymbols[invoice.currency] || '';
        const currencySymbolElements = document.querySelectorAll('[id^="currency-symbol-"]');
        currencySymbolElements.forEach(el => {
            el.textContent = currencySymbol;
        });
        
        // Alt toplamı güncelle
        const subtotal = calculateSubtotal();
        const subtotalEl = document.getElementById('subtotal');
        if (subtotalEl) {
            subtotalEl.textContent = subtotal.toFixed(2);
        }
        
        // İndirim tipi sembolünü güncelle
        const discountSymbol = document.getElementById('discount-symbol');
        if (discountSymbol) {
            discountSymbol.textContent = invoice.discount.type === 'percentage' ? '%' : currencySymbol;
        }
        
        // İndirim uygula radio butonunu seç
        const discountYesRadio = document.getElementById('discount-yes');
        const discountNoRadio = document.getElementById('discount-no');
        if (discountYesRadio && discountNoRadio) {
            discountYesRadio.checked = invoice.discount.apply;
            discountNoRadio.checked = !invoice.discount.apply;
        }
        
        // İndirim alanlarını göster/gizle
        const discountFields = document.getElementById('discount-fields');
        if (discountFields) {
            discountFields.classList.toggle('d-none', !invoice.discount.apply);
        }
        
        // İndirim tipi radio butonlarını güncelle
        const discountPercentageRadio = document.getElementById('discount-percentage');
        const discountValueRadio = document.getElementById('discount-value');
        if (discountPercentageRadio && discountValueRadio) {
            discountPercentageRadio.checked = invoice.discount.type === 'percentage';
            discountValueRadio.checked = invoice.discount.type === 'value';
        }
        
        // İndirim miktarı giriş alanını güncelle
        const discountAmountInput = document.getElementById('discount-amount');
        if (discountAmountInput) {
            discountAmountInput.value = invoice.discount.amount;
        }
        
        // İndirim değerlerini güncelle
        updateDiscountValue();
    }
    
    // İndirim değerini güncelle
    function updateDiscountValue() {
        const subtotal = calculateSubtotal();
        let discountValue = 0;
        
        if (invoice.discount.apply) {
            if (invoice.discount.type === 'percentage') {
                discountValue = (subtotal * invoice.discount.amount) / 100;
            } else {
                discountValue = invoice.discount.amount;
            }
        }
        
        // İndirim değerini sakla
        invoice.discount.value = discountValue;
        
        // İndirim ve indirim sonrası toplamı güncelle
        const discountTotalEl = document.getElementById('discount-total');
        const totalAfterDiscountEl = document.getElementById('total-after-discount');
        
        if (discountTotalEl) {
            discountTotalEl.textContent = discountValue.toFixed(2);
        }
        
        if (totalAfterDiscountEl) {
            const totalAfterDiscount = subtotal - discountValue;
            totalAfterDiscountEl.textContent = totalAfterDiscount.toFixed(2);
        }
    }
    
    // Avans ödemesi olayları
    function bindAdvancePaymentEvents() {
        // Avans ödemesi uygulama radio butonları
        const advanceRadios = document.querySelectorAll('input[name="advance-apply"]');
        advanceRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                const applyAdvance = this.value === 'yes';
                invoice.advancePayment.apply = applyAdvance;
                
                // Avans alanlarını göster/gizle
                const advanceFields = document.getElementById('advance-fields');
                if (advanceFields) {
                    advanceFields.classList.toggle('d-none', !applyAdvance);
                }
                
                // Avans ödemesi satırını göster/gizle
                const advanceRow = document.querySelector('.advance-row');
                if (advanceRow) {
                    advanceRow.classList.toggle('d-none', !applyAdvance);
                }
                
                // Avans değerini güncelle
                updateAdvanceValue();
            });
        });
        
        // Avans miktarı input
        const advanceAmountInput = document.getElementById('advance-amount');
        if (advanceAmountInput) {
            advanceAmountInput.addEventListener('input', function() {
                const amount = parseFloat(this.value);
                invoice.advancePayment.amount = isNaN(amount) ? 0 : amount;
                
                // Avans değerini güncelle
                updateAdvanceValue();
            });
        }
    }
    
    // Avans ödemesi bölümünü güncelle
    function updateAdvanceSection() {
        // Para birimi sembollerini güncelle
        const currencySymbol = currencySymbols[invoice.currency] || '';
        document.querySelectorAll('[id^="currency-symbol-"]').forEach(el => {
            el.textContent = currencySymbol;
        });
        
        // Avans para birimi sembolü
        const advanceCurrencySymbol = document.getElementById('advance-currency-symbol');
        if (advanceCurrencySymbol) {
            advanceCurrencySymbol.textContent = currencySymbol;
        }
        
        // Alt toplamı güncelle
        const subtotal = calculateSubtotal();
        const apSubtotalEl = document.getElementById('ap-subtotal');
        if (apSubtotalEl) {
            apSubtotalEl.textContent = subtotal.toFixed(2);
        }
        
        // İndirim varsa göster
        const discountRow = document.querySelector('.discount-row');
        if (discountRow) {
            const hasDiscount = invoice.discount.apply && invoice.discount.value > 0;
            discountRow.classList.toggle('d-none', !hasDiscount);
            
            const apDiscountTotalEl = document.getElementById('ap-discount-total');
            if (apDiscountTotalEl && hasDiscount) {
                apDiscountTotalEl.textContent = invoice.discount.value.toFixed(2);
            }
        }
        
        // Avans ödemesi radio butonlarını güncelle
        const advanceYesRadio = document.getElementById('advance-yes');
        const advanceNoRadio = document.getElementById('advance-no');
        if (advanceYesRadio && advanceNoRadio) {
            advanceYesRadio.checked = invoice.advancePayment.apply;
            advanceNoRadio.checked = !invoice.advancePayment.apply;
        }
        
        // Avans alanlarını göster/gizle
        const advanceFields = document.getElementById('advance-fields');
        if (advanceFields) {
            advanceFields.classList.toggle('d-none', !invoice.advancePayment.apply);
        }
        
        // Avans satırını göster/gizle
        const advanceRow = document.querySelector('.advance-row');
        if (advanceRow) {
            advanceRow.classList.toggle('d-none', !invoice.advancePayment.apply);
        }
        
        // Avans miktarı giriş alanını güncelle
        const advanceAmountInput = document.getElementById('advance-amount');
        if (advanceAmountInput) {
            advanceAmountInput.value = invoice.advancePayment.amount;
        }
        
        // Avans değerlerini güncelle
        updateAdvanceValue();
    }
    
    // Avans değerini güncelle
    function updateAdvanceValue() {
        const subtotal = calculateSubtotal();
        const totalAfterDiscount = subtotal - (invoice.discount.apply ? invoice.discount.value : 0);
        
        // Avans ödemesi ve son toplam
        const advanceTotalEl = document.getElementById('advance-total');
        const grandTotalEl = document.getElementById('grand-total');
        
        if (advanceTotalEl && invoice.advancePayment.apply) {
            advanceTotalEl.textContent = invoice.advancePayment.amount.toFixed(2);
        }
        
        if (grandTotalEl) {
            const grandTotal = totalAfterDiscount - (invoice.advancePayment.apply ? invoice.advancePayment.amount : 0);
            grandTotalEl.textContent = grandTotal.toFixed(2);
        }
    }
    
    // Ek bilgiler olayları
    function bindAdditionalInfoEvents() {
        // Garanti süresi
        const warrantySelect = document.getElementById('warranty-period');
        if (warrantySelect) {
            warrantySelect.addEventListener('change', function() {
                invoice.warranty = this.value;
            });
        }
        
        // Kargo dahil
        const shippingSelect = document.getElementById('shipping-included');
        if (shippingSelect) {
            shippingSelect.addEventListener('change', function() {
                invoice.shipping = this.value;
            });
        }
        
        // Ödeme koşulları
        const paymentTermsInput = document.getElementById('payment-terms');
        if (paymentTermsInput) {
            paymentTermsInput.addEventListener('input', function() {
                invoice.paymentTerms = this.value;
            });
        }
        
        // Teslimat koşulları
        const deliveryTermsInput = document.getElementById('delivery-terms');
        if (deliveryTermsInput) {
            deliveryTermsInput.addEventListener('input', function() {
                invoice.deliveryTerms = this.value;
            });
        }
        
        // Ek bilgiler
        const extraInfoInput = document.getElementById('extra-info');
        if (extraInfoInput) {
            extraInfoInput.addEventListener('input', function() {
                invoice.extraInfo = this.value;
            });
        }
    }
    
    // Önizleme olayları
    function bindPreviewEvents() {
        // Düzenleme butonu
        const editBtn = document.getElementById('edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', function() {
                // Adım 1'e dön
                showStep(1);
            });
        }
        
        // Kaydetme butonu
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', function() {
                finalizeInvoice();
            });
        }
        
        // PDF oluşturma butonu
        const generatePdfBtn = document.getElementById('generate-pdf-btn');
        if (generatePdfBtn) {
            generatePdfBtn.addEventListener('click', function() {
                generatePDF();
            });
        }
        
        // Başarı modalındaki PDF indirme butonu
        const downloadPdfBtn = document.getElementById('download-pdf');
        if (downloadPdfBtn) {
            downloadPdfBtn.addEventListener('click', function() {
                generatePDF();
            });
        }
    }
    
    // Fatura önizlemesi oluştur
    function renderInvoicePreview() {
        const previewElement = document.getElementById('invoice-preview');
        if (!previewElement) return;
        
        const currencySymbol = currencySymbols[invoice.currency] || '';
        const subtotal = calculateSubtotal();
        const discountValue = invoice.discount.apply ? invoice.discount.value : 0;
        const totalAfterDiscount = subtotal - discountValue;
        const advanceValue = invoice.advancePayment.apply ? invoice.advancePayment.amount : 0;
        const grandTotal = totalAfterDiscount - advanceValue;
        
        // Tarih formatı
        const now = new Date();
        const dateStr = now.toLocaleDateString();
        
        // Fatura tipi
        const invoiceTypeText = invoice.type === 'proforma' ? 'PROFORMA INVOICE' : 'INVOICE';
        
        // Şirket bilgileri (dummy)
        const companyName = "Your Company Name";
        const companyAddress = "Company Address, City, Country";
        const companyEmail = "info@yourcompany.com";
        const companyPhone = "+1 234 567 8900";
        
        // Ürün tablosu
        let productsTableHTML = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 5mm;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Product</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Quantity</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Unit Price</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        invoice.products.forEach(product => {
            const price = invoice.prices[product.id] || 0;
            const total = price * product.quantity;
            
            productsTableHTML += `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: left;">${escapeHtml(product.name)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${product.quantity}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${currencySymbol}${price.toFixed(2)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${currencySymbol}${total.toFixed(2)}</td>
                </tr>
            `;
        });
        
        // Toplam satırları
        productsTableHTML += `
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: right;"><strong>Subtotal:</strong></td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${currencySymbol}${subtotal.toFixed(2)}</td>
                    </tr>
        `;
        
        // İndirim satırı (varsa)
        if (invoice.discount.apply && discountValue > 0) {
            productsTableHTML += `
                <tr>
                    <td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: right;"><strong>Discount:</strong></td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">-${currencySymbol}${discountValue.toFixed(2)}</td>
                </tr>
                <tr>
                    <td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: right;"><strong>Total after discount:</strong></td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${currencySymbol}${totalAfterDiscount.toFixed(2)}</td>
                </tr>
            `;
        }
        
        // Avans ödemesi satırı (varsa)
        if (invoice.advancePayment.apply && advanceValue > 0) {
            productsTableHTML += `
                <tr>
                    <td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: right;"><strong>Advance Payment:</strong></td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">-${currencySymbol}${advanceValue.toFixed(2)}</td>
                </tr>
            `;
        }
        
        // Genel toplam
        productsTableHTML += `
                    <tr>
                        <td colspan="3" style="border: 1px solid #ddd; padding: 8px; text-align: right;"><strong>GRAND TOTAL:</strong></td>
                        <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold;">${currencySymbol}${grandTotal.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>
        `;
        
        // HTML içeriği
        previewElement.innerHTML = `
            <div class="company-logo">
                <img src="images/logo.png" alt="Company Logo">
            </div>
            
            <h2 class="invoice-title">${invoiceTypeText}</h2>
            
            <div class="invoice-info">
                <strong>Invoice #:</strong> INV-${Date.now().toString().slice(-6)}
            </div>
            
            <div class="invoice-date">
                <strong>Date:</strong> ${dateStr}
            </div>
            
            <div class="customer-section">
                <div class="customer-section-title">BILL TO:</div>
                <div class="customer-info">
                    ${escapeHtml(invoice.customer.name)}<br>
                    ${escapeHtml(invoice.customer.address)}<br>
                    ${invoice.customer.email ? escapeHtml(invoice.customer.email) + '<br>' : ''}
                    ${invoice.customer.phone ? escapeHtml(invoice.customer.phone) : ''}
                </div>
            </div>
            
            <div class="products-table">
                ${productsTableHTML}
            </div>
            
            <div class="terms-section">
                <div class="section-title">TERMS & CONDITIONS</div>
                <div style="font-size: 9pt;">
                    <p><strong>Warranty:</strong> ${escapeHtml(invoice.warranty)}</p>
                    <p><strong>Shipping:</strong> ${escapeHtml(invoice.shipping === 'included' ? 'Included in price' : 'Not included')}</p>
                    <p><strong>Payment Terms:</strong> ${escapeHtml(invoice.paymentTerms)}</p>
                    <p><strong>Delivery Terms:</strong> ${escapeHtml(invoice.deliveryTerms)}</p>
                    ${invoice.extraInfo ? `<p><strong>Additional Notes:</strong> ${escapeHtml(invoice.extraInfo)}</p>` : ''}
                </div>
            </div>
            
            <div class="company-section">
                <div class="section-title">COMPANY INFO</div>
                <div style="font-size: 9pt;">
                    <p><strong>${escapeHtml(companyName)}</strong></p>
                    <p>${escapeHtml(companyAddress)}</p>
                    <p>Email: ${escapeHtml(companyEmail)}</p>
                    <p>Phone: ${escapeHtml(companyPhone)}</p>
                </div>
            </div>
            
            <div class="footer-text">
                Thank you for your business!
            </div>
        `;
    }
    
    // Faturayı tamamla
    function finalizeInvoice() {
        console.log("Finalizing invoice...");
        
        // Oluşturma mantığı...
        
        // Fatura numarası
        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
        
        // Fatura kaydetme ve kayıt gösterme
        try {
            // Faturayı veritabanına kaydet
            if (InvoiceDB.invoices && typeof InvoiceDB.invoices.add === 'function') {
                const invoiceData = {
                    number: invoiceNumber,
                    type: invoice.type,
                    customer: invoice.customer,
                    products: invoice.products,
                    prices: invoice.prices,
                    currency: invoice.currency,
                    discount: invoice.discount,
                    advancePayment: invoice.advancePayment,
                    warranty: invoice.warranty,
                    shipping: invoice.shipping,
                    paymentTerms: invoice.paymentTerms,
                    deliveryTerms: invoice.deliveryTerms,
                    extraInfo: invoice.extraInfo,
                    subtotal: calculateSubtotal(),
                    total: calculateGrandTotal()
                };
                
                InvoiceDB.invoices.add(invoiceData);
                console.log(`Invoice saved: ${invoiceNumber}`);
            } else {
                console.warn("InvoiceDB.invoices.add not available, invoice not saved to database");
            }
            
            // Başarı mesajını göster
            const invoiceNumberElement = document.getElementById('invoice-number');
            if (invoiceNumberElement) {
                invoiceNumberElement.textContent = invoiceNumber;
            }
            
            successModal.show();
            
        } catch (error) {
            console.error("Error saving invoice:", error);
            alert("Error saving invoice: " + error.message);
        }
    }
    
    // PDF oluşturma
    function generatePDF() {
        const element = document.getElementById('invoice-preview');
        if (!element) return;
        
        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
        
        // html2pdf kütüphanesini kullan
        const opt = {
            margin: 0,
            filename: `invoice-${invoiceNumber}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // PDF oluştur ve indir
        html2pdf().set(opt).from(element).save();
    }
    
    // Alt toplam hesaplama
    function calculateSubtotal() {
        return invoice.products.reduce((total, product) => {
            const price = invoice.prices[product.id] || 0;
            return total + (price * product.quantity);
        }, 0);
    }
    
    // Genel toplam hesaplama
    function calculateGrandTotal() {
        const subtotal = calculateSubtotal();
        const discountValue = invoice.discount.apply ? invoice.discount.value : 0;
        const totalAfterDiscount = subtotal - discountValue;
        const advanceValue = invoice.advancePayment.apply ? invoice.advancePayment.amount : 0;
        return totalAfterDiscount - advanceValue;
    }
    
    // HTML içeriğini güvenli hale getirme
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // Uygulamayı başlat
    initApp();
});