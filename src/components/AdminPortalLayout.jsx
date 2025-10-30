import React from 'react';
import AdminNavbar from './AdminNavbar';
import './AdminPortalLayout.css';

function AdminPortalLayout({ children }) {
  return (
    <div className="admin-portal-layout">
      <AdminNavbar />
      <main className="admin-portal-content">
        {children}
      </main>
    </div>
  );
}

export default AdminPortalLayout;
