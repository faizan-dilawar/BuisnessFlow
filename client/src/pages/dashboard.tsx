import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  FileText, 
  Receipt, 
  TrendingUp, 
  TrendingDown,
  Clock,
  AlertTriangle,
  Plus,
  Users,
  Package,
  ChevronRight,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import InvoiceModal from "@/components/invoices/invoice-modal";

export default function Dashboard() {
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["/api/analytics/dashboard"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/analytics/dashboard");
      return res.json();
    },
  });

  const { data: recentInvoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ["/api/invoices"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/invoices");
      const invoices = await res.json();
      return invoices.slice(0, 4); // Get latest 4 invoices
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-100 text-emerald-800";
      case "issued":
        return "bg-amber-100 text-amber-800";
      case "draft":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  if (analyticsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-slate-600 mt-2">Welcome back! Here's what's happening with your business today.</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total Revenue (30d)</p>
                  <p className="text-2xl font-bold text-slate-800 mt-2">
                    {formatCurrency(analytics?.revenue || 0, "USD")}
                  </p>
                  <div className="flex items-center mt-2">
                    <ArrowUp className="text-emerald-500 w-4 h-4 mr-1" />
                    <span className="text-emerald-500 text-sm font-medium">12.5%</span>
                    <span className="text-slate-500 text-sm ml-1">vs last month</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-emerald-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Outstanding</p>
                  <p className="text-2xl font-bold text-slate-800 mt-2">
                    {formatCurrency(analytics?.outstanding || 0, "USD")}
                  </p>
                  <div className="flex items-center mt-2">
                    <Clock className="text-amber-500 w-4 h-4 mr-1" />
                    <span className="text-amber-500 text-sm font-medium">6 invoices</span>
                    <span className="text-slate-500 text-sm ml-1">pending</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <FileText className="text-amber-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Expenses (30d)</p>
                  <p className="text-2xl font-bold text-slate-800 mt-2">
                    {formatCurrency(analytics?.expenses || 0, "USD")}
                  </p>
                  <div className="flex items-center mt-2">
                    <ArrowDown className="text-red-500 w-4 h-4 mr-1" />
                    <span className="text-red-500 text-sm font-medium">8.2%</span>
                    <span className="text-slate-500 text-sm ml-1">vs last month</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Receipt className="text-red-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Net Profit (30d)</p>
                  <p className="text-2xl font-bold text-slate-800 mt-2">
                    {formatCurrency(analytics?.profit || 0, "USD")}
                  </p>
                  <div className="flex items-center mt-2">
                    <ArrowUp className="text-emerald-500 w-4 h-4 mr-1" />
                    <span className="text-emerald-500 text-sm font-medium">15.8%</span>
                    <span className="text-slate-500 text-sm ml-1">vs last month</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-blue-600 w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Invoices */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Invoices</CardTitle>
                  <Button variant="ghost" size="sm">View All</Button>
                </div>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-16 bg-slate-200 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : recentInvoices && recentInvoices.length > 0 ? (
                  <div className="space-y-4">
                    {recentInvoices.map((invoice: any) => (
                      <div key={invoice.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-b-0">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <FileText className="text-slate-600 w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{invoice.invoiceNo}</p>
                            <p className="text-sm text-slate-600">{invoice.customerName || "Customer"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-slate-800">
                            {formatCurrency(Number(invoice.total), "USD")}
                          </p>
                          <Badge className={getStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No invoices yet</p>
                    <Button 
                      className="mt-4"
                      onClick={() => setIsInvoiceModalOpen(true)}
                    >
                      Create your first invoice
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Low Stock Alert */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Low Stock Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics?.lowStockProducts && analytics.lowStockProducts.length > 0 ? (
                  <div className="space-y-4">
                    {analytics.lowStockProducts.slice(0, 3).map((product: any) => (
                      <div key={product.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-800">{product.name}</p>
                          <p className="text-sm text-slate-600">SKU: {product.sku}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-red-600 font-medium">{product.stockQty} left</span>
                          <p className="text-xs text-slate-500">Min: 5</p>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full">
                      Restock Items
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-slate-600 text-sm">All products are well stocked</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between"
                  onClick={() => setIsInvoiceModalOpen(true)}
                >
                  <div className="flex items-center">
                    <Plus className="text-primary w-5 h-5 mr-3" />
                    <span>Create Invoice</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex items-center">
                    <Users className="text-primary w-5 h-5 mr-3" />
                    <span>Add Customer</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex items-center">
                    <Package className="text-primary w-5 h-5 mr-3" />
                    <span>Add Product</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex items-center">
                    <Receipt className="text-primary w-5 h-5 mr-3" />
                    <span>Record Expense</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            {/* Revenue Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-40 bg-slate-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <TrendingUp className="text-slate-400 w-8 h-8 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">Chart will render here</p>
                    <p className="text-xs text-slate-400">Showing last 30 days</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <InvoiceModal 
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
      />
    </>
  );
}
