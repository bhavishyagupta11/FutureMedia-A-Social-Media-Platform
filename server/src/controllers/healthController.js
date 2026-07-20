const mongoose = require("mongoose");
const env = require("../config/env");
const { successResponse } = require("../utils/responseHandler");

exports.getHealth = async (req, res) => {
  const health = {
    status: "OK",
    version: "2.0.0",
    applicationMode: "Development",
    coreServices: {
      mongodb: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
      jwt: env.JWT_SECRET ? "Configured" : "Unconfigured"
    },
    optionalServices: {
      redis: env.features.redis ? "Connected" : "Disabled",
      bullmq: env.features.bullmq ? "Running" : "Disabled",
      smtp: env.features.smtp ? "Configured" : "Disabled",
      cloudinary: env.features.cloudinary ? "Configured" : "Local Storage Mode",
      intelligence: env.features.intelligence ? "Configured" : "Disabled",
      socket: env.features.socket ? "Configured" : "Disabled"
    },
    enabledFeatures: env.features
  };
  return successResponse(res, 200, "Healthy", health);
};

exports.getReady = (req, res) => res.json({ status: "Ready" });
exports.getLive = (req, res) => res.json({ status: "Alive" });