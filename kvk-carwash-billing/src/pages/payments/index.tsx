import { getAllCarPackages } from "@/services/carwash-packages-api";
import { pay } from "@/services/payments-api";

import {
  BadgePercent,
  Banknote,
  CarFront,
  Check,
  ChevronDown,
  CreditCard,
  Info,
  Loader2,
  Package,
  Plus,
  RefreshCcw,
  Search,
  ShoppingCart,
  Sparkles,
  User,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { createPortal } from "react-dom";

/* =========================================================
   Types
   ========================================================= */

type CarService = {
  id: string;
  title: string;
  durationInMinutes: number;
  serviceCategory: number;
  description: string;
  price: number;
  features: string;
};

type CarPackage = {
  id: string;
  title: string;
  description: string;
  durationInMinutes: number;
  basPrice: number;
  pricesWithoutDiscounts: number;
  isActive: boolean;
  services: CarService[];
};

type PackagesResponse = {
  allServices: CarService[];
  packagesWithServices: CarPackage[];
};

type PaymentForm = {
  customerName: string;
  customerPhone: string;
  vehicleType: string;
  VehicleNumber: string;
  discount: string;
  paymentMethod: 1 | 2;
};

type SelectedItem =
  | {
      id: string;
      type: "package";
      title: string;
      price: number;
    }
  | {
      id: string;
      type: "service";
      title: string;
      price: number;
    };

type AlertState = {
  visible: boolean;
  variant: "success" | "error" | "warning" | "info";
  title: string;
  description: string;
};

/* =========================================================
   Initial Form
   ========================================================= */

const initialForm: PaymentForm = {
  customerName: "",
  customerPhone: "",
  vehicleType: "",
  VehicleNumber: "",
  discount: "0",

  // 1 = Card
  // 2 = Cash
  paymentMethod: 2,
};

export default function Payments() {
  const [packages, setPackages] = useState<CarPackage[]>([]);
  const [services, setServices] = useState<CarService[]>([]);

  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const [form, setForm] = useState<PaymentForm>(initialForm);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectorSearch, setSelectorSearch] = useState("");

  /* Package information modal */
  const [selectedInfoPackage, setSelectedInfoPackage] =
    useState<CarPackage | null>(null);

  const [pageAlert, setPageAlert] = useState<AlertState>({
    visible: false,
    variant: "success",
    title: "",
    description: "",
  });

  const selectorRef = useRef<HTMLDivElement | null>(null);

  /* =========================================================
     Load packages + services
     ========================================================= */

  const getAllPackages = async () => {
    try {
      setIsLoading(true);

      const res: PackagesResponse = await getAllCarPackages();

      setPackages(
        Array.isArray(res?.packagesWithServices)
          ? res.packagesWithServices
          : [],
      );

      setServices(Array.isArray(res?.allServices) ? res.allServices : []);
    } catch (error) {
      console.error("Error fetching packages:", error);

      setPackages([]);
      setServices([]);

      setPageAlert({
        visible: true,
        variant: "error",
        title: "Unable to load data",
        description:
          "An error occurred while loading car wash packages and services.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void getAllPackages();
  }, []);

    useEffect(() => {
  if (!pageAlert.visible) return;

  const timer = setTimeout(() => {
    setPageAlert((prev) => ({
      ...prev,
      visible: false,
    }));
  }, 2000);

  return () => clearTimeout(timer);
}, [pageAlert.visible]);

  /* =========================================================
     Close selector dropdown
     ========================================================= */

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        selectorRef.current &&
        !selectorRef.current.contains(event.target as Node)
      ) {
        setIsSelectorOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  /* =========================================================
     Currency
     ========================================================= */

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  /* =========================================================
     Selected Packages
     ========================================================= */

  const selectedPackages = useMemo(() => {
    return packages.filter((item) => selectedPackageIds.includes(item.id));
  }, [packages, selectedPackageIds]);

  /* =========================================================
     Selected Services
     ========================================================= */

  const selectedServices = useMemo(() => {
    return services.filter((item) => selectedServiceIds.includes(item.id));
  }, [services, selectedServiceIds]);

  /* =========================================================
     Selected Items
     ========================================================= */

  const selectedItems: SelectedItem[] = useMemo(() => {
    const packageItems: SelectedItem[] = selectedPackages.map((item) => ({
      id: item.id,
      type: "package",
      title: item.title,
      price: item.basPrice,
    }));

    const serviceItems: SelectedItem[] = selectedServices.map((item) => ({
      id: item.id,
      type: "service",
      title: item.title,
      price: item.price,
    }));

    return [...packageItems, ...serviceItems];
  }, [selectedPackages, selectedServices]);

  /* =========================================================
     Totals
     ========================================================= */

  const packageTotal = useMemo(() => {
    return selectedPackages.reduce(
      (total, currentPackage) => total + currentPackage.basPrice,
      0,
    );
  }, [selectedPackages]);

  const serviceTotal = useMemo(() => {
    return selectedServices.reduce(
      (total, currentService) => total + currentService.price,
      0,
    );
  }, [selectedServices]);

  const subTotal = packageTotal + serviceTotal;

  const discount = Math.max(Number(form.discount) || 0, 0);

  const discountedTotal = Math.max(subTotal - discount, 0);

  /* =========================================================
     Filter Packages
     ========================================================= */

  const filteredPackages = useMemo(() => {
    const search = selectorSearch.trim().toLowerCase();

    const activePackages = packages.filter((item) => item.isActive);

    if (!search) {
      return activePackages;
    }

    return activePackages.filter((item) => {
      const serviceNames = item.services
        .map((service) => service.title)
        .join(" ")
        .toLowerCase();

      return (
        item.title.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search) ||
        serviceNames.includes(search)
      );
    });
  }, [packages, selectorSearch]);

  /* =========================================================
     Filter Services
     ========================================================= */

  const filteredServices = useMemo(() => {
    const search = selectorSearch.trim().toLowerCase();

    if (!search) {
      return services;
    }

    return services.filter((item) => {
      return (
        item.title.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search)
      );
    });
  }, [services, selectorSearch]);

  /* =========================================================
     Toggle Package
     ========================================================= */

  const togglePackage = (id: string) => {
    setSelectedPackageIds((previous) => {
      if (previous.includes(id)) {
        return previous.filter((item) => item !== id);
      }

      return [...previous, id];
    });
  };

  /* =========================================================
     Toggle Service
     ========================================================= */

  const toggleService = (id: string) => {
    setSelectedServiceIds((previous) => {
      if (previous.includes(id)) {
        return previous.filter((item) => item !== id);
      }

      return [...previous, id];
    });
  };

  /* =========================================================
     Remove Selected Item
     ========================================================= */

  const removeSelectedItem = (item: SelectedItem) => {
    if (item.type === "package") {
      setSelectedPackageIds((previous) =>
        previous.filter((id) => id !== item.id),
      );

      return;
    }

    setSelectedServiceIds((previous) =>
      previous.filter((id) => id !== item.id),
    );
  };

  /* =========================================================
     Clear Selection
     ========================================================= */

  const clearSelection = () => {
    setSelectedPackageIds([]);
    setSelectedServiceIds([]);
  };

  /* =========================================================
     Form Change
     ========================================================= */

  const handleChange = (
    field: keyof PaymentForm,
    value: string | 1 | 2,
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /* =========================================================
     Reset Form
     ========================================================= */

  const resetPaymentForm = () => {
    setForm(initialForm);

    setSelectedPackageIds([]);
    setSelectedServiceIds([]);

    setSelectorSearch("");
    setIsSelectorOpen(false);
  };

  /* =========================================================
     Handle Pay
     ========================================================= */

  const handlePay = async (paymentData: FormData) => {
    try {
      setIsSubmitting(true);

      const response = await pay(paymentData);

      console.log("Payment response:", response);

      setPageAlert({
        visible: true,
        variant: "success",
        title: "Payment successful",
        description: "The car wash payment was added successfully.",
      });

      resetPaymentForm();

      return response;
    } catch (error) {
      console.error("Error creating payment:", error);

      setPageAlert({
        visible: true,
        variant: "error",
        title: "Payment failed",
        description: "Unable to create the payment. Please try again.",
      });

      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =========================================================
     Submit
     ========================================================= */

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      selectedPackageIds.length === 0 &&
      selectedServiceIds.length === 0
    ) {
      setPageAlert({
        visible: true,
        variant: "warning",
        title: "Select an item",
        description: "Please select at least one package or service.",
      });

      return;
    }

    if (subTotal <= 0) {
      setPageAlert({
        visible: true,
        variant: "warning",
        title: "Invalid subtotal",
        description: "The order subtotal must be greater than zero.",
      });

      return;
    }

    if (discount > subTotal) {
      setPageAlert({
        visible: true,
        variant: "warning",
        title: "Invalid discount",
        description: "Discount cannot be greater than the subtotal.",
      });

      return;
    }

    const payload = new FormData();

    /* Customer */

    payload.append("CustomerName", form.customerName.trim());

    payload.append("CustomerPhone", form.customerPhone.trim());

    /* Vehicle */

    if (form.vehicleType) {
      payload.append("VehicleType", form.vehicleType);
    }

    payload.append("VehicleNumber", form.VehicleNumber.trim());

    /* Amounts */

    payload.append("SubTotalAmount", String(subTotal));

    payload.append("Discount", String(discount));

    payload.append("DiscountedTotalAmount", String(discountedTotal));

    /* Payment */

    payload.append("IsPaid", "true");

    // 1 = Card
    // 2 = Cash
    payload.append("PaymentMethod", String(form.paymentMethod));

    payload.append("CarWashOrderStatus", "1");

    /* Package IDs */

    selectedPackageIds.forEach((id) => {
      payload.append("PackageIds", id);
    });

    /* Service IDs */

    selectedServiceIds.forEach((id) => {
      payload.append("ServicesIds", id);
    });

    console.log("Payment request:");

    for (const [key, value] of payload.entries()) {
      console.log(`${key}:`, value);
    }

    await handlePay(payload);
  };

  return (
    <main className="min-h-screen bg-slate-50/60">
      {/* =====================================================
          Alert
          ===================================================== */}

      {pageAlert.visible &&
        createPortal(
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
          </div>,
          document.body,
        )}

      {/* =====================================================
          Loading
          ===================================================== */}

      {(isLoading || isSubmitting) &&
        createPortal(
          <div className="fixed inset-0 z-[99998] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/30 border-t-white" />

              <p className="text-sm font-medium text-white">
                {isSubmitting
                  ? "Processing payment..."
                  : "Loading packages..."}
              </p>
            </div>
          </div>,
          document.body,
        )}

      {/* =====================================================
          Package Info Modal
          ===================================================== */}

      {selectedInfoPackage && (
        <PackageInfoModal
          packageItem={selectedInfoPackage}
          formatPrice={formatPrice}
          onClose={() => setSelectedInfoPackage(null)}
        />
      )}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* =====================================================
            Header
            ===================================================== */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-900 text-white shadow-sm shadow-blue-900/20">
              <Banknote size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Add Car Wash Payment
              </h1>

              <p className="text-sm text-slate-500">
                Create a customer order and process payment.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={getAllPackages}
            disabled={isLoading || isSubmitting}
            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-900 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw
              size={16}
              className={isLoading ? "animate-spin" : ""}
            />

            Refresh
          </button>
        </div>

        {/* =====================================================
            Summary
            ===================================================== */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Selected Items"
            value={String(selectedItems.length)}
            icon={<ShoppingCart size={20} />}
            iconClassName="bg-blue-50 text-blue-900"
          />

          <SummaryCard
            title="Subtotal"
            value={formatPrice(subTotal)}
            icon={<Banknote size={20} />}
            iconClassName="bg-emerald-50 text-emerald-600"
          />

          <SummaryCard
            title="Final Amount"
            value={formatPrice(discountedTotal)}
            icon={<Sparkles size={20} />}
            iconClassName="bg-violet-50 text-violet-600"
          />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
            {/* =================================================
                LEFT
                ================================================= */}

            <div className="space-y-6">
              {/* =================================================
                  Packages + Services
                  ================================================= */}

              <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-sm">
                <SectionHeader
                  icon={<Package size={19} />}
                  title="Packages & Services"
                  description="Select one or multiple packages and individual services."
                />

                <div className="p-5">
                  <div className="relative" ref={selectorRef}>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Select Items
                      <span className="ml-1 text-red-500">*</span>
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setIsSelectorOpen((previous) => !previous)
                      }
                      className={`flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border bg-white px-3.5 py-2.5 text-left transition ${
                        isSelectorOpen
                          ? "border-blue-500 ring-4 ring-blue-100"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span
                        className={
                          selectedItems.length > 0
                            ? "text-sm font-medium text-slate-800"
                            : "text-sm text-slate-400"
                        }
                      >
                        {selectedItems.length > 0
                          ? `${selectedItems.length} item${
                              selectedItems.length > 1 ? "s" : ""
                            } selected`
                          : "Select packages or services"}
                      </span>

                      <ChevronDown
                        size={18}
                        className={`shrink-0 text-slate-400 transition ${
                          isSelectorOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* =================================================
                        Selector Dropdown
                        ================================================= */}

                    {isSelectorOpen && (
                      <div className="absolute left-0 right-0 top-[76px] z-[100] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                        {/* Search */}

                        <div className="border-b border-slate-200 p-3">
                          <div className="relative">
                            <Search
                              size={17}
                              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                              type="text"
                              value={selectorSearch}
                              onChange={(event) =>
                                setSelectorSearch(event.target.value)
                              }
                              placeholder="Search packages or services..."
                              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                            />
                          </div>
                        </div>

                        <div className="max-h-[430px] overflow-y-auto">
                          {/* =================================================
                              Packages
                              ================================================= */}

                          <div className="border-b border-slate-100">
                            <div className="sticky top-0 z-10 flex items-center justify-between bg-slate-50 px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <Package
                                  size={15}
                                  className="text-blue-900"
                                />

                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                  Packages
                                </span>
                              </div>

                              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-900">
                                {filteredPackages.length}
                              </span>
                            </div>

                            {filteredPackages.length > 0 ? (
                              filteredPackages.map((item) => {
                                const selected =
                                  selectedPackageIds.includes(item.id);

                                return (
                                  <PackageSelectorItem
                                    key={item.id}
                                    item={item}
                                    selected={selected}
                                    formatPrice={formatPrice}
                                    onSelect={() =>
                                      togglePackage(item.id)
                                    }
                                    onInfo={() =>
                                      setSelectedInfoPackage(item)
                                    }
                                  />
                                );
                              })
                            ) : (
                              <DropdownEmpty text="No packages found." />
                            )}
                          </div>

                          {/* =================================================
                              Services
                              ================================================= */}

                          <div>
                            <div className="sticky top-0 z-10 flex items-center justify-between bg-slate-50 px-4 py-2.5">
                              <div className="flex items-center gap-2">
                                <CarFront
                                  size={15}
                                  className="text-blue-900"
                                />

                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                  Individual Services
                                </span>
                              </div>

                              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                {filteredServices.length}
                              </span>
                            </div>

                            {filteredServices.length > 0 ? (
                              filteredServices.map((item) => {
                                const selected =
                                  selectedServiceIds.includes(item.id);

                                return (
                                  <SelectorItem
                                    key={item.id}
                                    title={item.title}
                                    description={item.description}
                                    price={formatPrice(item.price)}
                                    selected={selected}
                                    onClick={() =>
                                      toggleService(item.id)
                                    }
                                  />
                                );
                              })
                            ) : (
                              <DropdownEmpty text="No services found." />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* =================================================
                      Selected Items
                      ================================================= */}

                  {selectedItems.length > 0 ? (
                    <div className="mt-5">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-700">
                          Selected Items
                        </p>

                        <button
                          type="button"
                          onClick={clearSelection}
                          className="cursor-pointer text-xs font-semibold text-red-600 transition hover:text-red-700"
                        >
                          Clear all
                        </button>
                      </div>

                      <div className="space-y-2">
                        {selectedItems.map((item) => {
                          const selectedPackage =
                            item.type === "package"
                              ? packages.find(
                                  (currentPackage) =>
                                    currentPackage.id === item.id,
                                )
                              : undefined;

                          return (
                            <div
                              key={`${item.type}-${item.id}`}
                              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <div
                                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                    item.type === "package"
                                      ? "bg-blue-100 text-blue-900"
                                      : "bg-slate-200 text-slate-600"
                                  }`}
                                >
                                  {item.type === "package" ? (
                                    <Package size={17} />
                                  ) : (
                                    <CarFront size={17} />
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="truncate text-sm font-semibold text-slate-800">
                                      {item.title}
                                    </p>

                                    {selectedPackage && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setSelectedInfoPackage(
                                            selectedPackage,
                                          )
                                        }
                                        title="View package details"
                                        className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-blue-700 transition hover:bg-blue-100"
                                      >
                                        <Info size={14} />
                                      </button>
                                    )}
                                  </div>

                                  <p className="mt-0.5 text-xs capitalize text-slate-500">
                                    {item.type === "package"
                                      ? `${selectedPackage?.services.length ?? 0} included services`
                                      : "Individual service"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center gap-3">
                                <span className="text-sm font-bold text-emerald-600">
                                  {formatPrice(item.price)}
                                </span>

                                <button
                                  type="button"
                                  onClick={() =>
                                    removeSelectedItem(item)
                                  }
                                  aria-label={`Remove ${item.title}`}
                                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-200 text-slate-500">
                        <ShoppingCart size={20} />
                      </div>

                      <p className="text-sm font-semibold text-slate-700">
                        No items selected
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Select packages or services from the dropdown.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* =================================================
                  Customer
                  ================================================= */}

              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <SectionHeader
                  icon={<User size={19} />}
                  title="Customer Details"
                  description="Optional customer and vehicle information."
                />

                <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                  <InputField
                    label="Customer Name"
                    value={form.customerName}
                    placeholder="Enter customer name"
                    onChange={(value) =>
                      handleChange("customerName", value)
                    }
                  />

                  <InputField
                    label="Customer Phone"
                    value={form.customerPhone}
                    placeholder="Enter phone number"
                    onChange={(value) =>
                      handleChange("customerPhone", value)
                    }
                  />

                  <InputField
                    label="Vehicle Type"
                    value={form.vehicleType}
                    type="number"
                    placeholder="Enter vehicle type"
                    onChange={(value) =>
                      handleChange("vehicleType", value)
                    }
                  />

                  <InputField
                    label="Vehicle No"
                    value={form.VehicleNumber}
                    placeholder="Example: CAB-1234"
                    onChange={(value) =>
                      handleChange("VehicleNumber", value)
                    }
                  />
                </div>
              </section>
            </div>

            {/* =================================================
                RIGHT PAYMENT
                ================================================= */}

            <div>
              <section className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-6">
                <SectionHeader
                  icon={<CreditCard size={19} />}
                  title="Payment"
                  description="Review order totals and payment method."
                />

                <div className="p-5">
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Payment Method
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <PaymentMethodCard
                      title="Cash"
                      description="Cash payment"
                      icon={<Banknote size={20} />}
                      selected={form.paymentMethod === 2}
                      onClick={() =>
                        handleChange("paymentMethod", 2)
                      }
                    />

                    <PaymentMethodCard
                      title="Card"
                      description="Card payment"
                      icon={<CreditCard size={20} />}
                      selected={form.paymentMethod === 1}
                      onClick={() =>
                        handleChange("paymentMethod", 1)
                      }
                    />
                  </div>

                  <div className="my-5 border-t border-slate-200" />

                  <div className="space-y-3">
                    <PriceRow
                      title="Packages"
                      value={formatPrice(packageTotal)}
                    />

                    <PriceRow
                      title="Individual Services"
                      value={formatPrice(serviceTotal)}
                    />

                    <PriceRow
                      title="Subtotal"
                      value={formatPrice(subTotal)}
                      strong
                    />
                  </div>

                  {/* Discount */}

                  <div className="mt-5">
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Discount
                    </label>

                    <div className="relative">
                      <BadgePercent
                        size={17}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        type="number"
                        value={form.discount}
                        min={0}
                        max={subTotal}
                        onChange={(event) =>
                          handleChange("discount", event.target.value)
                        }
                        placeholder="0"
                        className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-14 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />

                      <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                        LKR
                      </span>
                    </div>
                  </div>

                  {/* Final */}

                  <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-emerald-800">
                        Total Payable
                      </span>

                      <Sparkles
                        size={18}
                        className="text-emerald-600"
                      />
                    </div>

                    <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-700">
                      {formatPrice(discountedTotal)}
                    </p>

                    {discount > 0 && (
                      <p className="mt-1 text-xs font-medium text-emerald-600">
                        Additional discount: {formatPrice(discount)}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      isLoading ||
                      selectedItems.length === 0
                    }
                    className="mt-5 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        Add Payment
                      </>
                    )}
                  </button>

                  <p className="mt-3 text-center text-xs leading-5 text-slate-400">
                    Review the selected packages, services and total before
                    submitting the payment.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

/* =========================================================
   Package Selector Item
   ========================================================= */

function PackageSelectorItem({
  item,
  selected,
  formatPrice,
  onSelect,
  onInfo,
}: {
  item: CarPackage;
  selected: boolean;
  formatPrice: (price: number) => string;
  onSelect: () => void;
  onInfo: () => void;
}) {
  const savings = Math.max(
    item.pricesWithoutDiscounts - item.basPrice,
    0,
  );

  return (
    <div
      className={`flex items-center gap-3 border-b border-slate-100 px-4 py-3 transition last:border-b-0 ${
        selected ? "bg-blue-50/70" : "hover:bg-slate-50"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
      >
        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
            selected
              ? "border-blue-900 bg-blue-900 text-white"
              : "border-slate-300 bg-white"
          }`}
        >
          {selected && <Check size={13} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-800">
              {item.title}
            </p>

            {savings > 0 && (
              <span className="hidden shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 sm:inline-flex">
                Save {formatPrice(savings)}
              </span>
            )}
          </div>

          <p className="mt-0.5 text-xs text-slate-500">
            {item.services.length} included service
            {item.services.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-emerald-600">
            {formatPrice(item.basPrice)}
          </p>

          {item.pricesWithoutDiscounts > item.basPrice && (
            <p className="text-[11px] text-slate-400 line-through">
              {formatPrice(item.pricesWithoutDiscounts)}
            </p>
          )}
        </div>
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onInfo();
        }}
        title="View included services"
        aria-label={`View ${item.title} package details`}
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-blue-900 transition hover:border-blue-300 hover:bg-blue-100"
      >
        <Info size={17} />
      </button>
    </div>
  );
}

/* =========================================================
   Package Info Modal
   ========================================================= */

function PackageInfoModal({
  packageItem,
  formatPrice,
  onClose,
}: {
  packageItem: CarPackage;
  formatPrice: (price: number) => string;
  onClose: () => void;
}) {
  const calculatedNormalPrice = packageItem.services.reduce(
    (total, service) => total + service.price,
    0,
  );

  const normalPrice =
    packageItem.pricesWithoutDiscounts > 0
      ? packageItem.pricesWithoutDiscounts
      : calculatedNormalPrice;

  const savings = Math.max(normalPrice - packageItem.basPrice, 0);

  const savingPercentage =
    normalPrice > 0
      ? Math.round((savings / normalPrice) * 100)
      : 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Header */}

        <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-900 text-white">
              <Package size={21} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                  {packageItem.title}
                </h2>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                  Active
                </span>
              </div>

              <p className="mt-0.5 text-sm text-slate-500">
                Package information and included services.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {/* Description */}

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              About this package
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {packageItem.description ||
                "No description has been provided for this package."}
            </p>
          </div>

          {/* Pricing */}

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-medium text-slate-500">
                Separate Price
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {formatPrice(normalPrice)}
              </p>

              <p className="mt-1 text-[11px] text-slate-400">
                Buying services separately
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
              <p className="text-xs font-medium text-blue-700">
                Package Price
              </p>

              <p className="mt-1 text-lg font-bold text-blue-900">
                {formatPrice(packageItem.basPrice)}
              </p>

              <p className="mt-1 text-[11px] text-blue-600">
                Customer package price
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-emerald-700">
                  Savings
                </p>

                {savingPercentage > 0 && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                    {savingPercentage}%
                  </span>
                )}
              </div>

              <p className="mt-1 text-lg font-bold text-emerald-700">
                {formatPrice(savings)}
              </p>

              <p className="mt-1 text-[11px] text-emerald-600">
                Total package saving
              </p>
            </div>
          </div>

          {/* Included Services */}

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900">
                  Included Services
                </h3>

                <p className="mt-0.5 text-xs text-slate-500">
                  All services included with this package.
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-900">
                {packageItem.services.length} Service
                {packageItem.services.length !== 1 ? "s" : ""}
              </span>
            </div>

            {packageItem.services.length > 0 ? (
              <div className="space-y-3">
                {packageItem.services.map((service, index) => (
                  <div
                    key={service.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-900">
                          {index + 1}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-900">
                              {service.title}
                            </p>

                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              <Check size={10} />
                              Included
                            </span>
                          </div>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {service.description ||
                              "No service description available."}
                          </p>

                          {service.durationInMinutes > 0 && (
                            <p className="mt-2 text-[11px] font-medium text-slate-400">
                              Duration: {service.durationInMinutes} minutes
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
                          {formatPrice(service.price)}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-400">
                          Separate price
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-200 text-slate-400">
                  <CarFront size={23} />
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  No included services
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  This package does not currently contain any services.
                </p>
              </div>
            )}
          </div>

          {/* Package Saving */}

          {savings > 0 && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <BadgePercent size={20} />
              </div>

              <div>
                <p className="text-sm font-bold text-emerald-800">
                  Better Value as a Package
                </p>

                <p className="mt-1 text-xs leading-5 text-emerald-700">
                  Purchasing these services separately costs{" "}
                  <span className="font-bold">
                    {formatPrice(normalPrice)}
                  </span>
                  . With this package, the customer pays{" "}
                  <span className="font-bold">
                    {formatPrice(packageItem.basPrice)}
                  </span>{" "}
                  and saves{" "}
                  <span className="font-bold">
                    {formatPrice(savings)}
                  </span>
                  .
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}

        <div className="flex shrink-0 justify-end border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-blue-900 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* =========================================================
   Section Header
   ========================================================= */

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-900">
        {icon}
      </div>

      <div>
        <h2 className="font-bold text-slate-900">{title}</h2>

        <p className="mt-0.5 text-xs text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   Input Field
   ========================================================= */

function InputField({
  label,
  value,
  placeholder,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  type?: "text" | "number";
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}

        <span className="ml-1 text-xs font-normal text-slate-400">
          (Optional)
        </span>
      </label>

      <input
        type={type}
        value={value}
        min={type === "number" ? 0 : undefined}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </div>
  );
}

/* =========================================================
   Normal Service Selector
   ========================================================= */

function SelectorItem({
  title,
  description,
  price,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  price: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 ${
        selected ? "bg-blue-50/70" : "hover:bg-slate-50"
      }`}
    >
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
          selected
            ? "border-blue-900 bg-blue-900 text-white"
            : "border-slate-300 bg-white"
        }`}
      >
        {selected && <Check size={13} />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
          {description}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-emerald-600">{price}</p>
      </div>
    </button>
  );
}

/* =========================================================
   Payment Method
   ========================================================= */

function PaymentMethodCard({
  title,
  description,
  icon,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative cursor-pointer rounded-xl border p-3 text-left transition ${
        selected
          ? "border-blue-900 bg-blue-50 ring-1 ring-blue-900"
          : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40"
      }`}
    >
      {selected && (
        <div className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-900 text-white">
          <Check size={12} />
        </div>
      )}

      <div
        className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${
          selected
            ? "bg-blue-900 text-white"
            : "bg-slate-100 text-slate-500"
        }`}
      >
        {icon}
      </div>

      <p className="text-sm font-bold text-slate-800">{title}</p>

      <p className="mt-0.5 text-[11px] text-slate-500">
        {description}
      </p>
    </button>
  );
}

/* =========================================================
   Price Row
   ========================================================= */

function PriceRow({
  title,
  value,
  strong = false,
}: {
  title: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 ${
        strong ? "border-t border-slate-200 pt-3" : ""
      }`}
    >
      <span
        className={
          strong
            ? "text-sm font-bold text-slate-800"
            : "text-sm text-slate-500"
        }
      >
        {title}
      </span>

      <span
        className={
          strong
            ? "text-sm font-bold text-slate-900"
            : "text-sm font-semibold text-slate-700"
        }
      >
        {value}
      </span>
    </div>
  );
}

/* =========================================================
   Summary Card
   ========================================================= */

function SummaryCard({
  title,
  value,
  icon,
  iconClassName,
}: {
  title: string;
  value: string;
  icon: ReactNode;
  iconClassName: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        <p className="mt-0.5 truncate text-xl font-bold text-slate-900">
          {value}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   Empty
   ========================================================= */

function DropdownEmpty({ text }: { text: string }) {
  return (
    <div className="px-4 py-6 text-center text-xs text-slate-400">
      {text}
    </div>
  );
}

/* =========================================================
   Alert
   ========================================================= */

function CustomAlert({
  alert,
  onClose,
}: {
  alert: AlertState;
  onClose: () => void;
}) {
  const styles = {
    success:
      "border-emerald-200 bg-emerald-50 text-emerald-800",

    error:
      "border-red-200 bg-red-50 text-red-800",

    warning:
      "border-amber-200 bg-amber-50 text-amber-800",

    info:
      "border-blue-200 bg-blue-50 text-blue-800",
  };

  const iconStyles = {
    success:
      "bg-emerald-100 text-emerald-700",

    error:
      "bg-red-100 text-red-700",

    warning:
      "bg-amber-100 text-amber-700",

    info:
      "bg-blue-100 text-blue-700",
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 shadow-xl ${styles[alert.variant]}`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconStyles[alert.variant]}`}
      >
        {alert.variant === "success" ? (
          <Check size={18} />
        ) : alert.variant === "info" ? (
          <Info size={18} />
        ) : (
          <Sparkles size={18} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold">{alert.title}</p>

        <p className="mt-1 text-sm opacity-80">
          {alert.description}
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg transition hover:bg-black/5"
      >
        <X size={17} />
      </button>
    </div>
  );
}