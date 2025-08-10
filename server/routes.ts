import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { hashPassword, verifyPassword, generateTokens, verifyAccessToken } from "./services/auth";
import { generateInvoicePDF } from "./services/pdf";
import { 
  insertUserSchema, insertCompanySchema, insertCustomerSchema, insertProductSchema, 
  insertInvoiceSchema, insertInvoiceItemSchema, insertPaymentSchema, insertExpenseSchema 
} from "@shared/schema";

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: "Too many authentication attempts, please try again later.",
});

// Middleware to verify JWT token
const authenticateToken = async (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  const user = await storage.getUser(payload.userId);
  if (!user) {
    return res.status(403).json({ message: 'User not found' });
  }

  (req as any).user = user;
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.post("/api/auth/signup", authLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password, name, companyName } = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
        companyName: z.string().min(1),
      }).parse(req.body);

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({ email, passwordHash, name });
      
      // Create company for the user
      await storage.createCompany({
        userId: user.id,
        name: companyName,
      });

      const tokens = generateTokens(user);
      res.json(tokens);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/login", authLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password } = z.object({
        email: z.string().email(),
        password: z.string(),
      }).parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user || !(await verifyPassword(password, user.passwordHash))) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const tokens = generateTokens(user);
      res.json(tokens);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    try {
      const { refreshToken } = z.object({
        refreshToken: z.string(),
      }).parse(req.body);

      const payload = verifyAccessToken(refreshToken);
      if (!payload) {
        return res.status(403).json({ message: "Invalid refresh token" });
      }

      const user = await storage.getUser(payload.userId);
      if (!user) {
        return res.status(403).json({ message: "User not found" });
      }

      const tokens = generateTokens(user);
      res.json(tokens);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // User profile
  app.get("/api/user/profile", authenticateToken, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const company = await storage.getCompanyByUserId(user.id);
    res.json({ user, company });
  });

  // Customer routes
  app.get("/api/customers", authenticateToken, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const company = await storage.getCompanyByUserId(user.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    
    const customers = await storage.getCustomersByCompanyId(company.id);
    res.json(customers);
  });

  app.post("/api/customers", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const company = await storage.getCompanyByUserId(user.id);
      if (!company) return res.status(404).json({ message: "Company not found" });

      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer({ ...customerData, companyId: company.id });
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ message: "Invalid customer data" });
    }
  });

  app.put("/api/customers/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, customerData);
      res.json(customer);
    } catch (error) {
      res.status(400).json({ message: "Invalid customer data" });
    }
  });

  app.delete("/api/customers/:id", authenticateToken, async (req: Request, res: Response) => {
    await storage.deleteCustomer(req.params.id);
    res.status(204).send();
  });

  // Product routes
  app.get("/api/products", authenticateToken, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const company = await storage.getCompanyByUserId(user.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    
    const products = await storage.getProductsByCompanyId(company.id);
    res.json(products);
  });

  app.post("/api/products", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const company = await storage.getCompanyByUserId(user.id);
      if (!company) return res.status(404).json({ message: "Company not found" });

      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct({ ...productData, companyId: company.id });
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.put("/api/products/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, productData);
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.delete("/api/products/:id", authenticateToken, async (req: Request, res: Response) => {
    await storage.deleteProduct(req.params.id);
    res.status(204).send();
  });

  // Invoice routes
  app.get("/api/invoices", authenticateToken, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const company = await storage.getCompanyByUserId(user.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    
    const invoices = await storage.getInvoicesByCompanyId(company.id);
    res.json(invoices);
  });

  app.get("/api/invoices/:id", authenticateToken, async (req: Request, res: Response) => {
    const invoice = await storage.getInvoiceWithItems(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Invoice not found" });
    res.json(invoice);
  });

  app.post("/api/invoices", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const company = await storage.getCompanyByUserId(user.id);
      if (!company) return res.status(404).json({ message: "Company not found" });

      const { invoice: invoiceData, items } = z.object({
        invoice: insertInvoiceSchema.omit({ invoiceNo: true, id: true, createdAt: true }),
        items: z.array(insertInvoiceItemSchema.omit({ invoiceId: true, id: true })),
      }).parse(req.body);

      const invoiceNo = await storage.generateInvoiceNumber(company.id);
      const invoice = await storage.createInvoice(
        { ...invoiceData, companyId: company.id, invoiceNo },
        items
      );
      
      res.status(201).json(invoice);
    } catch (error) {
      res.status(400).json({ message: "Invalid invoice data" });
    }
  });

  app.put("/api/invoices/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const invoiceData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, invoiceData);
      res.json(invoice);
    } catch (error) {
      res.status(400).json({ message: "Invalid invoice data" });
    }
  });

  app.get("/api/invoices/:id/pdf", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const company = await storage.getCompanyByUserId(user.id);
      if (!company) return res.status(404).json({ message: "Company not found" });

      const invoice = await storage.getInvoiceWithItems(req.params.id);
      if (!invoice) return res.status(404).json({ message: "Invoice not found" });

      const pdfBuffer = await generateInvoicePDF({
        invoice,
        items: invoice.items,
        customer: invoice.customer,
        company,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNo}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  // Payment routes
  app.post("/api/payments", authenticateToken, async (req: Request, res: Response) => {
    try {
      const paymentData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment(paymentData);
      res.status(201).json(payment);
    } catch (error) {
      res.status(400).json({ message: "Invalid payment data" });
    }
  });

  // Expense routes
  app.get("/api/expenses", authenticateToken, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const company = await storage.getCompanyByUserId(user.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    
    const expenses = await storage.getExpensesByCompanyId(company.id);
    res.json(expenses);
  });

  app.post("/api/expenses", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const company = await storage.getCompanyByUserId(user.id);
      if (!company) return res.status(404).json({ message: "Company not found" });

      const expenseData = insertExpenseSchema.parse(req.body);
      const expense = await storage.createExpense({ ...expenseData, companyId: company.id });
      res.status(201).json(expense);
    } catch (error) {
      res.status(400).json({ message: "Invalid expense data" });
    }
  });

  app.put("/api/expenses/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const expenseData = insertExpenseSchema.partial().parse(req.body);
      const expense = await storage.updateExpense(req.params.id, expenseData);
      res.json(expense);
    } catch (error) {
      res.status(400).json({ message: "Invalid expense data" });
    }
  });

  app.delete("/api/expenses/:id", authenticateToken, async (req: Request, res: Response) => {
    await storage.deleteExpense(req.params.id);
    res.status(204).send();
  });

  // Analytics routes
  app.get("/api/analytics/dashboard", authenticateToken, async (req: Request, res: Response) => {
    const user = (req as any).user;
    const company = await storage.getCompanyByUserId(user.id);
    if (!company) return res.status(404).json({ message: "Company not found" });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const today = new Date();

    const metrics = await storage.getDashboardMetrics(company.id, thirtyDaysAgo, today);
    const lowStockProducts = await storage.getLowStockProducts(company.id, 5);
    
    res.json({ ...metrics, lowStockProducts });
  });

  app.get("/api/reports/pnl", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const company = await storage.getCompanyByUserId(user.id);
      if (!company) return res.status(404).json({ message: "Company not found" });

      const { from, to } = z.object({
        from: z.string().transform(str => new Date(str)),
        to: z.string().transform(str => new Date(str)),
      }).parse(req.query);

      const pnl = await storage.getProfitLoss(company.id, from, to);
      res.json(pnl);
    } catch (error) {
      res.status(400).json({ message: "Invalid date range" });
    }
  });

  // Company settings
  app.put("/api/company/settings", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const company = await storage.getCompanyByUserId(user.id);
      if (!company) return res.status(404).json({ message: "Company not found" });

      const companyData = insertCompanySchema.partial().omit({ userId: true }).parse(req.body);
      const updatedCompany = await storage.updateCompany(company.id, companyData);
      res.json(updatedCompany);
    } catch (error) {
      res.status(400).json({ message: "Invalid company data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
