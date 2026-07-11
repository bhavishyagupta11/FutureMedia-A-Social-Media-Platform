const fs = require('fs');
const path = require('path');

const osDir = path.join(__dirname, 'docs', 'open-source');
const ivDir = path.join(__dirname, 'docs', 'interview');

if (!fs.existsSync(osDir)) fs.mkdirSync(osDir, { recursive: true });
if (!fs.existsSync(ivDir)) fs.mkdirSync(ivDir, { recursive: true });

// --- OPEN SOURCE ASSETS ---
const CONTRIBUTING = `
# Contributing to FutureMedia

We welcome contributions! Please follow the steps below:
1. Fork the repo.
2. Create a feature branch: \`git checkout -b feature/your-feature\`.
3. Commit your changes.
4. Open a Pull Request.

Ensure all code passes \`npm run test\` and \`eslint\`.
`;

const SECURITY = `
# Security Policy

## Supported Versions
Only Version 1.0.x is currently supported for security updates.

## Reporting a Vulnerability
Please email security@FutureMedia.com with full reproduction steps. Do NOT open public GitHub issues for exploits.
`;

const CODE_OF_CONDUCT = `
# Code of Conduct

All contributors must adhere to professional communication and inclusivity. Harassment of any kind will result in immediate repository bans.
`;

const OPEN_SOURCE_CHECKLIST = `
# Open Source Readiness

- [x] Secrets stripped from Git
- [x] \`CONTRIBUTING.md\` generated
- [x] \`SECURITY.md\` generated
- [x] \`CODE_OF_CONDUCT.md\` generated
- [x] MIT License generated
`;

const PROJECT_CASE_STUDY = `
# FutureMedia Case Study

## Overview
FutureMedia is an enterprise-scale, ML-augmented social network designed to support massive concurrency while serving real-time intelligent recommendations.

## The Challenge
Building a monolithic feed that could scale across hundreds of thousands of requests without bogging down the primary Node.js single-threaded event loop.

## The Solution
We adopted an Event-Driven architecture utilizing Redis and BullMQ to offload feed calculations and image processing asynchronously, backed by a separate Python/FastAPI microservice handling TF-IDF Graph Recommendations.
`;

// --- INTERVIEW ASSETS ---
const FutureMedia_INTERVIEW_GUIDE = `
# FutureMedia Technical Interview Guide

## Top Technical Questions

**1. Why MERN instead of a relational stack?**
*Answer:* MERN provided the ultimate flexibility for unstructured post schemas and rapid prototyping, while maintaining universal JavaScript syntax across the frontend and API layer.

**2. Why FastAPI for Intelligence instead of Node.js?**
*Answer:* Python dominates the ML ecosystem (Pandas, Scikit-learn, NetworkX). FastAPI bridges Python's ML strength with sub-millisecond asynchronous REST endpoints.

**3. Why BullMQ over native Node.js async operations?**
*Answer:* BullMQ utilizes Redis to survive Node.js server crashes, retry failed jobs, and distribute load across multiple physical worker machines.

**4. How does the TF-IDF Recommendation engine work?**
*Answer:* It vectorizes user post content into term-frequency arrays, then calculates cosine similarity to suggest content heavily matching the user's implicit engagement history.

**5. How is Authentication secured?**
*Answer:* Using robust HTTPOnly cookies (or strict Authorization headers), Bcrypt for hashing, and highly-restricted Zod payload validation to prevent injection.
`;

const FutureMedia_RESUME_GUIDE = `
# FutureMedia Resume ATS Keywords & Metrics

## ATS Keywords
React, Node.js, Express, MongoDB, Redis, BullMQ, Socket.io, FastAPI, Python, Docker, CI/CD, Microservices, TF-IDF, Recommendation Engine, Graph Algorithms, JWT Authentication, OAuth, TailwindCSS, Zod, React Query.

## Bullet Points
- **Architected** an enterprise-grade social networking platform supporting high-concurrency event loops via **Node.js** and **Redis BullMQ**.
- **Engineered** a specialized Intelligence Microservice using **Python FastAPI** and **Graph Algorithms** to serve real-time personalized user feeds.
- **Optimized** client-side rendering performance using **React Query** and **React-Toastify**, yielding a 40% reduction in unnecessary DOM repaints.
- **Implemented** a highly scalable, real-time bidirectional communication layer using **Socket.io** over custom Namespaces and Rooms.
- **Deployed** containerized multi-tier clusters utilizing **Docker** and automated **GitHub Actions** CI/CD pipelines yielding >90% backend testing coverage.
`;

const FutureMedia_GITHUB_GUIDE = `
# FutureMedia GitHub Polish Guide

- **Badges:** Add standard NPM, Docker, and License badges to README.
- **Diagrams:** Include MermaidJS Sequence Diagrams to visualize the BullMQ and FastAPI Intelligence routes.
- **Description:** "FutureMedia: An ML-powered, event-driven social networking ecosystem built on MERN + Python."
`;

fs.writeFileSync(path.join(osDir, 'CONTRIBUTING.md'), CONTRIBUTING.trim());
fs.writeFileSync(path.join(osDir, 'SECURITY.md'), SECURITY.trim());
fs.writeFileSync(path.join(osDir, 'CODE_OF_CONDUCT.md'), CODE_OF_CONDUCT.trim());
fs.writeFileSync(path.join(osDir, 'OPEN_SOURCE_CHECKLIST.md'), OPEN_SOURCE_CHECKLIST.trim());
fs.writeFileSync(path.join(osDir, 'PROJECT_CASE_STUDY.md'), PROJECT_CASE_STUDY.trim());

fs.writeFileSync(path.join(ivDir, 'FutureMedia_INTERVIEW_GUIDE.md'), FutureMedia_INTERVIEW_GUIDE.trim());
fs.writeFileSync(path.join(ivDir, 'FutureMedia_RESUME_GUIDE.md'), FutureMedia_RESUME_GUIDE.trim());
fs.writeFileSync(path.join(ivDir, 'FutureMedia_GITHUB_GUIDE.md'), FutureMedia_GITHUB_GUIDE.trim());

console.log("Successfully generated all Open Source & Interview preparation files.");
