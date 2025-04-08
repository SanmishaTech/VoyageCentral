import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { joiResolver } from "@hookform/resolvers/joi";
import Joi from "joi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { LoaderCircle, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { get } from "@/services/apiService";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { post, put } from "@/services/apiService";
import { PasswordInput } from "@/components/ui/password-input";
import AddSubscription from "./AddSubcription";
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
import { cn } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Package {
  id: number;
  packageName: string;
  numberOfBranches: number;
  usersPerBranch: number;
  periodInMonths: number;
  cost: number;
}

interface ApiResponse {
  id: number;
  businessName: string;
  gstin: string;
  addressLine1: string;
  addressLine2: string;
  state: string;
  city: string;
  pincode: string;
  letterHead?: string;
  logo?: string;
  contactPersonName: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  users: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    active: boolean;
  }>;
  subscriptions: Array<{
    id: number;
    startDate: string;
    endDate: string;
    package: Package;
  }>;
}

type UserFormInputs = {
  businessName: string;
  gstin: string;
  addressLine1: string;
  addressLine2: string;
  state: string;
  city: string;
  pincode: string;
  contactPersonName: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  letterHead?: string;
  logo?: string;
  user?: {
    name: string;
    email: string;
    password?: string;
  };
  subscription?: {
    packageId: number;
    startDate: string;
  };
};

const userFormSchema = Joi.object({
  businessName: Joi.string()
    .required()
    .messages({ "string.empty": "Business Name is required" }),
  gstin: Joi.string().length(15).required().messages({
    "string.empty": "GSTIN is required",
    "string.length": "GSTIN must be exactly 15 characters long",
  }),
  addressLine1: Joi.string()
    .required()
    .messages({ "string.empty": "Address Line 1 is required" }),
  addressLine2: Joi.string()
    .required()
    .messages({ "string.empty": "Address Line 2 is required" }),
  state: Joi.string()
    .required()
    .messages({ "string.empty": "State is required" }),
  city: Joi.string()
    .required()
    .messages({ "string.empty": "City is required" }),
  pincode: Joi.string()
    .required()
    .messages({ "string.empty": "Pincode is required" }),
  contactPersonName: Joi.string()
    .required()
    .messages({ "string.empty": "Contact Person Name is required" }),
  contactPersonEmail: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.empty": "Contact Person Email is required",
      "string.email": "Invalid email format",
    }),
  contactPersonPhone: Joi.string()
    .required()
    .messages({ "string.empty": "Contact Person Phone is required" }),
  letterHead: Joi.string().optional(),
  logo: Joi.string().optional(),
  user: Joi.when("$mode", {
    is: "create",
    then: Joi.object({
      name: Joi.string()
        .required()
        .messages({ "string.empty": "Name is required" }),
      email: Joi.string()
        .email({ tlds: { allow: false } })
        .required()
        .messages({
          "string.empty": "Email is required",
          "string.email": "Invalid email format",
        }),
      password: Joi.string().min(8).required().messages({
        "string.empty": "Password is required",
        "string.min": "Password must be at least 8 characters long",
      }),
    }).required(),
    otherwise: Joi.forbidden(),
  }),
  subscription: Joi.when("$mode", {
    is: "create",
    then: Joi.object({
      packageId: Joi.number().required().messages({
        "number.base": "Package is required",
        "any.required": "Package is required",
      }),
      startDate: Joi.string()
        .required()
        .messages({ "string.empty": "Start date is required" }),
    }).required(),
    otherwise: Joi.forbidden(),
  }),
});

const UserForm = ({ mode }: { mode: "create" | "edit" }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [userData, setUserData] = useState<ApiResponse | null>(null);

  const { data: packages = [] } = useQuery<Package[]>({
    queryKey: ["packages"],
    queryFn: async () => {
      const response = await get("/packages?limit=100");
      return response.packages;
    },
    enabled: mode === "create",
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UserFormInputs>({
    resolver: joiResolver(userFormSchema),
    context: { mode },
  });

  useEffect(() => {
    if (mode === "edit" && id) {
      (async () => {
        try {
          const resp = await get(`/agencies/${id}`);
          setUserData(resp);

          const sub = resp.subscriptions?.[0];
          const usr = resp.users?.[0];

          reset({
            businessName: resp.businessName,
            gstin: resp.gstin,
            addressLine1: resp.addressLine1,
            addressLine2: resp.addressLine2,
            state: resp.state,
            city: resp.city,
            pincode: resp.pincode,
            contactPersonName: resp.contactPersonName,
            contactPersonEmail: resp.contactPersonEmail,
            contactPersonPhone: resp.contactPersonPhone,
          });

          setSelectedPackage(sub?.package ?? null);
        } catch (error: unknown) {
          toast.error(
            error instanceof Error ? error.message : "Failed to fetch details"
          );
        }
      })();
    }
  }, [id, mode, reset]);

  const createUserMutation = useMutation({
    mutationFn: (data: UserFormInputs) => post("/agencies", data),
    onSuccess: () => {
      toast.success("Agency created successfully");
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      navigate("/agencies");
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to create agency"),
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: UserFormInputs) => put(`/agencies/${id}`, data),
    onSuccess: () => {
      toast.success("Agency updated successfully");
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      navigate("/agencies");
    },
    onError: (error: Error) =>
      toast.error(error.message || "Failed to update agency"),
  });

  const onSubmit: SubmitHandler<UserFormInputs> = (data) => {
    if (mode === "create") createUserMutation.mutate(data);
    else updateUserMutation.mutate(data);
  };
  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="mx-auto mt-10">
          <CardContent>
            {/* Agency Details */}
            <CardTitle>Agency Details</CardTitle>
            <div className="grid gap-4 mt-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessName" className="mb-2 block">
                    Business Name
                  </Label>
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="Enter business name"
                    {...register("businessName")}
                  />
                  {errors.businessName && (
                    <span className="text-red-500 text-sm">
                      {errors.businessName.message}
                    </span>
                  )}
                </div>
                <div>
                  <Label htmlFor="gstin" className="mb-2 block">
                    GSTIN
                  </Label>
                  <Input
                    id="gstin"
                    type="text"
                    placeholder="22AAAAA0000A1Z5"
                    {...register("gstin")}
                    className="uppercase"
                    maxLength={15}
                  />
                  {errors.gstin && (
                    <span className="text-red-500 text-sm">
                      {errors.gstin.message}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="addressLine1" className="mb-2 block">
                  Address Line 1
                </Label>
                <Input
                  id="addressLine1"
                  placeholder="123 Main St"
                  {...register("addressLine1")}
                />
                {errors.addressLine1 && (
                  <span className="text-red-500 text-sm">
                    {errors.addressLine1.message}
                  </span>
                )}
              </div>
              <div>
                <Label htmlFor="addressLine2" className="mb-2 block">
                  Address Line 2
                </Label>
                <Input
                  id="addressLine2"
                  placeholder="Apartment, suite, etc."
                  {...register("addressLine2")}
                />
                {errors.addressLine2 && (
                  <span className="text-red-500 text-sm">
                    {errors.addressLine2.message}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="state" className="mb-2 block">
                    State
                  </Label>
                  <Input
                    id="state"
                    type="text"
                    placeholder="California"
                    {...register("state")}
                  />
                  {errors.state && (
                    <span className="text-red-500 text-sm">
                      {errors.state.message}
                    </span>
                  )}
                </div>
                <div>
                  <Label htmlFor="city" className="mb-2 block">
                    City
                  </Label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="Los Angeles"
                    {...register("city")}
                  />
                  {errors.city && (
                    <span className="text-red-500 text-sm">
                      {errors.city.message}
                    </span>
                  )}
                </div>
                <div>
                  <Label htmlFor="pincode" className="mb-2 block">
                    Pincode
                  </Label>
                  <Input
                    id="pincode"
                    type="text"
                    placeholder="90001"
                    {...register("pincode")}
                  />
                  {errors.pincode && (
                    <span className="text-red-500 text-sm">
                      {errors.pincode.message}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <hr className="my-6 border-gray-300" />
            {/* Contact Person */}
            <CardTitle className="mt-4 text-lg">Contact Person</CardTitle>
            <div className="grid grid-cols-3 gap-6 mt-5">
              <div>
                <Label htmlFor="contactPersonName" className="mb-2 block">
                  Contact Person Name
                </Label>
                <Input
                  id="contactPersonName"
                  type="text"
                  placeholder="Jane Doe"
                  {...register("contactPersonName")}
                />
                {errors.contactPersonName && (
                  <span className="text-red-500 text-sm">
                    {errors.contactPersonName.message}
                  </span>
                )}
              </div>
              <div>
                <Label htmlFor="contactPersonEmail" className="mb-2 block">
                  Contact Person Email
                </Label>
                <Input
                  id="contactPersonEmail"
                  type="email"
                  placeholder="jane.doe@example.com"
                  {...register("contactPersonEmail")}
                />
                {errors.contactPersonEmail && (
                  <span className="text-red-500 text-sm">
                    {errors.contactPersonEmail.message}
                  </span>
                )}
              </div>
              <div>
                <Label htmlFor="contactPersonPhone" className="mb-2 block">
                  Contact Person Phone
                </Label>
                <Input
                  id="contactPersonPhone"
                  type="text"
                  placeholder="+1 234 567 890"
                  {...register("contactPersonPhone")}
                />
                {errors.contactPersonPhone && (
                  <span className="text-red-500 text-sm">
                    {errors.contactPersonPhone.message}
                  </span>
                )}
              </div>
            </div>

            {mode === "create" && (
              <>
                <hr className="my-6 border-gray-300" />
                {/* Subscription Section */}
                <CardTitle className="mt-4 text-lg">Subscription</CardTitle>
                <div className="grid gap-6 mt-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="subscription.packageId">
                        Select Package
                      </Label>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between"
                          >
                            {selectedPackage?.packageName ||
                              "Select package..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Search packages..." />
                            <CommandEmpty>No package found.</CommandEmpty>
                            <CommandGroup>
                              {packages.map((pkg) => (
                                <CommandItem
                                  key={pkg.id}
                                  value={pkg.packageName}
                                  onSelect={() => {
                                    setValue("subscription.packageId", pkg.id);
                                    setSelectedPackage(pkg);
                                    setOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedPackage?.id === pkg.id
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {pkg.packageName} ({pkg.numberOfBranches}{" "}
                                  branches, {pkg.usersPerBranch} users/branch)
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {errors.subscription?.packageId && (
                        <span className="text-red-500 text-sm">
                          {errors.subscription.packageId.message}
                        </span>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="subscription.startDate">Start Date</Label>
                      <Input
                        id="subscription.startDate"
                        type="date"
                        {...register("subscription.startDate")}
                        className="w-full"
                        min={new Date().toISOString().split("T")[0]}
                      />
                      {errors.subscription?.startDate && (
                        <span className="text-red-500 text-sm">
                          {errors.subscription.startDate.message}
                        </span>
                      )}
                    </div>
                    {selectedPackage && (
                      <div className="col-span-2 p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">
                          Selected Package Details
                        </h4>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <dt className="text-muted-foreground">
                            Number of Branches:
                          </dt>
                          <dd>{selectedPackage.numberOfBranches}</dd>
                          <dt className="text-muted-foreground">
                            Users per Branch:
                          </dt>
                          <dd>{selectedPackage.usersPerBranch}</dd>
                          <dt className="text-muted-foreground">Duration:</dt>
                          <dd>{selectedPackage.periodInMonths} months</dd>
                          <dt className="text-muted-foreground">Cost:</dt>
                          <dd>₹{selectedPackage.cost.toLocaleString()}</dd>
                        </dl>
                      </div>
                    )}
                  </div>
                </div>
                <hr className="my-6 border-gray-300" />
                {/* Create User Section */}
                <CardTitle className="mt-4 text-lg">Create User</CardTitle>
                <div className="grid gap-4 mt-5">
                  <div>
                    <Label htmlFor="name" className="mb-2 block">
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      {...register("user.name")}
                    />
                    {errors.user?.name && (
                      <span className="text-red-500 text-sm">
                        {errors.user.name.message}
                      </span>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="email" className="mb-2 block">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      {...register("user.email")}
                    />
                    {errors.user?.email && (
                      <span className="text-red-500 text-sm">
                        {errors.user.email.message}
                      </span>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="password" className="mb-2 block">
                      Password
                    </Label>
                    <PasswordInput
                      id="password"
                      placeholder="Enter a secure password"
                      {...register("user.password")}
                    />
                    {errors.user?.password && (
                      <span className="text-red-500 text-sm">
                        {errors.user.password.message}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        {/* Submit and Cancel Buttons */}
        <div className="justify-end flex gap-4">
          <Button
            type="submit"
            disabled={
              createUserMutation.isLoading || updateUserMutation.isLoading
            }
            className="flex items-center justify-center gap-2"
          >
            {createUserMutation.isLoading || updateUserMutation.isLoading ? (
              <>
                <LoaderCircle className="animate-spin h-4 w-4" /> Saving...
              </>
            ) : mode === "create" ? (
              "Create Agency"
            ) : (
              "Save Changes"
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/agencies")}
          >
            Cancel
          </Button>
        </div>
      </form>

      {/* Display Users & Subscriptions in Edit Mode */}
      {mode === "edit" && userData && (
        <div className="mx-auto mt-10 space-y-8">
          {/* Users Table */}
          <Card>
            <CardTitle className="ml-6 text-lg">Users</CardTitle>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userData.users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {u.role
                            .split("_")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() +
                                word.slice(1).toLowerCase()
                            )
                            .join(" ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            u.active
                              ? "bg-green-100 text-green-800 ring-green-200"
                              : "bg-red-100 text-red-800 ring-red-200"
                          }
                        >
                          {u.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Subscriptions Table */}
          <Card>
            <div className="flex items-center justify-between px-6 pt-4">
              <CardTitle className="text-lg">Subscriptions</CardTitle>
              <AddSubscription />
            </div>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userData.subscriptions.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.package.packageName}</TableCell>
                      <TableCell>
                        {new Date(s.startDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(s.endDate).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default UserForm;
