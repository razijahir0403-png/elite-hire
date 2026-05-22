const { body, param, query } = require('express-validator');

const authValidators = {
  register: [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  login: [
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
};

const roleValidators = {
  create: [
    body('name').trim().notEmpty().withMessage('Role name is required'),
    body('description').optional().trim(),
    body('permissions').optional().isArray().withMessage('Permissions must be an array'),
  ],
  update: [
    param('id').isMongoId().withMessage('Valid role id is required'),
    body('name').optional().trim().notEmpty().withMessage('Role name cannot be empty'),
    body('description').optional().trim(),
    body('permissions').optional().isArray().withMessage('Permissions must be an array'),
  ],
  idParam: [param('id').isMongoId().withMessage('Valid role id is required')],
};

const requestInfoValidators = {
  create: [
    body('domain').trim().notEmpty().withMessage('Domain is required'),
    body('salaryPackage').trim().notEmpty().withMessage('Salary package is required'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('contactNumber').trim().notEmpty().withMessage('Contact number is required'),
    body('resourcePerson').trim().notEmpty().withMessage('Resource person is required'),
    body('portalLink').optional().trim(),
    body('status').optional().isInt({ min: 0, max: 16 }).toInt(),
    body('description').optional().trim(),
  ],
  update: [
    param('id').isMongoId().withMessage('Valid record id is required'),
    body('idnumber').optional().trim().notEmpty(),
    body('domain').optional().trim().notEmpty(),
    body('salaryPackage').optional().trim(),
    body('location').optional().trim(),
    body('contactNumber').optional().trim(),
    body('resourcePerson').optional().trim(),
    body('portalLink').optional().trim(),
  ],
  updateStatus: [
    param('id').isMongoId().withMessage('Valid record id is required'),
    body('status').isInt({ min: 0, max: 16 }).withMessage('Status must be a valid numeric code'),
    body('description').trim().notEmpty().withMessage('Description is required'),
  ],
  idParam: [param('id').isMongoId().withMessage('Valid record id is required')],
  listQuery: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional({ values: 'falsy' }).isInt({ min: 0, max: 16 }).toInt(),
  ],
};

const activityLogValidators = {
  create: [
    body('action').trim().notEmpty().withMessage('Action is required'),
    body('resourceType').optional().trim(),
    body('resourceId').optional().trim(),
    body('details').optional(),
  ],
  idParam: [param('id').isMongoId().withMessage('Valid activity log id is required')],
};

const userValidators = {
  approveUser: [
    param('id').isMongoId().withMessage('Valid user id is required'),
    body('isApproved').optional().isBoolean().withMessage('isApproved must be a boolean'),
  ],
  update: [
    param('id').isMongoId().withMessage('Valid user id is required'),
    body('name').optional().trim().notEmpty(),
    body('email').optional().trim().isEmail(),
    body('isApproved').optional().isBoolean(),
    body('role').optional().isMongoId(),
  ],
  idParam: [param('id').isMongoId().withMessage('Valid user id is required')],
};

const paymentTrackerValidators = {
  create: [
    body('candidateName').trim().notEmpty().withMessage('Candidate name is required'),
    body('idNumber').trim().notEmpty().withMessage('ID number is required'),
    body('contactNumber')
      .customSanitizer((v) => String(v).replace(/\D/g, ''))
      .notEmpty()
      .withMessage('Contact number is required')
      .matches(/^\d{10}$/)
      .withMessage('Contact number must be exactly 10 digits'),
    body('totalAmount').isFloat({ min: 0.01 }).withMessage('Total amount must be a positive number'),
    body('courseDetail').trim().notEmpty().withMessage('Course detail is required'),
    body('initialPaymentAmount')
      .optional({ values: 'falsy' })
      .isFloat({ min: 0 })
      .withMessage('Initial payment amount must be zero or positive'),
    body('remarks').optional({ values: 'falsy' }).trim(),
  ],
  updateDetails: [
    param('id').isMongoId().withMessage('Valid payment id is required'),
    body('candidateName').optional({ values: 'falsy' }).trim().notEmpty(),
    body('idNumber').optional({ values: 'falsy' }).trim().notEmpty(),
    body('contactNumber')
      .optional({ values: 'falsy' })
      .customSanitizer((v) => String(v).replace(/\D/g, ''))
      .matches(/^\d{10}$/)
      .withMessage('Contact number must be exactly 10 digits'),
    body('courseDetail').optional({ values: 'falsy' }).trim().notEmpty(),
  ],
  recordPayment: [
    param('id').isMongoId().withMessage('Valid payment id is required'),
    body('newPaymentAmount')
      .isFloat({ min: 0.01 })
      .withMessage('New payment amount must be greater than zero'),
    body('remarks').optional({ values: 'falsy' }).trim(),
  ],
  idParam: [param('id').isMongoId().withMessage('Valid payment id is required')],
  listQuery: [
    query('page').optional({ values: 'falsy' }).isInt({ min: 1 }),
    query('limit').optional({ values: 'falsy' }).isInt({ min: 1, max: 100 }),
    query('dateFrom').optional({ values: 'falsy' }).isISO8601().withMessage('dateFrom must be a valid date'),
    query('dateTo').optional({ values: 'falsy' }).isISO8601().withMessage('dateTo must be a valid date'),
    query('searchCandidate').optional({ values: 'falsy' }).trim(),
    query('searchIdNumber').optional({ values: 'falsy' }).trim(),
    query('status').optional({ values: 'falsy' }).isInt({ min: 0, max: 2 }).toInt(),
    query('sortBy').optional({ values: 'falsy' }).trim(),
    query('sortOrder').optional({ values: 'falsy' }).isIn(['asc', 'desc']),
  ],
};

module.exports = {
  authValidators,
  roleValidators,
  requestInfoValidators,
  activityLogValidators,
  userValidators,
  paymentTrackerValidators,
};
