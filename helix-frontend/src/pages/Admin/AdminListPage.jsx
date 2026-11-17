// Admin list page

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  fetchAdminsThunk,
  createAdminThunk,
  updateAdminThunk,
  toggleAdminStatusThunk,
  updateApprovalThunk,
  selectAdmins,
  selectAdminsTotal,
  selectAdminStatus,
} from '../../redux/slices/adminSlice'
import { selectUser } from '../../redux/slices/authSlice'
import PageHeader from '../../components/PageHeader'
import DataTable from '../../components/DataTable'
import ConfirmDialog from '../../components/ConfirmDialog'
import FormField from '../../components/FormField'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
import { SkeletonTable } from '../../components/Skeletons'
import {
  RiUserAddLine,
  RiUserSettingsLine,
  RiUserUnfollowLine,
  RiUserFollowLine,
  RiDeleteBin7Line,
  RiCheckLine,
  RiCloseLine,
  RiBookOpenLine,
  RiCalendarLine,
  RiPhoneLine,
  RiLinkedinBoxLine,
  RiAttachmentLine,
  RiProfileLine,
  RiMapPinUserLine,
  RiInformationLine,
  RiFolderInfoLine,
  RiEyeLine,
  RiEyeOffLine
} from 'react-icons/ri'
import { Badge } from '../../components/ui/badge'
import { toast } from 'sonner'
import adminService from '../../services/adminService'
import { phoneRegex, emailRegex, passwordRegex } from '../../lib/validation'

const createSchema = yup.object({
  full_name: yup.string().min(2, 'Name must be at least 2 characters').required('Name is required'),
  email: yup
    .string()
    .trim()
    .required('Email is required')
    .matches(emailRegex, 'Enter a valid email address'),
  role: yup.string().required('Role is required'),
  password: yup
    .string()
    .matches(
      passwordRegex,
      'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .required('Password is required'),
})

const editSchema = yup.object({
  full_name: yup.string().min(2, 'Name must be at least 2 characters').required('Name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  role: yup.string().required('Role is required'),
})


// Profile view models are now rendered inside the gorgeous landscape viewer Dialog.

export default function AdminListPage() {
  const dispatch = useDispatch()
  const admins = useSelector(selectAdmins)
  const total = useSelector(selectAdminsTotal)
  const status = useSelector(selectAdminStatus)
  const currentUser = useSelector(selectUser)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const limit = 10

  // Modal Dialogs
  const [formOpen, setFormOpen] = useState(false)
  const [editUser, setEditUser] = useState(null) // null = Create Mode, object = Edit Mode
  const [showPassword, setShowPassword] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [targetUser, setTargetUser] = useState(null)

  // Account Delete States
  const [deleteId, setDeleteId] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteTargetName, setDeleteTargetName] = useState('')

  // Full Widescreen Application Viewer state
  const [viewingApplicationUser, setViewingApplicationUser] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [processingApproval, setProcessingApproval] = useState(null) // 'APPROVE' | 'REJECT' | null

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(editUser ? editSchema : createSchema),
  })

  const formValues = watch()

  useEffect(() => {
    dispatch(fetchAdminsThunk({ page, limit, search }))
  }, [dispatch, page, search])

  useEffect(() => {
    if (formOpen) {
      if (editUser) {
        reset({
          full_name: editUser.full_name,
          email: editUser.email,
          role: editUser.role,
        })
      } else {
        reset({
          full_name: '',
          email: '',
          role: 'ADMIN',
          password: '',
        })
      }
    }
  }, [formOpen, editUser, reset])

  const handleFormSubmit = async (data) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      if (editUser) {
        await dispatch(updateAdminThunk({ id: editUser.id, data })).unwrap()
        toast.success('Account updated successfully.')
      } else {
        await dispatch(createAdminThunk(data)).unwrap()
        toast.success('Account created successfully.')
      }
      setFormOpen(false)
      dispatch(fetchAdminsThunk({ page, limit, search }))
    } catch (err) {
      toast.error(err || 'Operation failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!targetUser) return
    const nextActiveState = !targetUser.is_active
    try {
      await dispatch(
        toggleAdminStatusThunk({ id: targetUser.id, isActive: nextActiveState })
      ).unwrap()
      toast.success(
        `User account ${nextActiveState ? 'activated' : 'deactivated'} successfully.`
      )
      dispatch(fetchAdminsThunk({ page, limit, search }))
    } catch (err) {
      toast.error(err || 'Failed to update user status.')
    } finally {
      setTargetUser(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteId) return
    try {
      await adminService.deleteAdmin(deleteId)
      toast.success('User account deleted successfully.')
      dispatch(fetchAdminsThunk({ page, limit, search }))
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete user account.')
    } finally {
      setDeleteId(null)
      setDeleteConfirmOpen(false)
      setDeleteTargetName('')
    }
  }

  const columns = [
    {
      header: 'Full Name',
      accessor: 'full_name',
      cell: (row) => (
        <div className="space-y-1.5 max-w-xs">
          <div>
            <p className="font-semibold text-ink-primary">{row.full_name}</p>
            <p className="text-[11px] text-ink-secondary">{row.email}</p>
          </div>
          {row.is_approved === 'PENDING' && (
            <button
              onClick={() => setViewingApplicationUser(row)}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-600 border border-blue-500/20 rounded-lg transition-all mt-1.5 shadow-sm"
            >
              <RiProfileLine size={12} />
              View Full Application
            </button>
          )}
        </div>
      ),
    },
    {
      header: 'System Access Role',
      accessor: 'role',
      headerClassName: 'hidden sm:table-cell',
      cellClassName: 'hidden sm:table-cell',
      cell: (row) => {
        const isSuper = row.role === 'SUPER_ADMIN'
        return (
          <Badge
            variant="secondary"
            className={[
              'text-xs font-semibold px-2 py-0.5 rounded-md border',
              isSuper
                ? 'bg-brand-navy/10 text-brand-navy border-brand-navy/20'
                : row.role === 'ADMIN'
                ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20'
                : 'bg-brand-light/20 text-brand-navy border-brand-light/30',
            ].join(' ')}
          >
            {row.role.replace('_', ' ')}
          </Badge>
        )
      },
    },
    {
      header: 'Approval Status',
      accessor: 'is_approved',
      headerClassName: 'hidden md:table-cell',
      cellClassName: 'hidden md:table-cell',
      cell: (row) => {
        const status = row.is_approved || 'APPROVED'
        let badgeClass = ''
        if (status === 'PENDING') {
          badgeClass = 'bg-amber-500/10 text-amber-500 border-amber-500/20'
        } else if (status === 'APPROVED') {
          badgeClass = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
        } else {
          badgeClass = 'bg-rose-500/10 text-rose-500 border-rose-500/20'
        }
        return (
          <Badge variant="outline" className={`${badgeClass} text-xs font-semibold px-2 py-0.5 rounded-md`}>
            {status}
          </Badge>
        )
      },
    },
    {
      header: 'Status',
      accessor: 'is_active',
      headerClassName: 'hidden sm:table-cell',
      cellClassName: 'hidden sm:table-cell',
      cell: (row) => (
        <span
          className={[
            'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border',
            row.is_active
              ? 'bg-status-active-bg text-status-active border-status-active/20'
              : 'bg-status-inactive-bg text-status-inactive border-status-inactive/20',
          ].join(' ')}
        >
          <span
            className={[
              'w-1.5 h-1.5 rounded-full',
              row.is_active ? 'bg-status-active' : 'bg-status-inactive',
            ].join(' ')}
          />
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => {
        // Super Admins cannot deactivate themselves
        const isSelf = row.email === JSON.parse(localStorage.getItem('helix_user'))?.email

        const handleApprove = async () => {
          try {
            await dispatch(updateApprovalThunk({ id: row.id, action: 'APPROVE' })).unwrap()
            toast.success(`${row.full_name}'s registration request APPROVED.`)
            dispatch(fetchAdminsThunk({ page, limit, search }))
          } catch (err) {
            toast.error(err || 'Failed to approve request.')
          }
        }

        const handleReject = async () => {
          try {
            await dispatch(updateApprovalThunk({ id: row.id, action: 'REJECT' })).unwrap()
            toast.success(`${row.full_name}'s registration request REJECTED.`)
            dispatch(fetchAdminsThunk({ page, limit, search }))
          } catch (err) {
            toast.error(err || 'Failed to reject request.')
          }
        }

        return (
          <div className="flex items-center gap-1">
            {/* View profile button (available for all user rows) */}
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-ink-secondary hover:text-brand-blue hover:bg-brand-blue/10 rounded-md"
              onClick={() => setViewingApplicationUser(row)}
              title="View Profile Details"
            >
              <RiEyeLine size={16} />
            </Button>

            {row.is_approved === 'PENDING' ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-md"
                  onClick={handleApprove}
                  title="Approve Access Request"
                >
                  <RiCheckLine size={18} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-md"
                  onClick={handleReject}
                  title="Reject Access Request"
                >
                  <RiCloseLine size={18} />
                </Button>
              </>
            ) : (
              <>
                {!isSelf && currentUser?.role === 'SUPER_ADMIN' && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={[
                        'w-7 h-7',
                        row.is_active
                          ? 'text-ink-secondary hover:text-status-critical'
                          : 'text-ink-secondary hover:text-status-active',
                      ].join(' ')}
                      onClick={() => {
                        setTargetUser(row)
                        setConfirmOpen(true)
                      }}
                      title={row.is_active ? 'Deactivate Account' : 'Activate Account'}
                    >
                      {row.is_active ? <RiUserUnfollowLine size={16} /> : <RiUserFollowLine size={16} />}
                    </Button>

                    {row.role !== 'SUPER_ADMIN' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 text-ink-secondary hover:text-status-critical"
                        onClick={() => {
                          setDeleteId(row.id)
                          setDeleteTargetName(row.full_name)
                          setDeleteConfirmOpen(true)
                        }}
                        title="Delete Account"
                      >
                        <RiDeleteBin7Line size={16} />
                      </Button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onco Access"
        breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Onco Access' }]}
        action={
          <Button
            className="w-full sm:w-auto bg-brand-blue hover:bg-brand-blue-dark text-ink-inverse text-xs px-4 py-2 font-semibold flex items-center justify-center gap-1.5 rounded-md"
            onClick={() => {
              setEditUser(null)
              setFormOpen(true)
            }}
          >
            <RiUserAddLine size={15} />
            Add Account
          </Button>
        }
      />

      {status === 'loading' && admins.length === 0 ? (
        <SkeletonTable rows={5} cols={4} />
      ) : (
        <DataTable
          columns={columns}
          items={admins}
          total={total}
          page={page}
          limit={limit}
          onPageChange={setPage}
          onSearchChange={setSearch}
          searchPlaceholder="Search accounts by name or email..."
          emptyMessage="No accounts found."
        />
      )}

      {/* Account Create/Edit Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md w-[95vw] bg-surface-card border border-surface-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-ink-primary font-bold text-lg flex items-center gap-2">
              <RiUserSettingsLine className="text-brand-blue" />
              {editUser ? 'Edit User Details' : 'Create Access Account'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleFormSubmit)} noValidate className="space-y-4 pt-2">
            <FormField label="Full Name" error={errors.full_name?.message} required>
              <Input placeholder="Dr. Sarah Chen" {...register('full_name')} />
            </FormField>

            <FormField label="Email Address" error={errors.email?.message} required>
              <Input type="email" placeholder="sarah.chen@hospital.org" {...register('email')} />
            </FormField>

            <FormField label="System Access Role" error={errors.role?.message} required>
              <Select
                value={formValues.role || 'ADMIN'}
                onValueChange={(val) => setValue('role', val)}
              >
                <SelectTrigger className="bg-surface-card">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent className="bg-surface-card">
                  {currentUser?.role === 'SUPER_ADMIN' && (
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  )}
                  <SelectItem value="ADMIN">Admin (Clinical/Coordinator)</SelectItem>
                  <SelectItem value="STUDENT">Student (Read-Only Observer)</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {!editUser && (
              <FormField label="Access Password" error={errors.password?.message} required>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-primary transition-colors focus:outline-none"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <RiEyeOffLine size={18} /> : <RiEyeLine size={18} />}
                  </button>
                </div>
              </FormField>
            )}

            <DialogFooter className="pt-2 flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto border-surface-border text-ink-primary hover:bg-surface-hover"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-brand-blue hover:bg-brand-blue-dark text-ink-inverse font-semibold flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{editUser ? 'Saving Details…' : 'Creating Account…'}</span>
                  </>
                ) : (
                  editUser ? 'Save Details' : 'Create Account'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmation toggle active/inactive status modal */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleToggleStatus}
        title={targetUser?.is_active ? 'Deactivate Account?' : 'Activate Account?'}
        description={`Are you sure you want to ${
          targetUser?.is_active ? 'deactivate' : 'activate'
        } the access credentials for ${targetUser?.full_name}?`}
        confirmText={targetUser?.is_active ? 'Deactivate' : 'Activate'}
        isDestructive={targetUser?.is_active}
      />

      {/* Confirmation permanent account deletion modal */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Access Account?"
        description={`Are you sure you want to permanently delete the account for ${deleteTargetName}? This will wipe their credentials and access privileges from the system database.`}
        confirmText="Delete Account"
        isDestructive
      />

      {/* Landscape Full Researcher Application Viewer Modal */}
      <Dialog open={!!viewingApplicationUser} onOpenChange={() => setViewingApplicationUser(null)}>
        <DialogContent className="max-w-4xl w-[95vw] bg-slate-900 border border-white/10 text-white rounded-2xl overflow-hidden p-4 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
          {viewingApplicationUser && (
            <div className="space-y-6 animate-fade-in text-left">
              
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <RiProfileLine className="text-blue-400" />
                    Researcher Access Application
                  </h2>
                  <p className="text-slate-400 text-xs mt-0.5">Submitted by {viewingApplicationUser.full_name} ({viewingApplicationUser.email})</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Status:</span>
                  <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-semibold px-2.5 py-0.5 rounded-md">
                    {viewingApplicationUser.is_approved || 'PENDING'}
                  </Badge>
                </div>
              </div>

              {/* Landscape Widescreen Columns Grid */}
              {viewingApplicationUser.researcher_profile ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  
                  {/* Column 1: Academic Background */}
                  <div className="space-y-3.5 bg-slate-950/40 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <RiBookOpenLine className="text-blue-400" size={15} />
                      <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase">Academic Details</span>
                    </div>
                    
                    <div className="space-y-3 text-xs">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase font-semibold">Current Institution</span>
                        <span className="text-xs text-slate-200 font-medium mt-0.5">{viewingApplicationUser.researcher_profile.institution || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase font-semibold">Highest Qualification</span>
                        <span className="text-xs text-slate-200 font-medium mt-0.5">{viewingApplicationUser.researcher_profile.qualification || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase font-semibold">Field of Specialization</span>
                        <span className="text-xs text-slate-200 font-medium mt-0.5">{viewingApplicationUser.researcher_profile.specialization || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase font-semibold">Designated Role</span>
                        <span className="text-xs text-slate-200 font-medium mt-0.5">{viewingApplicationUser.researcher_profile.researcher_role || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase font-semibold">Experience Level</span>
                        <span className="text-xs text-slate-200 font-medium mt-0.5">{viewingApplicationUser.researcher_profile.experience_years || 'N/A'}</span>
                      </div>
                      {viewingApplicationUser.researcher_profile.linkedin_url && (
                        <a
                          href={viewingApplicationUser.researcher_profile.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 mt-1 text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium hover:underline"
                        >
                          <RiLinkedinBoxLine size={15} /> Visit LinkedIn Profile
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Research Intentions */}
                  <div className="space-y-3.5 bg-slate-950/40 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <RiMapPinUserLine className="text-cyan-400" size={15} />
                      <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase">Research Focus</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase font-semibold">Primary Area</span>
                        <span className="text-xs text-slate-200 font-medium mt-0.5">{viewingApplicationUser.researcher_profile.research_area || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase font-semibold">Cancer Type of Interest</span>
                        <span className="text-xs text-slate-200 font-medium mt-0.5">{viewingApplicationUser.researcher_profile.cancer_interest || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase font-semibold">Expected Duration</span>
                        <span className="text-xs text-slate-200 font-medium mt-0.5">{viewingApplicationUser.researcher_profile.research_duration || 'N/A'}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-500 uppercase font-semibold">Supervisor / Referral</span>
                        <span className="text-xs text-slate-200 font-medium mt-0.5">{viewingApplicationUser.researcher_profile.supervisor_name || 'N/A'}</span>
                      </div>
                      {viewingApplicationUser.researcher_profile.prior_work_details && (
                        <div className="flex flex-col">
                          <span className="text-[9px] text-slate-500 uppercase font-semibold">Prior Work Details</span>
                          <span className="text-xs text-slate-300 leading-relaxed font-light mt-1 bg-slate-900/60 p-2 rounded-lg border border-white/5 line-clamp-3">
                            {viewingApplicationUser.researcher_profile.prior_work_details}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 3: Contact & Documents Attached */}
                  <div className="space-y-3.5 bg-slate-950/40 border border-white/5 rounded-xl p-4">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <RiFolderInfoLine className="text-emerald-400" size={15} />
                      <span className="text-[11px] font-bold tracking-wider text-slate-300 uppercase">Verification Documents</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      {/* Basic details */}
                      <div className="flex items-center gap-2.5 text-slate-300 text-xs bg-slate-900/50 p-2 rounded-lg border border-white/5">
                        <RiCalendarLine className="text-slate-500 shrink-0" size={14} />
                        <div>
                          <p className="text-[8px] text-slate-500 uppercase leading-none">DOB & Gender</p>
                          <p className="font-semibold mt-1">{viewingApplicationUser.researcher_profile.date_of_birth || 'N/A'} ({viewingApplicationUser.researcher_profile.gender || 'N/A'})</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 text-slate-300 text-xs bg-slate-900/50 p-2 rounded-lg border border-white/5">
                        <RiPhoneLine className="text-slate-500 shrink-0" size={14} />
                        <div>
                          <p className="text-[8px] text-slate-500 uppercase leading-none">Phone Contact</p>
                          <p className="font-semibold mt-1">{viewingApplicationUser.researcher_profile.phone || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Document cards */}
                      <div className="space-y-1.5 pt-2">
                        <span className="text-[9px] text-slate-500 uppercase font-semibold block">Attached Files:</span>
                        {[
                          ['Government ID Proof', viewingApplicationUser.researcher_profile.id_proof_url],
                          ['Institutional ID Card', viewingApplicationUser.researcher_profile.institutional_id_url],
                          ['Letter of Intent', viewingApplicationUser.researcher_profile.letter_of_intent_url],
                          ['Publications PDF', viewingApplicationUser.researcher_profile.publications_url]
                        ].map(([lbl, url]) => url ? (
                          <a
                            key={lbl}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/5 hover:border-blue-500/30 text-xs transition-all group font-semibold"
                          >
                            <span className="text-slate-300 group-hover:text-blue-300 transition-colors truncate">{lbl}</span>
                            <RiAttachmentLine className="text-slate-500 group-hover:text-blue-400 shrink-0" size={13} />
                          </a>
                        ) : null)}
                      </div>
                    </div>
                  </div>

                </div>
              ) : (
                /* General Account Information for Admins or Super Admins */
                <div className="bg-slate-950/40 border border-white/5 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <RiProfileLine className="text-blue-400" size={15} />
                    <span className="text-xs font-bold tracking-wider text-slate-300 uppercase">Account Specifications</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs text-left">
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5 flex flex-col gap-1">
                      <span className="text-[9px] text-slate-500 uppercase font-semibold">User Role</span>
                      <span className="text-xs text-slate-200 font-semibold">{viewingApplicationUser.role}</span>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5 flex flex-col gap-1">
                      <span className="text-[9px] text-slate-500 uppercase font-semibold">Account Status</span>
                      <span className="text-xs text-slate-200 font-semibold">{viewingApplicationUser.is_active ? 'ACTIVE' : 'INACTIVE'}</span>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5 flex flex-col gap-1">
                      <span className="text-[9px] text-slate-500 uppercase font-semibold">Email Registration</span>
                      <span className="text-xs text-slate-200 font-semibold">VERIFIED</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Research Objective Statement — Full Width */}
              {viewingApplicationUser.registration_reason && (
                <div className="relative p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 overflow-hidden font-sans">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500/40" />
                  <span className="font-bold uppercase tracking-wider block text-[9px] text-amber-500 mb-1">Access Request Objective (Why Joining Onco Sphere):</span>
                  <p className="italic text-sm text-slate-300 leading-relaxed font-light">
                    "{viewingApplicationUser.registration_reason}"
                  </p>
                </div>
              )}

              {/* Action Buttons Footer */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 border-t border-white/10 pt-4 mt-2">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <RiInformationLine size={14} className="text-slate-400 shrink-0" />
                  <span>Verify document legitimacy before deciding.</span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                  <Button
                    variant="outline"
                    className="border-white/10 text-slate-300 hover:bg-white/5 text-xs font-semibold px-4"
                    onClick={() => setViewingApplicationUser(null)}
                  >
                    Close Viewer
                  </Button>
                  
                  {/* Approve/Reject actions only visible for PENDING requests */}
                  {viewingApplicationUser.is_approved === 'PENDING' && (
                    <>
                      <button
                        disabled={!!processingApproval}
                        onClick={async () => {
                          if (processingApproval) return
                          setProcessingApproval('REJECT')
                          try {
                            await dispatch(updateApprovalThunk({ id: viewingApplicationUser.id, action: 'REJECT' })).unwrap()
                            toast.success(`${viewingApplicationUser.full_name}'s registration request REJECTED.`)
                            setViewingApplicationUser(null)
                            dispatch(fetchAdminsThunk({ page, limit, search }))
                          } catch (err) {
                            toast.error(err || 'Failed to reject request.')
                          } finally {
                            setProcessingApproval(null)
                          }
                        }}
                        className="px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-rose-600/10 border border-rose-500/20 disabled:opacity-60"
                      >
                        {processingApproval === 'REJECT' ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Rejecting…</span>
                          </>
                        ) : (
                          <>
                            <RiCloseLine size={16} /> Reject Request
                          </>
                        )}
                      </button>
                      <button
                        disabled={!!processingApproval}
                        onClick={async () => {
                          if (processingApproval) return
                          setProcessingApproval('APPROVE')
                          try {
                            await dispatch(updateApprovalThunk({ id: viewingApplicationUser.id, action: 'APPROVE' })).unwrap()
                            toast.success(`${viewingApplicationUser.full_name}'s registration request APPROVED.`)
                            setViewingApplicationUser(null)
                            dispatch(fetchAdminsThunk({ page, limit, search }))
                          } catch (err) {
                            toast.error(err || 'Failed to approve request.')
                          } finally {
                            setProcessingApproval(null)
                          }
                        }}
                        className="px-5 py-2 rounded-md bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 disabled:opacity-60"
                      >
                        {processingApproval === 'APPROVE' ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Approving…</span>
                          </>
                        ) : (
                          <>
                            <RiCheckLine size={16} /> Approve Access
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
