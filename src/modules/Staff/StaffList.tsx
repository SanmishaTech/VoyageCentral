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
import ChangePasswordDialog from "./ChangePasswordDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import CreateStaffs from "./CreateStaff"; // Import CreateStaffs component
import EditStaffs from "./EditStaff"; // Add this import

// Function to format role name
const formatRoleName = (role: string) => {
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

// Add interface for staff data (add near the top of the file)
interface Staff {
  id: number;
  name: string;
  email: string;
  communicationEmail: string | null;
  mobile1: string | null;
  mobile2: string | null;
  role: string;
  active: boolean;
  lastLogin: string | null;
  branchId: number | null;
  branch: {
    branchName: string;
    agency: {
      businessName: string;
    };
  } | null;
}

const fetchStaffs = async (
  page: number,
  sortBy: string,
  sortOrder: string,
  search: string,
  recordsPerPage: number
) => {
  const response = await get(
    `/staff?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${search}&limit=${recordsPerPage}`
  );
  return response;
};

const StaffsList = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10); // Add recordsPerPage state
  const [sortBy, setSortBy] = useState("name"); // Default sort column
  const [sortOrder, setSortOrder] = useState("asc"); // Default sort order
  const [search, setSearch] = useState(""); // Search query
  const [showChangePassword, setShowChangePassword] = useState(false); // State to toggle ChangePassword dialog
  const [selectedStaffs, setSelectedStaffs] = useState<number | null>(null); // Track the selected staff for password change
  const [showConfirmation, setShowConfirmation] = useState(false); // State to show/hide confirmation dialog
  const [staffToDelete, setStaffsToDelete] = useState<number | null>(null); // Track the staff ID to delete
  const [showCreateDialog, setShowCreateDialog] = useState(false); // Add state for create staff dialog
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedStaffsId, setSelectedStaffsId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Fetch staffs using react-query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      "staffs",
      currentPage,
      sortBy,
      sortOrder,
      search,
      recordsPerPage,
    ],
    queryFn: () =>
      fetchStaffs(currentPage, sortBy, sortOrder, search, recordsPerPage),
  });

  const staffs = data?.staff || [];
  const totalPages = data?.totalPages || 1;
  const totalStaffs = data?.totalStaffs || 0;

  // Mutation for deleting a staff
  const deleteStaffsMutation = useMutation({
    mutationFn: (id: number) => del(`/staff/${id}`),
    onSuccess: () => {
      toast.success("Staff deleted successfully");
      queryClient.invalidateQueries(["staffs"]);
    },
    onError: (error) => {
      if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete Staff");
      }
    },
  });

  const confirmDelete = (id: number) => {
    setStaffsToDelete(id);
    setShowConfirmation(true);
  };

  const handleDelete = () => {
    if (staffToDelete) {
      deleteStaffsMutation.mutate(staffToDelete);
      setShowConfirmation(false);
      setStaffsToDelete(null);
    }
  };

  // Mutation for changing staff status
  const changeStatusMutation = useMutation({
    mutationFn: ({ staffId, active }: { staffId: string; active: boolean }) =>
      patch(`/staff/${staffId}/status`, { active }),
    onSuccess: () => {
      toast.success("Staff status updated successfully");
      queryClient.invalidateQueries(["staffs"]);
    },
    onError: () => {
      toast.error("Failed to update staff status");
    },
  });

  const handleChangeStatus = (staffId: string, currentStatus: boolean) => {
    changeStatusMutation.mutate({ staffId, active: !currentStatus });
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

  const handleOpenChangePassword = (staffId: number) => {
    setSelectedStaffs(staffId); // Set the selected staff
    setShowChangePassword(true); // Show the ChangePassword dialog
  };

  const handleCloseChangePassword = () => {
    setSelectedStaffs(null); // Clear the selected staff
    setShowChangePassword(false); // Hide the ChangePassword dialog
  };

  const handleEdit = (staffId: string) => {
    setSelectedStaffsId(staffId);
    setShowEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setSelectedStaffsId(null);
  };

  return (
    <div className="mt-2 p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        Staff Management
      </h1>
      <Card className="mx-auto mt-6 sm:mt-10">
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Search Input */}
            <div className="flex-grow">
              <Input
                placeholder="Search staffs..."
                value={search}
                onChange={handleSearchChange}
                className="w-full"
                icon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Action Button */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Add
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
              Failed to load staffs.
            </div>
          ) : staffs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      onClick={() => handleSort("name")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Name</span>
                        {sortBy === "name" && (
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
                      onClick={() => handleSort("email")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Email</span>
                        {sortBy === "email" && (
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
                    {/* <TableHead>Contact Info</TableHead> */}
                    <TableHead>Branch</TableHead>
                    <TableHead
                      onClick={() => handleSort("role")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Role</span>
                        {sortBy === "role" && (
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
                    {/* <TableHead
                      onClick={() => handleSort("lastLogin")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Last Login</span>
                        {sortBy === "lastLogin" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead> */}
                    <TableHead
                      onClick={() => handleSort("active")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Status</span>
                        {sortBy === "active" && (
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
                  {staffs.map((staff: Staff) => (
                    <TableRow key={staff.id}>
                      <TableCell>{staff.name}</TableCell>
                      <TableCell>{staff.email}</TableCell>
                      {/* <TableCell>
                        <div className="flex flex-col gap-1">
                          {staff.communicationEmail && (
                            <span className="text-sm text-gray-600">
                              {staff.communicationEmail}
                            </span>
                          )}
                          {staff.mobile1 && (
                            <span className="text-sm">{staff.mobile1}</span>
                          )}
                          {staff.mobile2 && (
                            <span className="text-sm text-gray-600">
                              {staff.mobile2}
                            </span>
                          )}
                        </div>  
                      </TableCell> */}
                      <TableCell>
                        {staff.branch ? (
                          <div className="flex flex-col">
                            <span>{staff.branch.branchName}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatRoleName(staff.role)}
                        </Badge>
                      </TableCell>
                      {/* <TableCell>
                        {staff.lastLogin
                          ? formatDateTime(staff.lastLogin)
                          : "Never"}
                      </TableCell> */}
                      <TableCell>
                        {staff.active ? (
                          <Badge variant="outline">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(staff.id.toString())}
                          >
                            <Edit size={16} />
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmDelete(staff.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                          {/* <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56">
                              <DropdownMenuGroup>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleChangeStatus(staff.id, staff.active)
                                  }
                                >
                                  <div className="flex items-center gap-2">
                                    {staff.active ? (
                                      <XCircle className="h-4 w-4" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4" />
                                    )}
                                    <span>
                                      Set {staff.active ? "Inactive" : "Active"}
                                    </span>
                                  </div>
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() =>
                                    handleOpenChangePassword(staff.id)
                                  }
                                >
                                  <div className="flex items-center gap-2">
                                    <ShieldEllipsis className="h-4 w-4" />
                                    <span>Change Password</span>
                                  </div>
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu> */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <CustomPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={totalStaffs}
                recordsPerPage={recordsPerPage}
                onPageChange={setCurrentPage} // Pass setCurrentPage directly
                onRecordsPerPageChange={(newRecordsPerPage) => {
                  setRecordsPerPage(newRecordsPerPage);
                  setCurrentPage(1); // Reset to the first page when records per page changes
                }}
              />
            </div>
          ) : (
            <div className="text-center">No staffs found.</div>
          )}
        </CardContent>
      </Card>

      {/* Render ChangePasswordDialog */}
      {selectedStaffs && (
        <ChangePasswordDialog
          staffId={selectedStaffs}
          isOpen={showChangePassword}
          onClose={handleCloseChangePassword}
        />
      )}

      <ConfirmDialog
        isOpen={showConfirmation}
        title="Confirm Deletion"
        description="Are you sure you want to delete this staff? This action cannot be undone."
        onCancel={() => {
          setShowConfirmation(false);
          setStaffsToDelete(null);
        }}
        onConfirm={handleDelete}
      />

      {/* Add CreateStaffs dialog */}
      <CreateStaffs
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />

      {/* Add EditStaffs dialog */}
      {selectedStaffsId && (
        <EditStaffs
          isOpen={showEditDialog}
          onClose={handleCloseEditDialog}
          staffId={selectedStaffsId}
        />
      )}
    </div>
  );
};

export default StaffsList;
