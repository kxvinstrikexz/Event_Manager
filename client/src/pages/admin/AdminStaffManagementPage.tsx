import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api.js';
import { EmptyState } from '../../components/ui/EmptyState.js';
import { Modal } from '../../components/ui/Modal.js';

interface DepartmentItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: number | boolean;
  total_staff: number;
  active_staff: number;
  pending_staff: number;
  created_at: string;
}

interface StaffMember {
  id: string;
  user_id: string;
  full_name: string;
  staff_id: string;
  department_id?: string | null;
  department: string;
  department_code?: string | null;
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

interface TransferRecord {
  id: string;
  staff_id: string;
  previous_department_name: string;
  new_department_name: string;
  transfer_reason: string;
  transferred_by_name?: string;
  transferred_at: string;
}

export const AdminStaffManagementPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedDeptParam = searchParams.get('dept');

  // Departments State
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [selectedDept, setSelectedDept] = useState<DepartmentItem | null>(null);
  const [deptSearch, setDeptSearch] = useState('');
  const [loadingDepts, setLoadingDepts] = useState(true);

  // Department Staff State
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStaffCount, setTotalStaffCount] = useState(0);
  const [loadingStaff, setLoadingStaff] = useState(false);

  // Feedback Notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Transfer Dialog State
  const [transferModalStaff, setTransferModalStaff] = useState<StaffMember | null>(null);
  const [destinationDeptId, setDestinationDeptId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  // Staff Details & Transfer History Modal
  const [detailsStaff, setDetailsStaff] = useState<StaffMember | null>(null);
  const [transferHistory, setTransferHistory] = useState<TransferRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Action Confirmation Modal (Suspend, Ban, Delete, Unsuspend, Unban, Reject)
  const [actionModal, setActionModal] = useState<{
    type: 'suspend' | 'ban' | 'reject' | 'delete' | 'unsuspend' | 'unban';
    staff: StaffMember;
  } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Add Department Modal
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [newDeptCode, setNewDeptCode] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDescription, setNewDeptDescription] = useState('');
  const [addDeptLoading, setAddDeptLoading] = useState(false);
  const [addDeptError, setAddDeptError] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  // Fetch all departments
  const fetchDepartments = async () => {
    try {
      setLoadingDepts(true);
      const res = await api.getAdminDepartments();
      const list: DepartmentItem[] = res.departments || [];
      setDepartments(list);

      // If URL param exists, sync selectedDept
      if (selectedDeptParam) {
        const found = list.find(d => d.id === selectedDeptParam || d.code.toLowerCase() === selectedDeptParam.toLowerCase() || d.name.toLowerCase() === selectedDeptParam.toLowerCase());
        if (found) {
          setSelectedDept(found);
        }
      }
    } catch (err: any) {
      console.error('[Fetch Departments Error]', err);
      showToast('error', 'Failed to load department directory.');
    } finally {
      setLoadingDepts(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Fetch staff for selected department
  const fetchDepartmentStaff = async (deptId: string, targetPage = 1) => {
    try {
      setLoadingStaff(true);
      const params: Record<string, any> = {
        page: targetPage,
        limit: 15
      };
      if (staffSearch.trim()) params.search = staffSearch.trim();
      if (approvalFilter !== 'all') params.approval_status = approvalFilter;
      if (accountFilter !== 'all') params.account_status = accountFilter;

      const res = await api.getDepartmentStaff(deptId, params);
      setStaffList(res.staff || []);
      setTotalStaffCount(res.pagination?.total || 0);
      setTotalPages(res.pagination?.totalPages || 1);
      setPage(res.pagination?.page || 1);
    } catch (err: any) {
      console.error('[Fetch Department Staff Error]', err);
      showToast('error', 'Failed to load department staff.');
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    if (selectedDept) {
      fetchDepartmentStaff(selectedDept.id, 1);
      setSearchParams({ dept: selectedDept.code });
    } else {
      setSearchParams({});
    }
  }, [selectedDept, approvalFilter, accountFilter]);

  const handleSelectDepartment = (dept: DepartmentItem) => {
    setSelectedDept(dept);
    setStaffSearch('');
    setApprovalFilter('all');
    setAccountFilter('all');
    setPage(1);
  };

  const handleBackToDirectory = () => {
    setSelectedDept(null);
    setSearchParams({});
    fetchDepartments();
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDept) {
      fetchDepartmentStaff(selectedDept.id, 1);
    }
  };

  // Open Transfer Modal
  const openTransferModal = (staff: StaffMember) => {
    setTransferModalStaff(staff);
    // Find default destination that isn't current department
    const available = departments.filter(d => d.id !== staff.department_id && d.name.toLowerCase() !== staff.department.toLowerCase());
    setDestinationDeptId(available[0]?.id || '');
    setTransferReason('');
    setTransferError(null);
  };

  // Submit Department Transfer
  const handleExecuteTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferModalStaff || !destinationDeptId) return;

    if (!transferReason.trim()) {
      setTransferError('Please provide a mandatory transfer reason for university records.');
      return;
    }

    try {
      setTransferLoading(true);
      setTransferError(null);
      const res = await api.transferStaffDepartment(transferModalStaff.user_id, {
        destinationDepartmentId: destinationDeptId,
        reason: transferReason.trim()
      });

      showToast('success', res.message || 'Staff member transferred successfully.');
      setTransferModalStaff(null);

      // Refresh both current department list and directory counts
      if (selectedDept) {
        fetchDepartmentStaff(selectedDept.id, page);
      }
      fetchDepartments();
    } catch (err: any) {
      setTransferError(err.message || 'Failed to complete department transfer.');
    } finally {
      setTransferLoading(false);
    }
  };

  // Open Staff Details & Transfer History Modal
  const openStaffDetails = async (staff: StaffMember) => {
    setDetailsStaff(staff);
    setLoadingHistory(true);
    try {
      const res = await api.getStaffTransferHistory(staff.user_id);
      setTransferHistory(res.transferHistory || []);
    } catch (err: any) {
      console.warn('[History Error]', err);
      setTransferHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle Administrative Actions (Approve, Suspend, Ban, etc.)
  const handleApproveStaff = async (staff: StaffMember) => {
    try {
      await api.approveStaff(staff.user_id);
      showToast('success', `Approved credentials for ${staff.full_name}.`);
      if (selectedDept) fetchDepartmentStaff(selectedDept.id, page);
      fetchDepartments();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to approve staff.');
    }
  };

  const openActionModal = (type: 'suspend' | 'ban' | 'reject' | 'delete' | 'unsuspend' | 'unban', staff: StaffMember) => {
    setActionModal({ type, staff });
    setActionReason(
      type === 'suspend' ? 'Temporary suspension' :
      type === 'ban' ? 'Policy violation' :
      type === 'delete' ? 'Staff resigned' :
      type === 'unsuspend' ? 'Administrative review cleared' :
      type === 'unban' ? 'Appeal accepted' : ''
    );
    setDeleteConfirmationText('');
    setActionError(null);
  };

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;

    const { type, staff } = actionModal;

    if ((type === 'suspend' || type === 'ban' || type === 'delete') && !actionReason.trim()) {
      setActionError('A valid administrative reason is strictly mandatory.');
      return;
    }

    if (type === 'delete' && deleteConfirmationText.trim() !== 'DELETE') {
      setActionError('You must type DELETE exactly to confirm permanent account deletion.');
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);

      if (type === 'suspend') {
        await api.suspendStaff(staff.user_id, actionReason.trim());
        showToast('success', `Staff ${staff.full_name} has been suspended.`);
      } else if (type === 'unsuspend') {
        await api.unsuspendStaff(staff.user_id, actionReason.trim());
        showToast('success', `Suspension lifted for ${staff.full_name}.`);
      } else if (type === 'ban') {
        await api.banStaff(staff.user_id, actionReason.trim());
        showToast('success', `Staff ${staff.full_name} has been permanently banned.`);
      } else if (type === 'unban') {
        await api.unbanStaff(staff.user_id, actionReason.trim());
        showToast('success', `Ban lifted for ${staff.full_name}.`);
      } else if (type === 'reject') {
        await api.rejectStaff(staff.user_id, actionReason.trim());
        showToast('success', `Registration rejected for ${staff.full_name}.`);
      } else if (type === 'delete') {
        await api.deleteStaff(staff.user_id, {
          confirmation: deleteConfirmationText.trim(),
          reason: actionReason.trim()
        });
        showToast('success', `Staff account for ${staff.full_name} archived. Historical records preserved.`);
      }

      setActionModal(null);
      if (selectedDept) fetchDepartmentStaff(selectedDept.id, page);
      fetchDepartments();
    } catch (err: any) {
      setActionError(err.message || 'Operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Add new department
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptCode.trim() || !newDeptName.trim()) {
      setAddDeptError('Department code and department name are required.');
      return;
    }

    try {
      setAddDeptLoading(true);
      setAddDeptError(null);
      await api.createDepartment({
        code: newDeptCode.trim().toUpperCase(),
        name: newDeptName.trim(),
        description: newDeptDescription.trim() || undefined
      });

      showToast('success', `Department "${newDeptName.trim()}" added to university directory.`);
      setShowAddDeptModal(false);
      setNewDeptCode('');
      setNewDeptName('');
      setNewDeptDescription('');
      fetchDepartments();
    } catch (err: any) {
      setAddDeptError(err.message || 'Failed to create department.');
    } finally {
      setAddDeptLoading(false);
    }
  };

  // Filtered department list for directory view
  const filteredDepartments = departments.filter(d =>
    d.name.toLowerCase().includes(deptSearch.toLowerCase()) ||
    d.code.toLowerCase().includes(deptSearch.toLowerCase()) ||
    (d.description && d.description.toLowerCase().includes(deptSearch.toLowerCase()))
  );

  return (
    <div className="admin-staff-management" style={{ paddingBottom: '60px' }}>
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            backgroundColor: toast.type === 'success' ? '#0F5132' : '#842029',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '0.875rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>{toast.type === 'success' ? '✓' : '⚠️'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* VIEW 1: DEPARTMENT DIRECTORY (When no department is selected) */}
      {!selectedDept && (
        <div>
          {/* Page Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '1.625rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Department-wise Staff Management
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px', marginBottom: 0 }}>
                Institutional directory organizing university faculty, approvals, and departmental transfers.
              </p>
            </div>
            <button
              onClick={() => { setShowAddDeptModal(true); setAddDeptError(null); }}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}
            >
              <span>+</span>
              <span>Add Department</span>
            </button>
          </div>

          {/* Directory Toolbar */}
          <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ flex: '1', minWidth: '240px' }}>
                <input
                  type="text"
                  placeholder="Search departments by name or code (e.g. CSE, Information Technology)..."
                  value={deptSearch}
                  onChange={e => setDeptSearch(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', height: '40px' }}
                />
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                {filteredDepartments.length} {filteredDepartments.length === 1 ? 'department' : 'departments'} listed
              </div>
            </div>
          </div>

          {/* Department Directory Table */}
          {loadingDepts ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading university departments...
            </div>
          ) : filteredDepartments.length === 0 ? (
            <EmptyState
              title="No Departments Found"
              description="No academic departments matched your search query. You can add a new department using the button above."
            />
          ) : (
            <div className="table-responsive card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Department Name</th>
                    <th>Code</th>
                    <th style={{ textAlign: 'center' }}>Total Staff</th>
                    <th style={{ textAlign: 'center' }}>Active Staff</th>
                    <th style={{ textAlign: 'center' }}>Pending Approvals</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepartments.map(dept => (
                    <tr key={dept.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>
                          {dept.name}
                        </div>
                        {dept.description && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            {dept.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            backgroundColor: 'var(--surface-sunken)',
                            color: 'var(--text-primary)',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontFamily: 'var(--font-mono, monospace)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            letterSpacing: '0.5px'
                          }}
                        >
                          {dept.code}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>
                        {dept.total_staff}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ color: dept.active_staff > 0 ? '#0F5132' : 'var(--text-muted)', fontWeight: 600 }}>
                          {dept.active_staff}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {dept.pending_staff > 0 ? (
                          <span
                            style={{
                              display: 'inline-block',
                              backgroundColor: '#FFF3CD',
                              color: '#664D03',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontWeight: 700,
                              fontSize: '0.75rem'
                            }}
                          >
                            {dept.pending_staff} pending
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>0</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleSelectDepartment(dept)}
                          className="btn btn-outline"
                          style={{
                            height: '32px',
                            fontSize: '0.8125rem',
                            padding: '0 12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>View Staff</span>
                          <span>→</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: DEPARTMENT-SPECIFIC STAFF LISTING */}
      {selectedDept && (
        <div>
          {/* Breadcrumb Navigation */}
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={handleBackToDirectory}
              className="btn btn-outline"
              style={{
                height: '32px',
                fontSize: '0.78125rem',
                padding: '0 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: 'var(--text-secondary)'
              }}
            >
              <span>←</span>
              <span>Department Directory</span>
            </button>
          </div>

          {/* Department Banner & Overview */}
          <div className="card" style={{ padding: '20px', marginBottom: '20px', backgroundColor: 'var(--surface-sunken)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {selectedDept.name}
                  </h1>
                  <span
                    style={{
                      backgroundColor: 'var(--brand-primary)',
                      color: '#FFFFFF',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: '0.75rem',
                      fontWeight: 600
                    }}
                  >
                    {selectedDept.code}
                  </span>
                </div>
                {selectedDept.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px', marginBottom: 0 }}>
                    {selectedDept.description}
                  </p>
                )}
              </div>

              {/* Quick Department Stats */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ padding: '8px 14px', backgroundColor: '#FFFFFF', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Total Staff</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>{totalStaffCount}</div>
                </div>
                <div style={{ padding: '8px 14px', backgroundColor: '#FFFFFF', borderRadius: '6px', textAlign: 'center', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.6875rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600 }}>Pending</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#B02A37' }}>{selectedDept.pending_staff}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <div style={{ flex: '1', minWidth: '220px' }}>
                <input
                  type="text"
                  placeholder="Search by staff name, ID, or email..."
                  value={staffSearch}
                  onChange={e => setStaffSearch(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', height: '38px' }}
                />
              </div>

              <div style={{ width: '160px' }}>
                <select
                  value={approvalFilter}
                  onChange={e => setApprovalFilter(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', height: '38px' }}
                >
                  <option value="all">Approval: All</option>
                  <option value="pending">Pending Approval</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div style={{ width: '160px' }}>
                <select
                  value={accountFilter}
                  onChange={e => setAccountFilter(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', height: '38px' }}
                >
                  <option value="all">Account: All</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="banned">Banned</option>
                  <option value="deleted">Deleted / Archived</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ height: '38px', padding: '0 16px' }}>
                Search
              </button>
            </form>
          </div>

          {/* Staff Table */}
          {loadingStaff ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading faculty and staff members...
            </div>
          ) : staffList.length === 0 ? (
            <EmptyState
              title="No Staff Found in Department"
              description={`No staff members currently match the criteria in ${selectedDept.name}. When staff register under this department, they appear here automatically.`}
            />
          ) : (
            <div className="table-responsive card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Staff ID</th>
                    <th>Institutional Email</th>
                    <th>Designation</th>
                    <th>Department</th>
                    <th>Approval Status</th>
                    <th>Account Status</th>
                    <th>Registered</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.map(st => (
                    <tr key={st.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {st.full_name}
                        </div>
                        {st.office_location && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {st.office_location}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono, monospace)',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            backgroundColor: 'var(--surface-sunken)',
                            padding: '2px 6px',
                            borderRadius: '3px'
                          }}
                        >
                          {st.staff_id}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {st.official_email}
                      </td>
                      <td style={{ fontSize: '0.8125rem' }}>
                        {st.designation || 'Faculty Member'}
                      </td>
                      <td>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                          {st.department}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            st.approval_status === 'approved' ? 'badge-success' :
                            st.approval_status === 'pending' ? 'badge-warning' : 'badge-danger'
                          }`}
                        >
                          {st.approval_status}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            st.account_status === 'active' ? 'badge-success' :
                            st.account_status === 'suspended' ? 'badge-warning' : 'badge-danger'
                          }`}
                        >
                          {st.account_status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {new Date(st.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            onClick={() => openStaffDetails(st)}
                            className="btn btn-outline"
                            title="View Staff Profile & Department Transfer History"
                            style={{ height: '30px', fontSize: '0.75rem', padding: '0 8px' }}
                          >
                            Details
                          </button>

                          {/* Department Transfer Action */}
                          {st.account_status !== 'deleted' && (
                            <button
                              onClick={() => openTransferModal(st)}
                              className="btn btn-outline"
                              title="Transfer staff member to another academic department"
                              style={{ height: '30px', fontSize: '0.75rem', padding: '0 8px', borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)' }}
                            >
                              Transfer
                            </button>
                          )}

                          {/* Approval Actions */}
                          {st.approval_status === 'pending' && st.account_status !== 'deleted' && (
                            <>
                              <button
                                onClick={() => handleApproveStaff(st)}
                                className="btn btn-primary"
                                style={{ height: '30px', fontSize: '0.75rem', padding: '0 8px', backgroundColor: '#0F5132' }}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => openActionModal('reject', st)}
                                className="btn btn-outline"
                                style={{ height: '30px', fontSize: '0.75rem', padding: '0 8px', borderColor: '#842029', color: '#842029' }}
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {/* Suspend / Reactivate */}
                          {st.account_status === 'active' && (
                            <button
                              onClick={() => openActionModal('suspend', st)}
                              className="btn btn-outline"
                              style={{ height: '30px', fontSize: '0.75rem', padding: '0 8px', borderColor: '#B02A37', color: '#B02A37' }}
                            >
                              Suspend
                            </button>
                          )}

                          {st.account_status === 'suspended' && (
                            <button
                              onClick={() => openActionModal('unsuspend', st)}
                              className="btn btn-outline"
                              style={{ height: '30px', fontSize: '0.75rem', padding: '0 8px', borderColor: '#0F5132', color: '#0F5132' }}
                            >
                              Reactivate
                            </button>
                          )}

                          {/* Ban / Unban */}
                          {st.account_status !== 'banned' && st.account_status !== 'deleted' && (
                            <button
                              onClick={() => openActionModal('ban', st)}
                              className="btn btn-outline"
                              style={{ height: '30px', fontSize: '0.75rem', padding: '0 8px', borderColor: '#842029', color: '#842029' }}
                            >
                              Ban
                            </button>
                          )}

                          {st.account_status === 'banned' && (
                            <button
                              onClick={() => openActionModal('unban', st)}
                              className="btn btn-outline"
                              style={{ height: '30px', fontSize: '0.75rem', padding: '0 8px', borderColor: '#0F5132', color: '#0F5132' }}
                            >
                              Unban
                            </button>
                          )}

                          {/* Permanent Delete */}
                          {st.account_status !== 'deleted' && (
                            <button
                              onClick={() => openActionModal('delete', st)}
                              className="btn btn-outline"
                              style={{ height: '30px', fontSize: '0.75rem', padding: '0 6px', color: '#842029', border: 'none' }}
                              title="Permanently Delete Staff Account"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Showing page {page} of {totalPages} ({totalStaffCount} total)
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => fetchDepartmentStaff(selectedDept.id, page - 1)}
                      disabled={page <= 1}
                      className="btn btn-outline"
                      style={{ height: '30px', fontSize: '0.75rem', padding: '0 10px' }}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchDepartmentStaff(selectedDept.id, page + 1)}
                      disabled={page >= totalPages}
                      className="btn btn-outline"
                      style={{ height: '30px', fontSize: '0.75rem', padding: '0 10px' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: DEPARTMENT TRANSFER MODAL */}
      {/* ======================================================== */}
      <Modal
        isOpen={!!transferModalStaff}
        onClose={() => setTransferModalStaff(null)}
        title="Transfer Academic Department"
        maxWidth="520px"
      >
        {transferModalStaff && (
          <div>
            <div style={{ backgroundColor: 'var(--surface-sunken)', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8125rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Staff Name:</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{transferModalStaff.full_name}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Staff ID:</span>
                  <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>{transferModalStaff.staff_id}</div>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Current Department:</span>
                  <div style={{ fontWeight: 600, color: '#B02A37' }}>{transferModalStaff.department}</div>
                </div>
              </div>
            </div>

            {transferError && (
              <div style={{ backgroundColor: '#F8D7DA', color: '#842029', padding: '10px 14px', borderRadius: '4px', fontSize: '0.8125rem', marginBottom: '16px' }}>
                {transferError}
              </div>
            )}

            <form onSubmit={handleExecuteTransfer}>
              <div className="input-group" style={{ marginBottom: '14px' }}>
                <label className="input-label" style={{ fontWeight: 600 }}>Destination Department *</label>
                <select
                  value={destinationDeptId}
                  onChange={e => setDestinationDeptId(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="" disabled>Select destination department...</option>
                  {departments
                    .filter(d => d.id !== transferModalStaff.department_id && d.name.toLowerCase() !== transferModalStaff.department.toLowerCase())
                    .map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: '20px' }}>
                <label className="input-label" style={{ fontWeight: 600 }}>Transfer Reason *</label>
                <textarea
                  placeholder="e.g. Faculty reassigned to Department of Computer Science per academic reorganization order."
                  value={transferReason}
                  onChange={e => setTransferReason(e.target.value)}
                  className="input-field"
                  rows={3}
                  required
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  This reason will be recorded in the immutable department transfer history.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setTransferModalStaff(null)}
                  className="btn btn-outline"
                  disabled={transferLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={transferLoading}
                >
                  {transferLoading ? 'Transferring...' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 2: STAFF DETAILS & TRANSFER HISTORY MODAL */}
      {/* ======================================================== */}
      <Modal
        isOpen={!!detailsStaff}
        onClose={() => setDetailsStaff(null)}
        title="Staff Member Details & Transfer History"
        maxWidth="640px"
      >
        {detailsStaff && (
          <div>
            {/* Profile Overview */}
            <div style={{ backgroundColor: 'var(--surface-sunken)', padding: '16px', borderRadius: '6px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8125rem' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Full Name:</span>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{detailsStaff.full_name}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Staff ID:</span>
                  <div style={{ fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>{detailsStaff.staff_id}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Institutional Email:</span>
                  <div>{detailsStaff.official_email}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Current Department:</span>
                  <div style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>{detailsStaff.department}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Designation:</span>
                  <div>{detailsStaff.designation}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Office Location:</span>
                  <div>{detailsStaff.office_location || 'Not specified'}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Approval Status:</span>
                  <div>
                    <span className={`badge ${detailsStaff.approval_status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                      {detailsStaff.approval_status}
                    </span>
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>Account Status:</span>
                  <div>
                    <span className={`badge ${detailsStaff.account_status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {detailsStaff.account_status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Transfer History Section */}
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
              Department Transfer Audit Trail
            </h3>

            {loadingHistory ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Loading transfer history...
              </div>
            ) : transferHistory.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--surface-sunken)', borderRadius: '6px', fontSize: '0.8125rem' }}>
                No department transfers recorded for this staff member.
              </div>
            ) : (
              <div className="table-responsive" style={{ maxHeight: '240px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: '6px' }}>
                <table className="table" style={{ margin: 0, fontSize: '0.75rem' }}>
                  <thead>
                    <tr>
                      <th>Transfer</th>
                      <th>Reason</th>
                      <th>Authorized By</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transferHistory.map(rec => (
                      <tr key={rec.id}>
                        <td>
                          <span style={{ color: '#B02A37', fontWeight: 600 }}>{rec.previous_department_name}</span>
                          {' → '}
                          <span style={{ color: '#0F5132', fontWeight: 600 }}>{rec.new_department_name}</span>
                        </td>
                        <td>{rec.transfer_reason}</td>
                        <td>{rec.transferred_by_name || 'Admin'}</td>
                        <td>{new Date(rec.transferred_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setDetailsStaff(null)} className="btn btn-outline">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 3: ACTION CONFIRMATION MODAL (Suspend, Ban, Delete) */}
      {/* ======================================================== */}
      <Modal
        isOpen={!!actionModal}
        onClose={() => setActionModal(null)}
        title={
          actionModal?.type === 'suspend' ? 'Suspend Staff Member' :
          actionModal?.type === 'unsuspend' ? 'Reactivate Staff Member' :
          actionModal?.type === 'ban' ? 'Ban Staff Member' :
          actionModal?.type === 'unban' ? 'Unban Staff Member' :
          actionModal?.type === 'reject' ? 'Reject Staff Application' :
          'Delete Staff Account Permanently?'
        }
        maxWidth="480px"
      >
        {actionModal && (
          <div>
            {actionModal.type === 'delete' && (
              <div style={{ backgroundColor: '#F8D7DA', color: '#842029', padding: '12px', borderRadius: '4px', fontSize: '0.8125rem', marginBottom: '14px' }}>
                <strong>⚠️ Warning:</strong> This soft-deletes the staff login credentials and blocks identity reuse. Historical event and certificate records are safely preserved.
              </div>
            )}

            <div style={{ backgroundColor: 'var(--surface-sunken)', padding: '10px 14px', borderRadius: '4px', fontSize: '0.8125rem', marginBottom: '14px' }}>
              <div><strong>Name:</strong> {actionModal.staff.full_name}</div>
              <div><strong>ID:</strong> {actionModal.staff.staff_id}</div>
              <div><strong>Email:</strong> {actionModal.staff.official_email}</div>
            </div>

            {actionError && (
              <div style={{ backgroundColor: '#F8D7DA', color: '#842029', padding: '10px 14px', borderRadius: '4px', fontSize: '0.8125rem', marginBottom: '14px' }}>
                {actionError}
              </div>
            )}

            <form onSubmit={handleExecuteAction}>
              {actionModal.type !== 'reject' && (
                <div className="input-group" style={{ marginBottom: '12px' }}>
                  <label className="input-label">Reason *</label>
                  <select
                    value={actionReason}
                    onChange={e => setActionReason(e.target.value)}
                    className="input-field"
                    style={{ marginBottom: '8px' }}
                  >
                    {actionModal.type === 'suspend' && (
                      <>
                        <option value="Temporary suspension">Temporary suspension</option>
                        <option value="Security concern">Security concern</option>
                        <option value="Policy violation">Policy violation</option>
                        <option value="Staff resigned">Staff resigned</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                    {actionModal.type === 'ban' && (
                      <>
                        <option value="Policy violation">Policy violation</option>
                        <option value="Security concern">Security concern</option>
                        <option value="Gross misconduct">Gross misconduct</option>
                        <option value="Administrative action">Administrative action</option>
                      </>
                    )}
                    {actionModal.type === 'delete' && (
                      <>
                        <option value="Staff resigned">Staff resigned</option>
                        <option value="Contract ended">Contract ended</option>
                        <option value="Security concern">Security concern</option>
                        <option value="Policy violation">Policy violation</option>
                        <option value="Administrative action">Administrative action</option>
                      </>
                    )}
                    {actionModal.type === 'unsuspend' && (
                      <>
                        <option value="Administrative review cleared">Administrative review cleared</option>
                        <option value="Suspension period elapsed">Suspension period elapsed</option>
                        <option value="Reinstated by Department Head">Reinstated by Department Head</option>
                      </>
                    )}
                    {actionModal.type === 'unban' && (
                      <>
                        <option value="Appeal accepted">Appeal accepted</option>
                        <option value="Administrative pardon">Administrative pardon</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {actionModal.type === 'reject' && (
                <div className="input-group" style={{ marginBottom: '12px' }}>
                  <label className="input-label">Rejection Reason *</label>
                  <textarea
                    value={actionReason}
                    onChange={e => setActionReason(e.target.value)}
                    className="input-field"
                    rows={2}
                    placeholder="Provide reason for rejecting faculty registration..."
                    required
                  />
                </div>
              )}

              {actionModal.type === 'delete' && (
                <div className="input-group" style={{ marginBottom: '16px' }}>
                  <label className="input-label" style={{ fontWeight: 600, color: '#842029' }}>
                    Type DELETE to confirm permanent deletion:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmationText}
                    onChange={e => setDeleteConfirmationText(e.target.value)}
                    placeholder="DELETE"
                    className="input-field"
                    style={{ borderColor: '#842029', fontWeight: 600 }}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="btn btn-outline"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`btn ${actionModal.type === 'delete' || actionModal.type === 'ban' ? 'btn-danger' : 'btn-primary'}`}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing...' : 'Confirm Action'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>

      {/* ======================================================== */}
      {/* MODAL 4: ADD DEPARTMENT MODAL */}
      {/* ======================================================== */}
      <Modal
        isOpen={showAddDeptModal}
        onClose={() => setShowAddDeptModal(false)}
        title="Add Academic Department"
        maxWidth="460px"
      >
        {addDeptError && (
          <div style={{ backgroundColor: '#F8D7DA', color: '#842029', padding: '10px 14px', borderRadius: '4px', fontSize: '0.8125rem', marginBottom: '14px' }}>
            {addDeptError}
          </div>
        )}

        <form onSubmit={handleCreateDepartment}>
          <div className="input-group" style={{ marginBottom: '12px' }}>
            <label className="input-label">Department Code * (e.g. CSE, IT, MECH)</label>
            <input
              type="text"
              placeholder="e.g. DS"
              value={newDeptCode}
              onChange={e => setNewDeptCode(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div className="input-group" style={{ marginBottom: '12px' }}>
            <label className="input-label">Department Name *</label>
            <input
              type="text"
              placeholder="e.g. Data Science & Big Data"
              value={newDeptName}
              onChange={e => setNewDeptName(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div className="input-group" style={{ marginBottom: '20px' }}>
            <label className="input-label">Description (Optional)</label>
            <textarea
              placeholder="Brief description of the academic discipline..."
              value={newDeptDescription}
              onChange={e => setNewDeptDescription(e.target.value)}
              className="input-field"
              rows={2}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setShowAddDeptModal(false)}
              className="btn btn-outline"
              disabled={addDeptLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={addDeptLoading}
            >
              {addDeptLoading ? 'Creating...' : 'Save Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
