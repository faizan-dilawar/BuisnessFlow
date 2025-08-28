import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { hashPassword, verifyPassword, generateTokens, verifyAccessToken } from "./services/auth";
import { generateInvoicePDF, generatePnLPDF } from "./services/pdf";
import { 
  insertUserSchema, insertCompanySchema, insertCustomerSchema, insertProductSchema, 
  insertInvoiceSchema, insertInvoiceItemSchema, insertPaymentSchema, insertExpenseSchema, 
  companies,
  users,
  insertCustomerWithCompanySchema,
  backendExpenseSchema
} from "@shared/schema";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

// import { db } from "./db";
// import { v4 as uuidv4 } from "uuid";
// import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 5 requests per windowMs
  message: "Too many authentication attempts, please try again later.",
});

// Middleware to verify JWT token
const authenticateToken = async (req: Request, res: Response, next: Function) => {
  console.log('reBody',req.headers)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log('token',token)

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const payload = verifyAccessToken(token);
  console.log('payload',payload)
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
    console.log("req",req.body)
    try {
      const { email, password, name, companyName } = z.object({
        email: z.string().email().trim(),
  password: z.string().min(6).trim(),
  name: z.string().min(1).trim(),
  companyName: z.string().min(1).trim(),
      }).parse(req.body);

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const passwordHash = (password);
      const user = await storage.createUser({ email, passwordHash, name });
      
      // Create company for the userawait hashPassword
      await storage.createCompany({
        userId: user.id,
        name: companyName,
      });

      const tokens = generateTokens(user);
      res.json(tokens);
    } catch (error) {
      console.log(error)
      res.status(400).json({ message: "AInvalid request data" });
    }
  });
  const JWT_SECRET = process.env.JWT_SECRET || "dev-secret"; // put in .env

  // app.post("/signup", async (req, res, next) => {
  //   try {
  //     const { name, email, password, companyName } = req.body;
  
  //     // Validate basic presence
  //     if (!name || !email || !password || !companyName) {
  //       return res.status(400).json({ message: "All fields are required" });
  //     }
  
  //     // Check if email already exists
  //     const existingUser = await db
  //       .select()
  //       .from(users)
  //       .where(users.email.eq(email));
  //     if (existingUser.length > 0) {
  //       return res.status(400).json({ message: "Email already registered" });
  //     }
  
  //     // Generate UUIDs
  //     const userId = uuidv4();
  //     const companyId = uuidv4();
  
  //     // Hash password
  //     const passwordHash = await bcrypt.hash(password, 10);
  
  //     // Insert user first
  //     const [savedUser] = await db
  //       .insert(users)
  //       .values({
  //         id: userId,
  //         email,
  //         passwordHash,
  //         name,
  //         role: "admin", // default
  //       })
  //       .$returningId();
  
  //     // Insert company linked to user
  //     const [savedCompany] = await db
  //       .insert(companies)
  //       .values({
  //         id: companyId,
  //         userId: userId,
  //         name: companyName,
  //       })
  //       .$returningId();
  
  //     // Generate JWT token
  //     const token = jwt.sign(
  //       { userId: savedUser.id, companyId: savedCompany.id },
  //       JWT_SECRET,
  //       { expiresIn: "7d" }
  //     );
  
  //     res.status(201).json({
  //       message: "User registered successfully",
  //       token,
  //       user: savedUser,
  //       company: savedCompany,
  //     });
  //   } catch (err) {
  //     next(err);
  //   }
  // });
  app.post("/api/auth/login", authLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password } = z.object({
        email: z.string().email(),
        password: z.string(),
      }).parse(req.body);

      const user = await storage.getUserByEmail(email);
      console.log('user',user)
      // if (user || !(await verifyPassword(password, user.passwordHash))) {
      //   return res.status(401).json({ message: "Invalid credentials" });
      // }

      const tokens = generateTokens(user);
      res.json(tokens);
    } catch (error) {
      res.status(400).json({ message: "BInvalid request data" });
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
      res.status(400).json({ message: "CInvalid request data" });
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
    console.log('companyB',company)
    if (!company) return res.status(404).json({ message: "Company not found" });
    
    const customers = await storage.getCustomersByCompanyId(company.id);
    res.json(customers);
  });

  app.post("/api/customers", authenticateToken, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const company = await storage.getCompanyByUserId(user.id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
  
      // validate input without companyId
      const raw = insertCustomerSchema.parse(req.body);
  
      // extend with companyId (backend-only schema)
      const customerData = insertCustomerWithCompanySchema.parse({
        ...raw,
        companyId: company.id,
      });
  
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ message: "Invalid customer data", error });
    }
  });
  
  app.put("/api/customers/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, customerData);
      res.json(customer);
    } catch (error) {
      res.status(400).json({ message: "Invalid customer data",error });
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
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
  
      // ✅ Now frontend can send numbers directly
      const productData = insertProductSchema.parse({
        ...req.body,
        companyId: company.id,
      });
  
      const product = await storage.createProduct(productData);
  
      res.status(201).json(product);
    } catch (error) {
      console.error("Create product failed:", error);
      res.status(400).json({ message: "Invalid product data", error });
    }
  });

  app.put("/api/products/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      // const productData = insertProductSchema.partial().parse(...req.body);
      // const product = await storage.updateProduct(req.params.id, productData);
      // res.json(product);
      const productData = insertProductSchema.parse({
        ...req.body,
        companyId: company.id,
        priceDecimal: req.body.priceDecimal?.toString(),
        costDecimal: req.body.costDecimal?.toString(),
      });
      
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

  // app.post("/api/invoices", authenticateToken, async (req: Request, res: Response) => {
  //   try {
  //     const user = (req as any).user;
  //     const company = await storage.getCompanyByUserId(user.id);
  //     if (!company) return res.status(404).json({ message: "Company not found" });

  //     const { invoice: invoiceData, items } = z.object({
  //       invoice: insertInvoiceSchema.omit({ invoiceNo: true, id: true, createdAt: true }),
  //       items: z.array(insertInvoiceItemSchema.omit({ invoiceId: true, id: true })),
  //     }).parse(req.body);

  //     const invoiceNo = await storage.generateInvoiceNumber(company.id);
  //     const invoice = await storage.createInvoice(
  //       { ...invoiceData, companyId: company.id, invoiceNo },
  //       items
  //     );
      
  //     res.status(201).json(invoice);
  //   } catch (error) {
  //     res.status(400).json({ message: "Invalid invoice data" });
  //   }
  // });
// ✅ route: create invoice
app.post("/api/invoices", authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const company = await storage.getCompanyByUserId(user.id);
    if (!company) return res.status(404).json({ message: "Company not found" });

    // ✅ Define schema that excludes companyId & invoiceNo
    const InvoiceWithItemsSchema = z.object({
      invoice: insertInvoiceSchema,
      items: z.array(insertInvoiceItemSchema),
    });

    // ✅ Validate request body
    const { invoice, items } = InvoiceWithItemsSchema.parse(req.body);

    // ✅ Generate invoice number
    const invoiceNo = await storage.generateInvoiceNumber(company.id);

    // ✅ Insert invoice + items
    const newInvoice = await storage.createInvoice(
      { ...invoice, companyId: company.id, invoiceNo },
      items
    );
    console.log('newInvoice',newInvoice)

    res.status(201).json(newInvoice);
  } catch (error:any) {
    console.error(error);
    res.status(400).json({ message:error.message|| "Invalid invoice data" });
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

    // validate client input
    const expenseData = insertExpenseSchema.parse(req.body);

    // validate backend insert (with companyId)
    const fullExpense = backendExpenseSchema.parse({
      ...expenseData,
      companyId: company.id,
    });

    const expense = await storage.createExpense(fullExpense);

    res.status(201).json(expense);
  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: "Invalid expense data", error });
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
  app.get("/api/dashboard/metrics", authenticateToken, async (req: Request, res: Response) => {
    const user = (req as any).user;
    console.log("User:", user);
    const company = await storage.getCompanyByUserId(user.id);
    if (!company) return res.status(404).json({ message: "Company not found" });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const today = new Date();
    console.log("Company:", company.id);
console.log("Date range:", thirtyDaysAgo.toISOString(), "→", today.toISOString());

    const metrics = await storage.getDashboardMetrics(company.id, thirtyDaysAgo, today);
    console.log("Metrics result:", metrics);

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

  //rports download :
app.get("/api/reports/pnl/export", authenticateToken, async (req, res) => {
 try {
    const { format, from, to } = req.query as {
      format: string;
      from: string;
      to: string;
    };

    const user = (req as any).user;
    const company = await storage.getCompanyByUserId(user.id);
    if (!company) return res.status(404).json({ message: "Company not found" });

    // ✅ Your DB fetch
    const pnl = await storage.getProfitLoss(company.id, new Date(from), new Date(to));

    if (format === "pdf") {
      const pdf = await generatePnLPDF({
        from,
        to,
        rows: [
          { account: "Revenue", debit: 0, credit: pnl.revenue, balance: pnl.revenue },
          { account: "COGS", debit: pnl.cogs, credit: 0, balance: -pnl.cogs },
          { account: "Expenses", debit: pnl.expenses, credit: 0, balance: -pnl.expenses },
        ],
        companyName: company.name,
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="pnl-report.pdf"`);
      res.send(pdf);
      return;
    }

    if (format === "excel") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Profit & Loss");

      // Header
      sheet.mergeCells("A1:D1");
      sheet.getCell("A1").value = `${company.name} - Profit & Loss Report`;
      sheet.getCell("A1").font = { size: 16, bold: true };
      sheet.getCell("A1").alignment = { horizontal: "center" };

      sheet.addRow([]);
      sheet.addRow([`Period: ${from} → ${to}`]).font = { italic: true };
      sheet.addRow([]);

      // Table header
      const headerRow = sheet.addRow(["Account", "Debit", "Credit", "Balance"]);
      headerRow.font = { bold: true };
      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE5E7EB" }, // light gray
        };
      });

      // Data rows
      const rows = [
        ["Revenue", 0, pnl.revenue, pnl.revenue],
        ["COGS", pnl.cogs, 0, -pnl.cogs],
        ["Expenses", pnl.expenses, 0, -pnl.expenses],
        ["Gross Profit", 0, 0, pnl.grossProfit],
        ["Net Profit", 0, 0, pnl.netProfit],
      ];

      rows.forEach((r) => sheet.addRow(r));

      // Auto width
      sheet.columns.forEach((col) => {
        let maxLength = 15;
        if (typeof col.eachCell === "function") {
          col.eachCell({ includeEmpty: true }, (cell) => {
            maxLength = Math.max(maxLength, (cell.value?.toString()?.length ?? 0) + 2);
          });
        }
        col.width = maxLength;
      });

      // Send
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", `attachment; filename="pnl-report.xlsx"`);

      await workbook.xlsx.write(res);
      res.end();
      return;
    }

    res.status(400).json({ message: "Invalid format" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating report" });
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
