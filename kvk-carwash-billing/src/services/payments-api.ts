import axios from "axios";
import { getEnv } from "@/env";

const { API_URL } = getEnv();
const PAYMENTS_API_URL = `${API_URL}car-service/wash-order/`;

export type PaymentRecord = {
    carWashOrderId: string;
    orderNumber: string;
    orderDate: string;
    customerName: string | null;
    customerPhone: string | null;
    vehicleType: number;
    vehicleNumber: string | null;
    totalMinutesSpent: number;
    subTotalAmount: number;
    discount: number;
    discountedTotalAmount: number;
    isPaid: boolean;
    paymentMethod: number;
    carWashOrderStatus: number;
    packages: { carWashPackageId: string; packageName: string; packagePrice: number }[];
    services: { carWashServiceId: string; serviceName: string; servicePrice: number }[];
};

const getToken = () => {
    const cashier = localStorage.getItem("cashier")
        ? JSON.parse(localStorage.getItem("cashier") as string)
        : null;

    return cashier ? cashier.token : null;
};

export const pay = async (paymentData: FormData) => {
    try {
        const token = getToken();
        const response = await axios.post<{ additionalData?: { orderId?: string } }>(PAYMENTS_API_URL, paymentData, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export async function getPayment(id: string) {
    const { data } = await axios.get<PaymentRecord>(`${PAYMENTS_API_URL}${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
    });
    return data;
}

export const getPayments = async () => {
    try {
        const token = getToken();
        const response = await axios.get<PaymentRecord[]>(PAYMENTS_API_URL, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};
