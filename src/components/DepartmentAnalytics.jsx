import React, { useState, useEffect } from 'react';
import AdminPortalLayout from './AdminPortalLayout';
import { AdminAPI, PatientsAPI } from '../api';
import { FaUsers, FaChartBar, FaBuilding, FaFileDownload } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import './DepartmentAnalytics.css';

function DepartmentAnalytics() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);

  const departments = [
    "College of Accountancy",
    "College of Hospitality and Tourism Management",
    "School of Business and Public Administration",
    "Institute of Theology and Religious Studies",
    "School of Education",
    "College of Nursing and Pharmacy",
    "School of Arts and Sciences",
    "College of Engineering and Architecture",
    "College of Information Technology"
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch all users
      const usersData = await AdminAPI.getAllUsers(1, 10000); // Get all users
      setUsers(usersData.users || []);

      // Fetch all patients
      const patientsData = await PatientsAPI.list('all', '', false);
      setPatients(patientsData || []);

      // Calculate department statistics
      calculateDepartmentStats(usersData.users || [], patientsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire('Error', error.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateDepartmentStats = (usersData, patientsData) => {
    const stats = departments.map(department => {
      // Count registered users by department
      const registeredUsers = usersData.filter(user => 
        user.department === department
      ).length;

      // Count patients by department (from userId.department or direct department field)
      const patientsCount = patientsData.filter(patient => 
        patient.department === department || 
        patient.userId?.department === department
      ).length;

      // Count total visits from patients in this department
      const totalVisits = patientsData
        .filter(patient => 
          patient.department === department || 
          patient.userId?.department === department
        )
        .reduce((sum, patient) => sum + (patient.visits?.length || 0), 0);

      return {
        department,
        registeredUsers,
        patientsCount,
        totalVisits,
        totalPersons: registeredUsers
      };
    });

    // Sort by total persons (descending)
    stats.sort((a, b) => b.totalPersons - a.totalPersons);
    setDepartmentStats(stats);
  };

  const exportToExcel = () => {
    try {
      const data = departmentStats.map((stat, index) => ({
        'Rank': index + 1,
        'Department': stat.department,
        'Registered Users': stat.registeredUsers,
        'Patient Records': stat.patientsCount,
        'Total Clinic Visits': stat.totalVisits,
        'Total Persons': stat.totalPersons
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Department Analytics');

      // Auto-size columns
      const maxWidth = 40;
      const colWidths = Object.keys(data[0] || {}).map(key => ({
        wch: Math.min(maxWidth, Math.max(key.length, 15))
      }));
      worksheet['!cols'] = colWidths;

      const fileName = `Department_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      Swal.fire({
        icon: 'success',
        title: 'Export Successful',
        text: 'Department analytics exported to Excel',
        confirmButtonColor: '#e51d5e'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Export Failed',
        text: error.message || 'Failed to export data',
        confirmButtonColor: '#e51d5e'
      });
    }
  };

  const getTotalStats = () => {
    return {
      totalUsers: departmentStats.reduce((sum, stat) => sum + stat.registeredUsers, 0),
      totalPatients: departmentStats.reduce((sum, stat) => sum + stat.patientsCount, 0),
      totalVisits: departmentStats.reduce((sum, stat) => sum + stat.totalVisits, 0)
    };
  };

  const totals = getTotalStats();

  if (loading) {
    return (
      <AdminPortalLayout>
        <div className="department-analytics">
          <div className="loading-state">Loading department analytics...</div>
        </div>
      </AdminPortalLayout>
    );
  }

  return (
    <AdminPortalLayout>
      <div className="department-analytics">
        <div className="page-header">
          <div>
            <h1><FaBuilding /> Department Analytics</h1>
            <p className="page-subtitle">Patient distribution across departments</p>
          </div>
          <button className="export-btn" onClick={exportToExcel}>
            <FaFileDownload /> Export to Excel
          </button>
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon users">
              <FaUsers />
            </div>
            <div className="card-content">
              <div className="card-value">{totals.totalUsers}</div>
              <div className="card-label">Total Registered Users</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon patients">
              <FaUsers />
            </div>
            <div className="card-content">
              <div className="card-value">{totals.totalPatients}</div>
              <div className="card-label">Total Patient Records</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon visits">
              <FaChartBar />
            </div>
            <div className="card-content">
              <div className="card-value">{totals.totalVisits}</div>
              <div className="card-label">Total Clinic Visits</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon departments">
              <FaBuilding />
            </div>
            <div className="card-content">
              <div className="card-value">{departments.length}</div>
              <div className="card-label">Total Departments</div>
            </div>
          </div>
        </div>

        {/* Department Stats Table */}
        <div className="stats-table-container">
          <table className="stats-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Department</th>
                <th>Registered Users</th>
                <th>Patient Records</th>
                <th>Total Visits</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {departmentStats.map((stat, index) => {
                const percentage = totals.totalUsers > 0 
                  ? ((stat.registeredUsers / totals.totalUsers) * 100).toFixed(1)
                  : 0;
                
                return (
                  <tr key={stat.department}>
                    <td className="rank-cell">{index + 1}</td>
                    <td className="department-cell">
                      <FaBuilding className="dept-icon" />
                      {stat.department}
                    </td>
                    <td className="number-cell">{stat.registeredUsers}</td>
                    <td className="number-cell">{stat.patientsCount}</td>
                    <td className="number-cell">{stat.totalVisits}</td>
                    <td className="percentage-cell">
                      <div className="percentage-bar-container">
                        <div 
                          className="percentage-bar" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                        <span className="percentage-text">{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td colSpan="2"><strong>TOTAL</strong></td>
                <td className="number-cell"><strong>{totals.totalUsers}</strong></td>
                <td className="number-cell"><strong>{totals.totalPatients}</strong></td>
                <td className="number-cell"><strong>{totals.totalVisits}</strong></td>
                <td className="percentage-cell"><strong>100%</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Visual Chart */}
        <div className="chart-container">
          <h2>Department Distribution</h2>
          <div className="bar-chart">
            {departmentStats.map(stat => {
              const maxValue = Math.max(...departmentStats.map(s => s.registeredUsers));
              const heightPercentage = maxValue > 0 ? (stat.registeredUsers / maxValue) * 100 : 0;
              
              return (
                <div key={stat.department} className="bar-item">
                  <div className="bar-value">{stat.registeredUsers}</div>
                  <div 
                    className="bar" 
                    style={{ height: `${heightPercentage}%` }}
                    title={`${stat.department}: ${stat.registeredUsers} users`}
                  >
                  </div>
                  <div className="bar-label">{stat.department.split(' ').slice(-2).join(' ')}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminPortalLayout>
  );
}

export default DepartmentAnalytics;
