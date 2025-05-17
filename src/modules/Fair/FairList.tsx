import React, { useState } from "react";
import { Button, Input } from "@/components/ui";
// Import MultipleSelector from common folder
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
import { get, del } from "@/services/apiService";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import CustomPagination from "@/components/common/custom-pagination";
import {
  Loader,
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  PlusCircle,
} from "lucide-react";
import ConfirmDialog from "@/components/common/confirm-dialog";

import CreateFair from "./CreateFair"; // Import CreateUser component
import EditFair from "./EditFair"; // Add this import

const fetchFairs = async (
  page: number,
  sortBy: string,
  sortOrder: string,
  search: string,
  recordsPerPage: number
) => {
  const response = await get(
    `/fairs?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${search}&limit=${recordsPerPage}`
  );
  return response;
};

const FairList = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10); // Add recordsPerPage state
  const [sortBy, setSortBy] = useState("fairName"); // Default sort column
  const [sortOrder, setSortOrder] = useState("asc"); // Default sort order
  const [search, setSearch] = useState(""); // Search query
  const [showConfirmation, setShowConfirmation] = useState(false); // State to show/hide confirmation dialog
  const [fairToDelete, setFairToDelete] = useState<number | null>(null); // Track the user ID to delete
  const [showCreateDialog, setShowCreateDialog] = useState(false); // Add state for create user dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedFairId, setSelectedFairId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch branches using react-query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["fairs", currentPage, sortBy, sortOrder, search, recordsPerPage],
    queryFn: () =>
      fetchFairs(currentPage, sortBy, sortOrder, search, recordsPerPage),
  });

  const fairs = data?.fairs || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.totalFairs || 0;

  // Mutation for deleting a user
  const deleteMutation = useMutation({
    mutationFn: (id: number) => del(`/fairs/${id}`),
    onSuccess: () => {
      toast.success("Fair deleted successfully");
      queryClient.invalidateQueries(["fairs"]);
    },
    onError: (error) => {
      if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete Service");
      }
    },
  });

  const confirmDelete = (id: number) => {
    setFairToDelete(id);
    setShowConfirmation(true);
  };

  const handleDelete = () => {
    if (fairToDelete) {
      deleteMutation.mutate(fairToDelete);
      setShowConfirmation(false);
      setFairToDelete(null);
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

  const handleEdit = (fairId: string) => {
    setSelectedFairId(fairId);
    setShowEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setSelectedFairId(null);
  };

  return (
    <div className="mt-2 p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        Fair Management
      </h1>
      <Card className="mx-auto mt-6 sm:mt-10">
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Search Input */}
            <div className="flex-grow">
              <Input
                placeholder="Search fairs..."
                value={search}
                onChange={handleSearchChange}
                className="w-full"
                // icon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Fair
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
              Failed to load fairs.
            </div>
          ) : fairs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      onClick={() => handleSort("fairName")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Fair Name</span>
                        {sortBy === "fairName" && (
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
                  {fairs.map((fair) => (
                    <TableRow key={fair.id}>
                      <TableCell>{fair.fairName}</TableCell>

                      <TableCell>
                        <div className=" justify-end flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(fair.id.toString())}
                          >
                            <Edit size={16} />
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmDelete(fair.id)}
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
            <div className="text-center">No Fair found.</div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={showConfirmation}
        title="Confirm Deletion"
        description="Are you sure you want to delete this Fair? This action cannot be undone."
        onCancel={() => {
          setShowConfirmation(false);
          setFairToDelete(null);
        }}
        onConfirm={handleDelete}
      />

      {/* Add CreateUser dialog */}
      <CreateFair
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />

      {/* Add EditUser dialog */}
      {selectedFairId && (
        <EditFair
          isOpen={showEditDialog}
          onClose={handleCloseEditDialog}
          fairId={selectedFairId}
        />
      )}
    </div>
  );
};

export default FairList;
