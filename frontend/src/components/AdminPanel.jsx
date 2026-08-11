import React from 'react';
import { useAdminState } from './admin/hooks/useAdminState';
import AdminAuthGate from './admin/layout/AdminAuthGate';
import AdminDashboardLayout from './admin/layout/AdminDashboardLayout';

export default function AdminPanel({ onNavigate }) {
  // Use our clean, refactored state hook
  const adminState = useAdminState();

  // If not authenticated, show the 2-Step Login Gate
  if (!adminState.token) {
    return <AdminAuthGate state={adminState} />;
  }

  // If authenticated, render the main Floating Glass Dashboard
  return <AdminDashboardLayout state={adminState} />;
}
