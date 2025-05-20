import React, { useState } from "react";
import { Button, Input } from "@/components/ui";
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

import CreateService from "./CreateService";
import EditService from "./EditService";

const fetchServices = async (
  page: number,
  sortBy: string,
  sortOrder: string,
  search: string,
  recordsPerPage: number
) => {
  const response = await get(
    `/services?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${search}&limit=${recordsPerPage}`
  );
  return response;
};

const ServiceList = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState("serviceName");
  const [sortOrder, setSortOrder] = useState("asc");
  const [search, setSearch] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null
  );
  const navigate = useNavigate();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      "services",
      currentPage,
      sortBy,
      sortOrder,
      search,
      recordsPerPage,
    ],
    queryFn: () =>
      fetchServices(currentPage, sortBy, sortOrder, search, recordsPerPage),
  });

  const services = data?.services || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.totalServices || 0;

  const deleteMutation = useMutation({
    mutationFn: (id: number) => del(`/services/${id}`),
    onSuccess: () => {
      toast.success("Service deleted successfully");
      queryClient.invalidateQueries(["services"]);
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
    setServiceToDelete(id);
    setShowConfirmation(true);
  };

  const handleDelete = () => {
    if (serviceToDelete) {
      deleteMutation.mutate(serviceToDelete);
      setShowConfirmation(false);
      setServiceToDelete(null);
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleEdit = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setShowEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setSelectedServiceId(null);
  };

  return (
    <div className="mt-2 p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        Service Management
      </h1>
      <Card className="mx-auto mt-6 sm:mt-10">
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Search Input */}
            <div className="flex-grow">
              <Input
                placeholder="Search services..."
                value={search}
                onChange={handleSearchChange}
                className="w-full"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Service
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
              Failed to load services.
            </div>
          ) : services.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      onClick={() => handleSort("serviceName")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Service Name</span>
                        {sortBy === "serviceName" && (
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
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>{service.serviceName}</TableCell>

                      <TableCell>
                        <div className=" justify-end flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(service.id.toString())}
                          >
                            <Edit size={16} />
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmDelete(service.id)}
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
                onPageChange={setCurrentPage}
                onRecordsPerPageChange={(newRecordsPerPage) => {
                  setRecordsPerPage(newRecordsPerPage);
                  setCurrentPage(1);
                }}
              />
            </div>
          ) : (
            <div className="text-center">No Service found.</div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={showConfirmation}
        title="Confirm Deletion"
        description="Are you sure you want to delete this Service? This action cannot be undone."
        onCancel={() => {
          setShowConfirmation(false);
          setServiceToDelete(null);
        }}
        onConfirm={handleDelete}
      />

      <CreateService
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />

      {selectedServiceId && (
        <EditService
          isOpen={showEditDialog}
          onClose={handleCloseEditDialog}
          serviceId={selectedServiceId}
        />
      )}
    </div>
  );
};

export default ServiceList;
