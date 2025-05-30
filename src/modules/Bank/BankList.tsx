import React, { useState, useEffect } from "react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatter.js";
import { Button, Input } from "@/components/ui";
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
import CreateBank from "./CreateBank"; // Import CreateUser component
import EditBank from "./EditBank"; // Add this import

const fetchBanks = async (
  page: number,
  sortBy: string,
  sortOrder: string,
  search: string,
  recordsPerPage: number
) => {
  const response = await get(
    `/banks?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${search}&limit=${recordsPerPage}`
  );
  return response;
};

const BankList = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10); // Add recordsPerPage state
  const [sortBy, setSortBy] = useState("bankName"); // Default sort column
  const [sortOrder, setSortOrder] = useState("asc"); // Default sort order
  const [search, setSearch] = useState(""); // Search query
  const [showConfirmation, setShowConfirmation] = useState(false); // State to show/hide confirmation dialog
  const [bankToDelete, setBankToDelete] = useState<number | null>(null); // Track the user ID to delete
  const [showCreateDialog, setShowCreateDialog] = useState(false); // Add state for create user dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch branches using react-query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["banks", currentPage, sortBy, sortOrder, search, recordsPerPage],
    queryFn: () =>
      fetchBanks(currentPage, sortBy, sortOrder, search, recordsPerPage),
  });

  const banks = data?.banks || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.totalBanks || 0;

  // Mutation for deleting a user
  const deleteMutation = useMutation({
    mutationFn: (id: number) => del(`/banks/${id}`),
    onSuccess: () => {
      toast.success("Bank deleted successfully");
      queryClient.invalidateQueries(["banks"]);
    },
    onError: (error) => {
      if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete Bank");
      }
    },
  });

  const confirmDelete = (id: number) => {
    setBankToDelete(id);
    setShowConfirmation(true);
  };

  const handleDelete = () => {
    if (bankToDelete) {
      deleteMutation.mutate(bankToDelete);
      setShowConfirmation(false);
      setBankToDelete(null);
    }
  };

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if the same column is clicked
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending order
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1); // Reset to the first page
  };

  const handleEdit = (bankId: string) => {
    setSelectedBankId(bankId);
    setShowEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setSelectedBankId(null);
  };

  return (
    <div className="mt-2 p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        Bank Management
      </h1>
      <Card className="mx-auto mt-6 sm:mt-10">
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Search Input */}
            <div className="flex-grow">
              <Input
                placeholder="Search banks..."
                value={search}
                onChange={handleSearchChange}
                className="w-full"
                icon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Bank
              </Button>
            </div>
          </div>

          <Separator className="mb-4" />

          {/* Table Section */}
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader className="mr-2 h-8 w-8 animate-spin" />
            </div>
          ) : isError ? (
            <div className="text-center text-red-500">
              Failed to load banks.
            </div>
          ) : banks.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      onClick={() => handleSort("bankName")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Bank Name</span>
                        {sortBy === "bankName" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>

                    <TableHead className="text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banks.map((bank) => (
                    <TableRow key={bank.id}>
                      <TableCell>{bank.bankName}</TableCell>

                      <TableCell>
                        <div className=" justify-end flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(bank.id.toString())}
                          >
                            <Edit size={16} />
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmDelete(bank.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <CustomPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={total}
                recordsPerPage={recordsPerPage}
                onPageChange={setCurrentPage} // Pass setCurrentPage directly
                onRecordsPerPageChange={(newRecordsPerPage) => {
                  setRecordsPerPage(newRecordsPerPage);
                  setCurrentPage(1); // Reset to the first page when records per page changes
                }}
              />
            </div>
          ) : (
            <div className="text-center">No Bank found.</div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={showConfirmation}
        title="Confirm Deletion"
        description="Are you sure you want to delete this Bank? This action cannot be undone."
        onCancel={() => {
          setShowConfirmation(false);
          setBankToDelete(null);
        }}
        onConfirm={handleDelete}
      />

      {/* Add CreateUser dialog */}
      <CreateBank
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />

      {/* Add EditUser dialog */}
      {selectedBankId && (
        <EditBank
          isOpen={showEditDialog}
          onClose={handleCloseEditDialog}
          bankId={selectedBankId}
        />
      )}
    </div>
  );
};

export default BankList;
