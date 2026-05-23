/**
 * API paths relative to axios baseURL (which already includes /api).
 * Do NOT prefix these with /api — that would duplicate the baseURL segment.
 */
export const API_PATHS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
  },
  users: {
    list: '/users',
    approve: (id) => `/users/${id}/approve`,
  },
  roles: {
    list: '/roles',
    detail: (id) => `/roles/${id}`,
  },
  requestinfos: {
    list: '/requestinfos',
    detail: (id) => `/requestinfos/${id}`,
  },
  analytics: {
    list: '/analytics',
    detail: (id) => `/analytics/${id}`,
    updateStatus: (id) => `/analytics/update-status/${id}`,
    history: (id) => `/analytics/history/${id}`,
  },
  paymentTracker: {
    list: '/payment-tracker',
    summary: '/payment-tracker/summary',
    detail: (id) => `/payment-tracker/${id}`,
    payments: (id) => `/payment-tracker/${id}/payments`,
    history: (id) => `/payment-tracker/history/${id}`,
  },
  activitylogs: {
    list: '/activitylogs',
  },
};
