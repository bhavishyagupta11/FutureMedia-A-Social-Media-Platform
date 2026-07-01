const env = require("../config/env");

class RecommendationService {
  async getSuggestedUsers(userId) {
    if (!env.features.intelligence) {
      const err = new Error("Feature unavailable. Python Intelligence service is disabled.");
      err.status = 503;
      err.meta = { warning: "Recommendations disabled" };
      throw err;
    }
    // Attempt external call if implemented later
    const err = new Error("Feature unavailable.");
    err.status = 503;
    throw err;
  }
}
module.exports = new RecommendationService();
