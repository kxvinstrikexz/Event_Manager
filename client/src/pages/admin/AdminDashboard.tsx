import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';

export const AdminDashboard: React.FC = () => {
  const [reports, setReports] = useState<any | null>(null);
  const [pendingStaff, setPendingStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        const [repRes, staffRes] = await Promise.all([
          api.getAdminReports(),
          api.listStaff({ status: 'pending' })
        ]);
        setReports(repRes);
        setPendingStaff(staffRes.staff || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const handleApproveStaff = async (userId: string, name: string) => {
    try {
      await api.approveStaff(userId);
      setPendingStaff(prev => prev.filter(s => s.user_id !== userId));
      // Refresh reports
      const repRes = await api.getAdminReports();
      setReports(repRes);
    } catch (err: any) {
      alert(err.message || 'Failed to approve staff');
    }
  };

  const handleRejectStaff = async (userId: string) => {
    const reason = window.prompt('Specify institutional reason for rejecting this staff application:');
    if (reason === null) return;
    try {
      await api.rejectStaff(userId, reason);
      setPendingStaff(prev => prev.filter(s => s.user_id !== userId));
      const repRes = await api.getAdminReports();
      setReports(repRes);
    } catch (err: any) {
      alert(err.message || 'Failed to reject staff');
    }
  };

  const o = reports?.overview || {};

  return (
    <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontWeight: 700,
          color: 'var(--dark-base)',
          marginBottom: '4px'
        }}>
          Institutional Operations Control Center
        </div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          University Event Administration
        </h1>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
          High-level governance of academic symposia, faculty accreditations, student registrations, and compliance auditing.
        </p>
      </div>

      {/* Pending Staff Approvals Priority Banner */}
      {pendingStaff.length > 0 && (
        <div style={{
          backgroundColor: 'var(--status-warning-bg)',
          border: '1px solid var(--status-warning-border)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--status-warning-text)' }}>
                Action Required ({pendingStaff.length})
              </span>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--status-warning-text)', marginTop: '2px' }}>
                Pending Faculty Registration Approvals
              </h2>
            </div>
            <Link to="/admin/staff?status=pending" className="btn btn-outline" style={{ height: '32px', fontSize: '0.78125rem', borderColor: 'var(--status-warning-border)', color: 'var(--status-warning-text)' }}>
              Open Directory &rarr;
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pendingStaff.slice(0, 3).map(st => (
              <div
                key={st.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>{st.full_name}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                    ({st.designation} &bull; {st.department}) &bull; {st.official_email}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleApproveStaff(st.user_id, st.full_name)}
                    className="btn btn-primary"
                    style={{ height: '28px', padding: '0 12px', fontSize: '0.72rem' }}
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleRejectStaff(st.user_id)}
                    className="btn btn-danger"
                    style={{ height: '28px', padding: '0 10px', fontSize: '0.72rem' }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Institutional Numbers Bar */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '24px',
        marginBottom: '36px'
      }}>
        <div>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
            Total Events
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
            {o.totalEvents || 0}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
            Registrations
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
            {o.totalRegistrations || 0}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
            Verified Attendance
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--status-success-text)', marginTop: '2px' }}>
            {o.totalAttendance || 0}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
            Attendance Rate
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
            {o.attendanceRate || 0}%
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
            Active Faculty
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
            {o.approvedStaff || 0}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
            Certificates Issued
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
            {o.totalCertificates || 0}
          </div>
        </div>
      </div>

      {/* Operations Tables: Recent Events & Department Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
        {/* Table 1: Recent Events Overview */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Recent University Sessions
            </h2>
            <Link to="/admin/events" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent-base)' }}>
              Manage all events &rarr;
            </Link>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Event Title</th>
                  <th>Category</th>
                  <th>Date &amp; Venue</th>
                  <th>Organizer</th>
                  <th>Enrollments</th>
                  <th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {(reports?.recentEvents || []).map((ev: any) => (
                  <tr key={ev.id}>
                    <td>
                      <strong style={{ color: 'var(--text-primary)' }}>{ev.title}</strong>
                    </td>
                    <td>{ev.category}</td>
                    <td>
                      <div>{ev.date}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ev.venue}</div>
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>{ev.organizer_name}</td>
                    <td>
                      <strong>{ev.reg_count}</strong>
                    </td>
                    <td>
                      <span style={{ color: 'var(--status-success-text)', fontWeight: 600 }}>
                        {ev.att_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Department Participation */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Department Engagement Metrics
            </h2>
            <Link to="/admin/reports" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent-base)' }}>
              Full report &rarr;
            </Link>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Total Student Registrations</th>
                  <th>Verified Attendances</th>
                  <th>Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                {(reports?.departmentBreakdown || []).map((dept: any) => {
                  const rate = dept.registrations > 0 ? Math.round((dept.attendance / dept.registrations) * 100) : 0;
                  return (
                    <tr key={dept.department}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dept.department}</td>
                      <td>{dept.registrations}</td>
                      <td style={{ color: 'var(--status-success-text)', fontWeight: 600 }}>{dept.attendance}</td>
                      <td>{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
