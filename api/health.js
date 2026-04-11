const { handleApiRoute } = require("../lib/server-core");

module.exports = (req, res) => handleApiRoute(req, res, "/api/health");
