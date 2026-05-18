# Testing Quick Reference Guide

This document provides quick commands and instructions for running all project tests.

## Table of Contents

- [Automated Tests](#automated-tests)
  - [Backend Tests](#backend-tests)
  - [Frontend Tests](#frontend-tests)
  - [Coverage Reports](#coverage-reports)
- [Manual UAT Tests](#manual-uat-tests)
- [Test Case Mapping](#test-case-mapping)
- [Test Results Summary](#test-results-summary)

---

## Automated Tests

### Backend Tests

**Run all backend tests:**

```bash
cd backend
python -m pytest
```

**Run with coverage:**

```bash
cd backend
python -m pytest --cov=app --cov-report=html
```

**Run specific test file:**

```bash
cd backend
python -m pytest tests/test_auth.py -v
```

**Run specific test case:**

```bash
cd backend
python -m pytest tests/test_auth.py::test_login_success -v
```

**Run tests by TC ID (Test Case ID):**

```bash
# TC-009: User Registration
python -m pytest tests/test_auth.py::test_register_success -v

# TC-011: Login/Logout
python -m pytest tests/test_auth.py::test_login_success -v

# TC-014: PNG Import
python -m pytest tests/test_files.py::test_upload_png_and_get_thumb -v

# TC-019: UUID Storage
python -m pytest tests/test_files.py::test_upload_generates_unique_uuid -v

# TC-025-028: Annotation Types
python -m pytest tests/test_overlay.py::test_draw_annotations_covers_all_shapes -v

# TC-043: SVS Patch Extraction
python -m pytest tests/test_files.py::test_patch_extraction_svs -v
```

**Backend Coverage:** ~98%

---

### Frontend Tests

**Run all frontend tests:**

```bash
cd frontend
npm run test
```

**Run with coverage:**

```bash
cd frontend
npm run test:coverage
```

**Run specific test file:**

```bash
cd frontend
npx vitest run client/__tests__/AuthContext.test.tsx
```

**Run tests by TC ID:**

```bash
# TC-009, TC-010, TC-011: Authentication
npx vitest run client/__tests__/AuthContext.test.tsx client/__tests__/AuthDialog.test.tsx

# TC-010: Password Validation
npx vitest run client/__tests__/password.test.ts

# TC-029-033: Annotations
npx vitest run client/__tests__/AnnotationSidebar.test.tsx
```

**Watch mode (auto-rerun on changes):**

```bash
cd frontend
npm run test:watch
```

**Frontend Coverage:** ~86%

---

## Coverage Reports

### Generate Coverage Reports

**Backend:**

```bash
cd backend
python -m pytest --cov=app --cov-report=html --cov-report=term
```

View report: Open `backend/htmlcov/index.html` in browser

**Frontend:**

```bash
cd frontend
npm run test:coverage
```

View report: Open `frontend/coverage/index.html` in browser

### Coverage Thresholds

| Component | Current Coverage | Target |
|-----------|------------------|--------|
| Backend | 98% | ≥ 90% |
| Frontend | 86% | ≥ 80% |

---

## Manual UAT Tests

### Documentation

All manual User Acceptance Tests are documented in:

📄 **[UAT_TEST_CASES.md](UAT_TEST_CASES.md)**

### UAT Test Categories

1. **Installation & Setup (TC-001 to TC-003)**
   - README installation guide verification
   - Application launch and first run
   - Offline functionality testing

2. **Browser Compatibility (TC-004 to TC-008)**
   - Responsiveness at 1280×720
   - Responsiveness at 1920×1080
   - Initial page load performance
   - Chrome and Edge compatibility
   - Window resize handling

3. **Image Navigation (TC-020 to TC-024)**
   - Pan functionality
   - Pan with annotations sync
   - Zoom controls
   - Zoom with annotations sync
   - Frame rate consistency

4. **Patch Tool UI (TC-040 to TC-042)**
   - Tool availability
   - Selection user experience
   - Download workflow

5. **Category & Color Management (TC-044 to TC-047)**
   - Create custom category
   - Remove custom category
   - Add custom color
   - Remove custom color

### Running UAT Tests

1. Open `UAT_TEST_CASES.md`
2. Follow test steps for each test case
3. Record results in the document
4. Mark Pass/Fail checkboxes
5. Add notes for any issues
6. Sign and date completed tests

---

## Test Case Mapping

### Complete TC ID to Test Mapping

| TC Range | Coverage Type | Location | User Story |
|----------|---------------|----------|------------|
| TC-001 to TC-003 | Manual UAT | UAT_TEST_CASES.md | 2.1.1 Installation |
| TC-004 to TC-008 | Manual UAT | UAT_TEST_CASES.md | 2.1.2 Browser App |
| TC-009 to TC-013 | Automated | backend/tests/test_auth.py, test_admin.py | 2.1.3 Authentication |
| TC-014 to TC-019 | Automated | backend/tests/test_files.py | 2.1.4 Import Image |
| TC-020 to TC-024 | Manual UAT | UAT_TEST_CASES.md | 2.1.5 Image Actions |
| TC-025 to TC-034 | Automated | backend/tests/test_overlay.py | 2.1.6 Annotations |
| TC-029 to TC-033 | Automated | frontend/client/__tests__/AnnotationSidebar.test.tsx | 2.1.6 Annotations |
| TC-035 to TC-039 | Automated | backend/tests/test_files.py | 2.1.7 Export Images |
| TC-040 to TC-043 | Mixed | UAT_TEST_CASES.md + test_files.py | 2.1.8 Patch Tool |
| TC-044 to TC-047 | Manual UAT | UAT_TEST_CASES.md | 2.1.9 Categories |

### Quick Test Commands by User Story

**2.1.3 Sign Up and Authentication:**

```bash
cd backend && python -m pytest tests/test_auth.py tests/test_admin.py -v
cd frontend && npx vitest run client/__tests__/AuthContext.test.tsx client/__tests__/AuthDialog.test.tsx
```

**2.1.4 Import Image:**

```bash
cd backend && python -m pytest tests/test_files.py::test_upload_png_and_get_thumb tests/test_files.py::test_upload_svs_thumbnail_success tests/test_files.py::test_upload_generates_unique_uuid -v
```

**2.1.6 Annotations:**

```bash
cd backend && python -m pytest tests/test_overlay.py -v
cd frontend && npx vitest run client/__tests__/AnnotationSidebar.test.tsx
```

**2.1.7 Export Images:**

```bash
cd backend && python -m pytest tests/test_files.py -k "export" -v
```

**2.1.8 Patch Tool:**

```bash
cd backend && python -m pytest tests/test_files.py -k "patch" -v
```

---

## Test Results Summary

### Latest Test Run

**Date:** _____________

**Automated Tests:**

| Test Suite | Total | Passed | Failed | Skipped | Coverage |
|------------|-------|--------|--------|---------|----------|
| Backend | - | - | - | - | 98% |
| Frontend | - | - | - | - | 86% |
| **Total** | **-** | **-** | **-** | **-** | **92%** |

**UAT Tests:**

| Category | Total | Passed | Failed | Not Tested |
|----------|-------|--------|--------|------------|
| Installation | 3 | - | - | - |
| Browser Compatibility | 5 | - | - | - |
| Image Navigation | 5 | - | - | - |
| Patch Tool | 3 | - | - | - |
| Category/Color Mgmt | 4 | - | - | - |
| **Total** | **20** | **-** | **-** | **-** |

---

## Continuous Integration (CI)

### GitHub Actions (if configured)

Tests can be configured to run automatically on:

- Every push to main branch
- Every pull request
- On schedule (nightly)

**Example CI command:**

```yaml
# .github/workflows/test.yml
- name: Backend Tests
  run: cd backend && python -m pytest --cov=app

- name: Frontend Tests
  run: cd frontend && npm run test:coverage
```

---

## Troubleshooting

### Common Issues

**Backend tests fail with database errors:**

```bash
# Reset test database
cd backend
rm -rf app_data/test_*.db
python -m pytest
```

**Frontend tests fail with module errors:**

```bash
# Reinstall dependencies
cd frontend
rm -rf node_modules
npm install
npm run test
```

**Coverage report not generating:**

```bash
# Backend
cd backend
pip install pytest-cov

# Frontend
cd frontend
npm install --save-dev @vitest/coverage-v8
```

### Getting Help

- Check test output for specific error messages
- Review test file documentation
- Check `backend/README.md` and `frontend/README.md`
- Review UAT_TEST_CASES.md for manual test instructions

---

## Best Practices

### Before Committing Code

1. ✅ Run all automated tests
2. ✅ Ensure 100% pass rate
3. ✅ Check coverage hasn't decreased
4. ✅ Run relevant UAT tests for changed features
5. ✅ Update test cases if adding new features

### When Adding New Features

1. Write automated tests first (TDD)
2. Add UAT test cases for UI features
3. Update test case mapping in README
4. Ensure coverage ≥ 80%

### Test Data Management

- Use separate test database
- Clean up test files after runs
- Don't commit test data to repository
- Use fixtures for consistent test data

---

## Quick Reference Commands

```bash
# Run everything
make test                    # If Makefile configured
npm run test:all            # If package.json script exists

# Backend only
cd backend && python -m pytest -v

# Frontend only
cd frontend && npm run test

# With coverage
cd backend && python -m pytest --cov=app --cov-report=html
cd frontend && npm run test:coverage

# Watch mode (development)
cd frontend && npm run test:watch

# Specific test by TC ID
cd backend && python -m pytest tests/test_auth.py::test_login_success -v
```

---

**Last Updated:** 2025-10-26
**Maintained By:** Development Team
