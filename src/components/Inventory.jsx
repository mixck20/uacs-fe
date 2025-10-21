// ...existing code...
import React, { useState, useEffect } from "react";
import ClinicNavbar from "./ClinicNavbar";
import "./Inventory.css";
import { InventoryAPI } from "../api";
import Swal from "sweetalert2";

const initialItems = [];
const lowStockThreshold = 10;

function Inventory({ setActivePage, activePage, sidebarOpen, setSidebarOpen, inventory, setInventory, onLogout }) {
  const [items, setItems] = useState(inventory || initialItems);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    quantity: "",
    expiry: "",
    category: "Medicine",
  });

  const [showReport, setShowReport] = useState(false);

  // state for adjustment modal to prevent accidental changes
  const [adjustModal, setAdjustModal] = useState({
    open: false,
    id: null,
    name: "",
    action: "increase", // "increase" or "decrease"
    amount: 1,
  });

  // Load inventory from backend on mount
  useEffect(() => {
    InventoryAPI.list().then(data => {
      const mapped = (data || []).map(d => ({
        id: d._id || d.id,
        name: d.name,
        quantity: typeof d.quantity === "number" ? d.quantity : parseInt(d.quantity || 0, 10),
        expiry: d.expiryDate ? (new Date(d.expiryDate)).toISOString().substring(0,10) : (d.expiry ? d.expiry : ""),
        category: d.category || "Medicine",
        reorderLevel: typeof d.reorderLevel === "number" ? d.reorderLevel : (d.reorder_level ?? lowStockThreshold),
        createdAt: d.createdAt || d.created_at || (d._id ? new Date(parseInt(d._id.substring(0,8), 16) * 1000).toISOString() : undefined)
      }));
      setItems(mapped);
      setInventory && setInventory(mapped);
    }).catch(err => {
      console.error(err);
      Swal.fire({ title: "Failed to load inventory", text: err.message || String(err), icon: "error" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update parent/global state when local state changes
  useEffect(() => {
    setInventory && setInventory(items);
  }, [items, setInventory]);

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleAddOrUpdate(e) {
    e.preventDefault();
    const quantity = parseInt(form.quantity, 10);
    if (
      form.name.trim() &&
      !isNaN(quantity) &&
      quantity >= 0 &&
      form.expiry &&
      form.category
    ) {
      try {
        const payload = {
          name: form.name.trim(),
          quantity,
          expiryDate: form.expiry,
          description: "",
          unit: "pcs",
          reorderLevel: lowStockThreshold,
          category: form.category
        };
        const created = await InventoryAPI.create(payload);
        const normalized = {
          id: created._id || created.id,
          name: created.name,
          quantity: created.quantity,
          expiry: created.expiryDate ? created.expiryDate.substring(0,10) : (created.expiry ? created.expiry : ""),
          category: created.category || form.category,
          reorderLevel: typeof created.reorderLevel === "number" ? created.reorderLevel : lowStockThreshold,
          createdAt: created.createdAt || created.created_at || new Date().toISOString()
        };
        const updated = [normalized, ...items];
        setItems(updated);
        setForm({ name: "", quantity: "", expiry: "", category: "Medicine" });
        setShowForm(false);
        Swal.fire({ title: "Item saved", icon: "success", timer: 1200, showConfirmButton: false });
      } catch (err) {
        Swal.fire({ title: "Failed to save item", text: err.message || String(err), icon: "error" });
      }
    } else {
      Swal.fire({ title: "Invalid input", text: "Please fill all fields correctly. Quantity must be a non-negative number.", icon: "warning" });
    }
  }

  // Open modal for confirmable adjustment
  function openAdjustModal(item, action) {
    setAdjustModal({
      open: true,
      id: item.id,
      name: item.name,
      action,
      amount: 1,
    });
  }

  function closeAdjustModal() {
    setAdjustModal({ open: false, id: null, name: "", action: "increase", amount: 1 });
  }

  async function performAdjust() {
    const { id, amount, action } = adjustModal;
    const target = items.find(i => i.id === id);
    if (!target) return closeAdjustModal();

    const amt = Math.max(1, parseInt(amount, 10) || 1);
    const delta = amt * (action === "increase" ? 1 : -1);
    const newQty = Math.max(0, target.quantity + delta);

    if (action === "decrease" && Math.abs(delta) > target.quantity) {
      const res = await Swal.fire({
        title: "Dispense exceeds current quantity",
        text: `This will set "${target.name}" quantity from ${target.quantity} to ${newQty}. Continue?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, continue",
        cancelButtonText: "Cancel"
      });
      if (!res.isConfirmed) return;
    }

    try {
      await InventoryAPI.update(id, {
        name: target.name,
        quantity: newQty,
        unit: 'pcs',
        reorderLevel: target.reorderLevel ?? lowStockThreshold,
        expiryDate: target.expiry ? target.expiry : null,
        category: target.category
      });
      const updated = items.map(item => (
        item.id === id ? { ...item, quantity: newQty } : item
      ));
      setItems(updated);
      closeAdjustModal();
      Swal.fire({ title: "Stock recorded", icon: "success", timer: 1000, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: "Failed to update stock", text: err.message || String(err), icon: "error" });
    }
  }

  // Filter and search logic
  const filteredItems = items.filter(item =>
    (filter === "All" || item.category === filter) &&
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  // Expired and monthly usage for reports
  const expiredItems = items.filter(item =>
    item.expiry && new Date(item.expiry) < new Date()
  );
  const monthlyUsage = items.filter(item =>
    item.expiry &&
    new Date(item.expiry).getMonth() === new Date().getMonth()
  );

  // Inventory statistics across all categories (use per-item reorderLevel when available)
  const totalItems = items.length;
  const availableItems = items.filter(item => item.quantity > (item.reorderLevel ?? lowStockThreshold)).length;
  const shortageItems = items.filter(item => item.quantity <= (item.reorderLevel ?? lowStockThreshold)).length;

  return (
    <div className="clinic-container">
      <ClinicNavbar activePage={activePage} setActivePage={setActivePage} onLogout={onLogout} />
      <div className="clinic-content">
        <div className="inventory-header">
          <h1 className="inventory-title">Inventory</h1>
          <div className="inventory-actions">
            <button className="inventory-btn" onClick={() => setShowForm(true)}>Add Item</button>
            <button className="inventory-btn" onClick={() => setShowReport(!showReport)}>{showReport ? "Close Reports" : "View Reports"}</button>
          </div>
        </div>

        <div className="inventory-controls">
          <input
            type="text"
            className="inventory-search"
            placeholder="Search item name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="inventory-filter"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Medicine">Medicine</option>
            <option value="Equipment">Equipment</option>
            <option value="Supplies">Supplies</option>
          </select>
        </div>

        <div className="inventory-stats-summary">
          <div className="stat-item">
            <span className="stat-number">{totalItems}</span>
            <span className="stat-label">Total Items</span>
          </div>
          <div className="stat-item">
            <span className="stat-number available">{availableItems}</span>
            <span className="stat-label">Available</span>
          </div>
          <div className="stat-item">
            <span className="stat-number shortage">{shortageItems}</span>
            <span className="stat-label">Shortage</span>
          </div>
        </div>

        <div className="inventory-summary-cards">
          <div className="inventory-summary-card shortage-card">
            <div className="summary-card-header">
              <h3>Shortage</h3>
              <span className="shortage-count">{items.filter(item => item.quantity <= (item.reorderLevel ?? lowStockThreshold)).length}</span>
            </div>
            <div className="summary-card-content">
              {items.filter(item => item.quantity <= (item.reorderLevel ?? lowStockThreshold)).length > 0 ? (
                <ul className="shortage-list">
                  {items.filter(item => item.quantity <= (item.reorderLevel ?? lowStockThreshold)).map(item => (
                    <li key={item.id} className="shortage-item">
                      <span className="item-name">{item.name}</span>
                      <span className="item-quantity">Qty: {item.quantity}</span>
                      <span className="item-category"> ({item.category})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-shortage">No shortages</p>
              )}
            </div>
          </div>

          <div className="inventory-summary-card available-card">
            <div className="summary-card-header">
              <h3>Available Items</h3>
              <span className="available-count">{items.filter(item => item.quantity > (item.reorderLevel ?? lowStockThreshold)).length}</span>
            </div>
            <div className="summary-card-content">
              {items.filter(item => item.quantity > (item.reorderLevel ?? lowStockThreshold)).length > 0 ? (
                <ul className="available-list">
                  {items.filter(item => item.quantity > (item.reorderLevel ?? lowStockThreshold)).slice(0, 5).map(item => (
                    <li key={item.id} className="available-item">
                      <span className="item-name">{item.name}</span>
                      <span className="item-quantity">Qty: {item.quantity}</span>
                      <span className="item-category"> ({item.category})</span>
                    </li>
                  ))}
                  {items.filter(item => item.quantity > (item.reorderLevel ?? lowStockThreshold)).length > 5 && (
                    <li className="more-items">+{items.filter(item => item.quantity > (item.reorderLevel ?? lowStockThreshold)).length - 5} more</li>
                  )}
                </ul>
              ) : (
                <p className="no-available">No items available</p>
              )}
            </div>
          </div>
        </div>

        <table className="inventory-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Expiry Date</th>
              <th>Category</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "#999" }}>No items found.</td>
              </tr>
            )}
            {filteredItems.map(item => (
              <tr key={item.id} className={item.quantity <= (item.reorderLevel ?? lowStockThreshold) ? "low-stock" : ""}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{item.expiry}</td>
                <td>{item.category}</td>
                <td>
                  <button
                    className="inventory-adjust"
                    aria-label={`Increase ${item.name}`}
                    onClick={() => openAdjustModal(item, "increase")}
                  >+</button>
                  <button
                    className="inventory-adjust"
                    aria-label={`Decrease ${item.name}`}
                    onClick={() => openAdjustModal(item, "decrease")}
                  >−</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add/Update Item Form */}
        {showForm && (
          <div className="inventory-modal">
            <div className="inventory-modal-content">
              <h2>Add/Update Item</h2>
              <form onSubmit={handleAddOrUpdate}>
                <label>
                  Medical Supplies Name
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Paracetamol 500mg"
                    value={form.name}
                    onChange={handleFormChange}
                    required
                  />
                </label>

                <label>
                  Quantity
                  <input
                    type="number"
                    name="quantity"
                    placeholder="Quantity"
                    min="0"
                    value={form.quantity}
                    onChange={handleFormChange}
                    required
                  />
                </label>

                <label>
                  Expiration Date
                  <input
                    type="date"
                    name="expiry"
                    placeholder="Expiry Date"
                    value={form.expiry}
                    onChange={handleFormChange}
                    required
                  />
                </label>

                <label>
                  Type
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="Medicine">Medicine</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Supplies">Supplies</option>
                  </select>
                </label>

                <div className="inventory-modal-actions">
                  <button type="submit" className="inventory-btn">Save</button>
                  <button type="button" className="inventory-btn" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Adjustment Modal */}
        {adjustModal.open && (
          <div className="inventory-modal">
            <div className="inventory-modal-content">
              <h2>{adjustModal.action === "increase" ? "Receive Stock" : "Dispense Stock"}</h2>
              <p><strong>Item:</strong> {adjustModal.name}</p>
              <label>
                Quantity to record
                <input
                  type="number"
                  min="1"
                  value={adjustModal.amount}
                  onChange={e => setAdjustModal({ ...adjustModal, amount: e.target.value })}
                />
              </label>
              <div className="inventory-modal-actions">
                <button className="inventory-btn" onClick={performAdjust}>Confirm</button>
                <button className="inventory-btn" onClick={closeAdjustModal}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Reports Section */}
        {showReport && (
          <div className="inventory-modal">
            <div className="inventory-modal-content">
              <h2>Reports</h2>
              <h4>Expired Items</h4>
              <ul>
                {expiredItems.length === 0
                  ? <li>No expired items.</li>
                  : expiredItems.map(item => (
                    <li key={item.id}>{item.name} (expired on {item.expiry})</li>
                  ))
                }
              </ul>
              <h4>Items Expiring This Month</h4>
              <ul>
                {monthlyUsage.length === 0
                  ? <li>No items expiring this month.</li>
                  : monthlyUsage.map(item => (
                    <li key={item.id}>{item.name} (expires on {item.expiry})</li>
                  ))
                }
              </ul>
              <button className="inventory-btn" onClick={() => setShowReport(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Inventory;
// ...existing code...