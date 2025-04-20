export const resHelper = (res, status, message, data = null) => {
  const success = status >= 200 && status < 300;
  return res.status(status).json({ success, message, data });
};
