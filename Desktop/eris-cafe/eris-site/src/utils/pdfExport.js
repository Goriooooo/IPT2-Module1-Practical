import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Swal from 'sweetalert2';

// Generate PDF for a single order
export const generateOrderPDF = (order) => {
  try {
    console.log('Generating PDF for order:', order);
    const doc = new jsPDF();
  
  // Add header with logo/title
  doc.setFillColor(217, 119, 6); // Amber color
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('ERIS CAFE', 105, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Order Receipt', 105, 30, { align: 'center' });
  
  // Reset text color for body
  doc.setTextColor(0, 0, 0);
  
  // Order Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Order Information', 14, 50);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  const orderInfo = [
    ['Order ID:', order.orderId || 'N/A'],
    ['Order Date:', new Date(order.createdAt).toLocaleString()],
    ['Status:', (order.status || 'N/A').toUpperCase()],
    ['Payment Method:', order.paymentMethod || 'N/A'],
  ];
  
  let yPos = 58;
  orderInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 60, yPos);
    yPos += 7;
  });
  
  // Customer Information
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Customer Information', 14, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  yPos += 8;
  
  const customerInfo = [
    ['Name:', order.customerInfo?.name || 'N/A'],
    ['Email:', order.customerInfo?.email || 'N/A'],
    ['Phone:', order.customerInfo?.phone || 'N/A'],
  ];
  
  customerInfo.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 14, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 60, yPos);
    yPos += 7;
  });
  
  // Order Items Table
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Order Items', 14, yPos);
  
  const tableData = order.items?.map(item => [
    item.name || 'N/A',
    item.quantity?.toString() || '0',
    `$${(item.price || 0).toFixed(2)}`,
    `$${((item.price || 0) * (item.quantity || 0)).toFixed(2)}`
  ]) || [];
  
  doc.autoTable({
    startY: yPos + 5,
    head: [['Item Name', 'Quantity', 'Unit Price', 'Subtotal']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [217, 119, 6],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10
    },
    styles: {
      fontSize: 10,
      cellPadding: 5
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  });
  
  // Total Amount
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.5);
  doc.line(14, finalY, 196, finalY);
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Total Amount:', 120, finalY + 10);
  doc.setTextColor(217, 119, 6);
  doc.text(`$${(order.totalPrice || 0).toFixed(2)}`, 170, finalY + 10);
  
  // Delivery Information (if exists)
  if (order.deliveryInfo) {
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Delivery Information', 14, finalY + 25);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Address: ${order.deliveryInfo.address || 'N/A'}`, 14, finalY + 33);
    
    if (order.deliveryInfo.notes) {
      doc.text(`Notes: ${order.deliveryInfo.notes}`, 14, finalY + 40);
    }
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for your order!', 105, pageHeight - 20, { align: 'center' });
  doc.text('Eris Cafe - Buksu, Bulacan', 105, pageHeight - 15, { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleString()}`, 105, pageHeight - 10, { align: 'center' });
  
  // Save the PDF
  doc.save(`Order_${order.orderId}.pdf`);
  console.log('PDF generated successfully for order:', order.orderId);
  } catch (error) {
    console.error('Error generating PDF:', error);
    Swal.fire({
      title: 'PDF Generation Failed',
      text: 'Failed to generate PDF. Please try again.',
      icon: 'error',
      confirmButtonColor: '#8B5CF6'
    });
  }
};

// Generate PDF for multiple orders (summary report)
export const generateOrdersReportPDF = (orders, filterStatus = 'All') => {
  try {
    console.log('Generating summary report for', orders.length, 'orders');
    const doc = new jsPDF();
  
  // Header
  doc.setFillColor(217, 119, 6);
  doc.rect(0, 0, 210, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('ERIS CAFE', 105, 15, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Orders Report', 105, 25, { align: 'center' });
  
  // Report Information
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 45);
  doc.text(`Filter: ${filterStatus}`, 14, 52);
  doc.text(`Total Orders: ${orders.length}`, 14, 59);
  
  // Calculate totals
  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
  doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 14, 66);
  
  // Orders Table
  const tableData = orders.map(order => [
    order.orderId || 'N/A',
    order.customerInfo?.name || 'N/A',
    new Date(order.createdAt).toLocaleDateString(),
    (order.status || 'N/A').toUpperCase(),
    `$${(order.totalPrice || 0).toFixed(2)}`
  ]);
  
  doc.autoTable({
    startY: 75,
    head: [['Order ID', 'Customer', 'Date', 'Status', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [217, 119, 6],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    styles: {
      fontSize: 8,
      cellPadding: 4
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 50 },
      2: { cellWidth: 30 },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 25, halign: 'right' }
    },
    margin: { left: 14, right: 14 }
  });
  
  // Status Summary
  const finalY = doc.lastAutoTable.finalY + 15;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Status Summary', 14, finalY);
  
  const statusCounts = orders.reduce((acc, order) => {
    const status = order.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  let summaryY = finalY + 8;
  
  Object.entries(statusCounts).forEach(([status, count]) => {
    doc.text(`${status.charAt(0).toUpperCase() + status.slice(1)}: ${count}`, 14, summaryY);
    summaryY += 7;
  });
  
  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Eris Cafe - Admin Dashboard', 105, pageHeight - 10, { align: 'center' });
  
  // Save the PDF
  const timestamp = new Date().toISOString().split('T')[0];
  doc.save(`Orders_Report_${timestamp}.pdf`);
  console.log('Summary report generated successfully');
  } catch (error) {
    console.error('Error generating summary report:', error);
    Swal.fire({
      title: 'Report Generation Failed',
      text: 'Failed to generate report. Please try again.',
      icon: 'error',
      confirmButtonColor: '#8B5CF6'
    });
  }
};

// Generate detailed multi-page report
export const generateDetailedOrdersReportPDF = (orders) => {
  try {
    console.log('Generating detailed report for', orders.length, 'orders');
    const doc = new jsPDF();
    let currentPage = 1;
  
  orders.forEach((order, index) => {
    if (index > 0) {
      doc.addPage();
      currentPage++;
    }
    
    // Header for each page
    doc.setFillColor(217, 119, 6);
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('ERIS CAFE', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Order Details - ${order.orderId}`, 105, 25, { align: 'center' });
    
    // Order content (reuse single order logic)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Order Information', 14, 45);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    let yPos = 53;
    const orderInfo = [
      ['Order ID:', order.orderId || 'N/A'],
      ['Date:', new Date(order.createdAt).toLocaleString()],
      ['Status:', (order.status || 'N/A').toUpperCase()],
      ['Customer:', order.customerInfo?.name || 'N/A'],
      ['Email:', order.customerInfo?.email || 'N/A'],
      ['Phone:', order.customerInfo?.phone || 'N/A'],
    ];
    
    orderInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 14, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 50, yPos);
      yPos += 6;
    });
    
    // Items table
    yPos += 5;
    const tableData = order.items?.map(item => [
      item.name || 'N/A',
      item.quantity?.toString() || '0',
      `$${(item.price || 0).toFixed(2)}`,
      `$${((item.price || 0) * (item.quantity || 0)).toFixed(2)}`
    ]) || [];
    
    doc.autoTable({
      startY: yPos,
      head: [['Item', 'Qty', 'Price', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [217, 119, 6],
        fontSize: 9
      },
      styles: {
        fontSize: 8,
        cellPadding: 3
      },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' },
        3: { halign: 'right' }
      }
    });
    
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total:', 140, finalY);
    doc.setTextColor(217, 119, 6);
    doc.text(`$${(order.totalPrice || 0).toFixed(2)}`, 170, finalY);
    
    // Page number
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(8);
    doc.text(`Page ${currentPage} of ${orders.length}`, 105, doc.internal.pageSize.height - 10, { align: 'center' });
  });
  
  const timestamp = new Date().toISOString().split('T')[0];
  doc.save(`Detailed_Orders_Report_${timestamp}.pdf`);
  console.log('Detailed report generated successfully');
  } catch (error) {
    console.error('Error generating detailed report:', error);
    Swal.fire({
      title: 'Report Generation Failed',
      text: 'Failed to generate detailed report. Please try again.',
      icon: 'error',
      confirmButtonColor: '#8B5CF6'
    });
  }
};
