import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, User, CreditCard, Settings as SettingsIcon } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  address: z.string().optional(),
  gstin: z.string().optional(),
  currency: z.string().min(1, "Currency is required"),
  timezone: z.string().min(1, "Timezone is required"),
  allowNegativeStock: z.boolean(),
});

type CompanyForm = z.infer<typeof companySchema>;

const currencies = [
  { code: "USD", name: "US Dollar" },
  { code: "INR", name: "Indian Rupee" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
];

const timezones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Australia/Sydney",
];

export default function Settings() {
  const { user, company } = useAuth();
  console.log('companyID',company)
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name || "",
      address: company?.address || "",
      gstin: company?.gstin || "",
      currency: company?.currency || "USD",
      timezone: company?.timezone || "UTC",
      allowNegativeStock: company?.allowNegativeStock || false,
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: CompanyForm) => {
      const res = await apiRequest("PUT", "/api/company/settings", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      toast({
        title: "Success",
        description: "Company settings updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CompanyForm) => {
    updateCompanyMutation.mutate(data);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
        <p className="text-slate-600 mt-2">Manage your account and company preferences</p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="company" className="flex items-center">
            <Building className="w-4 h-4 mr-2" />
            Company
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center">
            <User className="w-4 h-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center">
            <CreditCard className="w-4 h-4 mr-2" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <p className="text-slate-600">Update your company details and preferences</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      {...form.register("name")}
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gstin">GSTIN/Tax ID</Label>
                    <Input
                      id="gstin"
                      {...form.register("gstin")}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    {...form.register("address")}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency *</Label>
                    <select
                      id="currency"
                      {...form.register("currency")}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      {currencies.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.currency && (
                      <p className="text-sm text-red-600">{form.formState.errors.currency.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone *</Label>
                    <select
                      id="timezone"
                      {...form.register("timezone")}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      {timezones.map((timezone) => (
                        <option key={timezone} value={timezone}>
                          {timezone}
                        </option>
                      ))}
                    </select>
                    {form.formState.errors.timezone && (
                      <p className="text-sm text-red-600">{form.formState.errors.timezone.message}</p>
                    )}
                  </div>
                </div>

                {/* Inventory Settings */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-slate-800 mb-4">Inventory Settings</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="allowNegativeStock">Allow Negative Stock</Label>
                      <p className="text-sm text-slate-500">
                        Allow products to have negative stock quantities
                      </p>
                    </div>
                    <Switch
                      id="allowNegativeStock"
                      checked={form.watch("allowNegativeStock")}
                      onCheckedChange={(checked) => form.setValue("allowNegativeStock", checked)}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={updateCompanyMutation.isPending}
                  >
                    {updateCompanyMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <p className="text-slate-600">Your personal account details</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={user?.name || ""} disabled />
                  </div>

                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input value={user?.email || ""} disabled />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value={user?.role || "Admin"} disabled />
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-slate-800 mb-4">Security</h3>
                  <Button variant="outline">
                    Change Password
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <p className="text-slate-600">Manage your billing information and subscription</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border rounded-lg p-6 bg-slate-50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-slate-800">Free Plan</h3>
                      <p className="text-slate-600">Basic features for small businesses</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-800">$0</p>
                      <p className="text-slate-600">per month</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      Up to 100 invoices per month
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      Basic reporting
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                      Email support
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-800">Payment Method</h3>
                  <p className="text-slate-600">No payment method required for the free plan</p>
                  <Button variant="outline">
                    Add Payment Method
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-800">Billing History</h3>
                  <p className="text-slate-600">No billing history available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
