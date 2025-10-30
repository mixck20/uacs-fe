import React, { useState, useEffect } from 'react';
import './DispensingHistory.css';
import AdminNavbar from './AdminNavbar';
import { InventoryAPI } from '../api';
import { FaPills, FaCalendarAlt, FaUser, FaDownload, FaFilter, FaSearch, FaFileExcel, FaChartBar } from 'react-icons/fa';
import Swal from 'sweetalert2';

function DispensingHistory({ setActivePage, onLogout, user }) {
  const [dispensingRecords, setDispensingRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedMedication, setSelectedMedication] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 15;

  // Fetch dispensing records
  useEffect(() => {
    fetchDispensingData();
  }, []);

  const fetchDispensingData = async () => {
    try {
      setLoading(true);
      const [recordsResponse, statistics] = await Promise.all([
        InventoryAPI.getAllDispensingRecords(),
        InventoryAPI.getDispensingStats()
      ]);
      
      // Handle response structure: { total, records }
      const records = recordsResponse?.records || [];
      
      // Calculate additional stats from records
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);
      
      const todayDispensed = records.filter(r => new Date(r.dispensedAt) >= today).length;
      const weekDispensed = records.filter(r => new Date(r.dispensedAt) >= weekAgo).length;
      const uniquePatients = new Set(records.map(r => r.patientId)).size;
      
      setDispensingRecords(records);
      setFilteredRecords(records);
      setStats({
        ...statistics,
        totalDispensed: records.length,
        todayDispensed,
        weekDispensed,
        uniquePatients
      });
    } catch (error) {
      console.error('Failed to fetch dispensing data:', error);
      setDispensingRecords([]);
      setFilteredRecords([]);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load dispensing records',
        icon: 'error',
        confirmButtonColor: '#e51d5e'
      });
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...dispensingRecords];

    // Search filter (patient name or medication)
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(record => 
        new Date(record.dispensedAt) >= new Date(dateFrom)
      );
    }
    if (dateTo) {
      filtered = filtered.filter(record => 
        new Date(record.dispensedAt) <= new Date(dateTo + 'T23:59:59')
      );
    }

    // Medication filter
    if (selectedMedication) {
      filtered = filtered.filter(record => 
        record.itemName === selectedMedication
      );
    }

    setFilteredRecords(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, dateFrom, dateTo, selectedMedication, dispensingRecords]);

  // Get unique medications for filter dropdown
  const uniqueMedications = [...new Set(dispensingRecords.map(r => r.itemName))].sort();

  // Pagination
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredRecords.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);

  // Export to CSV
  const exportToCSV = () => {
    if (filteredRecords.length === 0) {
      Swal.fire({
        title: 'No Data',
        text: 'No records to export',
        icon: 'warning',
        confirmButtonColor: '#e51d5e'
      });
      return;
    }

    const headers = ['Date', 'Medication', 'Quantity', 'Patient Name', 'Student ID', 'Dispensed By', 'Reason', 'Notes'];
    const csvData = filteredRecords.map(record => [
      new Date(record.dispensedAt).toLocaleString(),
      record.itemName || 'N/A',
      record.quantity,
      record.patientName || 'N/A',
      record.studentId || 'N/A',
      record.dispensedBy?.name || 'Unknown',
      record.reason || 'N/A',
      record.notes || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dispensing-history-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      title: 'Success!',
      text: `Exported ${filteredRecords.length} records to CSV`,
      icon: 'success',
      confirmButtonColor: '#4CAF50'
    });
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setDateFrom('');
    setDateTo('');
    setSelectedMedication('');
  };

  return (
    <div className="dispensing-history-page">
      <AdminNavbar setActivePage={setActivePage} onLogout={onLogout} user={user} />
      
      <div className="dispensing-content">
        <div className="dispensing-header">
          <div>
            <h1 className="dispensing-title">
              <FaPills /> Dispensing History & Reports
            </h1>
            <p className="dispensing-subtitle">Complete medication distribution records</p>
          </div>
          <button className="export-btn" onClick={exportToCSV}>
            <FaFileExcel /> Export to CSV
          </button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-icon">
                <FaPills />
              </div>
              <div className="stat-info">
                <span className="stat-label">Total Dispensed</span>
                <span className="stat-value">{stats.totalDispensed || 0}</span>
              </div>
            </div>
            <div className="stat-card today">
              <div className="stat-icon">
                <FaCalendarAlt />
              </div>
              <div className="stat-info">
                <span className="stat-label">Today</span>
                <span className="stat-value">{stats.todayDispensed || 0}</span>
              </div>
            </div>
            <div className="stat-card week">
              <div className="stat-icon">
                <FaChartBar />
              </div>
              <div className="stat-info">
                <span className="stat-label">This Week</span>
                <span className="stat-value">{stats.weekDispensed || 0}</span>
              </div>
            </div>
            <div className="stat-card patients">
              <div className="stat-icon">
                <FaUser />
              </div>
              <div className="stat-info">
                <span className="stat-label">Unique Patients</span>
                <span className="stat-value">{stats.uniquePatients || 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-row">
            <div className="search-box">
              <FaSearch />
              <input
                type="text"
                placeholder="Search by patient name, student ID, or medication..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="filter-row">
            <div className="filter-group">
              <label>
                <FaCalendarAlt /> Date From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>
                <FaCalendarAlt /> Date To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>
                <FaPills /> Medication
              </label>
              <select
                value={selectedMedication}
                onChange={(e) => setSelectedMedication(e.target.value)}
              >
                <option value="">All Medications</option>
                {uniqueMedications.map(med => (
                  <option key={med} value={med}>{med}</option>
                ))}
              </select>
            </div>

            <button className="clear-filters-btn" onClick={clearFilters}>
              <FaFilter /> Clear Filters
            </button>
          </div>

          <div className="results-info">
            Showing {filteredRecords.length} of {dispensingRecords.length} records
          </div>
        </div>

        {/* Records Table */}
        <div className="records-table-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading dispensing records...</p>
            </div>
          ) : currentRecords.length === 0 ? (
            <div className="empty-state">
              <FaPills className="empty-icon" />
              <h3>No Records Found</h3>
              <p>No dispensing records match your filters</p>
            </div>
          ) : (
            <>
              <table className="dispensing-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Medication</th>
                    <th>Quantity</th>
                    <th>Patient</th>
                    <th>Student ID</th>
                    <th>Dispensed By</th>
                    <th>Reason</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {currentRecords.map((record, index) => (
                    <tr key={index}>
                      <td className="date-cell">
                        {new Date(record.dispensedAt).toLocaleDateString()}
                        <span className="time">{new Date(record.dispensedAt).toLocaleTimeString()}</span>
                      </td>
                      <td className="medication-cell">
                        <FaPills className="med-icon" />
                        {record.itemName || 'Unknown'}
                      </td>
                      <td className="quantity-cell">{record.quantity}</td>
                      <td>{record.patientName || 'N/A'}</td>
                      <td className="student-id-cell">{record.studentId || 'N/A'}</td>
                      <td>{record.dispensedBy?.name || 'Unknown'}</td>
                      <td className="reason-cell">{record.reason || 'N/A'}</td>
                      <td className="notes-cell">{record.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span className="page-info">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DispensingHistory;
