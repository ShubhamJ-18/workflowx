/**
 * Standardized API Response Utilities
 */

function sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function sendError(res, message = 'An error occurred', statusCode = 500, errors = null) {
  const payload = {
    success: false,
    message,
  };

  if (errors) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
}

function sendPaginated(res, items = [], pagination = {}, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data: items,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 20,
      totalItems: pagination.totalItems || 0,
      totalPages: Math.ceil((pagination.totalItems || 0) / (pagination.limit || 20)),
      hasMore: (pagination.page || 1) * (pagination.limit || 20) < (pagination.totalItems || 0),
    },
  });
}

module.exports = {
  sendSuccess,
  sendError,
  sendPaginated,
};
