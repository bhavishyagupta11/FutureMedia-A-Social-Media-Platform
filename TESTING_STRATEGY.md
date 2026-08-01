# FutureMedia Testing Strategy & Architecture

## Overview
FutureMedia employs a dual-layer testing architecture designed for maximum confidence, performance, and developer velocity. Component rendering and unit logic are verified using **Jest** and **React Testing Library**, while full end-to-end integration workflows, cross-browser compatibility, multi-viewport responsiveness, and multi-user interactions are validated using **Playwright**.

---

## 1. Testing Layer Responsibilities

```
+-----------------------------------------------------------------------+
|                         PLAYWRIGHT (E2E)                              |
|  - Full Multi-Viewport Regression (Desktop Chromium, Tablet, Mobile)   |
|  - Two-User Context Interactions (Follow, Like Notification, Chat)    |
|  - Multi-Page Navigation & Session Persistence                        |
|  - Network Waterfall, FCP/LCP Performance Audit & Quality Gates       |
+-----------------------------------------------------------------------+
                                   |
                                   v
+-----------------------------------------------------------------------+
|                          JEST (Unit & Component)                      |
|  - Application Root Bootstrap & Provider Hierarchy Integration        |
|  - Component Render Testing (React 19 & React Router v7 Integration)   |
|  - Helper Utility & Pure Function Verification                        |
+-----------------------------------------------------------------------+
```

| Layer | Framework | Target Scope | Execution Command |
|---|---|---|---|
| **Unit & Component** | **Jest** (`react-scripts test`) | Component bootstrap, root providers, pure utilities | `npm test -- --watchAll=false` |
| **End-to-End Regression** | **Playwright** (`@playwright/test`) | Full UI workflows, multi-user flows, multi-viewport rendering | `npx playwright test` |

---

## 2. Directory Structure & Organization

```
social/
├── src/
│   ├── App.test.js               # Jest Root Application Shell Render Test
│   ├── setupTests.js             # Jest DOM & TextEncoder/Decoder Polyfills
│   └── app/
│       └── App.js                # Root Application Component
└── tests/                        # Playwright E2E Suite
    ├── helpers/
    │   └── testHelpers.js        # DB Connection, API Seed & Auth Helpers
    ├── pages/                    # Page Object Models (POMs)
    │   ├── AuthPage.js
    │   ├── FeedPage.js
    │   ├── NavigationPage.js
    │   ├── NotificationsPage.js
    │   ├── ProfilePage.js
    │   └── SearchPage.js
    └── e2e/                      # E2E Test Specifications
        ├── auth.spec.js          # Registration, Login, Session Persistence
        ├── follow.spec.js        # Follow/Unfollow & Follower Counters
        ├── navigation.spec.js    # Sidebar, BottomNav, Route Guards
        ├── posts.spec.js         # Post Creation, Deletion, Likes, Comments
        ├── profile.spec.js       # Profile View & Bio Updates
        ├── qualityAndPerformance.spec.js # Quality Gates & Performance Audit
        ├── settings.spec.js      # Account, Privacy & Dark Mode Toggles
        └── twoUserSession.spec.js # Multi-User Concurrent Context Workflows
```

---

## 3. Quality Gates & Enforcement

- **Gate 1: Zero Unit & Component Failures**: `npm test -- --watchAll=false` must exit with code 0.
- **Gate 2: 100% E2E Multi-Viewport Pass**: All Playwright scenarios must pass across Desktop (Chromium), Tablet (1024x768), and Mobile (390x844).
- **Gate 3: Performance & Console Audits**: FCP must be under 1.5s, LCP under 2.5s, with zero uncaught browser console errors or failed 500 HTTP requests.

---

## 4. Execution Commands

```bash
# Run Jest Unit/Component Test Suite
cd social
npm test -- --watchAll=false

# Run Full Playwright Multi-Viewport E2E Suite
npx playwright test

# Run Chromium Desktop E2E Suite Only
npx playwright test --project=chromium
```
