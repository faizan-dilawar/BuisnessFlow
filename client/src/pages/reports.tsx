import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calculator,
  Download,
  Calendar
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  const { data: pnlData, isLoading, refetch } = useQuery({
    queryKey: ["/api/reports/pnl", dateRange.from, dateRange.to],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/reports/pnl?from=${dateRange.from}&to=${dateRange.to}`);
      return res.json();
    },
    enabled: !!dateRange.from && !!dateRange.to,
  });

  const handleDateChange = (field: "from" | "to", value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };



  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return "0%";
    return ((value / total) * 100).toFixed(1) + "%";
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Reports</h1>
          <p className="text-slate-600 mt-2">Analyze your business performance</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 w-5 h-5" />
            Report Period
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end space-x-4">
            <div className="space-y-2">
              <Label htmlFor="from">From Date</Label>
              <Input
                id="from"
                type="date"
                value={dateRange.from}
                onChange={(e) => handleDateChange("from", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">To Date</Label>
              <Input
                id="to"
                type="date"
                value={dateRange.to}
                onChange={(e) => handleDateChange("to", e.target.value)}
              />
            </div>
            <Button onClick={() => refetch()}>
              Update Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : pnlData ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Total Revenue</p>
                    <p className="text-2xl font-bold text-slate-800 mt-2">
                      {formatCurrency(pnlData.revenue)}
                    </p>
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
                    <p className="text-slate-600 text-sm font-medium">Cost of Goods Sold</p>
                    <p className="text-2xl font-bold text-slate-800 mt-2">
                      {formatCurrency(pnlData.cogs)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatPercentage(pnlData.cogs, pnlData.revenue)} of revenue
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Calculator className="text-amber-600 w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Total Expenses</p>
                    <p className="text-2xl font-bold text-slate-800 mt-2">
                      {formatCurrency(pnlData.expenses)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatPercentage(pnlData.expenses, pnlData.revenue)} of revenue
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="text-red-600 w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Net Profit</p>
                    <p className={`text-2xl font-bold mt-2 ${
                      pnlData.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(pnlData.netProfit)}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatPercentage(pnlData.netProfit, pnlData.revenue)} margin
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    pnlData.netProfit >= 0 ? 'bg-emerald-100' : 'bg-red-100'
                  }`}>
                    <TrendingUp className={`w-6 h-6 ${
                      pnlData.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profit & Loss Statement */}
          <Card>
            <CardHeader>
              <CardTitle>Profit & Loss Statement</CardTitle>
              <p className="text-slate-600">
                From {new Date(dateRange.from).toLocaleDateString()} to {new Date(dateRange.to).toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Revenue Section */}
                <div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-200">
                    <span className="font-semibold text-slate-800">Revenue</span>
                    <span className="font-semibold text-slate-800">
                      {formatCurrency(pnlData.revenue)}
                    </span>
                  </div>
                </div>

                {/* Cost of Goods Sold */}
                <div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-600 pl-4">Cost of Goods Sold</span>
                    <span className="text-slate-600">
                      ({formatCurrency(pnlData.cogs)})
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-slate-200 font-medium">
                    <span className="text-slate-800">Gross Profit</span>
                    <span className={pnlData.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                      {formatCurrency(pnlData.grossProfit)}
                    </span>
                  </div>
                </div>

                {/* Operating Expenses */}
                <div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-600 pl-4">Operating Expenses</span>
                    <span className="text-slate-600">
                      ({formatCurrency(pnlData.expenses)})
                    </span>
                  </div>
                </div>

                {/* Net Profit */}
                <div className="border-t border-slate-300 pt-4">
                  <div className="flex justify-between items-center py-3">
                    <span className="text-lg font-bold text-slate-800">Net Profit</span>
                    <span className={`text-lg font-bold ${
                      pnlData.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(pnlData.netProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insights Card */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Financial Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-slate-800 mb-2">Profitability</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Gross Margin:</span>
                      <span className="font-medium">
                        {formatPercentage(pnlData.grossProfit, pnlData.revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Net Margin:</span>
                      <span className="font-medium">
                        {formatPercentage(pnlData.netProfit, pnlData.revenue)}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-slate-800 mb-2">Cost Structure</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">COGS as % of Revenue:</span>
                      <span className="font-medium">
                        {formatPercentage(pnlData.cogs, pnlData.revenue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">OpEx as % of Revenue:</span>
                      <span className="font-medium">
                        {formatPercentage(pnlData.expenses, pnlData.revenue)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calculator className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-800 mb-2">No data available</h3>
          <p className="text-slate-600 mb-4">Select a date range to view your financial reports.</p>
        </div>
      )}
    </div>
  );
}
