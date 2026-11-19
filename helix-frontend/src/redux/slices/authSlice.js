import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authService from '../../services/authService'

// ── Helpers ──────────────────────────────────────────────────────────────────

const persistTokens = (accessToken, refreshToken, user) => {
  localStorage.setItem('helix_access_token', accessToken)
  localStorage.setItem('helix_refresh_token', refreshToken)
  localStorage.setItem('helix_user', JSON.stringify(user))
}

const clearTokens = () => {
  localStorage.removeItem('helix_access_token')
  localStorage.removeItem('helix_refresh_token')
  localStorage.removeItem('helix_user')
}

const loadUserFromStorage = () => {
  try {
    const raw = localStorage.getItem('helix_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// ── Initial state ─────────────────────────────────────────────────────────────

const initialState = {
  user: loadUserFromStorage(),
  isAuthenticated: !!localStorage.getItem('helix_access_token'),
  status: 'idle',       // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
}

// ── Error Formatter ─────────────────────────────────────────────────────────
const getErrorMessage = (err, fallback) => {
  const detail = err.response?.data?.detail
  if (!detail) return fallback
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg + (d.loc ? ` (${d.loc.join('.')})` : '')).join(', ')
  }
  if (typeof detail === 'object') {
    return detail.message || detail.msg || fallback
  }
  return fallback
}

// ── Async thunks ──────────────────────────────────────────────────────────────

export const loginThunk = createAsyncThunk(
  'auth/login',
  async ({ email, password, rememberMe }, { rejectWithValue }) => {
    try {
      const res = await authService.login(email, password, rememberMe)
      return res.data
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Login failed. Please try again.'))
    }
  }
)

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (researcherData, { rejectWithValue }) => {
    try {
      const res = await authService.register(researcherData)
      return res.data
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, 'Registration failed. Please try again.'))
    }
  }
)

export const getMeThunk = createAsyncThunk(
  'auth/getMe',
  async (_, { rejectWithValue }) => {
    try {
      const res = await authService.getMe()
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Session expired.')
    }
  }
)

export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async () => {
    try {
      await authService.logout()
    } catch {
      // Always clear local state even if the server call fails
    } finally {
      clearTokens()
    }
  }
)

// ── Slice ─────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Synchronous logout — clears state immediately (used by Axios interceptor)
    clearAuth: (state) => {
      state.user = null
      state.isAuthenticated = false
      state.status = 'idle'
      state.error = null
      clearTokens()
    },
    clearError: (state) => {
      state.error = null
    },
    updateUserProfile: (state, action) => {
      if (state.user) {
        state.user = {
          ...state.user,
          full_name: action.payload.full_name,
          photo_url: action.payload.photo_url,
        }
        localStorage.setItem('helix_user', JSON.stringify(state.user))
      }
    },
  },
  extraReducers: (builder) => {
    // ── Login ────────────────────────────────────────────────────────────────
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        const { access_token, refresh_token, user } = action.payload
        persistTokens(access_token, refresh_token, user)
        state.user = user
        state.isAuthenticated = true
        state.status = 'succeeded'
        state.error = null
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })

    // ── Register ─────────────────────────────────────────────────────────────
    builder
      .addCase(registerThunk.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        const { pending, access_token, refresh_token, user } = action.payload || {}
        if (!pending && access_token && refresh_token) {
          persistTokens(access_token, refresh_token, user)
          state.user = user
          state.isAuthenticated = true
        }
        state.status = 'succeeded'
        state.error = null
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })

    // ── Get me ───────────────────────────────────────────────────────────────
    builder
      .addCase(getMeThunk.fulfilled, (state, action) => {
        state.user = action.payload
        localStorage.setItem('helix_user', JSON.stringify(action.payload))
      })
      .addCase(getMeThunk.rejected, (state) => {
        // Token no longer valid — clear everything
        state.user = null
        state.isAuthenticated = false
        clearTokens()
      })

    // ── Logout ───────────────────────────────────────────────────────────────
    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.user = null
      state.isAuthenticated = false
      state.status = 'idle'
      state.error = null
    })
  },
})

export const { clearAuth, clearError, updateUserProfile } = authSlice.actions

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectUser = (state) => state.auth.user
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated
export const selectAuthStatus = (state) => state.auth.status
export const selectAuthError = (state) => state.auth.error
export const selectUserRole = (state) => state.auth.user?.role

export default authSlice.reducer
