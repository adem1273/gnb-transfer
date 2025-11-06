export default function responseMiddleware(req, res, next) {
  res.apiSuccess = (data = null, message = 'OK') => res.json({ success: true, message, data });
  res.apiError = (message = 'Error', status = 500) => res.status(status).json({ success: false, message, data: null });
  next();
}
