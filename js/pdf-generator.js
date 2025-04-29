// PDF oluşturma işlemleri için JavaScript kütüphanesi
const PDFGenerator = {
    // Firma bilgileri - tek yerden güncellenebilir
    companyInfo: {
        name: "Alpress Kal. Dan. Ith. Ihr. San. Tic. Ltd. Sti.",
        address: "Seyitnizam Mh. Demirciler Sitesi 9.Cd. No26 Zeytinburnu Istanbul Turkiye",
        phone: "+90 212 416 65 05    +90 549 712 16 68",
        email: "alp@alpress.com.tr",
        web: "alpress.com.tr",
        // Para birimine göre banka hesapları
        bankAccounts: {
            EUR: {
                bank: "Euro Bank Name",
                accountHolder: "Alpress Kal. Dan. Ith. Ihr. San. Tic. Ltd. Sti.",
                iban: "TR00 0000 0000 0000 0000 0000 00",
                swift: "EURSWIFT"
            },
            USD: {
                bank: "US Dollar Bank Name",
                accountHolder: "Alpress Kal. Dan. Ith. Ihr. San. Tic. Ltd. Sti.",
                iban: "TR00 0000 0000 0000 0000 0000 01",
                swift: "USDSWIFT"
            },
            TL: {
                bank: "Turkish Lira Bank Name",
                accountHolder: "Alpress Kal. Dan. Ith. Ihr. San. Tic. Ltd. Sti.",
                iban: "TR00 0000 0000 0000 0000 0000 02",
                swift: "TRLSWIFT"
            }
        }
    },
    
    // Faturayı PDF olarak oluşturur
    generatePDF: function(invoiceData) {
        try {
            // jsPDF kütüphanesini kullanarak PDF oluşturalım
            const { jsPDF } = window.jspdf;
            
            // A4 boyutunda DİKEY PDF oluştur
            const doc = new jsPDF({
                orientation: 'portrait', // Dikey format
                unit: 'mm',
                format: 'a4'
            });
            
            // Modern font ekle
            doc.setFont("helvetica", "normal");
            
            // jsPDF ve autoTable'ın yüklü olduğundan emin olalım
            if (!doc.autoTable && window.jspdf.autoTable) {
                doc.autoTable = window.jspdf.autoTable.autoTable;
            }
            
            // Şirket logosu - dikey formata uygun konumlandırma
            try {
                // Logo yükseklik ve genişliği
                const logoWidth = 130; // mm
                const logoHeight = 80; // mm
                // Ortalamak için hesapla (A4 genişliği = 210mm)
                const xPosition = (210 - logoWidth) / 2;
                
                doc.addImage('images/logo.jpg', 'JPEG', xPosition, 10, logoWidth, logoHeight);
            } catch(e) {
                console.warn('Logo yüklenemedi:', e);
            }
            
            // Logo yüksek olduğu için alt kısımda kalan içerikleri aşağı kaydıralım
            let yPosition = 80; // Logo sonrası başlangıç
            
            // Başlık ve Fatura Numarası - İngilizce olarak değiştirildi ve sola yaslanmış
            const invoiceTitle = invoiceData.type === 'invoice' ? 'INVOICE' : 'PROFORMA INVOICE';
            doc.setFontSize(20);
            doc.setTextColor(220, 20, 60); // Kırmızı
            doc.text(invoiceTitle, 30, yPosition);
            
            // Fatura numarası ve tarih
            yPosition += 8;
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(`Invoice No: ${invoiceData.invoiceNumber || 'XXXX-XXXX'}`, 20, yPosition);
            
            yPosition += 5;
            doc.text(`Date: ${new Date().toLocaleDateString('en-US')}`, 20, yPosition);
            
            // Müşteri Bilgileri
            yPosition += 12;
            doc.setFontSize(12);
            doc.setTextColor(220, 20, 60); // Kırmızı
            doc.text('Customer Information:', 20, yPosition);
            
            yPosition += 4;
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text(`Name: ${invoiceData.customer.name}`, 20, yPosition);
            
            yPosition += 3;
            doc.text(`Address: ${invoiceData.customer.address}`, 20, yPosition);
            
            if (invoiceData.customer.email) {
                yPosition += 3;
                doc.text(`E-mail: ${invoiceData.customer.email}`, 20, yPosition);
            }
            
            if (invoiceData.customer.phone) {
                yPosition += 3;
                doc.text(`Phone: ${invoiceData.customer.phone}`, 20, yPosition);
            }
            
            // Para Birimi Sembolü
            const currencySymbol = this.getCurrencySymbol(invoiceData.currency);
            
            // Ürünler Tablosu
            yPosition += 10;
            const tableColumn = ['#', 'Product', 'Quantity', `Unit Price (${currencySymbol})`, `Total (${currencySymbol})`];
            const tableRows = [];
            
            invoiceData.items.forEach((item, index) => {
                const itemData = [
                    index + 1,
                    item.name,
                    item.quantity,
                    item.unitPrice.toFixed(2),
                    item.totalPrice.toFixed(2)
                ];
                tableRows.push(itemData);
            });
            
            // Dikey format için uygun tablo genişliği
            doc.autoTable({
                startY: yPosition,
                head: [tableColumn],
                body: tableRows,
                theme: 'striped',
                headStyles: {
                    fillColor: [220, 20, 60], // Kırmızı tablo başlığı
                    textColor: 255
                },
                styles: {
                    cellPadding: 3,
                    fontSize: 8, // Daha küçük font boyutu (dikey için)
                    fontStyle: 'helvetica', // Modern font
                },
                margin: { left: 20, right: 20 }
            });
            
            // Hesaplama Özeti
            const finalY = doc.lastAutoTable.finalY + 10;
            
            // Ara Toplam
            doc.text('Subtotal:', 130, finalY);
            doc.text(`${invoiceData.subtotal.toFixed(2)} ${currencySymbol}`, 190, finalY, { align: 'right' });
            
            let currentY = finalY + 6;
            
            // İndirim (varsa)
            if (invoiceData.discount.applied && invoiceData.discount.total > 0) {
                doc.text('Discount:', 130, currentY);
                doc.text(`${invoiceData.discount.total.toFixed(2)} ${currencySymbol}`, 190, currentY, { align: 'right' });
                currentY += 6;
            }
            
            // Avans Ödeme (varsa)
            if (invoiceData.advancePayment.applied && invoiceData.advancePayment.amount > 0) {
                doc.text('Advance Payment:', 130, currentY);
                doc.text(`${invoiceData.advancePayment.amount.toFixed(2)} ${currencySymbol}`, 190, currentY, { align: 'right' });
                currentY += 6;
            }
            
            // Genel Toplam
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('GRAND TOTAL:', 130, currentY + 5);
            doc.text(`${invoiceData.grandTotal.toFixed(2)} ${currencySymbol}`, 190, currentY + 5, { align: 'right' });
            
            // Alt bilgiler
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            
            // Şirket Bilgileri
            currentY += 20;
            doc.setTextColor(220, 20, 60); // Kırmızı
            doc.text('Company Information:', 20, currentY);
            doc.setTextColor(0, 0, 0);
            
            currentY += 7;
            doc.text(this.companyInfo.name, 20, currentY);
            
            currentY += 5;
            doc.text(this.companyInfo.address, 20, currentY);
            
            currentY += 5;
            doc.text(`Phone: ${this.companyInfo.phone}`, 20, currentY);
            
            currentY += 5;
            doc.text(`E-mail: ${this.companyInfo.email}`, 20, currentY);
            
            currentY += 5;
            doc.text(`Web: ${this.companyInfo.web}`, 20, currentY);
            
            // Ek Bilgiler
            currentY += 15;
            doc.setTextColor(220, 20, 60); // Kırmızı
            doc.text('Additional Information:', 20, currentY);
            doc.setTextColor(0, 0, 0);
            
            currentY += 7;
            doc.text(`Warranty Period: ${invoiceData.warranty.replace('year', 'Year').replace('years', 'Years')}`, 20, currentY);
            
            currentY += 5;
            doc.text(`Shipping: ${invoiceData.shipping === 'included' ? 'Included' : 'Not Included'}`, 20, currentY);
            
            if (invoiceData.paymentTerms) {
                currentY += 5;
                doc.text(`Payment Terms: ${invoiceData.paymentTerms}`, 20, currentY);
            }
            
            if (invoiceData.deliveryTerms) {
                currentY += 5;
                doc.text(`Delivery Terms: ${invoiceData.deliveryTerms}`, 20, currentY);
            }
            
            // Seçilen para birimine göre banka bilgileri
            const bankInfo = this.companyInfo.bankAccounts[invoiceData.currency] || this.companyInfo.bankAccounts.EUR;
            
            currentY += 10;
            doc.setTextColor(220, 20, 60); // Kırmızı
            doc.text('Bank Information:', 20, currentY);
            doc.setTextColor(0, 0, 0);
            
            currentY += 7;
            doc.text(`Bank: ${bankInfo.bank}`, 20, currentY);
            
            currentY += 5;
            doc.text(`Account Holder: ${bankInfo.accountHolder}`, 20, currentY);
            
            currentY += 5;
            doc.text(`IBAN: ${bankInfo.iban}`, 20, currentY);
            
            currentY += 5;
            doc.text(`Swift Code: ${bankInfo.swift}`, 20, currentY);
            
            // Alt Not
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text('This document has been created electronically and does not require a signature.', 20, 280);
            
            return {
                doc: doc,
                fileName: `${invoiceData.type}_${invoiceData.invoiceNumber || 'invoice'}.pdf`
            };
        } catch (error) {
            console.error("PDF generation error:", error);
            return { error: true, message: "Error while creating PDF: " + error.message };
        }
    },
    
    // HTML'den PDF oluşturma metodunu da dikey formata güncelle
    generatePDFFromHTML: function(invoiceData) {
        try {
            // Önce fatura önizlemesini oluştur
            const invoicePreview = document.getElementById('invoice-preview');
            
            if (!invoicePreview) {
                return false;
            }
            
            const invoiceHTML = invoicePreview.cloneNode(true);
            
            // PDF seçenekleri - dikey format
            const options = {
                margin: 10,
                filename: `${invoiceData.type}_${invoiceData.invoiceNumber || 'invoice'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { 
                    unit: 'mm', 
                    format: 'a4', 
                    orientation: 'portrait' // Dikey format
                }
            };
            
            // HTML2PDF ile PDF oluştur
            return html2pdf().from(invoiceHTML).set(options).save();
        } catch (e) {
            console.error("HTML to PDF generation error:", e);
            return false;
        }
    },
    
    getCurrencySymbol: function(currency) {
        switch(currency) {
            case 'EUR': return '€';
            case 'USD': return '$';
            case 'TL': return '₺';
            default: return currency;
        }
    }
};