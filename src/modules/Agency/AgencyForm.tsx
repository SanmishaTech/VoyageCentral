import { useEffect, useState, ChangeEvent } from "react";
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
import { get, post, put } from "@/services/apiService"; // Assuming this handles the base URL internally
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { PasswordInput } from "@/components/ui/password-input";
import AddSubscription from "./AddSubcription"; // Corrected component name casing
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

// --- Configuration ---
// Define your backend base URL. Use environment variables in a real app.
const BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"; // Adjust if needed

// --- Interfaces ---
interface Package {
  id: number;
  packageName: string;
  numberOfBranches: number;
  usersPerBranch: number;
  periodInMonths: number;
  cost: string | number; // Allow string or number based on API response
}

interface Subscription {
  id: number;
  startDate: string;
  endDate: string;
  package: Package | null; // Allow null if package data might be missing
  cost: string | number;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
  branchId: number | null;
  createdAt: string;
}

// API Response Interface matching the provided example
interface ApiResponse {
  id: number;
  currentSubscriptionId: number | null;
  businessName: string;
  addressLine1: string;
  addressLine2: string | null;
  state: string;
  city: string;
  pincode: string;
  uploadUUID: string | null;
  logoFilename: string | null;
  letterheadFilename: string | null;
  contactPersonName: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  gstin: string | null;
  createdAt: string;
  updatedAt: string;
  users: User[];
  subscriptions: Subscription[];
  // These are the key fields for displaying images
  logoUrl: string | null;
  letterheadUrl: string | null;
}

// --- Constants for File Validation ---
const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_LOGO_TYPES = ["image/jpeg", "image/png", "image/jpg"];
const MAX_LETTERHEAD_SIZE = 2 * 1024 * 1024; // 2MB (Align with logo for consistency)
const ACCEPTED_LETTERHEAD_TYPES = ["image/jpeg", "image/png", "image/jpg"];

// --- Zod Schemas (Frontend Validation) ---
const fileSchema = z
  .instanceof(File, { message: "File selection is invalid." }) // Changed message
  .optional()
  .nullable(); // Allow null if needed (e.g., for removal logic if implemented)

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
    `Letterhead size must be less than 2MB.`
  )
  .refine(
    (file) => !file || ACCEPTED_LETTERHEAD_TYPES.includes(file.type),
    "Invalid letterhead file type. Only JPG, JPEG, PNG are allowed."
  );

// Base schema for common fields
const baseAgencySchema = z.object({
  businessName: z.string().min(1, "Business Name is required"),
  gstin: z
    .string()
    .length(15, "GSTIN must be exactly 15 characters long")
    .or(z.literal(""))
    .or(z.null())
    .optional(), // Allow empty or null based on backend
  addressLine1: z.string().min(1, "Address Line 1 is required"),
  addressLine2: z.string().or(z.literal("")).or(z.null()).optional(), // Allow empty or null
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  pincode: z.string().min(1, "Pincode is required"), // Consider regex for format
  contactPersonName: z.string().min(1, "Contact Person Name is required"),
  contactPersonEmail: z
    .string()
    .email("Invalid email format")
    .min(1, "Contact Person Email is required"),
  contactPersonPhone: z
    .string()
    .min(10, "Contact Person Phone requires at least 10 digits")
    .max(15, "Contact Person Phone too long"), // Allow slightly more chars for formatting/country code
  letterHead: letterHeadSchema,
  logo: logoSchema,
});

// Schema for creating (includes user and subscription)
const createAgencySchema = baseAgencySchema.extend({
  user: z.object({
    name: z.string().min(1, "User Name is required"),
    email: z
      .string()
      .email("Invalid user email format")
      .min(1, "User Email is required"),
    password: z.string().min(5, "Password must be at least 5 characters long"),
  }),
  subscription: z.object({
    packageId: z.number({
      required_error: "Package is required",
      invalid_type_error: "Package is required",
    }),
    startDate: z.string().min(1, "Start date is required"), // Basic validation, refine if needed
  }),
});

// Schema for updating (user/subscription not directly editable here)
const updateAgencySchema = baseAgencySchema; // Use the base schema for update validation

// --- Component ---
const UserForm = ({ mode }: { mode: "create" | "edit" }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false); // For package dropdown
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [agencyData, setAgencyData] = useState<ApiResponse | null>(null); // Changed state name for clarity
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [letterHeadPreview, setLetterHeadPreview] = useState<string | null>(
    null
  );

  // Fetch packages (only needed for create mode)
  const { data: packages = [] } = useQuery<Package[]>({
    queryKey: ["packages"],
    queryFn: async () => {
      // Consider fetching all packages if the list isn't too large, or implement server-side search
      const response = await get("/packages?limit=200"); // Fetch more packages
      return response.packages || []; // Ensure it returns an array
    },
    enabled: mode === "create", // Only fetch when creating
  });

  // Determine the correct schema based on mode
  const currentSchema =
    mode === "create" ? createAgencySchema : updateAgencySchema;
  type FormInputs = z.infer<typeof currentSchema>; // Infer type from the current schema

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    setError,
    watch,
    formState: { errors },
  } = useForm<FormInputs>({
    resolver: zodResolver(currentSchema),
    defaultValues:
      mode === "create"
        ? {
            // Set defaults for create mode if needed, especially for nested objects
            user: { name: "", email: "", password: "" },
            subscription: {
              packageId: undefined,
              startDate: new Date().toISOString().split("T")[0],
            },
          }
        : {},
  });

  // Watch file inputs for preview updates
  const watchedLogo = watch("logo" as any); // Use 'as any' if type inference struggles
  const watchedLetterHead = watch("letterHead" as any);

  // --- Effects ---

  // Fetch data in Edit mode
  useEffect(() => {
    if (mode === "edit" && id) {
      setAgencyData(null); // Clear previous data before fetching
      setLogoPreview(null);
      setLetterHeadPreview(null);
      (async () => {
        try {
          const resp: ApiResponse = await get(`/agencies/${id}`);
          console.log("Fetched Agency Data:", resp); // Debug fetched data
          setAgencyData(resp); // Set the full agency data

          // Reset form with fetched data (excluding files and nested objects for edit)
          reset({
            businessName: resp.businessName,
            gstin: resp.gstin ?? "", // Handle null from API
            addressLine1: resp.addressLine1,
            addressLine2: resp.addressLine2 ?? "", // Handle null
            state: resp.state,
            city: resp.city,
            pincode: resp.pincode,
            contactPersonName: resp.contactPersonName,
            contactPersonEmail: resp.contactPersonEmail,
            contactPersonPhone: resp.contactPersonPhone,
            // logo and letterHead are handled via previews/existing URLs
            // user and subscription are not editable in this part of the form
          } as Partial<FormInputs>); // Use Partial as user/sub are not in update schema
        } catch (error: unknown) {
          console.error("Fetch error:", error);
          toast.error(
            `Failed to fetch agency details: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
          // Optionally navigate back or show an error state
          // navigate("/agencies");
        }
      })();
    } else {
      // Reset for create mode
      setAgencyData(null);
      setLogoPreview(null);
      setLetterHeadPreview(null);
      setSelectedPackage(null);
      reset(); // Reset form fields
    }
  }, [id, mode, reset]);

  // Generate Logo preview for NEWLY selected file
  useEffect(() => {
    let reader: FileReader;
    let isMounted = true; // Prevent state update on unmounted component

    if (watchedLogo && watchedLogo instanceof File) {
      reader = new FileReader();
      reader.onloadend = () => {
        if (isMounted) {
          setLogoPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(watchedLogo);
    } else if (watchedLogo === null) {
      // If explicitly set to null (e.g., future remove button)
      setLogoPreview(null);
    }
    // Don't clear preview here based on agencyData, JSX handles showing existing

    return () => {
      isMounted = false; // Cleanup function
      // Optional: Abort reader if needed, though less critical here
    };
  }, [watchedLogo]);

  // Generate Letterhead preview for NEWLY selected file
  useEffect(() => {
    let reader: FileReader;
    let isMounted = true;

    if (watchedLetterHead && watchedLetterHead instanceof File) {
      if (ACCEPTED_LETTERHEAD_TYPES.includes(watchedLetterHead.type)) {
        reader = new FileReader();
        reader.onloadend = () => {
          if (isMounted) {
            setLetterHeadPreview(reader.result as string);
          }
        };
        reader.readAsDataURL(watchedLetterHead);
      } else {
        if (isMounted) {
          // Show filename if not an image type we can preview
          setLetterHeadPreview(`Selected file: ${watchedLetterHead.name}`);
        }
      }
    } else if (watchedLetterHead === null) {
      setLetterHeadPreview(null);
    }

    return () => {
      isMounted = false;
    };
  }, [watchedLetterHead]);

  // --- Mutations ---
  const commonMutationConfig = {
    onSuccess: (data: any, variables: any, context: any) => {
      // More specific types if available
      const successMessage =
        mode === "create"
          ? "Agency created successfully"
          : "Agency updated successfully";
      toast.success(successMessage);
      queryClient.invalidateQueries({ queryKey: ["agencies"] }); // Invalidate list view
      if (mode === "edit" && id) {
        queryClient.invalidateQueries({ queryKey: ["agencies", id] }); // Invalidate detail view
      }
      navigate("/agencies");
    },
    onError: (error: Error) => {
      console.error("Mutation Error:", error); // Log the raw error
      Validate(error, setError); // Let Validate handle setting form errors
      // Optionally, show a generic toast error as well, but Validate might be sufficient
      // toast.error(`Failed to ${mode} agency: ${error.message || 'Please check errors below'}`);
    },
  };

  const createAgencyMutation = useMutation<ApiResponse, Error, FormData>({
    mutationFn: (formData: FormData) =>
      post("/agencies", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    ...commonMutationConfig,
  });

  const updateAgencyMutation = useMutation<ApiResponse, Error, FormData>({
    mutationFn: (formData: FormData) =>
      put(`/agencies/${id}`, formData, {
        // Ensure ID is included
        headers: { "Content-Type": "multipart/form-data" },
      }),
    ...commonMutationConfig,
  });

  // --- Handlers ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null; // Use null if no file selected
    const name = e.target.name as keyof FormInputs;
    // Use null instead of undefined if file is cleared
    setValue(name, file, { shouldValidate: true });

    // Manually clear the other type of preview if a file is selected/deselected
    if (name === "logo") setLogoPreview(null);
    if (name === "letterHead") setLetterHeadPreview(null);
  };

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    const formData = new FormData();

    console.log("Submitting Data:", data);

    // Append all non-file, non-nested fields safely
    Object.entries(data).forEach(([key, value]) => {
      const keyTyped = key as keyof FormInputs; // Type assertion
      if (
        keyTyped !== "logo" &&
        keyTyped !== "letterHead" &&
        keyTyped !== "user" &&
        keyTyped !== "subscription" &&
        value !== undefined && // Keep undefined check
        value !== null // Keep null check
      ) {
        formData.append(key, String(value)); // Convert value to string for FormData
      }
      // Handle potential explicit null for removal if backend supported it via FormData:
      // else if (value === null && (keyTyped === "logo" || keyTyped === "letterHead")) {
      //   // How to signal removal via FormData is tricky. Often needs backend adjustment.
      //   // Option 1: Append a special marker (e.g., '__REMOVE__')
      //   // formData.append(key + 'Filename', '__REMOVE__');
      //   // Option 2: Append empty string (backend interprets this)
      //   // formData.append(key + 'Filename', '');
      // }
    });

    // Append files ONLY if they are File objects (newly selected)
    if (data.logo instanceof File) {
      formData.append("logo", data.logo);
    }
    if (data.letterHead instanceof File) {
      formData.append("letterHead", data.letterHead);
    }

    // Stringify and append nested objects ONLY for CREATE mode
    if (mode === "create") {
      // Assert data is of create type before accessing user/subscription
      const createData = data as z.infer<typeof createAgencySchema>;
      if (createData.user) {
        formData.append("user", JSON.stringify(createData.user));
      }
      if (createData.subscription) {
        formData.append(
          "subscription",
          JSON.stringify(createData.subscription)
        );
      }
    }

    // --- Debug FormData ---
    // console.log("FormData contents:");
    // for (let [key, value] of formData.entries()) {
    //   console.log(`${key}:`, value);
    // }
    // --- End Debug ---

    if (mode === "create") {
      createAgencyMutation.mutate(formData);
    } else if (id) {
      updateAgencyMutation.mutate(formData);
    } else {
      toast.error("Cannot update: Agency ID is missing.");
      console.error("Update attempted without ID.");
    }
  };

  // --- JSX ---
  const isLoading =
    createAgencyMutation.isPending || updateAgencyMutation.isPending;

  return (
    <>
      {/* --- Form --- */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="mx-auto mt-10 min-w-5xl">
          {" "}
          {/* Constrain width */}
          <CardContent className="pt-6">
            {/* --- Agency Details --- */}
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Agency Details
            </CardTitle>
            <div className="grid gap-4 mt-5">
              {/* --- Row 1: Business Name, GSTIN --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="businessName"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Business Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="businessName"
                    {...register("businessName")}
                    placeholder="Enter business name"
                  />
                  {errors.businessName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.businessName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="gstin"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    GSTIN
                  </Label>
                  <Input
                    id="gstin"
                    {...register("gstin")}
                    placeholder="e.g., 22AAAAA0000A1Z5"
                    className="uppercase"
                    maxLength={15}
                  />
                  {errors.gstin && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.gstin.message}
                    </p>
                  )}
                </div>
              </div>
              {/* --- Row 2: Address Line 1 --- */}
              <div>
                <Label
                  htmlFor="addressLine1"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Address Line 1 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="addressLine1"
                  {...register("addressLine1")}
                  placeholder="Building No, Street Name"
                />
                {errors.addressLine1 && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.addressLine1.message}
                  </p>
                )}
              </div>
              {/* --- Row 3: Address Line 2 --- */}
              <div>
                <Label
                  htmlFor="addressLine2"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Address Line 2
                </Label>
                <Input
                  id="addressLine2"
                  {...register("addressLine2")}
                  placeholder="Area, Landmark"
                />
                {errors.addressLine2 && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.addressLine2.message}
                  </p>
                )}
              </div>
              {/* --- Row 4: State, City, Pincode --- */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label
                    htmlFor="state"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    State <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="state"
                    {...register("state")}
                    placeholder="e.g., Maharashtra"
                  />
                  {errors.state && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.state.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="city"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="city"
                    {...register("city")}
                    placeholder="e.g., Mumbai"
                  />
                  {errors.city && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.city.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="pincode"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Pincode <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="pincode"
                    {...register("pincode")}
                    placeholder="e.g., 400001"
                  />
                  {errors.pincode && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.pincode.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* --- File Inputs & Previews --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {/* Logo Input & Preview */}
              <div>
                <Label
                  htmlFor="logo"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Logo (JPG, PNG, max 2MB)
                </Label>
                <Input
                  id="logo"
                  type="file"
                  accept={ACCEPTED_LOGO_TYPES.join(",")}
                  onChange={handleFileChange}
                  name="logo"
                  className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary dark:file:bg-primary/20 dark:file:text-primary hover:file:bg-primary/20 dark:hover:file:bg-primary/30"
                />
                {/* Logo Preview Area */}
                <div className="mt-2 min-h-[100px] flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-600 rounded-md p-2 bg-gray-50 dark:bg-gray-800/50">
                  {logoPreview ? ( // Prioritize new selection preview
                    <img
                      src={logoPreview}
                      alt="New Logo Preview"
                      className="max-h-20 w-auto object-contain"
                    />
                  ) : agencyData?.logoUrl ? ( // Show existing logo from API URL
                    <img
                      src={`${BACKEND_URL}${agencyData.logoUrl}`} // *** USE ABSOLUTE URL ***
                      alt="Current Logo"
                      className="max-h-20 w-auto object-contain"
                      onError={(e) => {
                        // Handle broken image link
                        (e.target as HTMLImageElement).style.display = "none";
                        const errorPlaceholder =
                          e.target.parentNode?.querySelector(
                            ".error-placeholder"
                          );
                        if (!errorPlaceholder) {
                          (e.target as HTMLImageElement).insertAdjacentHTML(
                            "afterend",
                            '<p class="text-xs text-red-500 error-placeholder">Could not load logo</p>'
                          );
                        }
                      }}
                    />
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      No logo uploaded
                    </span>
                  )}
                </div>
                {errors.logo && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.logo.message as string}
                  </p>
                )}
              </div>

              {/* Letterhead Input & Preview */}
              <div>
                <Label
                  htmlFor="letterHead"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Letterhead (JPG, PNG, max 2MB)
                </Label>
                <Input
                  id="letterHead"
                  type="file"
                  accept={ACCEPTED_LETTERHEAD_TYPES.join(",")}
                  onChange={handleFileChange}
                  name="letterHead"
                  className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary dark:file:bg-primary/20 dark:file:text-primary hover:file:bg-primary/20 dark:hover:file:bg-primary/30"
                />
                {/* Letterhead Preview Area */}
                <div className="mt-2 min-h-[100px] flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-600 rounded-md p-2 bg-gray-50 dark:bg-gray-800/50">
                  {letterHeadPreview &&
                  letterHeadPreview.startsWith("data:image") ? ( // New image preview
                    <img
                      src={letterHeadPreview}
                      alt="New Letterhead Preview"
                      className="max-h-20 w-auto object-contain"
                    />
                  ) : letterHeadPreview ? ( // New file (not image) preview
                    <p className="text-xs text-gray-600 dark:text-gray-400 p-2 text-center">
                      {letterHeadPreview}
                    </p>
                  ) : agencyData?.letterheadUrl ? ( // Existing letterhead from API URL
                    <img
                      src={`${BACKEND_URL}${agencyData.letterheadUrl}`} // *** USE ABSOLUTE URL ***
                      alt="Current Letterhead"
                      className="max-h-20 w-auto object-contain"
                      onError={(e) => {
                        // Handle broken image link
                        (e.target as HTMLImageElement).style.display = "none";
                        const errorPlaceholder =
                          e.target.parentNode?.querySelector(
                            ".error-placeholder"
                          );
                        if (!errorPlaceholder) {
                          (e.target as HTMLImageElement).insertAdjacentHTML(
                            "afterend",
                            '<p class="text-xs text-red-500 error-placeholder">Could not load letterhead</p>'
                          );
                        }
                      }}
                    />
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      No letterhead uploaded
                    </span>
                  )}
                </div>
                {errors.letterHead && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.letterHead.message as string}
                  </p>
                )}
              </div>
            </div>

            <hr className="my-6 border-gray-200 dark:border-gray-700" />

            {/* --- Contact Person --- */}
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Contact Person
            </CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              <div>
                <Label
                  htmlFor="contactPersonName"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contactPersonName"
                  {...register("contactPersonName")}
                  placeholder="e.g., Jane Doe"
                />
                {errors.contactPersonName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.contactPersonName.message}
                  </p>
                )}
              </div>
              <div>
                <Label
                  htmlFor="contactPersonEmail"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contactPersonEmail"
                  type="email"
                  {...register("contactPersonEmail")}
                  placeholder="e.g., jane.doe@example.com"
                />
                {errors.contactPersonEmail && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.contactPersonEmail.message}
                  </p>
                )}
              </div>
              <div>
                <Label
                  htmlFor="contactPersonPhone"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Phone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contactPersonPhone"
                  type="tel"
                  {...register("contactPersonPhone")}
                  placeholder="e.g., 9876543210"
                />
                {errors.contactPersonPhone && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.contactPersonPhone.message}
                  </p>
                )}
              </div>
            </div>

            {/* --- Conditional Sections for Create Mode --- */}
            {mode === "create" && (
              <>
                <hr className="my-6 border-gray-200 dark:border-gray-700" />

                {/* --- Subscription Section --- */}
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Subscription
                </CardTitle>
                <div className="grid gap-6 mt-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Package Selection */}
                    <div>
                      <Label
                        htmlFor="subscription.packageId"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Select Package <span className="text-red-500">*</span>
                      </Label>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-full justify-between font-normal" // Adjusted style
                          >
                            {selectedPackage?.packageName ||
                              "Select package..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                          <Command>
                            <CommandInput placeholder="Search packages..." />
                            <CommandEmpty>No package found.</CommandEmpty>
                            <CommandGroup>
                              {packages.map((pkg) => (
                                <CommandItem
                                  key={pkg.id}
                                  value={pkg.packageName} // Use name for search/display value
                                  onSelect={(currentValue) => {
                                    const selected = packages.find(
                                      (p) =>
                                        p.packageName.toLowerCase() ===
                                        currentValue.toLowerCase()
                                    );
                                    if (selected) {
                                      setValue(
                                        "subscription.packageId" as any,
                                        selected.id,
                                        { shouldValidate: true }
                                      );
                                      setSelectedPackage(selected);
                                    } else {
                                      setValue(
                                        "subscription.packageId" as any,
                                        undefined,
                                        { shouldValidate: true }
                                      );
                                      setSelectedPackage(null);
                                    }
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
                        <p className="text-red-500 text-xs mt-1">
                          {errors.subscription.packageId.message as string}
                        </p>
                      )}
                    </div>
                    {/* Start Date */}
                    <div>
                      <Label
                        htmlFor="subscription.startDate"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Start Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="subscription.startDate"
                        type="date"
                        {...register("subscription.startDate" as any)}
                        className="w-full"
                        min={new Date().toISOString().split("T")[0]} // Prevent past dates
                      />
                      {errors.subscription?.startDate && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.subscription.startDate.message as string}
                        </p>
                      )}
                    </div>
                    {/* Selected Package Details Display */}
                    {selectedPackage && (
                      <div className="md:col-span-2 mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <h4 className="font-medium mb-2 text-sm text-gray-800 dark:text-gray-200">
                          Selected Package Details
                        </h4>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                          <dt className="text-gray-600 dark:text-gray-400">
                            Branches:
                          </dt>
                          <dd className="text-gray-900 dark:text-gray-100">
                            {selectedPackage.numberOfBranches}
                          </dd>
                          <dt className="text-gray-600 dark:text-gray-400">
                            Users/Branch:
                          </dt>
                          <dd className="text-gray-900 dark:text-gray-100">
                            {selectedPackage.usersPerBranch}
                          </dd>
                          <dt className="text-gray-600 dark:text-gray-400">
                            Duration:
                          </dt>
                          <dd className="text-gray-900 dark:text-gray-100">
                            {selectedPackage.periodInMonths} months
                          </dd>
                          <dt className="text-gray-600 dark:text-gray-400">
                            Cost:
                          </dt>
                          <dd className="text-gray-900 dark:text-gray-100">
                            ₹{Number(selectedPackage.cost).toLocaleString()}
                          </dd>
                        </dl>
                      </div>
                    )}
                  </div>
                </div>

                <hr className="my-6 border-gray-200 dark:border-gray-700" />

                {/* --- Create User Section --- */}
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  Create Agency Admin User
                </CardTitle>
                <div className="grid gap-4 mt-5">
                  {/* Name */}
                  <div>
                    <Label
                      htmlFor="user.name"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="user.name"
                      {...register("user.name" as any)}
                      placeholder="Admin User Full Name"
                    />
                    {errors.user?.name && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.user.name.message}
                      </p>
                    )}
                  </div>
                  {/* Email */}
                  <div>
                    <Label
                      htmlFor="user.email"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="user.email"
                      type="email"
                      {...register("user.email" as any)}
                      placeholder="admin@agency.com"
                    />
                    {errors.user?.email && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.user.email.message}
                      </p>
                    )}
                  </div>
                  {/* Password */}
                  <div>
                    <Label
                      htmlFor="user.password"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <PasswordInput
                      id="user.password"
                      {...register("user.password" as any)}
                      placeholder="Enter secure password (min 5 chars)"
                    />
                    {errors.user?.password && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.user.password.message}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
          {/* --- Submit/Cancel Buttons --- */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 rounded-b-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/agencies")}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[90px]" // Slightly wider
            >
              {isLoading ? (
                <LoaderCircle className="animate-spin h-4 w-4" />
              ) : mode === "create" ? (
                "Create Agency"
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </Card>
      </form>

      {/* --- Display Users & Subscriptions in Edit Mode --- */}
      {mode === "edit" && agencyData && (
        <div className="mx-auto mt-8 mb-10 space-y-6 min-w-5xl">
          {" "}
          {/* Added bottom margin */}
          {/* --- Users Table --- */}
          <Card>
            <CardContent className="pt-6">
              <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Associated Users
              </CardTitle>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agencyData.users.length > 0 ? (
                    agencyData.users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={u.active ? "default" : "destructive"}
                            className={
                              u.active
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-700"
                                : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-700"
                            }
                          >
                            {u.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-sm text-gray-500 dark:text-gray-400 py-4"
                      >
                        No users found for this agency.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {/* --- Subscriptions Table --- */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-200">
                  Subscription History
                </CardTitle>
                {id && <AddSubscription agencyId={id} />}{" "}
                {/* Ensure id is string */}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agencyData.subscriptions.length > 0 ? (
                    agencyData.subscriptions.map((s) => {
                      const now = new Date();
                      const endDate = new Date(s.endDate);
                      const isActive = endDate >= now;
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">
                            {s.package?.packageName ?? (
                              <span className="text-gray-500 italic">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(s.startDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{endDate.toLocaleDateString()}</TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={isActive ? "default" : "outline"}
                              className={
                                isActive
                                  ? "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30 border border-green-200 dark:border-green-700"
                                  : "text-gray-600 dark:text-gray-400"
                              }
                            >
                              {isActive ? "Active" : "Expired"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-sm text-gray-500 dark:text-gray-400 py-4"
                      >
                        No subscriptions found for this agency.
                      </TableCell>
                    </TableRow>
                  )}
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
