import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ChangeEvent,
  DragEvent,
  FormEvent,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CarFront,
  Check,
  DollarSign,
  Edit3,
  Eye,
  ImageIcon,
  Loader2,
  MoreVertical,
  Plus,
  RefreshCcw,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { getCarServices } from "@/services/carwash-services-api";

type Service = {
  id: string;
  title: string;
  description: string;
  price: number;
  image?: string | null;
  features: string[];
};

const DEFAULT_IMAGE_MIME_TYPE = "image/jpeg";

const getBase64ImageSource = (image?: string | null) => {
  if (!image) return "";

  const value = image.trim();

  if (
    value.startsWith("data:image/") ||
    value.startsWith("blob:") ||
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  return `data:${DEFAULT_IMAGE_MIME_TYPE};base64,${value}`;
};


const normalizeFeatures = (features: unknown): string[] => {
  if (Array.isArray(features)) {
    return features
      .map((feature) => String(feature).trim())
      .filter(Boolean);
  }

  if (typeof features === "string") {
    return features
      .split(",")
      .map((feature) => feature.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeService = (service: any): Service => ({
  id: String(service.id ?? crypto.randomUUID()),
  title: String(service.title ?? ""),
  description: String(service.description ?? ""),
  price: Number(service.price ?? 0),
  image: service.image ?? null,
  features: normalizeFeatures(service.features),
});

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to convert the image to Base64."));
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error("Unable to read the image file."));
    };

    reader.readAsDataURL(file);
  });
};

type ServiceForm = {
  title: string;
  description: string;
  price: string;
  feature1: string;
  feature2: string;
};

type FormErrors = Partial<Record<keyof ServiceForm | "image", string>>;

type AlertState = {
  visible: boolean;
  variant: "success" | "error" | "warning" | "info";
  title: string;
  description: string;
};

const initialForm: ServiceForm = {
  title: "",
  description: "",
  price: "",
  feature1: "",
  feature2: "",
};

export default function CarwashServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedService, setSelectedService] =
    useState<Service | null>(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [form, setForm] = useState<ServiceForm>(initialForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [pageAlert, setPageAlert] = useState<AlertState>({
    visible: false,
    variant: "success",
    title: "",
    description: "",
  });

  const menuRef = useRef<HTMLDivElement | null>(null);

  const getCarwashServices = async () => {
    try {
      setIsLoading(true);

      const response = await getCarServices();
      setServices(
        Array.isArray(response)
          ? response.map(normalizeService)
          : [],
      );
    } catch (error) {
      console.error("Unable to load car wash services:", error);
      setServices([]);

      setPageAlert({
        visible: true,
        variant: "error",
        title: "Unable to load services",
        description: "An error occurred while loading car wash services.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getCarwashServices();
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const filteredServices = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return services;
    }

    return services.filter((service) => {
      return (
        service.title.toLowerCase().includes(search) ||
        service.description.toLowerCase().includes(search) ||
        String(service.price).includes(search)
      );
    });
  }, [searchTerm, services]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredServices.length / itemsPerPage),
  );

  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;

    return filteredServices.slice(
      startIndex,
      startIndex + itemsPerPage,
    );
  }, [currentPage, filteredServices, itemsPerPage]);

  const showingFrom =
    filteredServices.length === 0
      ? 0
      : (currentPage - 1) * itemsPerPage + 1;

  const showingTo = Math.min(
    currentPage * itemsPerPage,
    filteredServices.length,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const resetForm = () => {
    setForm(initialForm);
    setFormErrors({});
    setSelectedImage(null);
    setImagePreview("");
    setIsDragging(false);
  };

  const handleOpenAddModal = () => {
    setFormMode("add");
    setSelectedService(null);
    resetForm();
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (service: Service) => {
    setFormMode("edit");
    setSelectedService(service);

    setForm({
      title: service.title,
      description: service.description,
      price: String(service.price),
      feature1: service.features[0] ?? "",
      feature2: service.features[1] ?? "",
    });

    setSelectedImage(null);
    setImagePreview(getBase64ImageSource(service.image));
    setFormErrors({});
    setIsFormModalOpen(true);
    setOpenMenuId(null);
  };

  const handleOpenViewModal = (service: Service) => {
    setSelectedService(service);
    setIsViewModalOpen(true);
    setOpenMenuId(null);
  };

  const handleOpenDeleteModal = (service: Service) => {
    setSelectedService(service);
    setIsDeleteModalOpen(true);
    setOpenMenuId(null);
  };

  const handleCloseFormModal = () => {
    if (isSubmitting) return;

    setIsFormModalOpen(false);
    setSelectedService(null);
    resetForm();
  };

  const handleFormChange = (
    field: keyof ServiceForm,
    value: string,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (formErrors[field]) {
      setFormErrors((previous) => ({
        ...previous,
        [field]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const errors: FormErrors = {};

    if (!form.title.trim()) {
      errors.title = "Service title is required.";
    } else if (form.title.trim().length < 3) {
      errors.title = "Title must contain at least 3 characters.";
    }

    if (!form.description.trim()) {
      errors.description = "Description is required.";
    } else if (form.description.trim().length < 10) {
      errors.description =
        "Description must contain at least 10 characters.";
    }

    const price = Number(form.price);

    if (!form.price.trim()) {
      errors.price = "Price is required.";
    } else if (Number.isNaN(price) || price <= 0) {
      errors.price = "Enter a valid price greater than zero.";
    }

    if (!form.feature1.trim()) {
      errors.feature1 = "Feature 1 is required.";
    }

    if (!form.feature2.trim()) {
      errors.feature2 = "Feature 2 is required.";
    }

    if (
      formMode === "add" &&
      !selectedImage &&
      !imagePreview
    ) {
      errors.image = "Service image is required.";
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const validateImage = (file: File) => {
    const acceptedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    const maxSize = 5 * 1024 * 1024;

    if (!acceptedTypes.includes(file.type)) {
      setFormErrors((previous) => ({
        ...previous,
        image: "Only PNG, JPG, JPEG or WEBP images are allowed.",
      }));

      return false;
    }

    if (file.size > maxSize) {
      setFormErrors((previous) => ({
        ...previous,
        image: "Image size must not exceed 5 MB.",
      }));

      return false;
    }

    return true;
  };

  const handleImageSelection = async (file: File | null) => {
    if (!file || !validateImage(file)) {
      return;
    }

    try {
      const base64Image = await fileToBase64(file);

      setSelectedImage(file);
      setImagePreview(base64Image);

      setFormErrors((previous) => ({
        ...previous,
        image: undefined,
      }));
    } catch (error) {
      console.error("Unable to convert image to Base64:", error);

      setSelectedImage(null);
      setImagePreview("");
      setFormErrors((previous) => ({
        ...previous,
        image: "Unable to process the selected image.",
      }));
    }
  };

  const handleFileInputChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;
    void handleImageSelection(file);

    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0] ?? null;
    void handleImageSelection(file);
  };

  const handleSubmitService = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const serviceData = {
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        image: imagePreview,
        features: [
          form.feature1.trim(),
          form.feature2.trim(),
        ],
        featuresText: [
          form.feature1.trim(),
          form.feature2.trim(),
        ].join(","),
      };

      /*
       Base64 JSON API example:

       const payload = {
         title: serviceData.title,
         description: serviceData.description,
         price: serviceData.price,
         image: serviceData.image,
         features: serviceData.featuresText,
       };

       if (formMode === "add") {
         await createCarwashService(payload);
       } else if (selectedService) {
         await updateCarwashService(selectedService.id, payload);
       }
      */

      await new Promise((resolve) => setTimeout(resolve, 700));

      if (formMode === "add") {
        const newService: Service = {
          id: crypto.randomUUID(),
          title: serviceData.title,
          description: serviceData.description,
          price: serviceData.price,
          image: serviceData.image,
          features: serviceData.features,
        };

        setServices((previous) => [
          newService,
          ...previous,
        ]);

        setPageAlert({
          visible: true,
          variant: "success",
          title: "Service added",
          description: `${serviceData.title} was added successfully.`,
        });
      } else if (selectedService) {
        setServices((previous) =>
          previous.map((service) =>
            service.id === selectedService.id
              ? {
                  ...service,
                  title: serviceData.title,
                  description: serviceData.description,
                  price: serviceData.price,
                  features: serviceData.features,
                  image: imagePreview || service.image,
                }
              : service,
          ),
        );

        setPageAlert({
          visible: true,
          variant: "success",
          title: "Service updated",
          description: `${serviceData.title} was updated successfully.`,
        });
      }

      handleCloseFormModal();
    } catch (error) {
      console.error("Unable to save service:", error);

      setPageAlert({
        visible: true,
        variant: "error",
        title: "Unable to save service",
        description:
          "An error occurred while saving the service.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async () => {
    if (!selectedService) return;

    try {
      setIsSubmitting(true);

      /*
       Replace with your API call:

       await deleteCarwashService(selectedService.id);
      */

      await new Promise((resolve) => setTimeout(resolve, 600));

      setServices((previous) =>
        previous.filter(
          (service) => service.id !== selectedService.id,
        ),
      );

      setPageAlert({
        visible: true,
        variant: "success",
        title: "Service deleted",
        description: `${selectedService.title} was deleted successfully.`,
      });

      setIsDeleteModalOpen(false);
      setSelectedService(null);
    } catch (error) {
      console.error("Unable to delete service:", error);

      setPageAlert({
        visible: true,
        variant: "error",
        title: "Unable to delete service",
        description:
          "An error occurred while deleting the service.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50/60">
      {pageAlert.visible && (
        <div className="fixed right-4 top-4 z-[99999] w-[calc(100%-2rem)] max-w-md">
          <CustomAlert
            alert={pageAlert}
            onClose={() =>
              setPageAlert((previous) => ({
                ...previous,
                visible: false,
              }))
            }
          />
        </div>
      )}

      {(isLoading || isSubmitting) &&
        createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/30 border-t-white" />

              <p className="text-sm font-medium text-white">
                {isSubmitting
                  ? "Processing..."
                  : "Loading services..."}
              </p>
            </div>
          </div>,
          document.body,
        )}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-900 text-white shadow-sm shadow-blue-900/20">
              <CarFront size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Car Wash Services
              </h1>

              <p className="text-sm text-slate-500">
                Manage service details, pricing, images and features.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={getCarwashServices}
              disabled={isLoading}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCcw
                size={16}
                className={isLoading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <Plus size={17} />
              Add Service
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SummaryCard
            title="Total Services"
            value={services.length}
            icon={<CarFront size={20} />}
            iconClassName="bg-blue-50 text-blue-900"
          />

          <SummaryCard
            title="Average Service Price"
            value={
              services.length > 0
                ? Math.round(
                    services.reduce(
                      (total, service) =>
                        total + service.price,
                      0,
                    ) / services.length,
                  )
                : 0
            }
            isPrice
            icon={<DollarSign size={20} />}
            iconClassName="bg-emerald-50 text-emerald-600"
          />
        </div>

        {/* Table card */}
        <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search
                size={18}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search title, description or price..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="text-sm text-slate-500">
              <span className="font-semibold text-slate-700">
                {filteredServices.length}
              </span>{" "}
              services
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-visible md:block">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Service
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Description
                  </th>

                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Price
                  </th>

                  <th className="w-20 px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {paginatedServices.length > 0 ? (
                  paginatedServices.map((service) => (
                    <tr
                      key={service.id}
                      className="transition hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                            {service.image ? (
                              <img
                                src={getBase64ImageSource(service.image)}
                                alt={service.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-slate-400">
                                <ImageIcon size={20} />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {service.title}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              Car wash service
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="max-w-md px-5 py-4">
                        <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                          {service.description}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                          {formatPrice(service.price)}
                        </span>
                      </td>

                      <td className="relative px-5 py-4">
                        <div
                          className="flex justify-end"
                          ref={
                            openMenuId === service.id
                              ? menuRef
                              : null
                          }
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId((previous) =>
                                previous === service.id
                                  ? null
                                  : service.id,
                              )
                            }
                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700"
                            aria-label={`Open actions for ${service.title}`}
                          >
                            <MoreVertical size={18} />
                          </button>

                          {openMenuId === service.id && (
                            <div className="absolute right-5 top-14 z-50 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenViewModal(service)
                                }
                                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                              >
                                <Eye size={16} />
                                View
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenEditModal(service)
                                }
                                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                              >
                                <Edit3 size={16} />
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleOpenDeleteModal(service)
                                }
                                className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                              >
                                <Trash2 size={16} />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-slate-100 md:hidden">
            {paginatedServices.length > 0 ? (
              paginatedServices.map((service) => (
                <article key={service.id} className="p-4">
                  <div className="mb-4 flex items-start gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                      {service.image ? (
                        <img
                          src={getBase64ImageSource(service.image)}
                          alt={service.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <ImageIcon size={22} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-slate-900">
                        {service.title}
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-emerald-600">
                        {formatPrice(service.price)}
                      </p>
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenuId((previous) =>
                            previous === service.id
                              ? null
                              : service.id,
                          )
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openMenuId === service.id && (
                        <div className="absolute right-0 top-11 z-50 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenViewModal(service)
                            }
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Eye size={16} />
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleOpenEditModal(service)
                            }
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Edit3 size={16} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleOpenDeleteModal(service)
                            }
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                    {service.description}
                  </p>
                </article>
              ))
            ) : (
              <EmptyState />
            )}
          </div>

          {/* Pagination */}
          {!isLoading && filteredServices.length > 0 && (
            <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {showingFrom}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-700">
                    {showingTo}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredServices.length}
                  </span>{" "}
                  services
                </p>

                <div className="flex items-center gap-2">
                  <label
                    htmlFor="service-items-per-page"
                    className="text-xs font-medium text-slate-500"
                  >
                    Rows:
                  </label>

                  <select
                    id="service-items-per-page"
                    value={itemsPerPage}
                    onChange={(event) => {
                      setItemsPerPage(
                        Number(event.target.value),
                      );
                      setCurrentPage(1);
                    }}
                    className="h-9 cursor-pointer rounded-lg border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((previous) =>
                      Math.max(previous - 1, 1),
                    )
                  }
                  disabled={currentPage === 1}
                  className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>

                <span className="text-sm font-semibold text-slate-600">
                  {currentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((previous) =>
                      Math.min(previous + 1, totalPages),
                    )
                  }
                  disabled={currentPage === totalPages}
                  className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {isViewModalOpen && selectedService && (
        <ViewServiceModal
          service={selectedService}
          formatPrice={formatPrice}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedService(null);
          }}
        />
      )}

      {isFormModalOpen && (
        <ServiceFormModal
          mode={formMode}
          form={form}
          errors={formErrors}
          imagePreview={imagePreview}
          isDragging={isDragging}
          isSubmitting={isSubmitting}
          onChange={handleFormChange}
          onFileChange={handleFileInputChange}
          onDrop={handleDrop}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onRemoveImage={() => {
            setSelectedImage(null);
            setImagePreview("");
          }}
          onClose={handleCloseFormModal}
          onSubmit={handleSubmitService}
        />
      )}

      {isDeleteModalOpen && selectedService && (
        <DeleteServiceModal
          service={selectedService}
          isSubmitting={isSubmitting}
          onClose={() => {
            if (isSubmitting) return;

            setIsDeleteModalOpen(false);
            setSelectedService(null);
          }}
          onDelete={handleDeleteService}
        />
      )}
    </main>
  );
}

type ServiceFormModalProps = {
  mode: "add" | "edit";
  form: ServiceForm;
  errors: FormErrors;
  imagePreview: string;
  isDragging: boolean;
  isSubmitting: boolean;
  onChange: (
    field: keyof ServiceForm,
    value: string,
  ) => void;
  onFileChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onRemoveImage: () => void;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

function ServiceFormModal({
  mode,
  form,
  errors,
  imagePreview,
  isDragging,
  isSubmitting,
  onChange,
  onFileChange,
  onDrop,
  onDragOver,
  onDragLeave,
  onRemoveImage,
  onClose,
  onSubmit,
}: ServiceFormModalProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-900 text-white">
              {mode === "add" ? (
                <Plus size={21} />
              ) : (
                <Edit3 size={20} />
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                {mode === "add"
                  ? "Add Car Wash Service"
                  : "Edit Car Wash Service"}
              </h2>

              <p className="text-sm text-slate-500">
                Add service information, features and one image.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="overflow-y-auto px-5 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_250px]">
              <div className="space-y-4">
                <FormField
                  label="Service Title"
                  value={form.title}
                  placeholder="Enter service title"
                  required
                  error={errors.title}
                  onChange={(value) =>
                    onChange("title", value)
                  }
                />

                <FormTextArea
                  label="Description"
                  value={form.description}
                  placeholder="Enter service description"
                  required
                  error={errors.description}
                  onChange={(value) =>
                    onChange("description", value)
                  }
                />

                <FormField
                  label="Price"
                  value={form.price}
                  placeholder="Enter price"
                  type="number"
                  required
                  error={errors.price}
                  onChange={(value) =>
                    onChange("price", value)
                  }
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    label="Feature 1"
                    value={form.feature1}
                    placeholder="Enter first feature"
                    required
                    error={errors.feature1}
                    onChange={(value) =>
                      onChange("feature1", value)
                    }
                  />

                  <FormField
                    label="Feature 2"
                    value={form.feature2}
                    placeholder="Enter second feature"
                    required
                    error={errors.feature2}
                    onChange={(value) =>
                      onChange("feature2", value)
                    }
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Service Image
                  <span className="ml-1 text-red-500">*</span>
                </label>

                {imagePreview ? (
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                    <img
                      src={imagePreview}
                      alt="Service preview"
                      className="h-56 w-full object-cover"
                    />

                    <div className="flex gap-2 border-t border-slate-200 bg-white p-3">
                      <label className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                        <UploadCloud size={15} />
                        Replace

                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={onFileChange}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={onRemoveImage}
                        className="flex h-9 w-9 items-center cursor-pointer justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    className={`flex min-h-56 flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition ${
                      isDragging
                        ? "border-blue-500 bg-blue-50"
                        : errors.image
                          ? "border-red-300 bg-red-50/30"
                          : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40"
                    }`}
                  >
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-900">
                      <UploadCloud size={23} />
                    </div>

                    <p className="text-sm font-semibold text-slate-800">
                      Drag and drop image
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      PNG, JPG, JPEG or WEBP
                      <br />
                      Maximum size 5 MB
                    </p>

                    <label className="mt-4 inline-flex h-9 cursor-pointer items-center justify-center rounded-lg bg-blue-900 px-4 text-xs font-semibold text-white transition hover:bg-blue-700">
                      Browse Image

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={onFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}

                {errors.image && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.image}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitting ? (
                <>
                  <Loader2
                    size={17}
                    className="animate-spin"
                  />
                  Saving
                </>
              ) : (
                <>
                  {mode === "add" ? (
                    <Plus size={17} />
                  ) : (
                    <Check size={17} />
                  )}
                  {mode === "add"
                    ? "Add Service"
                    : "Save Changes"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}

type ViewServiceModalProps = {
  service: Service;
  formatPrice: (price: number) => string;
  onClose: () => void;
};

function ViewServiceModal({
  service,
  formatPrice,
  onClose,
}: ViewServiceModalProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-900 text-white">
              <Eye size={21} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Service Details
              </h2>

              <p className="text-sm text-slate-500">
                View full car wash service information.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[72vh] overflow-y-auto p-5 sm:p-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
            {service.image ? (
              <img
                src={getBase64ImageSource(service.image)}
                alt={service.title}
                className="h-64 w-full object-cover"
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-slate-400">
                <ImageIcon size={38} />
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                {service.title}
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-600">
                {service.description}
              </p>
            </div>

            <span className="shrink-0 rounded-xl bg-emerald-50 px-4 py-2 text-base font-bold text-emerald-700">
              {formatPrice(service.price)}
            </span>
          </div>

          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles
                size={18}
                className="text-blue-900"
              />

              <h4 className="font-bold text-slate-900">
                Service Features
              </h4>
            </div>

            <div className="space-y-3">
              {service.features.map((feature, index) => (
                <div
                  key={`${feature}-${index}`}
                  className="flex items-start gap-3"
                >
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-900 text-white">
                    <Check size={13} />
                  </div>

                  <p className="text-sm leading-6 text-slate-700">
                    {feature}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

type DeleteServiceModalProps = {
  service: Service;
  isSubmitting: boolean;
  onClose: () => void;
  onDelete: () => void;
};

function DeleteServiceModal({
  service,
  isSubmitting,
  onClose,
  onDelete,
}: DeleteServiceModalProps) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <Trash2 size={25} />
        </div>

        <div className="mt-4 text-center">
          <h2 className="text-xl font-bold text-slate-900">
            Delete Service
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-slate-800">
              {service.title}
            </span>
            ? This action cannot be undone.
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="inline-flex h-11 cursor-pointer flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={isSubmitting}
            className="inline-flex h-11 cursor-pointer flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:bg-red-300"
          >
            {isSubmitting ? (
              <>
                <Loader2
                  size={16}
                  className="animate-spin"
                />
                Deleting
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

type FormFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  error?: string;
  required?: boolean;
  type?: "text" | "number";
  onChange: (value: string) => void;
};

function FormField({
  label,
  value,
  placeholder,
  error,
  required,
  type = "text",
  onChange,
}: FormFieldProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <input
        type={type}
        value={value}
        min={type === "number" ? 1 : undefined}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
            : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
        }`}
      />

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

type FormTextAreaProps = {
  label: string;
  value: string;
  placeholder: string;
  error?: string;
  required?: boolean;
  onChange: (value: string) => void;
};

function FormTextArea({
  label,
  value,
  placeholder,
  error,
  required,
  onChange,
}: FormTextAreaProps) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <textarea
        rows={5}
        value={value}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={`w-full resize-none rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-100"
            : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
        }`}
      />

      {error && (
        <p className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

type SummaryCardProps = {
  title: string;
  value: number;
  icon: ReactNode;
  iconClassName: string;
  isPrice?: boolean;
};

function SummaryCard({
  title,
  value,
  icon,
  iconClassName,
  isPrice,
}: SummaryCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
      >
        {icon}
      </div>

      <div>
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        <p className="mt-0.5 text-2xl font-bold text-slate-900">
          {isPrice
            ? `LKR ${value.toLocaleString()}`
            : value}
        </p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <CarFront size={26} />
      </div>

      <h3 className="font-semibold text-slate-900">
        No services found
      </h3>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        No services match the current search, or no car wash
        services have been created yet.
      </p>
    </div>
  );
}

type CustomAlertProps = {
  alert: AlertState;
  onClose: () => void;
};

function CustomAlert({
  alert,
  onClose,
}: CustomAlertProps) {
  const styles = {
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-red-200 bg-red-50 text-red-800",
    warning:
      "border-amber-200 bg-amber-50 text-amber-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 shadow-lg ${styles[alert.variant]}`}
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

      <div className="min-w-0 flex-1">
        <p className="font-semibold">{alert.title}</p>

        <p className="mt-1 text-sm opacity-80">
          {alert.description}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-lg p-1 transition hover:bg-black/5"
      >
        <X size={17} />
      </button>
    </div>
  );
}