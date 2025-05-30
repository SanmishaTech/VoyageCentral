import React, { useState, useEffect } from "react";
import { Button, Input } from "@/components/ui";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatter.js";
import axios from "axios";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import MultipleSelector, {
  Option,
} from "@/components/common/multiple-selector"; // Import MultipleSelector from common folder
import { Card, CardContent } from "@/components/ui/card";
import dayjs from "dayjs";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, del, patch } from "@/services/apiService";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import CustomPagination from "@/components/common/custom-pagination";
import {
  Loader,
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  Filter,
  Download,
  ShieldEllipsis,
  Search,
  PlusCircle,
  MoreHorizontal,
  CheckCircle,
  XCircle,
} from "lucide-react";
import ConfirmDialog from "@/components/common/confirm-dialog";
import { saveAs } from "file-saver";
import { Badge } from "@/components/ui/badge"; // Ensure Badge is imported
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
//  was here last time
const GroupClientBookingReceiptList = ({
  groupBookingId,
  groupClientBookingId,
}) => {
  const queryClient = useQueryClient();
  const [showConfirmation, setShowConfirmation] = useState(false); // State to show/hide confirmation dialog
  const [bookingReceiptToDelete, setBookingReceiptToDelete] = useState<
    number | null
  >(null); //
  //  Track the user ID to delete
  const navigate = useNavigate();

  const fetchBookingReceipts = async () => {
    const response = await get(`/booking-receipts/booking/${bookingId}`);
    return response;
  };

  // Fetch users using react-query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["booking-receipts", bookingId],
    queryFn: () => fetchBookingReceipts(),
  });

  const bookingReceipts = data?.bookingReceipts || [];

  // Mutation for deleting a user
  const deleteMutation = useMutation({
    mutationFn: (id: number) => del(`/booking-receipts/${id}`),
    onSuccess: () => {
      toast.success("Booking Receipt deleted successfully");
      queryClient.invalidateQueries(["booking-receipts"]);
    },
    onError: (error) => {
      if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete Booking Receipt");
      }
    },
  });

  const handleGenerateInvoice = async (receiptId) => {
    try {
      const response = await get(
        `/booking-receipts/invoice/${receiptId}`,
        {},
        { responseType: "blob" } // must be in config
      );

      if (response.status === 200) {
        const blob = new Blob([response.data], { type: "application/pdf" });

        const url = window.URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${receiptId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();

        window.URL.revokeObjectURL(url);
      } else {
        console.error("Failed to generate invoice");
        alert("Failed to generate invoice");
      }
    } catch (error) {
      console.error("Error downloading invoice:", error);
      alert("Failed to download invoice");
    }
  };

  const confirmDelete = (id: number) => {
    setBookingReceiptToDelete(id);
    setShowConfirmation(true);
  };

  const handleDelete = () => {
    if (bookingReceiptToDelete) {
      deleteMutation.mutate(bookingReceiptToDelete);
      setShowConfirmation(false);
      setBookingReceiptToDelete(null);
    }
  };

  return (
    <div className="mt-2 ">
      <div className="mx-auto ">
        <div className="mb-1 w-full flex flex-wrap justify-between items-center gap-2">
          <div className="text-xl font-bold text-gray-800 tracking-wide  dark:text-white ">
            Booking Receipt
          </div>

          <Button
            onClick={() =>
              navigate(`/bookings/${bookingId}/bookingReceipt/create`)
            }
            className="bg-primary text-xs hover:bg-primary/90 text-white shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Booking Receipt
          </Button>
        </div>

        <div>
          {/* Table Section */}
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader className="mr-2 h-8 w-8 animate-spin" />
            </div>
          ) : isError ? (
            <div className="text-center text-red-500">
              Failed to load booking receipt details.
            </div>
          ) : bookingReceipts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        <span>Receipt No.</span>
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        <span>Description</span>
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        <span>Receipt Date</span>
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        <span>Total Amount</span>
                      </div>
                    </TableHead>

                    <TableHead className="cursor-pointer text-right">
                      <span>Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookingReceipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="max-w-[600px] px-1 whitespace-normal break-words">
                        {receipt?.receiptNumber}
                      </TableCell>
                      <TableCell className="max-w-[500px] px-1 whitespace-normal break-words">
                        {receipt?.description}
                      </TableCell>
                      <TableCell className="max-w-[600px] px-1 whitespace-normal break-words">
                        {receipt?.receiptDate
                          ? dayjs(receipt?.receiptDate).format("DD/MM/YYYY")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {" "}
                        {formatCurrency(receipt?.totalAmount)}
                      </TableCell>

                      <TableCell className="20">
                        <div className="flex justify-end gap-2">
                          <Button
                            // variant="ghost"
                            size="sm"
                            onClick={() => handleGenerateInvoice(receipt.id)}
                          >
                            invoice
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmDelete(receipt.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center">No booking Receipt Found.</div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmation}
        title="Confirm Deletion"
        description="Are you sure you want to delete this Booking Receipt? This action cannot be undone."
        onCancel={() => {
          setShowConfirmation(false);
          setBookingReceiptToDelete(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default GroupClientBookingReceiptList;
