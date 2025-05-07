// PDF Generator for invoice application
const PDFGenerator = {
  generatePDF: function(invoiceData) {
    try {
      // A4 boyutunda yeni bir PDF dokümanı oluştur (mm cinsinden)
      const doc = new jspdf.jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4' // 210 x 297 mm
      });
      
      // ------ LOGO ------
      // Logo: Sol üstten hiç boşluk bırakmadan (X0, Y0) boyut (180 x 60)
      doc.addImage('images/logo.jpg', 'JPEG', 0, 0, 220, 60);
	  doc.addImage('images/damga.jpg', 'JPEG', 55, 255, 50, 35);
      
      // ------ BAŞLIK ------
      // Başlık: Sağ üstte (X130, Y30)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(220, 20, 60); // Kırmızı (crimson)
      doc.text(invoiceData.type === 'invoice' ? 'INVOICE' : 'PROFORMA INVOICE', 135, 30);
      
      // ------ FATURA BİLGİLERİ ------
      // Fatura No: X140, Y50
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0); // Siyah
      doc.text(`Invoice No: ${invoiceData.invoiceNumber || 'XXXX-XXXX'}`, 140, 50);
      
      // Fatura Tarihi: X140, Y60
      doc.text(`Date: ${new Date().toLocaleDateString('en-US')}`, 140, 60);
      
      // ------ MÜŞTERİ BİLGİLERİ ------
      // Customer Information Başlığı: X10, Y50
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(220, 20, 60); // Kırmızı başlık
      doc.text("Customer Information", 10, 50);
      
      // Müşteri bilgileri (her satır 10mm aşağıda)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0); // Siyah
      let customerY = 55; // Başlangıç noktası Y50 + 5mm
      
      doc.text(`Name: ${invoiceData.customer.name}`, 10, customerY);
      customerY += 5; // 10mm aşağı
      
      doc.text(`Address: ${invoiceData.customer.address}`, 10, customerY);
      customerY += 5;
      
      if (invoiceData.customer.email) {
        doc.text(`E-mail: ${invoiceData.customer.email}`, 10, customerY);
        customerY += 5;
      }
      
      if (invoiceData.customer.phone) {
        doc.text(`Phone: ${invoiceData.customer.phone}`, 10, customerY);
      }
      
      // ------ ÜRÜN TABLOSU ------
      // Ürün Tablosu Başlangıç: X5, Y82
      const tableStartY = 82;
      
      // Tablo başlıkları
      const tableColumns = ["#", "Description", "Quantity", `Unit Price (${this.getCurrencySymbol(invoiceData.currency)})`, `Total (${this.getCurrencySymbol(invoiceData.currency)})`];
      
      // Tablo verileri
      const tableData = invoiceData.items.map((item, index) => [
        index + 1,
        item.name,
        item.quantity,
        item.unitPrice.toFixed(2),
        item.totalPrice.toFixed(2)
      ]);
      
      // AutoTable eklentisi ile tablo oluşturma
      doc.autoTable({
        startY: tableStartY,
        margin: {left: 5}, // X5 konumundan başlatmak için sol margin
        head: [tableColumns],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 9,
          cellPadding: 3
        },
        headStyles: {
          fillColor: [220, 20, 60],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: {halign: 'center', cellWidth: 10},
          1: {halign: 'left', cellWidth: 80}, // Description sütunu daha geniş
          2: {halign: 'center', cellWidth: 20},
          3: {halign: 'right', cellWidth: 40},
          4: {halign: 'right', cellWidth: 40}
        }
      });
      
      // ------ FİYAT ÖZETİ ------
      // Son tablo pozisyonunu al
      const finalY = doc.previousAutoTable.finalY + 10;
      
      // Subtotal, Discount, vs. fiyat özeti
      let summaryY = finalY;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      // Subtotal
      doc.text("Subtotal:", 140, summaryY);
      doc.text(`${invoiceData.subtotal.toFixed(2)} ${this.getCurrencySymbol(invoiceData.currency)}`, 190, summaryY, {align: 'right'});
      
      // İndirim
      if (invoiceData.discount.applied && invoiceData.discount.total > 0) {
        summaryY += 8;
        doc.text("Discount:", 140, summaryY);
        doc.text(`${invoiceData.discount.total.toFixed(2)} ${this.getCurrencySymbol(invoiceData.currency)}`, 190, summaryY, {align: 'right'});
      }
      
      // Avans ödemesi
      if (invoiceData.advancePayment.applied && invoiceData.advancePayment.amount > 0) {
        summaryY += 8;
        doc.text("Advance Payment:", 140, summaryY);
        doc.text(`${invoiceData.advancePayment.amount.toFixed(2)} ${this.getCurrencySymbol(invoiceData.currency)}`, 190, summaryY, {align: 'right'});
      }
      
      // Genel toplam
      summaryY += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text("GRAND TOTAL:", 140, summaryY);
      doc.text(`${invoiceData.grandTotal.toFixed(2)} ${this.getCurrencySymbol(invoiceData.currency)}`, 190, summaryY, {align: 'right'});
      
      // ------ TERMS AND CONDITIONS ------
      // Terms and Conditions X5, Y220 den başlıyor
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(220, 20, 60); // Kırmızı başlık
      doc.text("Terms and Conditions", 8, 237);
      
      // Terms içeriği
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0); // Siyah
      
      let termsY = 245; // Başlangıç noktası Y220 + 10mm
      
      doc.text(`Warranty Period: ${invoiceData.warranty.replace('year', 'Year').replace('years', 'Years')}`, 8, termsY);
      termsY += 5;
      
      doc.text(`Shipping: ${invoiceData.shipping === 'included' ? 'Included' : 'Not Included'}`, 8, termsY);
      termsY += 5;
      
      if (invoiceData.paymentTerms) {
        doc.text(`Payment Terms: ${invoiceData.paymentTerms}`, 8, termsY);
        termsY += 5;
      }
      
      if (invoiceData.deliveryTerms) {
        doc.text(`Delivery Terms: ${invoiceData.deliveryTerms}`, 8, termsY);
        termsY += 5;
      }
      
      if (invoiceData.extraInfo) {
        doc.text(`Additional Info: ${invoiceData.extraInfo}`, 8, termsY);
      }
      
      // ------ COMPANY INFO & ACCOUNT DETAILS ------
      // Company information ve account details X110, Y220 den başlayıp sayfa sonuna kadar
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(220, 20, 60); // Kırmızı başlık
      doc.text("Account Details.", 110, 237);
      
      // Şirket bilgileri
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0); // Siyah
      
      let companyY = 244; // Başlangıç noktası Y220 + 10mm
      
      
      doc.setFont('helvetica', 'normal');
      doc.text("Adress: Seyitnizam Mh. Demirciler Sitesi 9.Cd. No26", 110, companyY);
      companyY += 5;
      
      doc.text("Zeytinburnu Istanbul Turkiye", 110, companyY);
      companyY += 8;
      
      // doc.text("Phone: +90 212 416 65 05    +90 549 712 16 68", 110, companyY);
      // companyY += 5;
      
      // doc.text("E-mail: alp@alpress.com.tr", 110, companyY);
      // companyY += 5;
      
      // doc.text("Web: alpress.com.tr", 110, companyY);
      // companyY += 7;
      
      // Banka bilgileri
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(220, 20, 60);
      doc.text("Bank Information", 110, companyY);
      companyY += 7;
      
      // Seçilen para birimine göre banka hesap bilgilerini al
      const bankInfo = this.getBankInfoForCurrency(invoiceData.currency);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text("Bank Name: Akbank A.S.", 110, companyY);
	  doc.text("Branch Name : Seyitnizam", 155, companyY);
      companyY += 5;
	  
	  
	  doc.text("Branch Code : 1349", 110, companyY);
	  doc.text("Swift Code : AKBKTRIS", 155, companyY);
      companyY += 5;
      
      doc.text("Account Name : Alpress Kalipcilik Dan. Ith. Ihr. San. ve Tic. Ltd.Sti", 110, companyY);
      companyY += 5;
	  doc.text(`Account Number: ${bankInfo.bank}`, 110, companyY);
      companyY += 5;
      doc.text(`IBAN: ${bankInfo.iban}`, 110, companyY);
     

      
      // Alt not
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120); // Gri
      doc.text("E-mail: alp@alpress.com.tr Web: alpress.com.tr Phone: +90 212 416 65 05    +90 549 712 16 68", 105, 293, {align: 'center'});
      
      // Başarılı oluşturma sonuçlarını döndür
      return {
        doc: doc,
        fileName: `${invoiceData.type === 'invoice' ? 'Invoice' : 'Proforma'}_${invoiceData.invoiceNumber || 'XXXX-XXXX'}.pdf`
      };
    } catch (e) {
      console.error("PDF oluşturma hatası:", e);
      return { error: true, message: e.message };
    }
  },

  // HTML'den PDF oluşturma alternatifi
  generatePDFFromHTML: function(invoiceData) {
    try {
      const element = document.getElementById('invoice-preview');
      
      // HTML'den PDF oluşturma için stil eşleştirmelerini ve tam konumlandırma
      // ince ayarları için özel stil tanımla
      element.style.position = 'relative';
      element.style.width = '210mm';
      element.style.height = '297mm';
      
      // Logo pozisyonlama
      const logo = element.querySelector('.company-logo img');
      if (logo) {
        logo.style.position = 'absolute';
        logo.style.top = '0';
        logo.style.left = '0';
        logo.style.width = '110mm';
        logo.style.height = '35mm';
        logo.style.objectFit = 'contain';
        logo.style.objectPosition = 'left top';
      }
      
      // Başlık pozisyonlama
      const title = element.querySelector('.invoice-title');
      if (title) {
        title.style.position = 'absolute';
        title.style.top = '30mm';
        title.style.left: '130mm';
        title.style.margin = '0';
        title.style.fontSize = '20pt';
        title.style.color = '#DC143C';
      }
      
      // PDF oluşturma ayarları
      const opt = {
        margin: [0, 0, 0, 0], // Sayfa kenar boşlukları yok
        filename: `${invoiceData.type === 'invoice' ? 'Invoice' : 'Proforma'}_${invoiceData.invoiceNumber || 'XXXX-XXXX'}.pdf`,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          letterRendering: true,
          width: 210 * 3.78, // mm'den px'e dönüşüm (yaklaşık 3.78 kat)
          height: 297 * 3.78
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          precision: 16
        }
      };
      
      // HTML'den PDF oluştur ve indir
      html2pdf().from(element).set(opt).save();
      
      return { success: true };
    } catch (e) {
      console.error("HTML'den PDF oluşturma hatası:", e);
      return { error: true, message: e.message };
    }
  },
  
  getCurrencySymbol: function(currency) {
    switch (currency) {
      case 'EUR': return '€';
      case 'USD': return '$';
      case 'TL': return '₺';
      default: return currency;
    }
  },
  
  getBankInfoForCurrency: function(currency) {
    const bankAccounts = {
      EUR: {
        bank: "1349-031030",
        accountHolder: "Alpress Kal. Dan. Ith. Ihr. San. Tic. Ltd. Sti.",
        iban: "TR26 0004 6013 4988 8000 0310 30",
        swift: "EURSWIFT"
      },
      USD: {
        bank: "1349-031029",
        accountHolder: "Alpress Kal. Dan. Ith. Ihr. San. Tic. Ltd. Sti.",
        iban: "TR76 0004 6013 4900 1000 0310 29",
        swift: "USDSWIFT"
      },
      TL: {
        bank: "1349-031032",
        accountHolder: "Alpress Kal. Dan. Ith. Ihr. San. Tic. Ltd. Sti.",
        iban: "TR44 0004 6013 4988 8000 0310 32",
        swift: "TRLSWIFT"
      }
    };
    
    return bankAccounts[currency] || bankAccounts.EUR;
  }
};
