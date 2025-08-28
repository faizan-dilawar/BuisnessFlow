import puppeteer from "puppeteer";
import { type Invoice, type InvoiceItem, type Customer, type Company } from "@shared/schema";

export interface InvoiceData {
  invoice: Invoice;
  items: InvoiceItem[];
  customer: Customer;
  company: Company;
}
// export interface PnLRow {
//   account: string;
//   debit: number;
//   credit: number;
//   balance: number;
// }

// export interface PnLData {
//   from: string;
//   to: string;
//   rows: PnLRow[];
//   companyName: string;
// }
interface Row {
  account: string;
  debit: number;
  credit: number;
  balance: number;
}

interface PnLData {
  from: string;
  to: string;
  rows: Row[];
  companyName: string;
}
export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  const html = generateInvoiceHTML(data);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

function generateInvoiceHTML(data: InvoiceData): string {
  const { invoice, items, customer, company } = data;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${invoice.invoiceNo}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
        .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .company-info h1 { margin: 0; color: #2563eb; }
        .invoice-info { text-align: right; }
        .invoice-number { font-size: 24px; font-weight: bold; color: #2563eb; }
        .billing-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
        .billing-info { width: 45%; }
        .billing-info h3 { margin-top: 0; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background-color: #f9fafb; font-weight: 600; color: #374151; }
        .amount { text-align: right; }
        .totals { margin-left: auto; width: 300px; }
        .totals table { margin-bottom: 0; }
        .total-row { font-weight: bold; font-size: 18px; background-color: #f3f4f6; }
        .status { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
        .status.paid { background-color: #d1fae5; color: #065f46; }
        .status.issued { background-color: #fef3c7; color: #92400e; }
        .status.draft { background-color: #e0e7ff; color: #3730a3; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <h1>${company.name}</h1>
          <p>${company.address || ''}</p>
          ${company.gstin ? `<p>GSTIN: ${company.gstin}</p>` : ''}
        </div>
        <div class="invoice-info">
          <div class="invoice-number">${invoice.invoiceNo}</div>
          <span class="status ${invoice.invoiceStatus}">${invoice.invoiceStatus}</span>
        </div>
      </div>

      <div class="billing-section">
        <div class="billing-info">
          <h3>Bill To</h3>
          <p><strong>${customer.name}</strong></p>
          ${customer.email ? `<p>${customer.email}</p>` : ''}
          ${customer.phone ? `<p>${customer.phone}</p>` : ''}
          ${customer.billingAddress ? `<p>${customer.billingAddress}</p>` : ''}
        </div>
        <div class="billing-info">
          <h3>Invoice Details</h3>
          <p><strong>Date:</strong> ${new Date(invoice.date).toLocaleDateString()}</p>
          <p><strong>Due Date:</strong> ${new Date(invoice.date).toLocaleDateString()}</p>
          <p><strong>Currency:</strong> ${company.currency || 'USD'}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th class="amount">Unit Price</th>
            <th class="amount">Tax Rate</th>
            <th class="amount">Total</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td>${item.description}</td>
              <td>${item.qty}</td>
              <td class="amount">${formatCurrency(Number(item.unitPrice), company.currency || 'USD')}</td>
              <td class="amount">${item.taxRate || 0}%</td>
              <td class="amount">${formatCurrency(Number(item.lineTotal), company.currency || 'USD')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <table>
          <tr>
            <td>Subtotal:</td>
            <td class="amount">${formatCurrency(Number(invoice.subTotal), company.currency || 'USD')}</td>
          </tr>
          <tr>
            <td>Tax:</td>
            <td class="amount">${formatCurrency(Number(invoice.taxTotal), company.currency || 'USD')}</td>
          </tr>
          <tr class="total-row">
            <td>Total:</td>
            <td class="amount">${formatCurrency(Number(invoice.total), company.currency || 'USD')}</td>
          </tr>
        </table>
      </div>

      ${invoice.notes ? `
        <div style="margin-top: 30px;">
          <h3>Notes</h3>
          <p>${invoice.notes}</p>
        </div>
      ` : ''}
    </body>
    </html>
  `;
}

const formatCurrency = (amount: number, currency: string): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};
// export async function generatePnLPDF(data: PnLData): Promise<Buffer> {
//   const html = generatePnLHTML(data);

//   const browser = await puppeteer.launch({
//     headless: true,
//     args: ["--no-sandbox", "--disable-setuid-sandbox"],
//   });

//   try {
//     const page = await browser.newPage();
//     await page.setContent(html, { waitUntil: "networkidle0" });

//     const pdf = await page.pdf({
//       format: "A4",
//       printBackground: true,
//       margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
//     });

//     return Buffer.from(pdf);
//   } finally {
//     await browser.close();
//   }
// }
// function generatePnLHTML(data: PnLData): string {
//   const { companyName, from, to, rows } = data;

//   const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
//   const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
//   const net = totalCredit - totalDebit;

//   return `
//   <!DOCTYPE html>
//   <html>
//   <head>
//     <meta charset="UTF-8">
//     <title>P&L Report</title>
//     <style>
//       body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
//       h1 { color: #2563eb; }
//       table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//       th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: right; }
//       th { background: #f9fafb; color: #374151; }
//       td:first-child, th:first-child { text-align: left; }
//       .total-row { font-weight: bold; background: #f3f4f6; }
//       .net-profit { font-size: 18px; font-weight: bold; margin-top: 20px; }
//     </style>
//   </head>
//   <body>
//     <h1>${companyName} - Profit & Loss Report</h1>
//     <p>Period: ${from} → ${to}</p>

//     <table>
//       <thead>
//         <tr>
//           <th>Account</th>
//           <th>Debit</th>
//           <th>Credit</th>
//           <th>Balance</th>
//         </tr>
//       </thead>
//       <tbody>
//         ${rows.map(r => `
//           <tr>
//             <td>${r.account}</td>
//             <td>${formatPnlCurrency(r.debit)}</td>
//             <td>${formatPnlCurrency(r.credit)}</td>
//             <td>${formatPnlCurrency(r.balance)}</td>
//           </tr>
//         `).join("")}
//       </tbody>
//       <tfoot>
//         <tr class="total-row">
//           <td>Total</td>
//           <td>${formatPnlCurrency(totalDebit)}</td>
//           <td>${formatPnlCurrency(totalCredit)}</td>
//           <td>${formatPnlCurrency(net)}</td>
//         </tr>
//       </tfoot>
//     </table>

//     <div class="net-profit">
//       Net ${net >= 0 ? "Profit" : "Loss"}: ${formatPnlCurrency(net)}
//     </div>
//   </body>
//   </html>
//   `;
// }
const formatPnlCurrency = (val: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
export async function generatePnLPDF(data: PnLData): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true, // ensures compatibility with latest Puppeteer
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; margin-bottom: 10px; }
            h3 { text-align: center; margin-top: 0; font-weight: normal; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #333; padding: 8px; text-align: right; }
            th { background: #f3f3f3; }
            td:first-child, th:first-child { text-align: left; }
          </style>
        </head>
        <body>
          <h1>${data.companyName}</h1>
          <h3>Profit & Loss Report</h3>
          <p style="text-align:center;">From: ${data.from} &nbsp;&nbsp; To: ${data.to}</p>
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              ${data.rows
                .map(
                  (row) => `
                <tr>
                  <td>${row.account}</td>
                  <td>${row.debit.toFixed(2)}</td>
                  <td>${row.credit.toFixed(2)}</td>
                  <td>${row.balance.toFixed(2)}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "A4" });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}