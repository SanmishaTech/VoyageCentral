import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LoaderCircle, Check, ChevronsUpDown } from "lucide-react"; // Import the LoaderCircle, Check, and ChevronsUpDown icons
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { get } from "@/services/apiService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { post, put } from "@/services/apiService";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Validate from "@/lib/Handlevalidation";
import { ROLES, ROLE_LABELS, Role } from "@/config/roles";
import { bloodGroupOptions, genderOptions } from "@/config/data";
import { ScrollArea } from "@/components/ui/scroll-area";

const staffFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name cannot be left blank.")
    .max(100, "Name must not exceed 100 characters.")
    .refine((val) => /^[A-Za-z\s\u0900-\u097F]+$/.test(val), {
      message: "Name can only contain letters.",
    }),
  email: z.string().email("Invalid email address"),
  dateOfBirth: z.string().optional(),
  address: z
    .string()
    .max(2000, "address must not exceed 2000 characters")
    .optional(),
  bloodGroup: z.string().optional(),
  gender: z
    .string()
    .min(1, "Gender field is required")
    .max(100, "gender field must not exceed 100 characters"),
  communicationEmail: z
    .string()
    .email("Invalid email address")
    .optional()
    .nullable(),
  mobile1: z
    .string()
    .optional()
    .refine((val) => /^\d{10}$/.test(val), {
      message: "Mobile number must be exactly 10 digits.",
    }),
  mobile2: z
    .string()
    .optional()
    .refine((val) => val === "" || /^\d{10}$/.test(val), {
      message: "Mobile number must be exactly 10 digits.",
    }),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .optional(),
  role: z.enum([ROLES.ADMIN, ROLES.BRANCH_ADMIN, ROLES.USER], {
    errorMap: () => ({ message: "Role is required" }),
  }),
  active: z.boolean().optional(),
  branchId: z.string().min(1, "Branch field is required"),
});

type StaffFormInputs = z.infer<typeof staffFormSchema>;

interface StaffFormProps {
  mode: "create" | "edit";
  staffId?: string;
  onSuccess?: () => void;
  className?: string;
}

const StaffForm = ({ mode, staffId, onSuccess, className }: StaffFormProps) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // First, fetch the staff data
  const { data: staffData, isLoading: isLoadingStaff } = useQuery({
    queryKey: ["staff", staffId],
    queryFn: async () => {
      const response = await get(`/staff/${staffId}`);
      return response.data;
    },
    enabled: mode === "edit" && !!staffId,
    refetchOnMount: true,
  });
  const defaultValues = {
    name: "",
    email: "",
    communicationEmail: null,
    mobile1: "",
    mobile2: "",
    password: "",
    role: ROLES.USER, // or ROLES.ADMIN if that's the default
    active: true,
    branchId: "", // empty string for select
    address: "",
    gender: "",
    dateOfBirth: "",
    bloodGroup: "",
  };

  // Initialize form after data is available
  const form = useForm<StaffFormInputs>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: mode === "create" ? defaultValues : undefined, // Use default values in create mode
  });

  useEffect(() => {
    if (staffData) {
      form.reset({
        name: staffData.name || "",
        email: staffData.email || "",
        communicationEmail: staffData.communicationEmail || "",
        mobile1: staffData.mobile1 || "",
        mobile2: staffData.mobile2 || "",
        role: staffData.role?.toLowerCase() || "",
        active: staffData.active ?? true,
        branchId: String(staffData.branchId),
        address: staffData.address || "",
        gender: staffData.gender || "",
        bloodGroup: staffData.bloodGroup || "",
        dateOfBirth: staffData.dateOfBirth
          ? new Date(staffData.dateOfBirth).toISOString().split("T")[0]
          : "",
      });

      // setTimeout(() => {
      //   form.setValue("role", staffData.role?.toLowerCase() || "");
      // }, 300);
    }
  }, [staffId, staffData]);

  // Remove the roles query since we're using predefined roles

  // Update branches query to handle paginated response
  const { data: branchesData } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const response = await get("/branches/all");
      return response || []; // Access the branches array from response
    },
  });

  // Remove the duplicate useEffect for form reset since we're handling it in onSuccess

  // Mutation for creating a staff
  const createStaffMutation = useMutation({
    mutationFn: (data: StaffFormInputs) => post("/staff", data),
    onSuccess: () => {
      toast.success("Staff created successfully");
      queryClient.invalidateQueries(["staffs"]); // Refetch the staffs list
      onSuccess?.(); // Call onSuccess callback if provided
    },
    onError: (error: any) => {
      Validate(error, form.setError);
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create staff");
      }
    },
  });

  // Mutation for updating a staff
  const updateStaffMutation = useMutation({
    mutationFn: (data: StaffFormInputs) => put(`/staff/${staffId}`, data),
    onSuccess: () => {
      toast.success("Staff updated successfully");
      queryClient.invalidateQueries(["staffs"]);
      onSuccess?.(); // Call onSuccess instead of navigating
    },
    onError: (error: any) => {
      Validate(error, form.setError);
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update staff");
      }
    },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<StaffFormInputs> = (data) => {
    if (mode === "create") {
      createStaffMutation.mutate(data); // Trigger create mutation
    } else {
      updateStaffMutation.mutate(data); // Trigger update mutation
    }
  };

  const handleCancel = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  // Remove the Card wrapper conditional and always use the dialog form style
  return (
    <div className={className}>
      <ScrollArea className="max-h-[80vh] overflow-y-auto">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
          {/* Name Field */}
          <div className="grid gap-2 relative">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <span className="text-red-500 text-[11px] absolute bottom-0 translate-y-[105%]">
                {form.formState.errors.name.message}
              </span>
            )}
          </div>

          {/* Email Fields Side by Side */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Primary Email */}
            <div className="grid gap-2 relative">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <span className="text-red-500 text-[11px] absolute bottom-0 translate-y-[105%]">
                  {form.formState.errors.email.message}
                </span>
              )}
            </div>

            {/* Communication Email */}
            <div className="grid gap-2 relative">
              <Label htmlFor="communicationEmail">Communication Email</Label>
              <Input
                id="communicationEmail"
                type="email"
                placeholder="communication@example.com"
                {...form.register("communicationEmail")}
              />
              {form.formState.errors.communicationEmail && (
                <span className="text-red-500 text-[11px] absolute bottom-0 translate-y-[105%]">
                  {form.formState.errors.communicationEmail.message}
                </span>
              )}
            </div>
          </div>

          {/* Mobile Numbers */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2 relative">
              <Label htmlFor="mobile1">Mobile 1</Label>
              <Input
                id="mobile1"
                placeholder="Enter mobile number"
                {...form.register("mobile1")}
                maxLength={10}
              />
              {form.formState.errors.mobile1 && (
                <span className="text-red-500 text-[11px] absolute bottom-0 translate-y-[105%]">
                  {form.formState.errors.mobile1.message}
                </span>
              )}
            </div>

            <div className="grid gap-2 relative">
              <Label htmlFor="mobile2">Mobile 2</Label>
              <Input
                id="mobile2"
                placeholder="Enter alternate mobile"
                {...form.register("mobile2")}
                maxLength={10}
              />
              {form.formState.errors.mobile2 && (
                <span className="text-red-500 text-[11px] absolute bottom-0 translate-y-[105%]">
                  {form.formState.errors.mobile2.message}
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2 relative">
              <Label htmlFor="gender">Gender</Label>
              <Controller
                name="gender"
                control={form.control}
                render={({ field }) => (
                  <Select
                    key={field.value}
                    onValueChange={(value) => form.setValue("gender", value)}
                    value={form.watch("gender")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select tour type" />
                    </SelectTrigger>
                    <SelectContent>
                      {genderOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.gender && (
                <span className="text-red-500 text-[11px] absolute bottom-0 translate-y-[105%]">
                  {form.formState.errors.gender.message}
                </span>
              )}
            </div>

            <div className="grid gap-2 relative">
              <Label htmlFor="dateOfBirth">Date Of Birth</Label>
              <Input
                id="dateOfBirth"
                placeholder="Enter date of birth"
                type="date"
                {...form.register("dateOfBirth")}
                maxLength={10}
              />
              {form.formState.errors.dateOfBirth && (
                <span className="text-red-500 text-[11px] absolute bottom-0 translate-y-[105%]">
                  {form.formState.errors.dateOfBirth.message}
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid col-span-2 gap-2 relative">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                placeholder="Enter address"
                {...form.register("address")}
              />
              {form.formState.errors.address && (
                <span className="text-red-500 text-[11px] absolute bottom-0 translate-y-[105%]">
                  {form.formState.errors.address.message}
                </span>
              )}
            </div>

            <div className="grid gap-2 relative">
              <Label htmlFor="bloodGroup">Blood Group</Label>
              {/* <Input
              id="bloodGroup"
              placeholder="Enter blood Group"
              {...form.register("bloodGroup")}
              maxLength={10}
            /> */}
              <Controller
                name="bloodGroup"
                control={form.control}
                render={({ field }) => (
                  <Select
                    key={field.value}
                    onValueChange={(value) =>
                      form.setValue("bloodGroup", value)
                    }
                    value={form.watch("bloodGroup")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select tour type" />
                    </SelectTrigger>
                    <SelectContent>
                      {bloodGroupOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.bloodGroup && (
                <span className="text-red-500 text-[11px] absolute bottom-0 translate-y-[105%]">
                  {form.formState.errors.bloodGroup.message}
                </span>
              )}
            </div>
          </div>

          {/* Password Field (Only for Create Mode) */}
          {mode === "create" && (
            <div className="grid gap-2 relative">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                placeholder="Enter a secure password"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <span className="text-red-500 text-[10px] absolute bottom-0 translate-y-[105%]">
                  {form.formState.errors.password.message}
                </span>
              )}
            </div>
          )}

          {/* Role, Branch and Active Fields in the Same Row */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Role Dropdown */}
            <div className="grid gap-2 relative">
              <Label htmlFor="role">Role</Label>
              <Controller
                name="role"
                control={form.control}
                render={({ field }) => (
                  <Select
                    key={field.value} // <-- forces re-render
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />

              {form.formState.errors.role && (
                <span className="text-red-500 text-[10px] absolute bottom-0 translate-y-[105%]">
                  {form.formState.errors.role.message}
                </span>
              )}
            </div>

            {/* Branch Combobox */}
            <div className="grid gap-2 relative">
              <Label htmlFor="branchId">Branch</Label>
              {/* <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="justify-between"
                >
                  {form.watch("branchId") && branchesData
                    ? branchesData.find(
                        (branch) => branch.id === form.watch("branchId")
                      )?.branchName || "Select branch..."
                    : "Select branch..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <Command>
                  <CommandInput placeholder="Search branch..." />
                  <CommandEmpty>No branch found.</CommandEmpty>
                  <CommandGroup>
                    {branchesData?.map((branch) => (
                      <CommandItem
                        key={branch.id}
                        value={branch.branchName}
                        onSelect={() => {
                          form.setValue("branchId", branch.id);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            form.watch("branchId") === branch.id
                              ? "opacity-100"
                              : "opacity-0"
                          )}
                        />
                        {branch.branchName}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover> */}
              <Controller
                name="branchId"
                control={form.control}
                render={({ field }) => (
                  <Select
                    key={field.value} // <-- forces re-render
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branchesData && branchesData.length > 0 ? (
                        branchesData.map((branch) => (
                          <SelectItem key={branch.id} value={String(branch.id)}>
                            {branch.branchName}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-muted-foreground">
                          No branches available
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.branchId && (
                <span className="text-red-500 text-[10px] absolute bottom-0 translate-y-[105%]">
                  {form.formState.errors.branchId.message}
                </span>
              )}
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-2">
              <Label htmlFor="active">Active</Label>
              <Switch
                id="active"
                checked={form.watch("active")}
                onCheckedChange={(checked) => form.setValue("active", checked)}
              />
            </div>
          </div>

          {/* Submit and Cancel Buttons */}
          <div className="justify-end flex gap-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createStaffMutation.isLoading || updateStaffMutation.isLoading
              }
              className="flex items-center justify-center gap-2"
            >
              {createStaffMutation.isLoading ||
              updateStaffMutation.isLoading ? (
                <>
                  <LoaderCircle className="animate-spin h-4 w-4" />
                  Saving...
                </>
              ) : mode === "create" ? (
                "Create"
              ) : (
                "Update"
              )}
            </Button>
          </div>
        </form>
      </ScrollArea>
    </div>
  );
};

export default StaffForm;
