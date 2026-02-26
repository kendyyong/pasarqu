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

// 🚀 DAFTAR ROLE YANG DIPERBOLEHKAN BELANJA (KONSISTEN)
const ALL_SHOPPERS = ["USER", "CUSTOMER", "MERCHANT", "COURIER", "SUPER_ADMIN"];

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
      <ProtectedRoute allowedRoles={ALL_SHOPPERS}>
        <ChatRoom />
      </ProtectedRoute>
    }
  />,
  <Route
    key="cust-dash"
    path="/customer-dashboard"
    element={
      <ProtectedRoute allowedRoles={ALL_SHOPPERS}>
        <CustomerDashboard />
      </ProtectedRoute>
    }
  />,
  <Route
    key="pay"
    path="/pasarqu-pay"
    element={
      <ProtectedRoute allowedRoles={ALL_SHOPPERS}>
        <PasarQuPay />
      </ProtectedRoute>
    }
  />,
  <Route
    key="checkout"
    path="/checkout"
    element={
      <ProtectedRoute allowedRoles={ALL_SHOPPERS}>
        <CheckoutPaymentPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="addr"
    path="/settings/address"
    element={
      <ProtectedRoute allowedRoles={ALL_SHOPPERS}>
        <AddressSettingsPage />
      </ProtectedRoute>
    }
  />,
  <Route
    key="orders"
    path="/order-history"
    element={
      <ProtectedRoute allowedRoles={ALL_SHOPPERS}>
        <OrderHistoryPage />
      </ProtectedRoute>
    }
  />,
];
