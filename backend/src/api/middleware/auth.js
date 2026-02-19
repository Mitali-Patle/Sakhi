/**
 * Simple API key authentication middleware.
 * Pass X-API-Key header matching the API_KEY env variable.
 */
function apiKeyAuth(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || key !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized. Provide a valid X-API-Key header.' });
  }
  next();
}

module.exports = { apiKeyAuth };
