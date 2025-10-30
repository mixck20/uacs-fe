import React, { useState, useEffect } from "react";
import ClinicNavbar from "./ClinicNavbar";
import "./Inventory.css";
import { InventoryAPI } from "../api";
import Swal from "sweetalert2";
import {
  FaPills,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaExclamationTriangle,
  FaBoxes,
  FaCalendarAlt,
  FaChartLine,
  FaTimes
} from "react-icons/fa";

const lowStockThreshold = 10;

function Inventory({ setActivePage, activePage, inventory, setInventory, onLogout, user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [dispensingItem, setDispensingItem] = useState(null);
  const [dispenseForm, setDispenseForm] = useState({
    quantity: "",
    patientName: "",
    studentId: "",
    reason: "",
    notes: ""
  });
  const [form, setForm] = useState({
    name: "",
    quantity: "",
    expiryDate: "",
    description: "",
    manufacturer: "",
    batchNumber: ""
  });

  // Load medicines from backend
  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const data = await InventoryAPI.list();
      
      // Filter only medicines and normalize data
      const medicines = (data || [])
        .filter(item => !item.category || item.category === "Medicine")
        .map(item => ({
          id: item._id || item.id,
          name: item.name,
          quantity: typeof item.quantity === "number" ? item.quantity : parseInt(item.quantity || 0, 10),
          expiryDate: item.expiryDate || item.expiry || "",
          description: item.description || "",
          manufacturer: item.manufacturer || "",
          batchNumber: item.batchNumber || "",
          reorderLevel: typeof item.reorderLevel === "number" ? item.reorderLevel : lowStockThreshold,
          createdAt: item.createdAt || new Date().toISOString()
        }));
      
      setItems(medicines);
      if (setInventory) setInventory(medicines);
    } catch (err) {
      console.error("Failed to load inventory:", err);
      Swal.fire({
        title: "Error",
        text: "Failed to load medicines inventory",
        icon: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const quantity = parseInt(form.quantity, 10);
    if (!form.name.trim() || isNaN(quantity) || quantity < 0) {
      Swal.fire({
        title: "Invalid Input",
        text: "Please fill all required fields correctly",
        icon: "warning"
      });
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        quantity,
        expiryDate: form.expiryDate || null,
        description: form.description.trim(),
        manufacturer: form.manufacturer.trim(),
        batchNumber: form.batchNumber.trim(),
        category: "Medicine",
        unit: "pcs",
        reorderLevel: lowStockThreshold
      };

      if (editingItem) {
        // Update existing medicine
        await InventoryAPI.update(editingItem.id, payload);
        Swal.fire({
          title: "Updated!",
          text: "Medicine updated successfully",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        // Create new medicine
        await InventoryAPI.create(payload);
        Swal.fire({
          title: "Added!",
          text: "Medicine added successfully",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
      }

      loadInventory();
      closeForm();
    } catch (err) {
      Swal.fire({
        title: "Error",
        text: err.message || "Failed to save medicine",
        icon: "error"
      });
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      quantity: item.quantity.toString(),
      expiryDate: item.expiryDate ? item.expiryDate.split('T')[0] : "",
      description: item.description || "",
      manufacturer: item.manufacturer || "",
      batchNumber: item.batchNumber || ""
    });
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    const result = await Swal.fire({
      title: "Delete Medicine?",
      text: `Are you sure you want to delete "${item.name}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel"
    });

    if (result.isConfirmed) {
      try {
        await InventoryAPI.delete(item.id);
        Swal.fire({
          title: "Deleted!",
          text: "Medicine has been deleted",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
        loadInventory();
      } catch (err) {
        Swal.fire({
          title: "Error",
          text: "Failed to delete medicine",
          icon: "error"
        });
      }
    }
  };

  const handleAdjustStock = async (item, action) => {
    const { value: amount } = await Swal.fire({
      title: action === 'add' ? 'Add Stock' : 'Dispense Stock',
      input: 'number',
      inputLabel: `Quantity to ${action === 'add' ? 'add' : 'remove'}`,
      inputPlaceholder: 'Enter quantity',
      inputAttributes: {
        min: 1,
        step: 1
      },
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value || value < 1) {
          return 'Please enter a valid quantity';
        }
        if (action === 'remove' && parseInt(value) > item.quantity) {
          return `Cannot remove more than available quantity (${item.quantity})`;
        }
      }
    });

    if (amount) {
      const qty = parseInt(amount);
      const newQuantity = action === 'add' ? item.quantity + qty : item.quantity - qty;

      try {
        await InventoryAPI.update(item.id, {
          ...item,
          quantity: Math.max(0, newQuantity),
          category: "Medicine"
        });

        Swal.fire({
          title: "Success!",
          text: `Stock ${action === 'add' ? 'added' : 'dispensed'} successfully`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });

        loadInventory();
      } catch (err) {
        Swal.fire({
          title: "Error",
          text: "Failed to update stock",
          icon: "error"
        });
      }
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingItem(null);
    setForm({
      name: "",
      quantity: "",
      expiryDate: "",
      description: "",
      manufacturer: "",
      batchNumber: ""
    });
  };

  // Dispensing functions
  const openDispenseModal = (item) => {
    setDispensingItem(item);
    setShowDispenseModal(true);
    setDispenseForm({
      quantity: "",
      patientName: "",
      studentId: "",
      reason: "",
      notes: ""
    });
  };

  const closeDispenseModal = () => {
    setShowDispenseModal(false);
    setDispensingItem(null);
    setDispenseForm({
      quantity: "",
      patientName: "",
      studentId: "",
      reason: "",
      notes: ""
    });
  };

  const handleDispenseSubmit = async (e) => {
    e.preventDefault();

    if (!dispenseForm.quantity || parseInt(dispenseForm.quantity) <= 0) {
      Swal.fire({
        title: "Invalid Quantity",
        text: "Please enter a valid quantity",
        icon: "warning"
      });
      return;
    }

    if (parseInt(dispenseForm.quantity) > dispensingItem.quantity) {
      Swal.fire({
        title: "Insufficient Stock",
        text: `Available: ${dispensingItem.quantity}. Requested: ${dispenseForm.quantity}`,
        icon: "error"
      });
      return;
    }

    if (!dispenseForm.patientName.trim()) {
      Swal.fire({
        title: "Patient Name Required",
        text: "Please enter the patient's name",
        icon: "warning"
      });
      return;
    }

    try {
      const result = await Swal.fire({
        title: "Confirm Dispensing",
        html: `
          <div style="text-align: left;">
            <p><strong>Item:</strong> ${dispensingItem.name}</p>
            <p><strong>Quantity:</strong> ${dispenseForm.quantity}</p>
            <p><strong>Patient:</strong> ${dispenseForm.patientName}</p>
            ${dispenseForm.studentId ? `<p><strong>Student ID:</strong> ${dispenseForm.studentId}</p>` : ''}
            <p style="color: #666; margin-top: 10px;">Remaining stock: ${dispensingItem.quantity - parseInt(dispenseForm.quantity)}</p>
          </div>
        `,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#e51d5e",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Yes, dispense it!"
      });

      if (!result.isConfirmed) return;

      const response = await InventoryAPI.dispense({
        itemId: dispensingItem._id || dispensingItem.id,
        quantity: parseInt(dispenseForm.quantity),
        patientName: dispenseForm.patientName,
        studentId: dispenseForm.studentId,
        reason: dispenseForm.reason,
        notes: dispenseForm.notes
      });

      await loadInventory();
      closeDispenseModal();

      const message = response.lowStockAlert 
        ? `Item dispensed successfully! ⚠️ Low stock alert sent - only ${response.item.quantity} remaining.`
        : "Item dispensed successfully!";

      Swal.fire({
        title: "Dispensed!",
        text: message,
        icon: "success",
        confirmButtonColor: "#e51d5e"
      });

    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message || "Failed to dispense item",
        icon: "error"
      });
    }
  };

  // Filter and calculations
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.manufacturer?.toLowerCase().includes(search.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const stats = {
    total: items.length,
    available: items.filter(item => item.quantity > lowStockThreshold).length,
    lowStock: items.filter(item => item.quantity > 0 && item.quantity <= lowStockThreshold).length,
    outOfStock: items.filter(item => item.quantity === 0).length,
    expiringSoon: items.filter(item => {
      if (!item.expiryDate) return false;
      const daysUntilExpiry = Math.floor((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
    }).length
  };

  return (
    <div className="clinic-container">
      <ClinicNavbar activePage={activePage} setActivePage={setActivePage} onLogout={onLogout} user={user} />
      <div className="clinic-content">
        {/* Header */}
        <div className="inventory-header">
          <div className="header-content">
            <h1 className="inventory-title">
              Inventory
            </h1>
            <p className="inventory-subtitle">Medical supplies, equipment, and resources management</p>
          </div>
          <button className="add-medicine-btn" onClick={() => setShowForm(true)}>
            <FaPlus /> Add Item
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="inventory-stats-grid">
          <div className="stat-card stat-total">
            <div className="stat-icon">
              <FaBoxes />
            </div>
            <div className="stat-details">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Items</div>
            </div>
          </div>
          <div className="stat-card stat-available">
            <div className="stat-icon">
              <FaChartLine />
            </div>
            <div className="stat-details">
              <div className="stat-number">{stats.available}</div>
              <div className="stat-label">Available</div>
            </div>
          </div>
          <div className="stat-card stat-low">
            <div className="stat-icon">
              <FaExclamationTriangle />
            </div>
            <div className="stat-details">
              <div className="stat-number">{stats.lowStock}</div>
              <div className="stat-label">Low Stock</div>
            </div>
          </div>
          <div className="stat-card stat-expiring">
            <div className="stat-icon">
              <FaCalendarAlt />
            </div>
            <div className="stat-details">
              <div className="stat-number">{stats.expiringSoon}</div>
              <div className="stat-label">Expiring Soon</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="inventory-toolbar">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by medicine name or manufacturer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Medicines Grid */}
        <div className="medicines-grid">
          {loading ? (
            <div className="loading-state">Loading medicines...</div>
          ) : filteredItems.length === 0 ? (
            <div className="empty-state">
              <FaPills />
              <p>No medicines found</p>
              {search && <small>Try adjusting your search</small>}
            </div>
          ) : (
            paginatedItems.map((item) => {
              const isLowStock = item.quantity <= lowStockThreshold && item.quantity > 0;
              const isOutOfStock = item.quantity === 0;
              const daysUntilExpiry = item.expiryDate
                ? Math.floor((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
                : null;
              const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
              const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;

              return (
                <div
                  key={item.id}
                  className={`medicine-card ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : ''} ${isExpired ? 'expired' : ''}`}
                >
                  <div className="medicine-card-header">
                    <div className="medicine-icon">
                      <FaPills />
                    </div>
                    <div className="medicine-info">
                      <h3>{item.name}</h3>
                      {item.manufacturer && (
                        <p className="manufacturer">{item.manufacturer}</p>
                      )}
                    </div>
                  </div>

                  <div className="medicine-card-body">
                    <div className="info-row">
                      <span className="label">Quantity:</span>
                      <span className={`value ${isOutOfStock ? 'danger' : isLowStock ? 'warning' : 'success'}`}>
                        {item.quantity} units
                      </span>
                    </div>

                    {item.expiryDate && (
                      <div className="info-row">
                        <span className="label">
                          <FaCalendarAlt /> Expiry:
                        </span>
                        <span className={`value ${isExpired ? 'danger' : isExpiringSoon ? 'warning' : ''}`}>
                          {new Date(item.expiryDate).toLocaleDateString()}
                          {isExpired && <small> (Expired)</small>}
                          {isExpiringSoon && !isExpired && <small> ({daysUntilExpiry} days left)</small>}
                        </span>
                      </div>
                    )}

                    {item.batchNumber && (
                      <div className="info-row">
                        <span className="label">Batch:</span>
                        <span className="value">{item.batchNumber}</span>
                      </div>
                    )}

                    {item.description && (
                      <div className="description">
                        {item.description}
                      </div>
                    )}

                    {/* Stock Alert Badge */}
                    {isOutOfStock && (
                      <div className="alert-badge out-of-stock-badge">
                        <FaExclamationTriangle /> Out of Stock
                      </div>
                    )}
                    {isLowStock && (
                      <div className="alert-badge low-stock-badge">
                        <FaExclamationTriangle /> Low Stock
                      </div>
                    )}
                    {isExpired && (
                      <div className="alert-badge expired-badge">
                        <FaExclamationTriangle /> Expired
                      </div>
                    )}
                  </div>

                  <div className="medicine-card-actions">
                    <button
                      className="action-btn add-btn"
                      onClick={() => handleAdjustStock(item, 'add')}
                      title="Add Stock"
                    >
                      <FaPlus /> Add
                    </button>
                    <button
                      className="action-btn dispense-btn"
                      onClick={() => openDispenseModal(item)}
                      disabled={item.quantity === 0}
                      title="Quick Dispense"
                    >
                      <FaChartLine /> Dispense
                    </button>
                    <button
                      className="action-btn edit-btn"
                      onClick={() => handleEdit(item)}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(item)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {filteredItems.length > itemsPerPage && (
          <div className="pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="pagination-btn"
            >
              Previous
            </button>
            <span className="pagination-info">
              Page {currentPage} of {totalPages} ({filteredItems.length} total)
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        )}

        {/* Add/Edit Medicine Modal */}
        {showForm && (
          <div className="inventory-modal">
            <div className="inventory-modal-content">
              <div className="modal-header">
                <h2>
                  <FaPills /> {editingItem ? 'Edit Medicine' : 'Add New Medicine'}
                </h2>
                <button className="close-btn" onClick={closeForm}>
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Medicine Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    placeholder="e.g., Paracetamol 500mg"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity *</label>
                    <input
                      type="number"
                      name="quantity"
                      value={form.quantity}
                      onChange={handleFormChange}
                      placeholder="0"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input
                      type="date"
                      name="expiryDate"
                      value={form.expiryDate}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Manufacturer</label>
                    <input
                      type="text"
                      name="manufacturer"
                      value={form.manufacturer}
                      onChange={handleFormChange}
                      placeholder="e.g., PharmaCorp"
                    />
                  </div>
                  <div className="form-group">
                    <label>Batch Number</label>
                    <input
                      type="text"
                      name="batchNumber"
                      value={form.batchNumber}
                      onChange={handleFormChange}
                      placeholder="e.g., BN12345"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    placeholder="Additional notes or instructions..."
                    rows="3"
                  />
                </div>

                <div className="modal-actions">
                  <button type="submit" className="submit-btn">
                    {editingItem ? 'Update Medicine' : 'Add Medicine'}
                  </button>
                  <button type="button" className="cancel-btn" onClick={closeForm}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Quick Dispense Modal */}
        {showDispenseModal && dispensingItem && (
          <div className="inventory-modal">
            <div className="inventory-modal-content">
              <div className="modal-header">
                <h2>
                  <FaChartLine /> Quick Dispense: {dispensingItem.name}
                </h2>
                <button className="close-btn" onClick={closeDispenseModal}>
                  <FaTimes />
                </button>
              </div>

              <div className="dispense-info">
                <p><strong>Available Stock:</strong> {dispensingItem.quantity}</p>
                <p><strong>Category:</strong> {dispensingItem.category}</p>
              </div>

              <form onSubmit={handleDispenseSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Quantity to Dispense *</label>
                    <input
                      type="number"
                      min="1"
                      max={dispensingItem.quantity}
                      value={dispenseForm.quantity}
                      onChange={(e) => setDispenseForm({...dispenseForm, quantity: e.target.value})}
                      placeholder="Enter quantity"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Patient Name *</label>
                    <input
                      type="text"
                      value={dispenseForm.patientName}
                      onChange={(e) => setDispenseForm({...dispenseForm, patientName: e.target.value})}
                      placeholder="Enter patient name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Student ID (Optional)</label>
                    <input
                      type="text"
                      value={dispenseForm.studentId}
                      onChange={(e) => setDispenseForm({...dispenseForm, studentId: e.target.value})}
                      placeholder="Enter student ID"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Reason</label>
                    <input
                      type="text"
                      value={dispenseForm.reason}
                      onChange={(e) => setDispenseForm({...dispenseForm, reason: e.target.value})}
                      placeholder="e.g., Headache, Fever, etc."
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Additional Notes</label>
                    <textarea
                      value={dispenseForm.notes}
                      onChange={(e) => setDispenseForm({...dispenseForm, notes: e.target.value})}
                      placeholder="Any additional notes..."
                      rows="3"
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="submit" className="submit-btn">
                    <FaChartLine /> Dispense Medicine
                  </button>
                  <button type="button" className="cancel-btn" onClick={closeDispenseModal}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Inventory;
