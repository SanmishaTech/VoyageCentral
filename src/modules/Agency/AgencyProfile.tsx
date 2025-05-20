import { useEffect, useState, ChangeEvent } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { LoaderCircle, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { get, put } from "@/services/apiService";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
const BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// --- Interfaces ---
interface Package {
  id: number;
  packageName: string;
  numberOfBranches: number;
  usersPerBranch: number;
  periodInMonths: number;
  cost: string | number;
}

interface Subscription {
  id: number;
  startDate: string;
  endDate: string;
  package: Package | null;
  cost: string | number;
  cgstPercent?: number;
  cgstAmount?: string | number;
  sgstPercent?: number;
  sgstAmount?: string | number;
  igstPercent?: number;
  igstAmount?: string | number;
  totalAmount: string | number;
  paymentDate: string;
  paymentMode: string;
  utrNumber?: string;
  neftImpfNumber?: string;
  chequeNumber?: string;
  chequeDate?: string;
  bankName?: string;
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

interface ApiResponse {
  id: number;
  currentSubscriptionId: number | null;
  businessName: string;
  addressLine1: string;
  addressLine2: string | null;
  stateId: string | number;
  cityId: string | number;
  pincode: string;
  uploadUUID: string | null;
  logoFilename: string | null;
  letterheadFilename: string | null;
  contactPersonName: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  contactPersonName2: string;
  contactPersonEmail2: string;
  contactPersonPhone2: string;
  gstin: string | null;
  createdAt: string;
  updatedAt: string;
  users: User[];
  subscriptions: Subscription[];
  logoUrl: string | null;
  letterheadUrl: string | null;
}

// --- Constants for File Validation ---
const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_LOGO_TYPES = ["image/jpeg", "image/png", "image/jpg"];
const MAX_LETTERHEAD_SIZE = 2 * 1024 * 1024;
const ACCEPTED_LETTERHEAD_TYPES = ["image/jpeg", "image/png", "image/jpg"];

// --- Zod Schemas (Frontend Validation) ---
const fileSchema = z
  .instanceof(File, { message: "File selection is invalid." })
  .optional()
  .nullable();

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

// --- Update Agency Schema ---
const updateAgencySchema = z.object({
  businessName: z
    .string()
    .min(1, "Business Name is required")
    .max(100, "Business Name must not exceed 100 characters"),
  gstin: z
    .string()
    .length(15, "GSTIN must be exactly 15 characters long")
    .or(z.literal(""))
    .or(z.null())
    .optional(),
  addressLine1: z.string().min(1, "Address Line 1 is required"),
  addressLine2: z.string().or(z.literal("")).or(z.null()).optional(),
  stateName: z.string().min(1, "State Name is required"),
  cityName: z.string().min(1, "City Name is required"),
  pincode: z.string().min(1, "Pincode is required"),
  contactPersonName: z.string().min(1, "Contact Person Name is required"),
  contactPersonName2: z
    .string()
    .regex(
      /^([A-Za-z\s\u0900-\u097F]+)?$/,
      "Contact name can only contain letters."
    )
    .refine((val) => val === "" || val.trim().length > 0, {
      message: "Contact name cannot be only spaces.",
    }),
  contactPersonEmail: z
    .string()
    .email("Invalid email format")
    .min(1, "Contact Person Email is required"),
  contactPersonEmail2: z
    .string()
    .max(100, "Contact Person Email is too long")
    .email("Invalid email format")
    .or(z.literal(""))
    .optional(),
  contactPersonPhone: z
    .string()
    .min(10, "Contact Person Phone requires at least 10 digits")
    .max(10, "Contact Person Phone too long"),
  contactPersonPhone2: z
    .string()
    .refine((val) => val === "" || /^[0-9]{10}$/.test(val), {
      message: "Contact Person Phone field must contain exactly 10 digits.",
    }),
  letterHead: letterHeadSchema,
  logo: logoSchema,
});

type FormInputs = z.infer<typeof updateAgencySchema>;

const AgencyProfile = () => {
  const { agencyId: id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [letterHeadPreview, setLetterHeadPreview] = useState<string | null>(
    null
  );
  const [agencyData, setAgencyData] = useState<ApiResponse | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    setError,
    control,
    watch,
    formState: { errors },
  } = useForm<FormInputs>({
    resolver: zodResolver(updateAgencySchema),
    defaultValues: {},
  });

  // Fetch agency data for edit mode
  useEffect(() => {
    if (id) {
      setAgencyData(null);
      setLogoPreview(null);
      setLetterHeadPreview(null);
      (async () => {
        try {
          const resp: ApiResponse = await get(`/agencies/${id}`);
          setAgencyData(resp);
          reset({
            businessName: resp.businessName,
            gstin: resp.gstin ?? "",
            addressLine1: resp.addressLine1,
            addressLine2: resp.addressLine2 ?? "",
            stateName: resp.stateName ? resp.stateName : "",
            cityName: resp.cityName ? resp.cityName : "",
            pincode: resp.pincode,
            contactPersonName: resp.contactPersonName,
            contactPersonEmail: resp.contactPersonEmail,
            contactPersonPhone: resp.contactPersonPhone,
            contactPersonName2: resp.contactPersonName2 || "",
            contactPersonEmail2: resp.contactPersonEmail2 || "",
            contactPersonPhone2: resp.contactPersonPhone2 || "",
          });
        } catch (error: unknown) {
          toast.error(
            `Failed to fetch agency details: ${
              error instanceof Error ? error.message : "Unknown error"
            }`
          );
        }
      })();
    }
  }, [id, reset]);

  // Logo preview
  const watchedLogo = watch("logo" as any);
  useEffect(() => {
    let reader: FileReader;
    let isMounted = true;
    if (watchedLogo && watchedLogo instanceof File) {
      reader = new FileReader();
      reader.onloadend = () => {
        if (isMounted) setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(watchedLogo);
    } else if (watchedLogo === null) {
      setLogoPreview(null);
    }
    return () => {
      isMounted = false;
    };
  }, [watchedLogo]);

  // Letterhead preview
  const watchedLetterHead = watch("letterHead" as any);
  useEffect(() => {
    let reader: FileReader;
    let isMounted = true;
    if (watchedLetterHead && watchedLetterHead instanceof File) {
      if (ACCEPTED_LETTERHEAD_TYPES.includes(watchedLetterHead.type)) {
        reader = new FileReader();
        reader.onloadend = () => {
          if (isMounted) setLetterHeadPreview(reader.result as string);
        };
        reader.readAsDataURL(watchedLetterHead);
      } else {
        if (isMounted) {
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
  const updateAgencyMutation = useMutation<ApiResponse, Error, FormData>({
    mutationFn: (formData: FormData) =>
      put(`/agencies/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      toast.success("Agency updated successfully");
      queryClient.invalidateQueries({ queryKey: ["agencies"] });
      if (id) {
        queryClient.invalidateQueries({ queryKey: ["agencies", id] });
      }
    },
    onError: (error: Error) => {
      Validate(error, setError);
    },
  });

  // --- Handlers ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    const name = e.target.name as keyof FormInputs;
    setValue(name, file, { shouldValidate: true });
    if (name === "logo") setLogoPreview(null);
    if (name === "letterHead") setLetterHeadPreview(null);
  };

  const onSubmit = (data: FormInputs) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      const keyTyped = key as keyof FormInputs;
      if (
        keyTyped !== "logo" &&
        keyTyped !== "letterHead" &&
        value !== undefined &&
        value !== null
      ) {
        formData.append(key, String(value));
      }
    });
    if (data.logo instanceof File) {
      formData.append("logo", data.logo);
    }
    if (data.letterHead instanceof File) {
      formData.append("letterHead", data.letterHead);
    }
    updateAgencyMutation.mutate(formData);
  };

  const isLoading = updateAgencyMutation.isPending;

  return (
    <>
      <div className="mt-2 p-6">
        <h1 className="text-2xl font-bold mb-6">Agency Profile</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* {Object.entries(errors).map(([field, error]) => (
          <p key={field} className="text-red-500 text-sm">
            {error?.message as string}
          </p>
        ))} */}
          <Card className="mx-auto mt-10">
            <CardContent className="pt-6">
              <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Agency Details
              </CardTitle>
              <div className="grid gap-4 mt-5">
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label
                      htmlFor="stateName"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      State <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="stateName"
                      {...register("stateName")}
                      placeholder="Enter state name"
                    />
                    {errors.stateName && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.stateName.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label
                      htmlFor="cityName"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      City <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="cityName"
                      {...register("cityName")}
                      placeholder="Enter city name"
                    />
                    {errors.cityName && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.cityName.message}
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
                  <div className="mt-2 min-h-[100px] flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-600 rounded-md p-2 bg-gray-50 dark:bg-gray-800/50">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="New Logo Preview"
                        className="max-h-20 w-auto object-contain"
                      />
                    ) : agencyData?.logoUrl ? (
                      <img
                        src={`${BACKEND_URL}${agencyData.logoUrl}`}
                        alt="Current Logo"
                        className="max-h-20 w-auto object-contain"
                        onError={(e) => {
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
                  <div className="mt-2 min-h-[100px] flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-600 rounded-md p-2 bg-gray-50 dark:bg-gray-800/50">
                    {letterHeadPreview &&
                    letterHeadPreview.startsWith("data:image") ? (
                      <img
                        src={letterHeadPreview}
                        alt="New Letterhead Preview"
                        className="max-h-20 w-auto object-contain"
                      />
                    ) : letterHeadPreview ? (
                      <p className="text-xs text-gray-600 dark:text-gray-400 p-2 text-center">
                        {letterHeadPreview}
                      </p>
                    ) : agencyData?.letterheadUrl ? (
                      <img
                        src={`${BACKEND_URL}${agencyData.letterheadUrl}`}
                        alt="Current Letterhead"
                        className="max-h-20 w-auto object-contain"
                        onError={(e) => {
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
              <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Contact Person
              </CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                <div>
                  <Label
                    htmlFor="contactPersonName"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Contact Person Name 1<span className="text-red-500">*</span>
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
                    Contact Person Email 1
                    <span className="text-red-500">*</span>
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
                    Contact Person Phone 1
                    <span className="text-red-500">*</span>
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
                <div>
                  <Label
                    htmlFor="contactPersonName2"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Contact Person Name 2
                  </Label>
                  <Input
                    id="contactPersonName2"
                    {...register("contactPersonName2")}
                    placeholder="e.g., Jane Doe"
                  />
                  {errors.contactPersonName2 && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.contactPersonName2.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="contactPersonEmail2"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Contact Person Email 2
                  </Label>
                  <Input
                    id="contactPersonEmail2"
                    type="email"
                    {...register("contactPersonEmail2")}
                    placeholder="e.g., jane.doe@example.com"
                  />
                  {errors.contactPersonEmail2 && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.contactPersonEmail2.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label
                    htmlFor="contactPersonPhone2"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Contact Person Phone 2
                  </Label>
                  <Input
                    id="contactPersonPhone2"
                    type="tel"
                    {...register("contactPersonPhone2")}
                    placeholder="e.g., 9876543210"
                  />
                  {errors.contactPersonPhone2 && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.contactPersonPhone2.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
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
                className="min-w-[90px]"
              >
                {isLoading ? (
                  <LoaderCircle className="animate-spin h-4 w-4" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </Card>
        </form>
      </div>
    </>
  );
};

export default AgencyProfile;
