import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import type { PaymentRecord } from "./payments-api";

const money = new Intl.NumberFormat("en-LK", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const issuedFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Colombo", day: "numeric", month: "short", year: "numeric",
  hour: "numeric", minute: "2-digit", hour12: true,
});

export function createPaymentReceipt(payment: PaymentRecord, method: string, vehicleType: string) {
  if (!payment.isPaid || !payment.orderNumber || !Number.isFinite(payment.discountedTotalAmount)) {
    throw new Error("Missing paid order details.");
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const right = doc.internal.pageSize.getWidth() - 48;
  const red = "#a6141f";
  const ink = "#1e293b";
  const muted = "#546070";

  function text(value: string, x: number, y: number, size: number, color = ink, bold = false) {
    doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(size).setTextColor(color);
    doc.text(value, x, y);
  }

  function field(title: string, value: string, x: number, y: number) {
    text(title, x, y, 9, muted, true);
    doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(ink);
    const lines: string[] = doc.splitTextToSize(value, 224);
    doc.text(lines, x, y + 18);
    return y + 18 + lines.length * 14;
  }

  doc.setProperties({ title: "KVK Arena Car Wash Payment Receipt" });
  doc.setFillColor(red).rect(48, 85, 32, 4, "F");
  text("KVK ARENA / CAR WASH", 48, 112, 12, red, true);
  text("Payment receipt", 48, 150, 29, ink, true);
  doc.setFillColor("#e3f2e8").rect(right - 69, 131, 69, 24, "F");
  text("PAID", right - 48, 147, 10, "#1c5733", true);
  doc.setDrawColor("#d9dee5").line(48, 174, right, 174);

  const referenceEnd = field("ORDER NUMBER", payment.orderNumber, 48, 204);
  field("ISSUED", issuedFormat.format(new Date()), 315, 204);
  const customerEnd = field("CUSTOMER", payment.customerName?.trim() || "Walk-in customer", 48, referenceEnd + 20);
  const methodEnd = field("PAYMENT METHOD", method, 315, referenceEnd + 20);
  const detailsY = Math.max(customerEnd, methodEnd) + 20;
  const vehicle = [vehicleType, payment.vehicleNumber?.trim()].filter(Boolean).join(" / ");
  const vehicleEnd = field("VEHICLE", vehicle, 48, detailsY);
  const orderDate = payment.orderDate?.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  const dateEnd = orderDate ? field("ORDER DATE", orderDate, 315, detailsY) : detailsY;

  const items = [
    ...payment.packages.map(item => [item.packageName, "Package"]),
    ...payment.services.map(item => [item.serviceName, "Service"]),
  ];
  autoTable(doc, {
    startY: Math.max(vehicleEnd, dateEnd) + 24,
    margin: { left: 48, right: 48, bottom: 65 },
    head: [["Description", "Type"]],
    body: items,
    foot: [
      ["Subtotal", { content: `LKR ${money.format(payment.subTotalAmount)}`, styles: { halign: "right" } }],
      ...(payment.discount > 0 ? [["Discount", { content: `- LKR ${money.format(payment.discount)}`, styles: { halign: "right" as const } }]] : []),
      ["Total paid", { content: `LKR ${money.format(payment.discountedTotalAmount)}`, styles: { halign: "right" } }],
    ],
    showFoot: "lastPage",
    theme: "plain",
    rowPageBreak: "avoid",
    styles: { fontSize: 10, cellPadding: 9, textColor: ink },
    headStyles: { fillColor: "#eff1f3", fontStyle: "bold" },
    bodyStyles: { lineColor: "#d9dee5", lineWidth: { bottom: 0.5 } },
    footStyles: { fillColor: "#faeeee", textColor: red, fontStyle: "bold", fontSize: 12 },
  });

  text("Please keep this receipt for your records.", 48, doc.internal.pageSize.getHeight() - 36, 10, muted);
  return { doc, filename: `carwash-receipt-${payment.orderNumber}.pdf` };
}
