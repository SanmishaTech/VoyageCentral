import React, { useState, useEffect } from "react";
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
import EditState from "./EditState";
import CreateState from "./CreateState";

const fetchState = async (
  page: number,
  sortBy: string,
  sortOrder: string,
  search: string,
  active: string,
  roles: string[],
  recordsPerPage: number
) => {
  const rolesQuery = roles.length > 0 ? `&roles=${roles.join(",")}` : "";
  const response = await get(
    `/states?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${search}&active=${active}${rolesQuery}&limit=${recordsPerPage}`
  );
  return response;
};

const UserList = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10); // Add recordsPerPage state
  const [sortBy, setSortBy] = useState("stateName"); // Default sort column
  const [sortOrder, setSortOrder] = useState("asc"); // Default sort order
  const [search, setSearch] = useState(""); // Search query
  const [active, setActive] = useState("all"); // Active filter (all, true, false)
  const [roles, setRoles] = useState<string[]>([]); // Selected roles for filtering
  const [availableRoles, setAvailableRoles] = useState<Option[]>([]); // Roles fetched from API
  const [showFilters, setShowFilters] = useState(false); // State to show/hide filters
  const [showChangePassword, setShowChangePassword] = useState(false); // State to toggle ChangePassword dialog
  const [selectedUser, setSelectedUser] = useState<number | null>(null); // Track the selected user for password change
  const [showConfirmation, setShowConfirmation] = useState(false); // State to show/hide confirmation dialog
  const [userToDelete, setUserToDelete] = useState<number | null>(null); // Track the user ID to delete
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null);
  const navigate = useNavigate();

  // Fetch state using react-query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      "states",
      currentPage,
      sortBy,
      sortOrder,
      search,
      active,
      roles,
      recordsPerPage,
    ],
    queryFn: () =>
      fetchState(
        currentPage,
        sortBy,
        sortOrder,
        search,
        active,
        roles,
        recordsPerPage
      ),
  });

  const states = data?.states || [];
  const totalPages = data?.totalPages || 1;
  const totalState = data?.totalState || 0;

  // Mutation for deleting a user
  const deleteUserMutation = useMutation({
    mutationFn: (id: number) => del(`/states/${id}`),
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries(["states"]);
    },
    onError: (error) => {
      if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete State");
      }
    },
  });

  const confirmDelete = (id: number) => {
    setUserToDelete(id);
    setShowConfirmation(true);
  };

  const handleDelete = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete);
      setShowConfirmation(false);
      setUserToDelete(null);
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

  // Handle active filter change
  const handleActiveChange = (value: string) => {
    setActive(value);
    setCurrentPage(1); // Reset to the first page
  };

  // Handle role filter change
  const handleRoleChange = (selectedRoles: Option[]) => {
    setRoles(selectedRoles.map((role) => role.value)); // Extract values from selected options
    setCurrentPage(1); // Reset to the first page
  };

  const handleOpenChangePassword = (userId: number) => {
    setSelectedUser(userId); // Set the selected user
    setShowChangePassword(true); // Show the ChangePassword dialog
  };

  const handleCloseChangePassword = () => {
    setSelectedUser(null); // Clear the selected user
    setShowChangePassword(false); // Hide the ChangePassword dialog
  };

  const handleEdit = (stateId: number) => {
    setSelectedStateId(stateId);
    setShowEditDialog(true);
  };

  const handleCreate = () => {
    setShowCreateDialog(true);
  };

  return (
    <div className="mt-2 p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        State Management
      </h1>
      <Card className="mx-auto mt-6 sm:mt-10">
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Search Input */}
            <div className="flex-grow">
              <Input
                placeholder="Search states..."
                value={search}
                onChange={handleSearchChange}
                className="w-full"
                icon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={handleCreate}
                className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Add State
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
              Failed to load states.
            </div>
          ) : states.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      onClick={() => handleSort("stateName")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>State Name</span>
                        {sortBy === "stateName" && (
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
                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        <span>Country Name</span>
                      </div>
                    </TableHead>

                    <TableHead className="text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {states.map((state) => (
                    <TableRow key={state.id}>
                      <TableCell>{state.stateName}</TableCell>
                      <TableCell>{state.country.countryName}</TableCell>

                      <TableCell>
                        <div className="justify-end flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(state.id)}
                          >
                            <Edit size={16} />
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmDelete(state.id)}
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
                totalRecords={totalState}
                recordsPerPage={recordsPerPage}
                onPageChange={setCurrentPage} // Pass setCurrentPage directly
                onRecordsPerPageChange={(newRecordsPerPage) => {
                  setRecordsPerPage(newRecordsPerPage);
                  setCurrentPage(1); // Reset to the first page when records per page changes
                }}
              />
            </div>
          ) : (
            <div className="text-center">No State Found.</div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={showConfirmation}
        title="Confirm Deletion"
        description="Are you sure you want to delete this user? This action cannot be undone."
        onCancel={() => {
          setShowConfirmation(false);
          setUserToDelete(null);
        }}
        onConfirm={handleDelete}
      />

      <EditState
        stateId={selectedStateId}
        isOpen={showEditDialog}
        onClose={() => {
          setShowEditDialog(false);
          setSelectedStateId(null);
        }}
      />

      <CreateState
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </div>
  );
};

export default UserList;
