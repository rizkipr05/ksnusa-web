"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { AddProductModal } from "@/components/AddProductModal"; // Pastikan file ini ada di components
import { EditProductModal } from "@/components/EditProductModal";
import { deleteProduct } from "@/app/actions";

export default function InventoryClient({ initialData, suppliers }: { initialData: any[], suppliers: any[] }) {
  const [filter, setFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(initialData.map(item => item.category)))];

  const filteredData = initialData
    .filter(i => i.productName.toLowerCase().includes(filter.toLowerCase()))
    .filter(i => selectedCategory === "All" || i.category === selectedCategory);

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(id);
        alert("Product deleted successfully!");
      } catch (error) {
        alert("Failed to delete product: " + error.message);
      }
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Inventory</h2>
        <AddProductModal suppliers={suppliers} />
      </div>

      <Card>
        <CardHeader><CardTitle>Stock List</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input placeholder="Search product..." onChange={(e) => setFilter(e.target.value)} />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Total Sold</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item, i) => (
                <TableRow key={i}>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.currentStock}</TableCell>
                  <TableCell>{item.totalSold}</TableCell>
                  <TableCell>Rp {item.revenue.toLocaleString()}</TableCell>
                  <TableCell><Badge>{item.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <EditProductModal suppliers={suppliers} existingData={item} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}