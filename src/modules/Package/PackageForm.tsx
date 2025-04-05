import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { get, post, put } from "@/services/apiService";
import { Button, Input } from "@/components/ui";

interface PackageFormProps {
  mode: "create" | "edit";
}

const PackageForm: React.FC<PackageFormProps> = ({ mode }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [packageName, setPackageName] = useState("");
  const [numberOfBranches, setNumberOfBranches] = useState(1);
  const [usersPerBranch, setUsersPerBranch] = useState(1);
  const [periodInMonths, setPeriodInMonths] = useState(1);
  const [cost, setCost] = useState(0);

  // Fetch package details if in edit mode
  const { data: packageData, isLoading } = useQuery(
    ["package", id],
    () => get(`/packages/${id}`),
    {
      enabled: mode === "edit" && !!id,
      onSuccess: (data) => {
        setPackageName(data.packageName);
        setNumberOfBranches(data.numberOfBranches);
        setUsersPerBranch(data.usersPerBranch);
        setPeriodInMonths(data.periodInMonths);
        setCost(data.cost);
      },
    }
  );

  const mutation = useMutation({
    mutationFn: (newPackage: any) =>
      mode === "edit"
        ? put(`/packages/${id}`, newPackage)
        : post("/packages", newPackage),
    onSuccess: () => {
      toast.success(
        `Package ${mode === "edit" ? "updated" : "created"} successfully`
      );
      queryClient.invalidateQueries(["packages"]);
      navigate("/packages");
    },
    onError: () => {
      toast.error(`Failed to ${mode === "edit" ? "update" : "create"} package`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      packageName,
      numberOfBranches,
      usersPerBranch,
      periodInMonths,
      cost,
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Input
          label="Package Name"
          placeholder="Enter package name"
          value={packageName}
          onChange={(e) => setPackageName(e.target.value)}
          required
        />
      </div>
      <div>
        <Input
          label="Number of Branches"
          type="number"
          placeholder="Enter number of branches"
          value={numberOfBranches}
          onChange={(e) => setNumberOfBranches(Number(e.target.value))}
          required
        />
      </div>
      <div>
        <Input
          label="Users Per Branch"
          type="number"
          placeholder="Enter users per branch"
          value={usersPerBranch}
          onChange={(e) => setUsersPerBranch(Number(e.target.value))}
          required
        />
      </div>
      <div>
        <Input
          label="Period (Months)"
          type="number"
          placeholder="Enter period in months"
          value={periodInMonths}
          onChange={(e) => setPeriodInMonths(Number(e.target.value))}
          required
        />
      </div>
      <div>
        <Input
          label="Cost"
          type="number"
          placeholder="Enter cost"
          value={cost}
          onChange={(e) => setCost(Number(e.target.value))}
          required
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" className="bg-primary text-white">
          {mode === "edit" ? "Update Package" : "Create Package"}
        </Button>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate(`/packages/${id}/edit`)}
      >
        Edit
      </Button>
    </form>
  );
};

export default PackageForm;
