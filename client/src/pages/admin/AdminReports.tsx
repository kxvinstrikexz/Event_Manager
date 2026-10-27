import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';

export const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAdminReports()
      .then(res => setReports(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handlePrintReport = () => {
    window.print();
  };

  const o = reports?.overview || {};

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        marginBottom: '28px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Institutional Analytics &amp; Compliance Report
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
            Official university performance digest tracking cross-department participation, symposium volume, and attendance fidelity.
          </p>
        </div>

        <button onClick={handlePrintReport} className="btn btn-primary" style={{ height: '38px', fontSize: '0.8125rem' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          Export / Print Report
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Compiling institutional metrics...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Executive Overview Panel */}
          <div className="panel">
            <div className="panel-header">
              <h2 className="panel-title">Executive Summary</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Report Period: Current Academic Term</span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '24px'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Enrolled Students</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {o.totalStudents || 0}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Approved Faculty</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {o.approvedStaff || 0} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({o.pendingStaff || 0} pending)</span>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Academic Events</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {o.totalEvents || 0}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Student Registrations</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {o.totalRegistrations || 0}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Verified Attendances</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--status-success-text)', marginTop: '4px' }}>
                  {o.totalAttendance || 0}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Attendance Rate</div>
                <div style={{ fontSize: '1.7rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {o.attendanceRate || 0}%
                </div>
              </div>
            </div>
          </div>

          {/* Department Breakdown Table */}
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>
              Academic Department Engagement Breakdown
            </h2>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Department / School</th>
                    <th>Total Registrations</th>
                    <th>Verified Attendances</th>
                    <th>Attendance Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {(reports?.departmentBreakdown || []).map((d: any) => {
                    const rate = d.registrations > 0 ? Math.round((d.attendance / d.registrations) * 100) : 0;
                    return (
                      <tr key={d.department}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{d.department}</td>
                        <td>{d.registrations}</td>
                        <td style={{ color: 'var(--status-success-text)', fontWeight: 600 }}>{d.attendance}</td>
                        <td>{rate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Discipline Breakdown Table */}
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>
              Event Categories Distribution
            </h2>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Event Category</th>
                    <th>Total Sessions Organized</th>
                    <th>Registrations Generated</th>
                  </tr>
                </thead>
                <tbody>
                  {(reports?.categoryBreakdown || []).map((c: any) => (
                    <tr key={c.category}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.category}</td>
                      <td>{c.count} sessions</td>
                      <td>{c.total_registrations} enrollments</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
