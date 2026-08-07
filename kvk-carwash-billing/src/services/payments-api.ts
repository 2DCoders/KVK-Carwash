import axios from "axios";
import { getEnv } from "@/env";

const { API_URL } = getEnv();
const PAYMENTS_API_URL = `${API_URL}car-service/wash-order/`;

const getToken = () => {
    const cashier = localStorage.getItem("cashier")
        ? JSON.parse(localStorage.getItem("cashier") as string)
        : null;

    return cashier ? cashier.token : null;
};

export const pay = async (paymentData: FormData) => {
    try {
        const token = getToken();
        const response = await axios.post(`${PAYMENTS_API_URL}`, paymentData, {
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

export const getPayments = async () => {
    try {
        const token = getToken();
        const response = await axios.get(`${PAYMENTS_API_URL}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};