import { useEffect, useState, ChangeEvent } from "react"; // Added ChangeEvent
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { LoaderCircle, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { get, post, put } from "@/services/apiService"; // Updated import
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import Validate from "@/lib/Handlevalidation";

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

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_LOGO_TYPES = ["image/jpeg", "image/png", "image/jpg"];
const MAX_LETTERHEAD_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_LETTERHEAD_TYPES = ["application/pdf"];

const fileSchema = z
  .instanceof(File, { message: "File is required." })
  .optional();

const logoSchema = fileSchema
  .refine(
    (file) => !file || file.size <= MAX_LOGO_SIZE,
    `Logo size must be less than 2MB.`
  )
  .refine(
    (file) => !file || ACCEPTED_LOGO_TYPES.includes(file.type),
    "Invalid logo file type. Only JPG, JPEG, PNG are allowed."
  );

const letterHeadSchema = fileSchema
  .refine(
    (file) => !file || file.size <= MAX_LETTERHEAD_SIZE,
    `Letterhead size must be less than 5MB.`
  )
  .refine(
    (file) => !file || ACCEPTED_LETTERHEAD_TYPES.includes(file.type),
    "Invalid letterhead file type. Only PDF is allowed."
  );

const userFormSchema = z
  .object({
    businessName: z.string().min(1, "Business Name is required"),
    gstin: z.string().length(15, "GSTIN must be exactly 15 characters long"),
    addressLine1: z.string().min(1, "Address Line 1 is required"),
    addressLine2: z.string().min(1, "Address Line 2 is required"),
    state: z.string().min(1, "State is required"),
    city: z.string().min(1, "City is required"),
    pincode: z.string().min(1, "Pincode is required"),
    contactPersonName: z.string().min(1, "Contact Person Name is required"),
    contactPersonEmail: z
      .string()
      .email("Invalid email format")
      .min(1, "Contact Person Email is required"),
    contactPersonPhone: z.string().min(1, "Contact Person Phone is required"),
    // Change logo and letterHead to accept File objects
    letterHead: letterHeadSchema,
    logo: logoSchema,
    user: z
      .object({
        name: z.string().min(1, "Name is required"),
        email: z
          .string()
          .email("Invalid email format")
          .min(1, "Email is required"),
        password: z
          .string()
          .min(5, "Password must be at least 5 characters long")
          .optional(),
      })
      .optional(),
    subscription: z
      .object({
        packageId: z.number({
          required_error: "Package is required",
          invalid_type_error: "Package is required",
        }),
        startDate: z.string().min(1, "Start date is required"),
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (ctx.path[0] === "$mode" && ctx.path[1] === "create") {
      if (!data.user) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "User details are required when creating an agency",
          path: ["user"],
        });
      }
      if (!data.subscription) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Subscription details are required when creating an agency",
          path: ["subscription"],
        });
      }
    }
  });

type UserFormInputs = z.infer<typeof userFormSchema>;

const UserForm = ({ mode }: { mode: "create" | "edit" }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [userData, setUserData] = useState<ApiResponse | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [letterHeadPreview, setLetterHeadPreview] = useState<string | null>(
    null
  ); // Assuming PDF preview isn't straightforward

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
    // trigger, // Removed as it's unused
    reset,
    setError,
    watch, // Add watch to observe file inputs
    formState: { errors },
  } = useForm<UserFormInputs>({
    resolver: zodResolver(userFormSchema),
    context: { mode },
  });

  // Watch file inputs to update previews
  const watchedLogo = watch("logo");
  const watchedLetterHead = watch("letterHead");

  useEffect(() => {
    if (watchedLogo && watchedLogo instanceof File) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(watchedLogo);
    } else {
      setLogoPreview(null);
    }
  }, [watchedLogo]);

  // For letterhead (PDF), we might just show the filename
  useEffect(() => {
    if (watchedLetterHead && watchedLetterHead instanceof File) {
      setLetterHeadPreview(watchedLetterHead.name); // Show filename for PDF
    } else {
      setLetterHeadPreview(null);
    }
  }, [watchedLetterHead]);

  useEffect(() => {
    if (mode === "edit" && id) {
      (async () => {
        try {
          const resp = await get(`/agencies/${id}`);
          setUserData(resp);

          const sub = resp.subscriptions?.[0];

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
          // Set initial previews if URLs exist
          setLogoPreview(resp.logo ? `/uploads/${resp.logo}` : null); // Adjust path as needed
          setLetterHeadPreview(
            resp.letterHead ? resp.letterHead.split("/").pop() : null
          ); // Show filename if exists
        } catch (error: unknown) {
          toast.error(
            error instanceof Error ? error.message : "Failed to fetch details"
          );
        }
      })();
    }
  }, [id, mode, reset]);

  const createUserMutation = useMutation<unknown, Error, FormData>({
    // Expect FormData
    mutationFn: (formData: FormData) =>
      post("/agencies", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }), // Use post
    onSuccess: () => {
      toast.success("Agency created successfully");
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      navigate("/agencies");
    },
    onError: (error: Error) => {
      Validate(error, setError);
      toast.error(error.message || "Failed to create agency");
    },
  });

  const updateUserMutation = useMutation<unknown, Error, FormData>({
    // Expect FormData
    mutationFn: (formData: FormData) =>
      put(`/agencies/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }), // Use put
    onSuccess: () => {
      toast.success("Agency updated successfully");
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      navigate("/agencies");
    },
    onError: (error: Error) => {
      Validate(error, setError);
      toast.error(error.message || "Failed to update agency");
    },
  });

  // Handle file input changes specifically to register them
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const name = e.target.name as keyof UserFormInputs; // 'logo' or 'letterHead'
    if (file) {
      setValue(name, file, { shouldValidate: true });
    } else {
      // Handle case where user cancels file selection if needed
      setValue(name, undefined, { shouldValidate: true });
    }
  };

  const onSubmit: SubmitHandler<UserFormInputs> = (data) => {
    const formData = new FormData();

    // Append all regular fields
    Object.entries(data).forEach(([key, value]) => {
      if (
        key !== "logo" &&
        key !== "letterHead" &&
        key !== "user" &&
        key !== "subscription" &&
        value !== undefined &&
        value !== null
      ) {
        formData.append(key, String(value));
      }
    });

    // Append files if they exist
    if (data.logo instanceof File) {
      formData.append("logo", data.logo);
    }
    if (data.letterHead instanceof File) {
      formData.append("letterHead", data.letterHead);
    }

    // Flatten and append nested user fields
    if (data.user) {
      Object.entries(data.user).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          formData.append(`user[${k}]`, String(v));
        }
      });
    }

    // Flatten and append nested subscription fields
    if (data.subscription) {
      Object.entries(data.subscription).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          formData.append(`subscription[${k}]`, String(v));
        }
      });
    }

    // Call the appropriate mutation
    if (mode === "create") createUserMutation.mutate(formData);
    else updateUserMutation.mutate(formData);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="mx-auto mt-10 ">
          <CardContent>
            {/* Agency Details */}
            <CardTitle className="text-lg">Agency Details</CardTitle>
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
            {/* Add File Inputs */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="logo" className="mb-2 block">
                  Logo (JPG, PNG, max 2MB)
                </Label>
                <Input
                  id="logo"
                  type="file"
                  accept={ACCEPTED_LOGO_TYPES.join(",")}
                  // Use onChange directly, register is not needed for controlled file input this way
                  onChange={handleFileChange}
                  name="logo" // Important: name must match schema key
                />
                {logoPreview && (
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="mt-2 h-20 w-auto object-contain"
                  />
                )}
                {errors.logo && (
                  <span className="text-red-500 text-sm">
                    {errors.logo.message}
                  </span>
                )}
              </div>
              <div>
                <Label htmlFor="letterHead" className="mb-2 block">
                  Letterhead (PDF, max 5MB)
                </Label>
                <Input
                  id="letterHead"
                  type="file"
                  // accept={ACCEPTED_LETTERHEAD_TYPES.join(",")}
                  onChange={handleFileChange}
                  name="letterHead" // Important: name must match schema key
                />
                {letterHeadPreview && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Selected: {letterHeadPreview}
                  </p>
                )}
                {errors.letterHead && (
                  <span className="text-red-500 text-sm">
                    {errors.letterHead.message}
                  </span>
                )}
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
                      <Label className="mb-2" htmlFor="subscription.packageId">
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
                                    setValue("subscription.packageId", pkg.id, {
                                      shouldValidate: true,
                                    });
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
                          {errors.subscription?.packageId.message}
                        </span>
                      )}
                    </div>
                    <div>
                      <Label className="mb-2" htmlFor="subscription.startDate">
                        Start Date
                      </Label>
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
          <div className="justify-end mr-5 flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/agencies")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                createUserMutation.isPending || updateUserMutation.isPending
              }
              className="flex items-center justify-center gap-2"
            >
              {createUserMutation.isPending || updateUserMutation.isPending ? (
                <>
                  <LoaderCircle className="animate-spin h-4 w-4" /> Saving...
                </>
              ) : mode === "create" ? (
                "Create"
              ) : (
                "Update"
              )}
            </Button>
          </div>
        </Card>
        {/* Submit and Cancel Buttons */}
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
              {id && <AddSubscription agencyId={id} />}
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
                  {userData?.subscriptions.map((s) => (
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
