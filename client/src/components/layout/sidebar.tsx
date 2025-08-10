import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  ChartLine, 
  FileText, 
  Users, 
  Package, 
  Receipt, 
  BarChart3, 
  Settings,
  LogOut,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: ChartLine, label: "Dashboard", href: "/" },
  { icon: FileText, label: "Invoices", href: "/invoices" },
  { icon: Users, label: "Customers", href: "/customers" },
  { icon: Package, label: "Products", href: "/products" },
  { icon: Receipt, label: "Expenses", href: "/expenses" },
  { icon: BarChart3, label: "Reports", href: "/reports" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-slate-200 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <FileText className="text-white text-sm" />
          </div>
          <span className="text-xl font-semibold text-slate-800">InvoiceFlow</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-6 px-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href === "/" && location === "/dashboard");
          
          return (
            <Link key={item.href} href={item.href}>
              <a className={cn(
                "flex items-center px-4 py-3 text-slate-600 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors group",
                isActive && "bg-primary-50 text-primary-600"
              )}>
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center">
            <User className="text-slate-600 w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          </div>
          <button 
            onClick={logout}
            className="text-slate-400 hover:text-slate-600 p-1"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
