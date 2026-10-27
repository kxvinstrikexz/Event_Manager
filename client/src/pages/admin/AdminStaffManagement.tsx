import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api.js';
import { EmptyState } from '../../components/ui/EmptyState.js';

interface StaffItem {
  id: string;
  user_id: string;
  full_name: string;
  staff_id: string;
  department: string;
  designation: string;
  official_email: string;
  phone: string | null;
  office_location: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
  account_status: 'active' | 'suspended' | 'banned' | 'deleted';
  user_account_status?: 'active' | 'suspended' | 'banned' | 'deleted';
  email_verified: boolean | number;
  approved_at: string | null;
  rejection_reason: string | null;
  suspended_at: string | null;
  suspension_reason: string | null;
  banned_at: string | null;
  ban_reason: string | null;
  deleted_at: string | null;
  deletion_reason: string | null;
  last_login_at: string | null;
  created_at: string;
  user_created_at?: string;
  approver_name?: string | null;
}

interface AuditLogItem {
  id: string;
  admin_id: string;
  admin_username?: string;
  target_user_id: string;
  target_staff_id: string | null;
  target_name: string | null;
  action: string;
  previous_status: string | null;
  new_status: string | null;
  reason: string;
  created_at: string;
}

export const AdminStaffManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';

  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Action Modal State
  const [activeModal, setActiveModal] = useState<{
    type: 'suspend' | 'ban' | 'reject' | 'delete' | 'unsuspend' | 'unban';
    staff: StaffItem;
  } | null>(null);

  const [modalReason, setModalReason] = useState('');
  const [modalConfirmation, setModalConfirmation] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Audit Log Drawer / Modal State
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.listStaff({
        status: statusFilter,
        search: search.trim() || undefined
      });
      setStaffList(res.staff || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const res = await api.getAuditLogs();
      setAuditLogs(res.auditLogs || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStaff();
  };

  const handleApprove = async (userId: string, name: string) => {
    if (!window.confirm(`Approve credentials for ${name}? This will grant access to manage university events.`)) {
      return;
    }
    try {
      await api.approveStaff(userId);
      fetchStaff();
    } catch (err: any) {
      alert(err.message || 'Failed to approve staff account.');
    }
  };

  const openActionModal = (type: 'suspend' | 'ban' | 'reject' | 'delete' | 'unsuspend' | 'unban', staff: StaffItem) => {
    setActiveModal({ type, staff });
    setModalReason('');
    setModalConfirmation('');
    setActionError(null);
  };

  const closeActionModal = () => {
    setActiveModal(null);
    setModalReason('');
    setModalConfirmation('');
    setActionError(null);
  };

  const handleExecuteModalAction = async () => {
    if (!activeModal) return;
    const { type, staff } = activeModal;

    if ((type === 'suspend' || type === 'ban' || type === 'reject') && !modalReason.trim()) {
      setActionError('A justification reason is required.');
      return;
    }

    if (type === 'delete') {
      if (modalConfirmation.trim() !== 'DELETE') {
        setActionError('You must type DELETE to confirm permanent deletion.');
        return;
      }
      if (!modalReason.trim()) {
        setActionError('A justification reason is required for deletion.');
        return;
      }
    }

    setActionLoading(true);
    setActionError(null);

    try {
      if (type === 'suspend') {
        await api.suspendStaff(staff.user_id, modalReason.trim());
      } else if (type === 'unsuspend') {
        await api.unsuspendStaff(staff.user_id, modalReason.trim() || undefined);
      } else if (type === 'ban') {
        await api.banStaff(staff.user_id, modalReason.trim());
      } else if (type === 'unban') {
        await api.unbanStaff(staff.user_id, modalReason.trim() || undefined);
      } else if (type === 'reject') {
        await api.rejectStaff(staff.user_id, modalReason.trim());
      } else if (type === 'delete') {
        await api.deleteStaff(staff.user_id, {
          confirmation: modalConfirmation.trim(),
          reason: modalReason.trim()
        });
      }

      closeActionModal();
      fetchStaff();
    } catch (err: any) {
      setActionError(err.message || 'Operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '48px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Faculty &amp; Staff Account Administration
          </h1>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
            Institutional oversight: approve credentials, manage suspensions and bans, audit permissions, and control account lifecycles.
          </p>
        </div>

        <button
          onClick={() => {
            setShowAuditLogs(true);
            fetchAuditLogs();
          }}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '40px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Security Audit Trail
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px'
      }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: '1 1 320px' }}>
          <input
            type="text"
            placeholder="Search by name, email, staff ID, or department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field"
            style={{ height: '38px', fontSize: '0.84375rem' }}
          />
          <button type="submit" className="btn btn-secondary" style={{ height: '38px' }}>
            Filter
          </button>
        </form>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label className="input-label" style={{ margin: 0 }}>Account &amp; Approval Status:</label>
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setSearchParams(e.target.value !== 'all' ? { status: e.target.value } : {});
            }}
            className="input-field"
            style={{ height: '38px', width: 'auto', minWidth: '180px' }}
          >
            <option value="all">All Accounts</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved &amp; Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
            <option value="rejected">Rejected Applications</option>
            <option value="deleted">Archived / Deleted</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading staff registry...
        </div>
      ) : staffList.length === 0 ? (
        <EmptyState
          title="No staff records match criteria"
          description="Try selecting a different status filter or resetting your search term."
        />
      ) : (
        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="table" style={{ minWidth: '1080px' }}>
            <thead>
              <tr>
                <th>Staff Member</th>
                <th>Staff ID</th>
                <th>Official Email</th>
                <th>Department</th>
                <th>Email Verification</th>
                <th>Approval</th>
                <th>Account Status</th>
                <th>Dates &amp; Activity</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map(st => {
                const currentAccountStatus = st.account_status || st.user_account_status || 'active';
                const isEmailVerified = Boolean(st.email_verified);

                return (
                  <tr key={st.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {st.full_name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        {st.designation}
                      </div>
                      {st.office_location && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {st.office_location}
                        </div>
                      )}
                    </td>

                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {st.staff_id}
                    </td>

                    <td style={{ fontSize: '0.8125rem' }}>
                      {st.official_email}
                    </td>

                    <td style={{ fontSize: '0.8125rem' }}>
                      {st.department}
                    </td>

                    {/* Email Verification Status */}
                    <td>
                      {isEmailVerified ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: '#059669',
                          backgroundColor: '#ecfdf5',
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}>
                          ● Verified
                        </span>
                      ) : (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: '#d97706',
                          backgroundColor: '#fffbeb',
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}>
                          ○ Unverified
                        </span>
                      )}
                    </td>

                    {/* Approval Status */}
                    <td>
                      <span className={`badge badge-${st.approval_status}`}>
                        {st.approval_status}
                      </span>
                    </td>

                    {/* Canonical Account Status */}
                    <td>
                      {currentAccountStatus === 'active' && (
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: '#059669',
                          backgroundColor: '#ecfdf5',
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}>
                          Active
                        </span>
                      )}
                      {currentAccountStatus === 'suspended' && (
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: '#ea580c',
                          backgroundColor: '#fff7ed',
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}>
                          Suspended
                        </span>
                      )}
                      {currentAccountStatus === 'banned' && (
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: '#dc2626',
                          backgroundColor: '#fef2f2',
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}>
                          Banned
                        </span>
                      )}
                      {currentAccountStatus === 'deleted' && (
                        <span style={{
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          color: '#6b7280',
                          backgroundColor: '#f3f4f6',
                          padding: '2px 8px',
                          borderRadius: '12px'
                        }}>
                          Archived
                        </span>
                      )}
                    </td>

                    {/* Dates & Activity */}
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <div>Reg: {st.created_at ? st.created_at.split(' ')[0] : '—'}</div>
                      {st.approved_at && (
                        <div>Appr: {st.approved_at.split(' ')[0]}</div>
                      )}
                      <div>Login: {st.last_login_at ? st.last_login_at.split(' ')[0] : 'Never'}</div>
                    </td>

                    {/* Status-Aware Administrative Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {/* 1. Pending Actions */}
                        {st.approval_status === 'pending' && currentAccountStatus !== 'deleted' && (
                          <>
                            <button
                              onClick={() => handleApprove(st.user_id, st.full_name)}
                              className="btn btn-primary"
                              style={{ height: '28px', padding: '0 10px', fontSize: '0.72rem' }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openActionModal('reject', st)}
                              className="btn btn-danger"
                              style={{ height: '28px', padding: '0 8px', fontSize: '0.72rem' }}
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {/* 2. Approved & Active Actions */}
                        {st.approval_status === 'approved' && currentAccountStatus === 'active' && (
                          <>
                            <button
                              onClick={() => openActionModal('suspend', st)}
                              className="btn btn-outline"
                              style={{ height: '28px', padding: '0 8px', fontSize: '0.72rem', color: '#ea580c' }}
                            >
                              Suspend
                            </button>
                            <button
                              onClick={() => openActionModal('ban', st)}
                              className="btn btn-outline"
                              style={{ height: '28px', padding: '0 8px', fontSize: '0.72rem', color: '#dc2626' }}
                            >
                              Ban
                            </button>
                            <button
                              onClick={() => openActionModal('delete', st)}
                              className="btn btn-danger"
                              style={{ height: '28px', padding: '0 8px', fontSize: '0.72rem' }}
                            >
                              Delete
                            </button>
                          </>
                        )}

                        {/* 3. Suspended Actions */}
                        {currentAccountStatus === 'suspended' && (
                          <>
                            <button
                              onClick={() => openActionModal('unsuspend', st)}
                              className="btn btn-primary"
                              style={{ height: '28px', padding: '0 10px', fontSize: '0.72rem' }}
                            >
                              Unsuspend
                            </button>
                            <button
                              onClick={() => openActionModal('ban', st)}
                              className="btn btn-outline"
                              style={{ height: '28px', padding: '0 8px', fontSize: '0.72rem', color: '#dc2626' }}
                            >
                              Ban
                            </button>
                            <button
                              onClick={() => openActionModal('delete', st)}
                              className="btn btn-danger"
                              style={{ height: '28px', padding: '0 8px', fontSize: '0.72rem' }}
                            >
                              Delete
                            </button>
                          </>
                        )}

                        {/* 4. Banned Actions */}
                        {currentAccountStatus === 'banned' && (
                          <>
                            <button
                              onClick={() => openActionModal('unban', st)}
                              className="btn btn-secondary"
                              style={{ height: '28px', padding: '0 10px', fontSize: '0.72rem' }}
                            >
                              Unban
                            </button>
                            <button
                              onClick={() => openActionModal('delete', st)}
                              className="btn btn-danger"
                              style={{ height: '28px', padding: '0 8px', fontSize: '0.72rem' }}
                            >
                              Delete
                            </button>
                          </>
                        )}

                        {/* 5. Rejected Actions */}
                        {st.approval_status === 'rejected' && currentAccountStatus !== 'deleted' && (
                          <>
                            <button
                              onClick={() => handleApprove(st.user_id, st.full_name)}
                              className="btn btn-secondary"
                              style={{ height: '28px', padding: '0 8px', fontSize: '0.72rem' }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openActionModal('delete', st)}
                              className="btn btn-danger"
                              style={{ height: '28px', padding: '0 8px', fontSize: '0.72rem' }}
                            >
                              Delete
                            </button>
                          </>
                        )}

                        {/* 6. Deleted / Archived Actions */}
                        {currentAccountStatus === 'deleted' && (
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Archived (Protected)
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation & Action Modal */}
      {activeModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)',
            maxWidth: '520px',
            width: '100%',
            padding: '28px'
          }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
              {activeModal.type === 'suspend' && 'Suspend Staff Account'}
              {activeModal.type === 'unsuspend' && 'Reactivate / Unsuspend Staff'}
              {activeModal.type === 'ban' && 'Ban Staff Account'}
              {activeModal.type === 'unban' && 'Lift Account Ban'}
              {activeModal.type === 'reject' && 'Reject Staff Application'}
              {activeModal.type === 'delete' && 'Delete Staff Account Permanently'}
            </h2>

            {/* Target Account Summary Box */}
            <div style={{
              padding: '12px 14px',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: '16px',
              fontSize: '0.8125rem'
            }}>
              <div><strong>Staff:</strong> {activeModal.staff.full_name}</div>
              <div><strong>ID:</strong> {activeModal.staff.staff_id}</div>
              <div><strong>Email:</strong> {activeModal.staff.official_email}</div>
            </div>

            {/* Deletion Warning Banner */}
            {activeModal.type === 'delete' && (
              <div style={{
                padding: '12px 14px',
                backgroundColor: 'rgba(220, 38, 38, 0.08)',
                border: '1px solid rgba(220, 38, 38, 0.3)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '16px',
                fontSize: '0.8125rem',
                color: '#dc2626'
              }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                  ⚠️ This action cannot be undone.
                </div>
                <div>
                  The staff account will be permanently deactivated and their Staff ID and email will be permanently retired from future registrations.
                </div>
                <div style={{ marginTop: '4px', color: '#16a34a' }}>
                  Historical events, registrations, certificates, and attendance will remain preserved in university records.
                </div>
              </div>
            )}

            {/* Error Message */}
            {actionError && (
              <div style={{
                padding: '10px 14px',
                backgroundColor: 'var(--status-error-bg)',
                color: 'var(--status-error-text)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: '16px',
                fontSize: '0.8125rem'
              }}>
                {actionError}
              </div>
            )}

            {/* Deletion Type-In Confirmation */}
            {activeModal.type === 'delete' && (
              <div className="input-group" style={{ marginBottom: '16px' }}>
                <label className="input-label" style={{ color: '#dc2626', fontWeight: 700 }}>
                  To confirm permanent deletion, type "DELETE" below:
                </label>
                <input
                  type="text"
                  value={modalConfirmation}
                  onChange={e => setModalConfirmation(e.target.value)}
                  placeholder="DELETE"
                  className="input-field"
                  style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                />
              </div>
            )}

            {/* Justification Reason Input */}
            <div className="input-group" style={{ marginBottom: '20px' }}>
              <label className="input-label">
                {activeModal.type === 'delete' ? 'Mandatory Deletion Reason:' : 'Administrative Justification / Reason:'}
              </label>

              {/* Quick Preset Selector */}
              <select
                onChange={e => {
                  if (e.target.value) setModalReason(e.target.value);
                }}
                className="input-field"
                style={{ marginBottom: '8px', fontSize: '0.8125rem' }}
              >
                <option value="">Select common preset or write custom reason...</option>
                <option value="Staff resigned from university">Staff resigned from university</option>
                <option value="Contract completed / ended">Contract completed / ended</option>
                <option value="Temporary institutional suspension">Temporary institutional suspension</option>
                <option value="Institutional security concern">Institutional security concern</option>
                <option value="University policy violation">University policy violation</option>
                <option value="Administrative audit action">Administrative audit action</option>
              </select>

              <textarea
                value={modalReason}
                onChange={e => setModalReason(e.target.value)}
                placeholder="Enter justification recorded in the administrative security audit log..."
                className="input-field"
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={closeActionModal}
                disabled={actionLoading}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteModalAction}
                disabled={actionLoading}
                className={activeModal.type === 'delete' || activeModal.type === 'ban' ? 'btn btn-danger' : 'btn btn-primary'}
              >
                {actionLoading ? 'Processing...' : (
                  activeModal.type === 'suspend' ? 'Confirm Suspension' :
                  activeModal.type === 'unsuspend' ? 'Confirm Reactivation' :
                  activeModal.type === 'ban' ? 'Confirm Ban' :
                  activeModal.type === 'unban' ? 'Lift Ban' :
                  activeModal.type === 'reject' ? 'Confirm Rejection' :
                  'Delete Staff Permanently'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Audit Trail Modal */}
      {showAuditLogs && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-card)',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                  Administrative Security Audit Trail
                </h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  Append-only immutable record of staff account approvals, suspensions, bans, and deletions.
                </p>
              </div>
              <button
                onClick={() => setShowAuditLogs(false)}
                className="btn btn-secondary"
                style={{ height: '32px', padding: '0 12px' }}
              >
                Close
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
              {auditLoading ? (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading audit trail...
                </div>
              ) : auditLogs.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No administrative audit records logged yet.
                </div>
              ) : (
                <table className="table" style={{ fontSize: '0.8125rem' }}>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Admin</th>
                      <th>Action</th>
                      <th>Target Staff</th>
                      <th>Status Transition</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map(log => (
                      <tr key={log.id}>
                        <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                          {log.created_at}
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          {log.admin_username || 'Administrator'}
                        </td>
                        <td>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: log.action.includes('DELETE') || log.action.includes('BAN')
                              ? '#fef2f2'
                              : log.action.includes('SUSPEND')
                              ? '#fff7ed'
                              : '#ecfdf5',
                            color: log.action.includes('DELETE') || log.action.includes('BAN')
                              ? '#dc2626'
                              : log.action.includes('SUSPEND')
                              ? '#ea580c'
                              : '#059669'
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{log.target_name || 'Staff Member'}</div>
                          {log.target_staff_id && (
                            <div style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                              {log.target_staff_id}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{log.previous_status || '—'}</span>
                          {' → '}
                          <strong>{log.new_status || '—'}</strong>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {log.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
