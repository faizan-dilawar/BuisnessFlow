import { relations, sql } from "drizzle-orm";
// import { text, decimal, varchar, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import {
  mysqlTable,
  varchar,
  text,
  timestamp,
  mysqlEnum,
  boolean,
  int,
  decimal,
  datetime
} from "drizzle-orm/mysql-core";


// Enums
export const roleEnum = mysqlEnum("role", ["admin"]);
export const invoiceStatusEnum = mysqlEnum("invoice_status", ["draft", "issued", "paid", "cancelled"]);

// Users table
export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
   role: mysqlEnum("role", ["admin"]).default("admin"), // ✅
  createdAt: timestamp("created_at").defaultNow(),
   updatedAt: timestamp("updated_at").defaultNow(),
});

// Companies table
export const companies = mysqlTable("companies", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  gstin: varchar("gstin", { length: 15 }),
  currency: varchar("currency", { length: 3 }).default("USD"),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  allowNegativeStock: boolean("allow_negative_stock").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});




// Customers table
export const customers = mysqlTable("customers", {
  id: varchar("id", { length: 36 }).primaryKey(),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  billingAddress: text("billing_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products table
export const products = mysqlTable("products", {
  id: varchar("id", { length: 36 }).primaryKey(),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  sku: varchar("sku", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  priceDecimal: decimal("price_decimal", { precision: 10, scale: 2 }).notNull(),
  costDecimal: decimal("cost_decimal", { precision: 10, scale: 2 }).notNull(),

  stockQty: int("stock_qty").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Counters for invoice numbering
export const counters = mysqlTable("counters", {
  id: varchar("id", { length: 36 }).primaryKey(),
  name: varchar("name", { length: 50 }).notNull(),
  year: int("year").notNull(),
  month: varchar("month", { length: 20 }).notNull(),
  sequence: int("sequence").default(0),
});

// Invoices table
export const invoices = mysqlTable("invoices", {
  id: varchar("id", { length: 36 }).primaryKey(),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  customerId: varchar("customer_id", { length: 36 }).notNull(),
  invoiceNo: varchar("invoice_no", { length: 50 }).notNull(),

  // ✅ Use DATETIME for business dates
  date: datetime("date").notNull(),
  // dueDate: datetime("due_date").notNull(),

  invoiceStatus: mysqlEnum("invoice_status", ["draft","issued","paid","cancelled"]).default("draft"),
  subTotal: decimal("sub_total", { precision: 14, scale: 2 }).notNull(),
  taxTotal: decimal("tax_total", { precision: 14, scale: 2 }).notNull(),
  total: decimal("total", { precision: 14, scale: 2 }).notNull(),
  notes: text("notes"),

  // ✅ MySQL-safe default (don’t use .defaultNow())
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});


// Invoice Items table
export const invoiceItems = mysqlTable("invoice_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  invoiceId: varchar("invoice_id", { length: 36 }).notNull(),
  productId: varchar("product_id", { length: 36 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  qty: int("qty").notNull(),
  unitPrice: decimal("unit_price", { precision: 14, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0.00"),
  lineTotal: decimal("line_total", { precision: 14, scale: 2 }).notNull(),
});

// Payments table
export const payments = mysqlTable("payments", {
  id: varchar("id", { length: 36 }).primaryKey(),
  invoiceId: varchar("invoice_id", { length: 36 }).notNull(),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  method: varchar("method", { length: 50 }).notNull(),
  paidAt: timestamp("paid_at").notNull(),
  reference: varchar("reference", { length: 255 }),
});

// Expenses table
export const expenses = mysqlTable("expenses", {
  id: varchar("id", { length: 36 }).primaryKey(),
  companyId: varchar("company_id", { length: 36 }).notNull(),
  vendor: varchar("vendor", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 14, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  date: timestamp("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ one }) => ({
  company: one(companies, {
    fields: [users.id],
    references: [companies.userId],
  }),
}));

export const companyRelations = relations(companies, ({ one, many }) => ({
  user: one(users, {
    fields: [companies.userId],
    references: [users.id],
  }),
  customers: many(customers),
  products: many(products),
  invoices: many(invoices),
  expenses: many(expenses),
}));

export const customerRelations = relations(customers, ({ one, many }) => ({
  company: one(companies, {
    fields: [customers.companyId],
    references: [companies.id],
  }),
  invoices: many(invoices),
}));

export const productRelations = relations(products, ({ one, many }) => ({
  company: one(companies, {
    fields: [products.companyId],
    references: [companies.id],
  }),
  invoiceItems: many(invoiceItems),
}));

export const invoiceRelations = relations(invoices, ({ one, many }) => ({
  company: one(companies, {
    fields: [invoices.companyId],
    references: [companies.id],
  }),
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  items: many(invoiceItems),
  payments: many(payments),
}));

export const invoiceItemRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  product: one(products, {
    fields: [invoiceItems.productId],
    references: [products.id],
  }),
}));

export const paymentRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

export const expenseRelations = relations(expenses, ({ one }) => ({
  company: one(companies, {
    fields: [expenses.companyId],
    references: [companies.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCompanySchema = createInsertSchema(companies).omit({ id: true, createdAt: true });
// export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true });
// export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  companyId: true, // 👈 omit because you’ll inject it in backend
  createdAt: true,
});
export const insertCustomerWithCompanySchema = insertCustomerSchema.extend({
  companyId: z.string(),
});
export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
}).extend({
  priceDecimal: z.number().min(0, "Price is required"),
  costDecimal: z.number().min(0, "Cost is required"),
  stockQty: z.number().int().min(0).optional(),
});
// export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true, createdAt: true });
// export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true });
// Invoice schema
export const insertInvoiceSchema = createInsertSchema(invoices)
  .omit({
    id: true,
    createdAt: true,
    companyId: true,  // <-- omit because backend sets it
    invoiceNo: true,  // <-- omit because backend generates it
  })
  .extend({
    date: z.coerce.date(),         // accepts string -> Date
    subTotal: z.coerce.number(),   // accepts string or number -> number
    taxTotal: z.coerce.number(),
    total: z.coerce.number(),
  });

// Invoice item schema
export const insertInvoiceItemSchema = createInsertSchema(invoiceItems, {
  unitPrice: z.union([z.string(), z.number()]).transform(String),
  taxRate: z.union([z.string(), z.number()]).transform(String),
  lineTotal: z.union([z.string(), z.number()]).transform(String),
}).omit({
  id: true,
  invoiceId: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true });
export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;
