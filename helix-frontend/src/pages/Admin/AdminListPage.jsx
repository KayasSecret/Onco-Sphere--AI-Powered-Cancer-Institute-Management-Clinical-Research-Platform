import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
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
  RiProfileLine,
  RiEyeLine,
  RiEyeOffLine,
} from 'react-icons/ri'
import { Badge } from '../../components/ui/badge'
import { toast } from 'sonner'
import adminService from '../../services/adminService'
import { emailRegex, passwordRegex } from '../../lib/validation'
import ApplicationReviewModal from './ApplicationReviewModal'
import './AdminListPage.css'

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
  const [editUser, setEditUser] = useState(null)
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

  const handleModalApprove = async (applicant) => {
    if (processingApproval || !applicant) return
    setProcessingApproval('APPROVE')
    try {
      await dispatch(updateApprovalThunk({ id: applicant.id, action: 'APPROVE' })).unwrap()
      toast.success(`${applicant.full_name}'s registration request APPROVED.`)
      setViewingApplicationUser(null)
      dispatch(fetchAdminsThunk({ page, limit, search }))
    } catch (err) {
      toast.error(err || 'Failed to approve request.')
    } finally {
      setProcessingApproval(null)
    }
  }

  const handleModalReject = async (applicant) => {
    if (processingApproval || !applicant) return
    setProcessingApproval('REJECT')
    try {
      await dispatch(updateApprovalThunk({ id: applicant.id, action: 'REJECT' })).unwrap()
      toast.success(`${applicant.full_name}'s registration request REJECTED.`)
      setViewingApplicationUser(null)
      dispatch(fetchAdminsThunk({ page, limit, search }))
    } catch (err) {
      toast.error(err || 'Failed to reject request.')
    } finally {
      setProcessingApproval(null)
    }
  }

  const columns = [
    {
      header: 'Full Name',
      accessor: 'full_name',
      cell: (row) => (
        <div className="space-y-1.5 max-w-xs">
          <div>
            <p className="font-bold text-ink-primary">{row.full_name}</p>
            <p className="text-[11px] text-ink-secondary">{row.email}</p>
          </div>
          {row.is_approved === 'PENDING' && (
            <button
              type="button"
              onClick={() => setViewingApplicationUser(row)}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold text-brand-blue dark:text-sky-300 hover:text-white bg-brand-blue/10 hover:bg-brand-blue border border-brand-blue/25 rounded-lg transition-all mt-1 shadow-2xs cursor-pointer"
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
              'text-xs font-semibold px-2.5 py-0.5 rounded-md border',
              isSuper
                ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25'
                : row.role === 'ADMIN'
                ? 'bg-brand-blue/10 text-brand-blue dark:text-sky-300 border-brand-blue/25'
                : 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/25',
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
        const approvalState = row.is_approved || 'APPROVED'
        let badgeClass = ''
        if (approvalState === 'PENDING') {
          badgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
        } else if (approvalState === 'APPROVED') {
          badgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
        } else {
          badgeClass = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25'
        }
        return (
          <Badge variant="outline" className={`${badgeClass} text-xs font-semibold px-2.5 py-0.5 rounded-md`}>
            {approvalState}
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
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25'
              : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25',
          ].join(' ')}
        >
          <span
            className={[
              'w-1.5 h-1.5 rounded-full',
              row.is_active ? 'bg-emerald-500' : 'bg-slate-400',
            ].join(' ')}
          />
          {row.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Actions',
      cell: (row) => {
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
            <Button
              variant="ghost"
              size="icon"
              className="w-7 h-7 text-ink-secondary hover:text-brand-blue hover:bg-brand-blue/10 rounded-md cursor-pointer"
              onClick={() => setViewingApplicationUser(row)}
              title="View Profile & Application Details"
            >
              <RiEyeLine size={16} />
            </Button>

            {row.is_approved === 'PENDING' ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-md cursor-pointer"
                  onClick={handleApprove}
                  title="Approve Access Request"
                >
                  <RiCheckLine size={18} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-md cursor-pointer"
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
                        'w-7 h-7 cursor-pointer',
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
                        className="w-7 h-7 text-ink-secondary hover:text-status-critical cursor-pointer"
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
    <div className="onco-access-root space-y-5 pb-6">
      {/* ── Clinical Governance & Access Header Banner ───────────────────── */}
      <div className="onco-access-banner onco-access-anim">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs text-ink-secondary"
            >
              <Link
                to="/dashboard"
                className="font-semibold text-brand-blue dark:text-sky-400 hover:underline"
              >
                Dashboard
              </Link>
              <span className="opacity-40">/</span>
              <span className="text-ink-secondary font-medium">Onco Access</span>
            </nav>

            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-primary tracking-tight">
                Onco Access
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-[0.14em] bg-brand-blue/10 dark:bg-sky-500/15 text-brand-navy dark:text-sky-300 border border-brand-blue/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Institutional Access Governance
              </span>
            </div>

            <p className="text-xs sm:text-sm text-ink-secondary max-w-xl">
              Review researcher credential applications, manage clinical administrator accounts, and control system access permissions.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-sm transition-all cursor-pointer self-start sm:self-center shrink-0"
            onClick={() => {
              setEditUser(null)
              setFormOpen(true)
            }}
          >
            <RiUserAddLine size={16} />
            <span>Add Account</span>
          </button>
        </div>
      </div>

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
                ) : editUser ? (
                  'Save Details'
                ) : (
                  'Create Account'
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

      {/* Ultra-Premium Super Admin Application Review Workspace Modal */}
      <ApplicationReviewModal
        user={viewingApplicationUser}
        open={!!viewingApplicationUser}
        onOpenChange={(isOpen) => {
          if (!isOpen) setViewingApplicationUser(null)
        }}
        onApprove={handleModalApprove}
        onReject={handleModalReject}
        processingApproval={processingApproval}
      />
    </div>
  )
}
