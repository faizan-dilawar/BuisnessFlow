import { randomUUID } from "crypto";
import { eq, and, desc, asc, sum, gte, lte, sql, inArray } from "drizzle-orm";
import { getDb } from "./db";
import { 
  users, companies, customers, products, invoices, invoiceItems, payments, expenses, counters,
  type User, type InsertUser, type Company, type InsertCompany, type Customer, type InsertCustomer,
  type Product, type InsertProduct, type Invoice, type InsertInvoice, type InvoiceItem, type InsertInvoiceItem,
  type Payment, type InsertPayment, type Expense, type InsertExpense,
  BackendExpenseInput
} from "@shared/schema";
export const db = await getDb();

export interface IStorage {
  // User operations
  
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Company operations
  getCompanyByUserId(userId: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company>;
  
  // Customer operations
  getCustomersByCompanyId(companyId: string): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  
  // Product operations
  getProductsByCompanyId(companyId: string): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  
  // Invoice operations
  getInvoicesByCompanyId(companyId: string): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoiceWithItems(id: string): Promise<(Invoice & { items: InvoiceItem[]; customer: Customer }) | undefined>;
  createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  generateInvoiceNumber(companyId: string): Promise<string>;
  
  // Payment operations
  getPaymentsByInvoiceId(invoiceId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  // Expense operations
  getExpensesByCompanyId(companyId: string): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense>;
  deleteExpense(id: string): Promise<void>;
  
  // Analytics
  // getDashboardMetrics(companyId: string, fromDate: Date, toDate: Date): Promise<{
  //   revenue: number;
  //   outstanding: number;
  //   expenses: number;
  //   profit: number;
  // }>;
  getProfitLoss(companyId: string, fromDate: Date, toDate: Date): Promise<{
    revenue: number;
    cogs: number;
    expenses: number;
    grossProfit: number;
    netProfit: number;
  }>;
  getLowStockProducts(companyId: string, threshold: number): Promise<Product[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    await db.insert(users).values({ ...insertUser, id,
      role: "admin", // default role


    });

    // const [user] = await db
    // .select()
    // .from(users)
    // .where(eq(users.id, id));
    const [user] = await db.select().from(users).where(eq(users.id, id));

    console.log("Inserted ID:", id);
console.log("Fetched user:", user);
  
  return user;
  }

  async getCompanyByUserId(userId: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.userId, userId));
    return company || undefined;
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const id = randomUUID();

  // Insert the company
  await db.insert(companies).values({
    ...insertCompany,
    id,
  });

  // Fetch the newly created company
  const [company] = await db
    .select()
    .from(companies)
    .where(eq(companies.id, id));
    return company;
  }

  async updateCompany(id: string, company: Partial<InsertCompany>): Promise<Company> {
    const [updated] = await db
      .update(companies)
      .set(company)
      .where(eq(companies.id, id))
      .returning();
    return updated;
  }

  async getCustomersByCompanyId(companyId: string): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.companyId, companyId)).orderBy(asc(customers.name));
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer || undefined;
  }

   async  createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    console.log("insertCustomer",insertCustomer)
  
    await db.insert(customers).values({
      ...insertCustomer,
      id,
    });
  
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
  
    return customer;
  }
  async updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer> {
    const [updated] = await db
      .update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
    return updated;
  }

  async deleteCustomer(id: string): Promise<void> {
    await db.delete(customers).where(eq(customers.id, id));
  }

  async getProductsByCompanyId(companyId: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.companyId, companyId)).orderBy(asc(products.name));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();

  await db.insert(products).values({
    ...insertProduct,
    id,
  });

  // 👇 use eq() helper here
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id));
    return product;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    const [updated] = await db
      .update(products)
      .set(product)
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  async getInvoicesByCompanyId(companyId: string): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.companyId, companyId)).orderBy(desc(invoices.createdAt));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async getInvoiceWithItems(id: string): Promise<(Invoice & { items: InvoiceItem[]; customer: Customer }) | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    if (!invoice) return undefined;

    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id));
    const [customer] = await db.select().from(customers).where(eq(customers.id, invoice.customerId));

    return { ...invoice, items, customer };
  }

  // async createInvoice(invoice: InsertInvoice, items: InsertInvoiceItem[]): Promise<Invoice> {
  //   const id = randomUUID();
    
  //   // Start transaction
  //   const [newInvoice] = await db
  //     .insert(invoices)
  //     .values({ ...invoice, id })
  //     .returning();

  //   // Insert invoice items
  //   for (const item of items) {
  //     await db.insert(invoiceItems).values({ ...item, id: randomUUID(), invoiceId: id });
  //   }

  //   // Update stock quantities if invoice is issued
  //   if (invoice.invoiceStatuss === "issued") {
  //     for (const item of items) {
  //       await db
  //         .update(products)
  //         .set({ stockQty: sql`stock_qty - ${item.qty}` })
  //         .where(eq(products.id, item.productId));
  //     }
  //   }

  //   return newInvoice;
  // }
  // storage.ts

  async createInvoice(invoiceData: any, items: any[]) {
    return await db.transaction(async (tx) => {
      // 1️⃣ Create invoice
      const invoiceId = randomUUID();
      await tx.insert(invoices).values({
        id: invoiceId,
        ...invoiceData,
      });
  
      // 2️⃣ Insert items + update product stock
      for (const item of items) {
        // fetch product
        const [product] = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId));
  
        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }
  
        if (product.stockQty < item.qty) {
          throw new Error(`Not enough stock for ${product.name}`);
        }
  
        // deduct stock
        await tx
          .update(products)
          .set({ stockQty: product.stockQty - item.qty })
          .where(eq(products.id, item.productId));
  
        // insert invoice item
        await tx.insert(invoiceItems).values({
          id: randomUUID(),
          invoiceId,
          ...item,
        });
      }
  
      // 3️⃣ Return invoice with items
      const [createdInvoice] = await tx
        .select()
        .from(invoices)
        .where(eq(invoices.id, invoiceId));
  
      const createdItems = await tx
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, invoiceId));
  
      return { ...createdInvoice, items: createdItems };
    });
  }


  async updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice> {
    const [updated] = await db
      .update(invoices)
      .set(invoice)
      .where(eq(invoices.id, id))
      .returning();
    return updated;
  }

  async generateInvoiceNumber(companyId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    // Try to get existing counter
    const [counter] = await db
      .select()
      .from(counters)
      .where(and(
        eq(counters.name, "invoice"),
        eq(counters.year, year),
        eq(counters.month, month)
      ));

    let sequence: number;
    
    if (counter) {
      // Update existing counter
      sequence = (counter.sequence || 0) + 1;
      await db
        .update(counters)
        .set({ sequence })
        .where(eq(counters.id, counter.id));
    } else {
      // Create new counter
      sequence = 1;
      await db.insert(counters).values({
        id: randomUUID(),
        name: "invoice",
        year,
        month,
        sequence,
      });
    }

    const monthPadded = month.toString().padStart(2, "0");
    const sequencePadded = sequence.toString().padStart(3, "0");
    
    return `INV-${year}${monthPadded}-${sequencePadded}`;
  }

  async getPaymentsByInvoiceId(invoiceId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.invoiceId, invoiceId)).orderBy(desc(payments.paidAt));
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const [payment] = await db
      .insert(payments)
      .values({ ...insertPayment, id })
      .returning();

    // Check if invoice is fully paid
    const totalPaid = await db
      .select({ total: sum(payments.amount) })
      .from(payments)
      .where(eq(payments.invoiceId, insertPayment.invoiceId));

    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, insertPayment.invoiceId));
    
    if (invoice && totalPaid[0]?.total && Number(totalPaid[0].total) >= Number(invoice.total)) {
      await db
        .update(invoices)
        .set({ status: "paid" })
        .where(eq(invoices.id, insertPayment.invoiceId));
    }

    return payment;
  }

  async getExpensesByCompanyId(companyId: string): Promise<Expense[]> {
    return await db.select().from(expenses).where(eq(expenses.companyId, companyId)).orderBy(desc(expenses.date));
  }

async createExpense(expenseData: BackendExpenseInput): Promise<Expense> {
  return await db.transaction(async (tx) => {
    // 1️⃣ Create expense
    const expenseId = randomUUID();

    await tx.insert(expenses).values({
      id: expenseId,
      companyId: expenseData.companyId,
      date: expenseData.date,
      amount: expenseData.amount,
      vendor: expenseData.vendor,
      category: expenseData.category,
      notes: expenseData.notes,
    });

    // 2️⃣ Fetch back inserted expense
    const [createdExpense] = await tx
      .select()
      .from(expenses)
      .where(eq(expenses.id, expenseId));

    return createdExpense;
  });
}

  async updateExpense(id: string, expense: Partial<InsertExpense>): Promise<Expense> {
    const [updated] = await db
      .update(expenses)
      .set(expense)
      .where(eq(expenses.id, id))
      .returning();
    return updated;
  }

  async deleteExpense(id: string): Promise<void> {
    await db.delete(expenses).where(eq(expenses.id, id));
  }

  // async getDashboardMetrics(companyId: string, fromDate: Date, toDate: Date): Promise<{
  //   revenue: number;
  //   outstanding: number;
  //   expenses: number;
  //   profit: number;
  // }> {
  //   // Revenue from paid invoices
  //   const revenueResult = await db
  //     .select({ total: sum(invoices.total) })
  //     .from(invoices)
  //     .where(and(
  //       eq(invoices.companyId, companyId),
  //       eq(invoices.invoiceStatus, "paid"),
  //       gte(invoices.date, fromDate),
  //       lte(invoices.date, toDate)
  //     ));

  //   // Outstanding amount from issued invoices
  //   const outstandingResult = await db
  //     .select({ total: sum(invoices.total) })
  //     .from(invoices)
  //     .where(and(
  //       eq(invoices.companyId, companyId),
  //       eq(invoices.invoiceStatus, "issued")
  //     ));

  //   // Total expenses
  //   const expensesResult = await db
  //     .select({ total: sum(expenses.amount) })
  //     .from(expenses)
  //     .where(and(
  //       eq(expenses.companyId, companyId),
  //       gte(expenses.date, fromDate),
  //       lte(expenses.date, toDate)
  //     ));

  //   const revenue = Number(revenueResult[0]?.total || 0);
  //   const outstanding = Number(outstandingResult[0]?.total || 0);
  //   const expensesTotal = Number(expensesResult[0]?.total || 0);
  //   const profit = revenue - expensesTotal;

  //   return { revenue, outstanding, expenses: expensesTotal, profit };
  // }
  async getDashboardMetrics(
    companyId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<{
    revenue: number;
    outstanding: number;
    expenses: number;
    profit: number;
  }> {
    // Revenue (paid invoices)
    const revenueResult = await db
      .select({ total: sum(invoices.total) })
      .from(invoices)
      .where(
        and(
          eq(invoices.companyId, companyId),
          eq(invoices.invoiceStatus, "paid"),
          gte(invoices.date, fromDate),
          lte(invoices.date, toDate)
        )
      );
  
    // Outstanding (issued + draft invoices)
    const outstandingResult = await db
      .select({ total: sum(invoices.total) })
      .from(invoices)
      .where(
        and(
          eq(invoices.companyId, companyId),
          inArray(invoices.invoiceStatus, ["issued", "draft"]),
          gte(invoices.date, fromDate),
          lte(invoices.date, toDate)
        )
      );
  
    // Expenses
    const expensesResult = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(
        and(
          eq(expenses.companyId, companyId),
          gte(expenses.date, fromDate),
          lte(expenses.date, toDate)
        )
      );
       // Profit = sum((priceDecimal - costDecimal) * quantity) for paid invoices
  const profitResult = await db
    .select({
      total: sum(
        sql`${invoiceItems.qty} * (${invoiceItems.unitPrice} - ${products.costDecimal})`
      ),
    })
    .from(invoiceItems)
    .innerJoin(products, eq(invoiceItems.productId, products.id))
    .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
    .where(
      and(
        eq(invoices.companyId, companyId),
        eq(invoices.invoiceStatus, "paid"),
        gte(invoices.date, fromDate),
        lte(invoices.date, toDate)
      )
    );
  
    // Normalize
    const revenue = Number(revenueResult[0]?.total ?? 0);
    const outstanding = Number(outstandingResult[0]?.total ?? 0);
    const expensesTotal = Number(expensesResult[0]?.total ?? 0);
  const profit = Number(profitResult[0]?.total ?? 0);
  
    return { revenue, outstanding, expenses: expensesTotal, profit };
  }
  

  async getProfitLoss(companyId: string, fromDate: Date, toDate: Date): Promise<{
    revenue: number;
    cogs: number;
    expenses: number;
    grossProfit: number;
    netProfit: number;
  }> {
    // Revenue from paid invoices
    const revenueResult = await db
      .select({ total: sum(invoices.total) })
      .from(invoices)
      .where(and(
        eq(invoices.companyId, companyId),
        eq(invoices.invoiceStatus, "paid"),
        gte(invoices.date, fromDate),
        lte(invoices.date, toDate)
      ));

    // COGS calculation (cost of sold products)
    const cogsResult = await db
      .select({
        total: sql<number>`SUM(${invoiceItems.qty} * ${products.costDecimal})`
      })
      .from(invoiceItems)
      .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
      .innerJoin(products, eq(invoiceItems.productId, products.id))
      .where(and(
        eq(invoices.companyId, companyId),
        eq(invoices.invoiceStatus, "paid"),
        gte(invoices.date, fromDate),
        lte(invoices.date, toDate)
      ));

    // Total expenses
    const expensesResult = await db
      .select({ total: sum(expenses.amount) })
      .from(expenses)
      .where(and(
        eq(expenses.companyId, companyId),
        gte(expenses.date, fromDate),
        lte(expenses.date, toDate)
      ));

    const revenue = Number(revenueResult[0]?.total || 0);
    const cogs = Number(cogsResult[0]?.total || 0);
    const expensesTotal = Number(expensesResult[0]?.total || 0);
    const grossProfit = revenue - cogs;
    const netProfit = grossProfit - expensesTotal;

    return { revenue, cogs, expenses: expensesTotal, grossProfit, netProfit };
  }

  async getLowStockProducts(companyId: string, threshold: number = 5): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(
        eq(products.companyId, companyId),
        lte(products.stockQty, threshold)
      ))
      .orderBy(asc(products.stockQty));
  }
}

export const storage = new DatabaseStorage();
