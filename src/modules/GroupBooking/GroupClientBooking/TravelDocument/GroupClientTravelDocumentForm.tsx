import React, { useEffect, useState } from "react";
import {
  useForm,
  SubmitHandler,
  Controller,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import dayjs from "dayjs";
import { Checkbox } from "@/components/ui/checkbox"; // make sure it's imported

import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea"; // adjust path if needed
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Validate from "@/lib/Handlevalidation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoaderCircle, Trash2, PlusCircle } from "lucide-react"; // Import the LoaderCircle icon
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { get } from "@/services/apiService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { post, put } from "@/services/apiService";
import { set } from "date-fns";
import {
  modeOptions,
  foodTypeOptions,
  flightClassOptions,
  trainClassOptions,
  planOptions,
  roomOptions,
  tariffPackageOptions,
  bedOptions,
} from "@/config/data";

// --- Configuration ---
// Define your backend base URL. Use environment variables in a real app.
const BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"; // Adjust if needed

const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_ATTACHMENT_TYPES = ["image/jpeg", "image/png", "image/jpg"];

const fileSchema = z
  .instanceof(File, { message: "File selection is invalid." }) // Changed message
  .optional()
  .nullable(); // Allow null if needed (e.g., for removal logic if implemented)

const attachmentSchema = fileSchema
  .refine(
    (file) => !file || file.size <= MAX_ATTACHMENT_SIZE,
    `attachment size must be less than 2MB.`
  )
  .refine(
    (file) => !file || ACCEPTED_ATTACHMENT_TYPES.includes(file.type),
    "Invalid attachment file type. Only JPG, JPEG, PNG are allowed."
  );

const FormSchema = z.object({
  description: z
    .string()
    .min(1, "Description field is required.")
    .max(2000, "Description must not exceed 2000 characters."),
  attachment: attachmentSchema,
  isPrivate: z.boolean().optional(),
});

type FormInputs = z.infer<typeof FormSchema>;

const defaultValues: FormInputs = {
  description: "",
  isPrivate: false,
};

const GroupClientTravelDocumentForm = ({
  mode,
}: {
  mode: "create" | "edit";
}) => {
  const { groupBookingId, groupClientBookingId, travelDocumentId } = useParams<{
    groupBookingId: string;
    groupClientBookingId: string;
    travelDocumentId: string;
  }>();
  const [logoPreview, setAttachmentPreview] = useState<string | null>(null);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    setError,
    formState: { errors },
  } = useForm<FormInputs>({
    resolver: zodResolver(FormSchema),
    defaultValues: mode === "create" ? defaultValues : undefined, // Use default values in create mode
  });
  const watchedAttachment = watch("attachment" as any); // Use 'as any' if type inference struggles

  const { data: editTravelDocumentData, isLoading: editTravelDocumentLoading } =
    useQuery({
      queryKey: ["editTravelDocument", travelDocumentId],
      queryFn: async () => {
        const response = await get(
          `/group-client-travel-documents/${travelDocumentId}`
        );
        return response;
      },
    });

  useEffect(() => {
    if (editTravelDocumentData) {
      setAttachmentPreview(null);

      reset({
        description: editTravelDocumentData.description,
        isPrivate: editTravelDocumentData.isPrivate,
      });
    }
  }, [editTravelDocumentData, reset]);

  useEffect(() => {
    let reader: FileReader;
    let isMounted = true; // Prevent state update on unmounted component

    if (watchedAttachment && watchedAttachment instanceof File) {
      reader = new FileReader();
      reader.onloadend = () => {
        if (isMounted) {
          setAttachmentPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(watchedAttachment);
    } else if (watchedAttachment === null) {
      // If explicitly set to null (e.g., future remove button)
      setAttachmentPreview(null);
    }
    // Don't clear preview here based on agencyData, JSX handles showing existing
    return () => {
      isMounted = false; // Cleanup function
      // Optional: Abort reader if needed, though less critical here
    };
  }, [watchedAttachment]);

  // Mutation for creating a user
  const createMutation = useMutation({
    mutationFn: (data: FormInputs) =>
      post(`/group-client-travel-documents/${groupClientBookingId}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["group-client-travel-documents"]); // Refetch the users list
      toast.success("Travel Document added successfully");
      navigate(
        `/groupBookings/${groupBookingId}/groupClientBooking/${groupClientBookingId}/edit`
      );
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(
        error.response?.data?.message || "Failed to create Travel Document"
      );
    },
  });

  // Mutation for updating a user
  const updateMutation = useMutation({
    mutationFn: (data: FormInputs) =>
      put(`/group-client-travel-documents/${travelDocumentId}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      toast.success("Travel Document updated successfully");
      queryClient.invalidateQueries(["group-client-travel-documents"]);
      navigate(
        `/groupBookings/${groupBookingId}/groupClientBooking/${groupClientBookingId}/edit`
      );
    },
    onError: (error: any) => {
      Validate(error, setError);
      console.log("this is error", error);
      toast.error(
        error.response?.data?.message || "Failed to update Travel Document"
      );
    },
  });

  // --- Handlers ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null; // Use null if no file selected
    const name = e.target.name as keyof FormInputs;
    // Use null instead of undefined if file is cleared
    setValue(name, file, { shouldValidate: true });

    // Manually clear the other type of preview if a file is selected/deselected
    if (name === "attachment") setAttachmentPreview(null);
  };

  // start
  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    const formData = new FormData();

    // Append all fields to FormData
    formData.append("description", data.description);
    formData.append("isPrivate", data.isPrivate);

    // Append attachment if it exists
    if (data.attachment instanceof File) {
      formData.append("attachment", data.attachment);
    }

    // Trigger the appropriate mutation
    if (mode === "create") {
      createMutation.mutate(formData); // Pass FormData to the mutation
    } else {
      updateMutation.mutate(formData); // Pass FormData to the mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      {/* JSX Code for HotelForm.tsx */}
      {/* {Object.entries(errors).map(([field, error]) => (
        <p key={field} className="text-red-500 text-sm">
          {error?.message as string}
        </p>
      ))} */}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="mx-auto mt-10 ">
          <CardContent className="pt-6 space-y-8">
            <CardTitle className="font-semibold mt-5 text-gray-800 dark:text-gray-200 mb-4">
              Travel Document Details
            </CardTitle>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Party Coming From */}
              <div className="col-span-1 md:col-span-3">
                <Label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Description <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="description"
                  {...register("description")}
                  placeholder="description"
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Logo Input & Preview */}
              <div className="col-span-2 lg:col-span-1">
                <Label
                  htmlFor="attachment"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Attachment (JPG, PNG, max 2MB)
                </Label>
                <Input
                  id="attachment"
                  type="file"
                  accept={ACCEPTED_ATTACHMENT_TYPES.join(",")}
                  onChange={handleFileChange}
                  name="attachment"
                  className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary dark:file:bg-primary/20 dark:file:text-primary hover:file:bg-primary/20 dark:hover:file:bg-primary/30"
                />
                {/* Logo Preview Area */}
                <div className="mt-2 min-h-[100px] flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-600 rounded-md p-2 bg-gray-50 dark:bg-gray-800/50">
                  {logoPreview ? ( // Prioritize new selection preview
                    <img
                      src={logoPreview}
                      alt="New arrachment Preview"
                      className="max-h-20 w-auto object-contain"
                    />
                  ) : editTravelDocumentData?.attachmentUrl ? ( // Show existing logo from API URL
                    <img
                      src={`${BACKEND_URL}${editTravelDocumentData.attachmentUrl}`} // *** USE ABSOLUTE URL ***
                      alt="Current arrachment"
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
                      No Attachment uploaded
                    </span>
                  )}
                </div>
                {errors.attachment && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.attachment.message as string}
                  </p>
                )}
              </div>
              {/* attachemnt end */}
              <div className="mt-4 flex items-center space-x-2 ">
                <Controller
                  name="isPrivate"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="isPrivate"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="border border-2"
                    />
                  )}
                />
                <Label
                  htmlFor="isPrivate"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  Is Private
                </Label>
              </div>
            </div>
          </CardContent>

          {/* Submit/Cancel Buttons */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 rounded-b-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(
                  `/groupBookings/${groupBookingId}/groupClientBooking/${groupClientBookingId}/edit`
                )
              }
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-[90px]">
              {isLoading ? (
                <LoaderCircle className="animate-spin h-4 w-4" />
              ) : mode === "create" ? (
                "Add Travel Document"
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </Card>
      </form>
    </>
  );
};

export default GroupClientTravelDocumentForm;
