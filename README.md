# ANN - Image Annotation Tool (COMP5615_F13_05_P29)

## INSTALLATION

We provide installers for the three most common platforms. Please follow the steps for your operating system:

🖥️ Windows

1. Download the installer file: [ann-standalone-1.0.0-windows-x86_64.exe](https://github.sydney.edu.au/emon0711/COMP5615_F13_05_P29/releases/download/v1.0.0/ann-standalone-1.0.0-windows-x86_64.exe).
2. Double-click the file to start the installation wizard.
3. The system will launch the application on the command line.

Once finished, the wep application will be displayed on the default browser. If that's not the case, enter the following URL: http://localhost:8080/

🍏 macOS

1. Download setup.sh and start.sh from https://github.sydney.edu.au/emon0711/COMP5615_F13_05_P29/tree/main/MacFile (MacFile folder), then move both  files to folder you want to download and use for installation.
2. Open Terminal on designated folder
3. Run to make the files to be executable : 
```bash
chmod +x setup.sh start.sh
```
3. Run and enter credential for github.sydney.edu.au  :
```bash
./setup.sh
```
4. Folder COMP5615_F13_05_P29 will be created at designated location.
5. To run the app, using Terminal in folder containing start.sh run : 
```bash
./start.sh
```
6. Once finished, the wep application will be displayed on the default browser. If that's not the case, enter the following URL: http://localhost:8080/

🐧 Linux

1. Download the binary file: [ann-standalone-1.0.0-linux-x86_64](https://github.sydney.edu.au/emon0711/COMP5615_F13_05_P29/releases/download/v1.0.0/ann-standalone-1.0.0-linux-x86_64).
2. Open a terminal in the folder where you downloaded it.
3. Give it permission to run (only needed the first time):

```bash
chmod +x ann-standalone-1.0.0-linux-x86_64
```

Run the app with:

```bash
./ann-standalone-1.0.0-linux-x86_64
```

# DEVELOPMENT

Our team is developing an interactive responsive web application for annotating cell images that could run locally. Support multi-category manual segmentation, mask management, and image/mask download.

## Statement

This project will have some key requirements including but not limited to:

- **Responsive Design:** The system should be able to adapts to browser sizes.
- **Local Execution:** The system should be able to be run in local desktop.
- **Image Upload:** The system should be able to supports uploading images and masks in `.svs` and `.png` formats.
- **Image Conversion:** The system should be able to converts `.svs` files to `.jpg` or `.png`.
- **Manual Mask Segmentation:**
  - The system should be able to save each mask with a unique mask ID (per image, starting from 1).
  - The system should allow users to define custom cell categories (e.g., Blood cell, Muscle cell, etc.), each with an associated mask color.
  - The system should be able to perform segmentation by selecting a cell category (default provided).
- **Mask Editing:** The system should be able to modify or delete existing masks.
- **Category Filtering:** The system should be able to display masks by category, view all, and save masks.
- **Color-Coded Masks:** The system should allow user to make each cell category in a unique color.
- **Mask Management:** The system should be able to save masks for later use.
- **Downloads:** The system should be able to download images, patches, and masks individually, in groups, or all at once.

## Team

- Gregorius Andrew Winata
- Byron Quintuna
- Ellis Mon
- Jiakun Li
- Enyuan Zhang

## Tools

- **Frontend:** React
- **Backend:** FastAPI (Python)
- **Database:** SQLite

## Development Environment Setup

1. **Requirements**

   The source code of this application is based on the following languages and frameworks:

   - [Python 3.12](https://www.python.org/downloads/)
   - [NodeJS >18.19.1](https://nodejs.org/en/download/)
   - [git](https://git-scm.com/downloads)

2. **Clone the repository**

   ```bash
   git clone https://github.sydney.edu.au/emon0711/COMP5615_F13_05_P29.git
   cd COMP5615_F13_05_P29
   python -m venv env #Install Virtual Environtments *Recommended
   ```

3. **Backend Setup (FastAPI)**
   Make sure you're inside of `COMP5615_F13_05_P29`

   ```bash
   source env/bin/activate #Activate Virtual Environtments
   cd backend
   pip install -r requirements.txt
   ```

4. **Frontend Setup (React)**
   Make sure you're inside of `COMP5615_F13_05_P29`
   ```bash
   cd frontend
   npm install
   ```

## Initialization Guide

### Launch Frontend

Make sure you're inside of `COMP5615_F13_05_P29`

```
cd frontend
npm start
```

### Launch Backend

Make sure you're inside of `COMP5615_F13_05_P29`

```bash
source env/bin/activate #Activate Virtual Environtments
cd backend
uvicorn app.main:app --reload --port 5001
```

Go to a web browser and access `http://localhost:8080/`. Sample user : 'admin@local.com' and password: 'admin', without the quotation marks.

## Testing

The project includes comprehensive test suites for both frontend and backend components.

### Backend Tests (Python/Pytest)

The backend uses **pytest** for unit and integration testing.

#### Run All Backend Tests

```bash
cd backend
pytest
```

#### Run Tests with Coverage Report

```bash
cd backend
pytest --cov=app --cov-report=term-missing
```

Or using the Makefile:

```bash
make pytest-cov
```

#### View HTML Coverage Report

After running tests with coverage, open the HTML report:

```bash
cd backend
pytest --cov=app --cov-report=html
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
start htmlcov/index.html  # Windows
```

#### Run Specific Test Files

```bash
cd backend
pytest tests/test_auth.py
pytest tests/test_files.py -v  # verbose output
```

**Backend Test Coverage:**
- Statement Coverage: **~98%**
- All API endpoints, authentication, database operations, and file I/O are tested

### Frontend Tests (Vitest/React Testing Library)

The frontend uses **Vitest** and **React Testing Library** for component and unit testing.

#### Run All Frontend Tests

```bash
cd frontend
npm run test
```

Or using Vitest directly:

```bash
cd frontend
npx vitest run
```

#### Run Tests with Coverage Report

```bash
cd frontend
npm run test:coverage
```

Or using the Makefile:

```bash
make vitest-cov
```

#### View HTML Coverage Report

After running tests with coverage, open the HTML report:

```bash
cd frontend
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

#### Run Tests in Watch Mode (for development)

```bash
cd frontend
npm run test:watch
```

#### Run Specific Test Files

```bash
cd frontend
npx vitest run client/__tests__/AuthContext.test.tsx
npx vitest run client/__tests__/Header.test.tsx -t "shows a sign-in button"  # specific test
```

**Frontend Test Coverage:**
- Statement Coverage: **~86.15%**
- All core components, hooks, utilities, and pages are tested

### Run All Tests

To run all tests (backend, frontend unit) with linting:

```bash
make test
```

This command runs:
1. Frontend unit tests (Vitest)
3. Code formatting/linting

### Test Structure

```
COMP5615_F13_05_P29/
├── backend/
│   └── tests/
│       ├── test_auth.py          # Authentication tests
│       ├── test_files.py         # File upload/download tests
│       ├── test_admin.py         # Admin functionality tests
│       ├── test_user_service.py  # User service tests
│       └── conftest.py           # Pytest fixtures
│
└── frontend/
    ├── client/__tests__/         # Unit/component tests
        ├── AuthContext.test.tsx
        ├── Header.test.tsx
        ├── AnnotationSidebar.test.tsx
        └── ...
```

### Coverage Reports

Coverage reports are generated in the following locations:

- **Backend:** `backend/htmlcov/index.html`
- **Frontend:** `frontend/coverage/index.html`

**Note:** Complex integration components (ImageViewer, Layout, UserManagement) are excluded from coverage metrics as they are better tested through E2E tests.

### Test Case ID Mapping

The following table maps acceptance criteria test case IDs to their actual implementation in the test suite:

| Test ID | Test File | Test Function/Description | User Story |
|---------|-----------|---------------------------|------------|
| TC-009 | `backend/tests/test_auth.py` | `test_register_success` - Verify user registration via Sign Up | 2.1.3 Sign Up and Authentication |
| TC-009 | `frontend/client/__tests__/AuthDialog.test.tsx` | `TC-009: registers a new user and surfaces backend data` | 2.1.3 Sign Up and Authentication |
| TC-010 | `backend/tests/test_auth.py` | `test_register_name_too_short` - Verify password validation | 2.1.3 Sign Up and Authentication |
| TC-010 | `frontend/client/__tests__/AuthDialog.test.tsx` | `TC-010: prevents registration when passwords do not match` | 2.1.3 Sign Up and Authentication |
| TC-010 | `frontend/client/__tests__/password.test.ts` | `TC-010: captures multiple issues for a weak password` | 2.1.3 Sign Up and Authentication |
| TC-010 | `frontend/client/__tests__/password.test.ts` | `TC-010: flags leading or trailing spaces` | 2.1.3 Sign Up and Authentication |
| TC-011 | `backend/tests/test_auth.py` | `test_login_success` - Users can log in and log out | 2.1.3 Sign Up and Authentication |
| TC-011 | `backend/tests/test_auth.py` | `test_login_invalid_password` - Invalid credentials rejection | 2.1.3 Sign Up and Authentication |
| TC-011 | `backend/tests/test_auth.py` | `test_me_with_token` - JWT token authentication | 2.1.3 Sign Up and Authentication |
| TC-011 | `frontend/client/__tests__/AuthContext.test.tsx` | `TC-011: hydrates user information from localStorage on mount` | 2.1.3 Sign Up and Authentication |
| TC-011 | `frontend/client/__tests__/AuthContext.test.tsx` | `TC-011: logs in by calling the API, decoding the token` | 2.1.3 Sign Up and Authentication |
| TC-011 | `frontend/client/__tests__/AuthContext.test.tsx` | `TC-011: logs out by clearing storage and context state` | 2.1.3 Sign Up and Authentication |
| TC-011 | `frontend/client/__tests__/AuthDialog.test.tsx` | `TC-011: submits login credentials and closes the dialog` | 2.1.3 Sign Up and Authentication |
| TC-011 | `frontend/client/__tests__/AuthDialog.test.tsx` | `TC-011: shows an error message when login fails` | 2.1.3 Sign Up and Authentication |
| TC-012 | Password hashing verified in backend implementation (bcrypt) | Backend uses bcrypt for password hashing | 2.1.3 Sign Up and Authentication |
| TC-013 | `backend/tests/test_admin.py` | `test_create_user_and_duplicate_and_validation` - Admin user creation | 2.1.3 Sign Up and Authentication |
| TC-014 | `backend/tests/test_files.py` | `test_upload_png_and_get_thumb` - Verify PNG file import | 2.1.4 Import image |
| TC-015 | `backend/tests/test_files.py` | `test_upload_svs_thumbnail_success` - Verify SVS file import | 2.1.4 Import image |
| TC-016 | `backend/tests/test_files.py` | `test_upload_rejects_bad_extension` - Unsupported format rejection | 2.1.4 Import image |
| TC-017 | `backend/tests/test_files.py` | `test_thumb_not_found` - Verify image rendering | 2.1.4 Import image |
| TC-018 | Integration test with 497MB SVS files | Large file handling tested using OpenSeaDragon | 2.1.4 Import image |
| TC-019 | `backend/tests/test_files.py` | `test_upload_generates_unique_uuid` - UUID storage verification | 2.1.4 Import image |
| TC-020-028 | Pan/zoom functionality | Tested via manual UAT and integration tests | 2.1.5 Image actions |
| TC-025 | `backend/tests/test_overlay.py` | `test_draw_annotations_covers_all_shapes` - Rectangle annotation | 2.1.6 Annotations |
| TC-026 | `backend/tests/test_overlay.py` | `test_draw_annotations_covers_all_shapes` - Circle annotation | 2.1.6 Annotations |
| TC-027 | `backend/tests/test_overlay.py` | `test_draw_annotations_covers_all_shapes` - Freehand annotation | 2.1.6 Annotations |
| TC-028 | `backend/tests/test_overlay.py` | `test_draw_annotations_covers_all_shapes` - Text annotation | 2.1.6 Annotations |
| TC-029 | `frontend/client/__tests__/AnnotationSidebar.test.tsx` | `TC-029: shows an empty state when no annotations exist` | 2.1.6 Annotations |
| TC-030 | `frontend/client/__tests__/AnnotationSidebar.test.tsx` | `TC-030: invokes callbacks when selecting tools and adjusting appearance` | 2.1.6 Annotations |
| TC-031 | `frontend/client/__tests__/AnnotationSidebar.test.tsx` | `TC-031: updates annotation properties when selected` | 2.1.6 Annotations |
| TC-032 | `frontend/client/__tests__/AnnotationSidebar.test.tsx` | `TC-032 & TC-033: allows toggling and deleting annotations` | 2.1.6 Annotations |
| TC-033 | `frontend/client/__tests__/AnnotationSidebar.test.tsx` | `TC-032 & TC-033: allows toggling and deleting annotations` (eraser) | 2.1.6 Annotations |
| TC-034 | `backend/tests/test_overlay.py` | `test_scale_points_scales_to_destination` - Annotation transformation sync | 2.1.6 Annotations |
| TC-035 | `backend/tests/test_files.py` | `test_download_original_png` - Verify base image export | 2.1.7 Export images |
| TC-036 | `backend/tests/test_files.py` | `test_export_png_annotations_mode` - Verify JSON mask export | 2.1.7 Export images |
| TC-037 | `backend/tests/test_files.py` | `test_export_png_image_modes` - Verify PNG mask export | 2.1.7 Export images |
| TC-038 | `backend/tests/test_files.py` | `test_export_png_image_modes` - Verify composite export | 2.1.7 Export images |
| TC-039 | `backend/tests/test_files.py` | `test_export_png_all_mode` - Verify export resolution independence | 2.1.7 Export images |
| TC-040 | Patch tool UI | Tested via manual UAT - Patch tool button availability | 2.1.8 Patch tool |
| TC-041 | `backend/tests/test_files.py` | `test_patch_extraction_non_svs` - Verify region selection | 2.1.8 Patch tool |
| TC-042 | `backend/tests/test_files.py` | `test_patch_extraction_invalid_level` - Verify patch download | 2.1.8 Patch tool |
| TC-043 | `backend/tests/test_files.py` | `test_patch_extraction_svs` - SVS patch at high resolution | 2.1.8 Patch tool |
| TC-044-047 | `frontend/client/__tests__/AnnotationSidebar.test.tsx` | `TC-030: invokes callbacks...` - Category/color management | 2.1.9 Categories and colors |

**Additional Tests:**

Many more tests exist covering edge cases, error handling, and integration scenarios. The above mapping shows the primary tests for each acceptance criteria. For a complete list of all tests, see:

- Backend: `backend/tests/` directory (~98% coverage)
- Frontend: `frontend/client/__tests__/` directory (~86% coverage)

### User Acceptance Testing (UAT)

Manual UAT test cases for UI/UX validation, browser compatibility, and user workflows are documented in:

- **UAT Test Cases:** [`UAT_TEST_CASES.md`](UAT_TEST_CASES.md)

The UAT document covers:

- TC-001 to TC-003: Installation and setup verification
- TC-004 to TC-008: Browser compatibility and responsiveness testing
- TC-020 to TC-024: Pan/zoom user experience validation
- TC-040 to TC-042: Patch tool UI testing
- TC-044 to TC-047: Category and color management

These manual tests complement the automated test suite to provide comprehensive quality assurance.


## Keyboard Shortcuts

The application supports various keyboard shortcuts to improve workflow efficiency. Press `?` or `Shift + /` anytime to view the keyboard shortcuts help dialog.

### General

| Shortcut               | Description                           |
| ---------------------- | ------------------------------------- |
| `Ctrl/Cmd + Z`         | Undo last action                      |
| `Ctrl/Cmd + Y`         | Redo last undone action               |
| `Ctrl/Cmd + Shift + Z` | Redo last undone action (alternative) |
| `Ctrl/Cmd + S`         | Export annotations                    |
| `Esc`                  | Deselect annotation                   |

### Tools

| Shortcut | Description      |
| -------- | ---------------- |
| `1`      | Select tool      |
| `2`      | Pan tool         |
| `3`      | Circle tool      |
| `4`      | Rectangle tool   |
| `5`      | Freehand tool    |
| `6`      | Measurement tool |
| `7`      | Eraser tool      |
| `8`      | Text tool        |

### Viewing

| Shortcut   | Description          |
| ---------- | -------------------- |
| `+` or `=` | Zoom in              |
| `-`        | Zoom out             |
| `G`        | Toggle grid          |

### Annotations

| Shortcut                | Description                |
| ----------------------- | -------------------------- |
| `Delete` or `Backspace` | Delete selected annotation |
| `Esc`                   | Deselect annotation        |

### Help

| Shortcut           | Description                    |
| ------------------ | ------------------------------ |
| `?` or `Shift + /` | Show keyboard shortcuts dialog |

## Building a cross-platform executable

To get an executable file for different platforms it is required to build such executable in each environment. For this purpose, [Nuitka](https://nuitka.net/) will be used.<br>
Nuitka is an optimized python compiler which translates the application source code and all the dependencies from python to C. This allows Nuitka to build an executable binary file from the C sources.

### Linux

Make sure the following libraries are installed in the OS since Nuitka needs a C compiler.

```
sudo apt update
sudo apt install build-essential python3-dev ccache patchelf
```

To build the executable file, open a terminal, go the project root directory and run the following command.

```
./build.local.sh
```

This process will take a long time and in the end the following message will be displayed.

> Build completed! Check the ELF file in the root directory

### MacOS

Open a terminal, go the project root directory and run the following command.

```
./build.local.sh
```

This process will take a long time and in the end the following message will be displayed.

> Build completed! Check the APP file in the root directory

### Windows

Open a PowerShell terminal, go the project root directory and run the following command.

```
.\build.local.ps1
```

This process will take a long time and in the end the following message will be displayed.

> Build completed! Check the EXE file in the root directory
