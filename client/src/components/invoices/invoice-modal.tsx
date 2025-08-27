import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, X } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

const invoiceItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  description: z.string().min(1, "Description is required"),
  qty: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  taxRate: z.number().min(0).max(100, "Tax rate must be between 0-100"),
});

const invoiceSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  date: z.string().min(1, "Date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  status: z.enum(["draft", "issued","paid","cancelled"]),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
});

type InvoiceForm = z.infer<typeof invoiceSchema>;

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingInvoice?: any;
}

export default function InvoiceModal({ isOpen, onClose, editingInvoice }: InvoiceModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/customers");
      console.log("customers",res)
      return res.json();
    },
  });

  const { data: products } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/products");
      return res.json();
    },
  });

  const form = useForm<InvoiceForm>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: "",
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: "draft",
      notes: "",
      items: [
        {
          productId: "",
          description: "",
          qty: 1,
          unitPrice: 0,
          taxRate: 18,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const createMutation = useMutation({
    mutationFn: async (data: InvoiceForm) => {
      const payload = {
        invoice: {
          customerId: data.customerId,
          date: new Date(data.date),
          dueDate: new Date(data.dueDate),
          invoiceStatus: data.status,
          notes: data.notes,
          subTotal: calculateSubtotal(),
          taxTotal: calculateTaxTotal(),
          total: calculateTotal(),
        },
        items: data.items.map(item => ({
          productId: item.productId,
          description: item.description,
          qty: item.qty,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          lineTotal: calculateLineTotal(item.qty, item.unitPrice, item.taxRate),
        })),
      };
      console.log("pay;oad",payload)
      const res = await apiRequest("POST", "/api/invoices", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      onClose();
      form.reset();
      toast({
        title: "Success",
        description: "Invoice created successfully",
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

  const watchedItems = form.watch("items");

  const getProduct = (productId: string) => {
    return products?.find((p: any) => p.id === productId);
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = getProduct(productId);
    if (product) {
      form.setValue(`items.${index}.productId`, productId);
      form.setValue(`items.${index}.description`, product.name);
      form.setValue(`items.${index}.unitPrice`, Number(product.priceDecimal));
    }
  };

  const calculateLineTotal = (qty: number, unitPrice: number, taxRate: number) => {
    const subtotal = qty * unitPrice;
    const tax = subtotal * (taxRate / 100);
    return subtotal + tax;
  };

  const calculateSubtotal = () => {
    return watchedItems.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
  };

  const calculateTaxTotal = () => {
    return watchedItems.reduce((sum, item) => {
      const subtotal = item.qty * item.unitPrice;
      return sum + (subtotal * (item.taxRate / 100));
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTaxTotal();
  };

  const onSubmit = (data: InvoiceForm) => {
    createMutation.mutate(data);
  };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingInvoice ? "Edit Invoice" : "Create New Invoice"}
          </DialogTitle>
          <DialogDescription>
            {editingInvoice 
              ? "Update invoice details below."
              : "Fill in the invoice details below."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Invoice Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="customerId">Customer *</Label>
              <select
                id="customerId"
                {...form.register("customerId")}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">Select Customer...</option>
                {customers?.map((customer: any) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.customerId && (
                <p className="text-sm text-red-600">{form.formState.errors.customerId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Invoice Date *</Label>
              <Input
                id="date"
                type="date"
                {...form.register("date")}
              />
              {form.formState.errors.date && (
                <p className="text-sm text-red-600">{form.formState.errors.date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                {...form.register("dueDate")}
              />
              {form.formState.errors.dueDate && (
                <p className="text-sm text-red-600">{form.formState.errors.dueDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                {...form.register("status")}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="draft">Draft</option>
                <option value="issued">Issued</option>
                <option value="paid">Paid</option>

                <option value="cancelled">Cancelled</option>

                {/* "draft", "issued", "paid", "cancelled" */}
              </select>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Invoice Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({
                  productId: "",
                  description: "",
                  qty: 1,
                  unitPrice: 0,
                  taxRate: 18,
                })}
              >
                <Plus className="mr-2 w-4 h-4" />
                Add Item
              </Button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Tax %</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => {
                    const item = watchedItems[index];
                    const lineTotal = item ? calculateLineTotal(item.qty, item.unitPrice, item.taxRate) : 0;

                    return (
                      <TableRow key={field.id}>
                        <TableCell>
                          <select
                            {...form.register(`items.${index}.productId`)}
                            onChange={(e) => handleProductChange(index, e.target.value)}
                            className="w-full text-sm border-0 focus:ring-0 p-1"
                          >
                            <option value="">Select Product...</option>
                            {products?.map((product: any) => (
                              <option key={product.id} value={product.id}>
                                {product.name}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell>
                          <Input
                            {...form.register(`items.${index}.description`)}
                            className="border-0 focus:ring-0 p-1"
                            placeholder="Description"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            {...form.register(`items.${index}.qty`, { valueAsNumber: true })}
                            className="border-0 focus:ring-0 p-1 w-20"
                            min="1"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            {...form.register(`items.${index}.unitPrice`, { valueAsNumber: true })}
                            className="border-0 focus:ring-0 p-1 w-24"
                            min="0"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            {...form.register(`items.${index}.taxRate`, { valueAsNumber: true })}
                            className="border-0 focus:ring-0 p-1 w-20"
                            min="0"
                            max="100"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(lineTotal)}
                        </TableCell>
                        <TableCell>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {form.formState.errors.items && (
              <p className="text-sm text-red-600">{form.formState.errors.items.message}</p>
            )}
          </div>

          {/* Invoice Totals */}
          <div className="flex justify-end">
            <div className="w-80 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(calculateSubtotal())}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Tax:</span>
                <span className="font-medium">{formatCurrency(calculateTaxTotal())}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span className="text-lg">{formatCurrency(calculateTotal())}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...form.register("notes")}
              placeholder="Additional notes or terms..."
            />
          </div>

          {/* Modal Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Create Invoice"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
