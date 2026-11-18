import api from './axiosInstance'

const reportService = {
  getTemplates: () =>
    api.get('/api/v1/reports/templates'),

  getSettings: () =>
    api.get('/api/v1/reports/settings'),

  updateSettings: (data) =>
    api.post('/api/v1/reports/settings', data),

  addSignature: (data) =>
    api.post('/api/v1/reports/signature', data),

  updateSignature: (sigId, data) =>
    api.put(`/api/v1/reports/signature/${sigId}`, data),

  deleteSignature: (sigId) =>
    api.delete(`/api/v1/reports/signature/${sigId}`),

  createParameter: (data) =>
    api.post('/api/v1/reports/parameters', data),

  updateParameter: (paramId, data) =>
    api.put(`/api/v1/reports/parameters/${paramId}`, data),

  resetParameters: () =>
    api.post('/api/v1/reports/parameters/reset'),

  createReport: (data, existingReportNumber = null) => {
    const url = existingReportNumber
      ? `/api/v1/reports?existing_report_number=${encodeURIComponent(existingReportNumber)}`
      : '/api/v1/reports'
    return api.post(url, data)
  },

  getReport: (id) =>
    api.get(`/api/v1/reports/${id}`),

  listReports: (params = {}) =>
    api.get('/api/v1/reports', { params }),

  logPrint: (id) =>
    api.post(`/api/v1/reports/${id}/print-log`),

  getReportHistory: (reportNumber) =>
    api.get(`/api/v1/reports/history/${encodeURIComponent(reportNumber)}`),

  getReportVersions: (reportNumber) =>
    api.get(`/api/v1/reports/versions/${encodeURIComponent(reportNumber)}`),

  deleteReport: (id) =>
    api.delete(`/api/v1/reports/${id}`),
}

export default reportService
