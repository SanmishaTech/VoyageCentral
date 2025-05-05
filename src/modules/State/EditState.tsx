import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, put } from "@/services/apiService";
import { z } from "zod";
import { toast } from "sonner";
import { Button, Input } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader } from "lucide-react";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import Validate from "@/lib/Handlevalidation";
interface Country {
  id: number;
  countryName: string;
}

interface CountriesResponse {
  countries: Country[];
  page: number;
  totalPages: number;
  totalCountries: number;
}

const stateSchema = z.object({
  stateName: z.string().min(1, "State name is required"),
  countryId: z.number().min(1, "Country is required"),
});

type StateFormData = z.infer<typeof stateSchema>;

interface EditStateProps {
  stateId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

interface StateResponse {
  id: number;
  stateName: string;
  country: {
    id: number;
    countryName: string;
  };
  createdAt: string;
  updatedAt: string;
}

const EditState = ({ stateId, isOpen, onClose }: EditStateProps) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    setError,
    watch,
  } = useForm<StateFormData>({
    resolver: zodResolver(stateSchema),
    defaultValues: {
      stateName: "",
      countryId: undefined,
    },
  });

  const { data: countriesResponse } = useQuery<CountriesResponse>({
    queryKey: ["countries"],
    queryFn: () => get("/countries"),
  });

  const { data: stateData, isLoading } = useQuery<StateResponse>({
    queryKey: ["states", stateId],
    queryFn: async () => {
      const response = await get(`/states/${stateId}`);
      return response;
    },
    enabled: !!stateId && isOpen,
  });

  useEffect(() => {
    if (stateData) {
      reset({
        stateName: stateData.stateName,
        countryId: stateData.country.id,
      });
    }
  }, [stateData, reset]);

  const countries = countriesResponse?.countries || [];

  const updateStateMutation = useMutation({
    mutationFn: (data: StateFormData) => put(`/states/${stateId}`, data),
    onSuccess: () => {
      toast.success("State updated successfully");
      queryClient.invalidateQueries(["states"]);
      onClose();
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(error.response?.data?.message || "Failed to update state");
    },
  });

  const onSubmit = (data: StateFormData) => {
    updateStateMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit State</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-[200px]">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-4 space-y-4">
              <div className="grid gap-2 relative">
                <Label htmlFor="countryId">Country</Label>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="justify-between"
                    >
                      {watch("countryId")
                        ? countries.find(
                            (country) => country.id === watch("countryId")
                          )?.countryName
                        : "Select country..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[450px] p-0">
                    <Command>
                      <CommandInput placeholder="Search country..." />
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup>
                        {countries.map((country) => (
                          <CommandItem
                            key={country.id}
                            onSelect={() => {
                              setValue("countryId", country.id);
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                watch("countryId") === country.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {country.countryName}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.countryId && (
                  <span className="text-red-500 text-sm absolute bottom-0 translate-y-[105%]">
                    {errors.countryId.message}
                  </span>
                )}
              </div>

              <div className="grid gap-2 relative">
                <Label htmlFor="stateName">State Name</Label>
                <Input
                  id="stateName"
                  placeholder="Enter State Name..."
                  {...register("stateName")}
                />
                {errors.stateName && (
                  <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
                    {errors.stateName.message}
                  </span>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="ml-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-white"
                disabled={updateStateMutation.isLoading}
              >
                Update
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditState;
