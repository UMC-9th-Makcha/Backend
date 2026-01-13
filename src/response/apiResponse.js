export const successResponse = (data, message = null) => {
  const response = { success: true, data };
  if (message) response.message = message;
  return response;
};

export const errorResponse = (code, message, details = null) => {
  const response = { success: false, error: { code, message } };
  if (details) response.error.details = details;
  return response;
};