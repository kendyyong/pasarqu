import React from "react";
import { Route } from "react-router-dom";
import { CustomerDashboard } from "../../pages/customer/CustomerDashboard";
import { ProductDetail } from "../../pages/customer/ProductDetail";
import { ShopDetail } from "../../pages/customer/ShopDetail";
import { OrderTrackingPage } from "../../pages/customer/OrderTrackingPage";
import { AddressSettingsPage } from "../../pages/customer/components/AddressSettingsPage";
import { OrderHistoryPage } from "../../pages/customer/components/OrderHistoryPage";
import { PasarQuPay } from "../../pages/customer/components/PasarQuPay";
import { TermsCashback } from "../../pages/customer/components/TermsCashback";
import { CheckoutPaymentPage } from "../../pages/checkout/CheckoutPaymentPage";
import { ProtectedRoute } from "../../components/layout/ProtectedRoute";
import { ChatRoom } from "../../pages/chat/ChatRoom";

// WAJIB MENGGUNAKAN "export const" DI SINI AGAR TIDAK ERROR SYNTAX
export const CustomerRoutes = () => [
  <Route
    key="product-detail"
    path="/product/:productId"
    element={<ProductDetail />}
  />,
  <Route key="shop-detail" path="/shop/:merchantId" element={<ShopDetail />} />,
  <Route key="terms-cash" path="/terms-cashback" element={<TermsCashback />} />,
  <Route
    key="chat-room"
    path="/chat/:roomId"
    element={
      <ProtectedRoute allowedRoles={["CUSTOMER", "SUPER_ADMIN"]}>
        <ChatRoom />
      </ProtectedRoute>
    }
  />,
  <Route
    key="cust-dash"
    path="/customer-dashboard"
    element={
      <ProtectedRoute allowedRoles={["CUSTOMER", "SUPER_ADMIN"]}>
        <CustomerDashboard />
      </ProtectedRoute>
    }
  />,
  <Route
    key="pay"
    path="/pasarqu-pay"
    element={
      <ProtectedRoute allowedRoles={["CUSTOMER", "SUPER_ADMIN"]}>
        <PasarQuPay />
      </ProtectedRoute>
    }
  />,
  <Route
    key="checkout"
    path="/checkout"
    element={
      <ProtectedRoute allowedRoles={["CUSTOMER", "SUPER_ADMIN"]}>
        <CheckoutPaymentPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="addr"
    path="/settings/address"
    element={
      <ProtectedRoute allowedRoles={["CUSTOMER", "SUPER_ADMIN"]}>
        <AddressSettingsPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="orders"
    path="/order-history"
    element={
      <ProtectedRoute allowedRoles={["CUSTOMER", "SUPER_ADMIN"]}>
        <OrderHistoryPage />
      </ProtectedRoute>
    }
  />,
];
