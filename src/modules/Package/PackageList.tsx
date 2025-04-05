import React, { useState, useEffect } from "react";
import { Button, Input } from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner"; // Using Sonner for toast notifications
import { get, del } from "@/services/apiService";
import CustomPagination from "@/components/common/custom-pagination";
import ConfirmDialog from "@/components/common/confirm-dialog";
import {
  ChevronUp,
  ChevronDown,
  Search,
  PlusCircle,
  Edit,
  Trash,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import CreatePackage from "./CreatePackage";
import { debounce } from "lodash"; // Import lodash debounce
import EditPackage from "./EditPackage"; // Add this import

const fetchPackages = async (
  page: number,
  sortBy: string,
  sortOrder: string,
  search: string,
  recordsPerPage: number
) => {
  const response = await get(
    `/packages?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${search}&limit=${recordsPerPage}`
  );
  return response; // Return the full response object
};

const PackageList = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate(); // For navigation to edit page
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("packageName"); // Default sort column
  const [sortOrder, setSortOrder] = useState("asc"); // Default sort order
  const [search, setSearch] = useState(""); // Search query
  const [debouncedSearch, setDebouncedSearch] = useState(""); // Debounced search query
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(
    null
  );

  // Debounce the search input
  useEffect(() => {
    const handler = debounce(() => {
      setDebouncedSearch(search); // Update the debounced search value
    }, 300); // 300ms debounce delay

    handler();

    return () => {
      handler.cancel(); // Cleanup debounce on unmount
    };
  }, [search]);

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      "packages",
      currentPage,
      sortBy,
      sortOrder,
      debouncedSearch,
      recordsPerPage,
    ],
    queryFn: () =>
      fetchPackages(
        currentPage,
        sortBy,
        sortOrder,
        debouncedSearch,
        recordsPerPage
      ),
    keepPreviousData: true, // Keep previous data while fetching new data
  });

  const deletePackageMutation = useMutation({
    mutationFn: (id: number) => {
      console.log(`Deleting package with ID: ${id}`); // Debugging
      return del(`/packages/${id}`);
    },
    onSuccess: () => {
      toast.success("Package deleted successfully");
      queryClient.invalidateQueries(["packages"]); // Refresh the package list
    },
    onError: (error) => {
      console.error(
        "Error deleting package:",
        error.response?.data || error.message
      ); // Debugging
      toast.error("Failed to delete package");
    },
  });

  const confirmDelete = (id: number) => {
    console.log("Package to delete:", id); // Debugging
    setPackageToDelete(id);
    setShowConfirmation(true);
  };

  const handleDelete = () => {
    console.log("Deleting package:", packageToDelete); // Debugging
    if (packageToDelete) {
      deletePackageMutation.mutate(packageToDelete);
      setShowConfirmation(false);
      setPackageToDelete(null);
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleEdit = (id: number) => {
    setSelectedPackageId(id);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setSelectedPackageId(null);
  };

  const handleOpenDialog = () => setIsDialogOpen(true);
  const handleCloseDialog = () => setIsDialogOpen(false);

  const packages = data?.packages || [];
  const totalPages = data?.meta?.totalPages || 1;
  const totalPackages = data?.meta?.total || 0;

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading packages</div>;

  return (
    <div className="mt-2 p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        Package Management
      </h1>
      <Card className="mx-auto mt-6 sm:mt-10">
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Search Input */}
            <div className="flex-grow">
              <Input
                placeholder="Search packages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full"
                icon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleOpenDialog}
                className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Package
              </Button>
            </div>
          </div>

          <Separator className="mb-4" />

          {/* Table Section */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    onClick={() => handleSort("packageName")}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center">
                      <span>Package Name</span>
                      {sortBy === "packageName" && (
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
                  <TableHead
                    onClick={() => handleSort("numberOfBranches")}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center">
                      <span>Number of Branches</span>
                      {sortBy === "numberOfBranches" && (
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
                  <TableHead
                    onClick={() => handleSort("usersPerBranch")}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center">
                      <span>Users Per Branch</span>
                      {sortBy === "usersPerBranch" && (
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
                  <TableHead
                    onClick={() => handleSort("periodInMonths")}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center">
                      <span>Period (Months)</span>
                      {sortBy === "periodInMonths" && (
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
                  <TableHead
                    onClick={() => handleSort("cost")}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center">
                      <span>Cost</span>
                      {sortBy === "cost" && (
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
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packages.map((pkg: any) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="text-center">
                      {pkg.packageName}
                    </TableCell>
                    <TableCell className="text-center">
                      {pkg.numberOfBranches}
                    </TableCell>
                    <TableCell className="text-center">
                      {pkg.usersPerBranch}
                    </TableCell>
                    <TableCell className="text-center">
                      {pkg.periodInMonths}
                    </TableCell>
                    <TableCell className="text-center">
                      ₹{pkg.cost.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(pkg.id)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => confirmDelete(pkg.id)}
                        >
                          <Trash className="h-4 w-4 mr-1" />
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
              totalRecords={totalPackages}
              recordsPerPage={recordsPerPage}
              onPageChange={setCurrentPage}
              onRecordsPerPageChange={(newRecordsPerPage) => {
                setRecordsPerPage(newRecordsPerPage);
                setCurrentPage(1);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={showConfirmation}
        title="Confirm Deletion"
        description="Are you sure you want to delete this package? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        onCancel={() => {
          setShowConfirmation(false);
          setPackageToDelete(null);
        }}
      />
      <CreatePackage isOpen={isDialogOpen} onClose={handleCloseDialog} />
      <EditPackage
        packageId={selectedPackageId}
        isOpen={isEditDialogOpen}
        onClose={handleCloseEditDialog}
      />
    </div>
  );
};

export default PackageList;
