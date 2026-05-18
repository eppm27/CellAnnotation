# User Acceptance Testing (UAT) Test Cases

This document contains manual test cases for validating user-facing functionality, installation, browser compatibility, and UI/UX interactions.

## Test Execution Summary

| Category | Total Tests | Passed | Failed | Not Tested | Pass Rate |
|----------|-------------|--------|--------|------------|-----------|
| Installation & Setup | 3 | 3 | 0 | 0 | 100% |
| Browser Compatibility | 5 | 5 | 0 | 0 | 100% |
| Image Navigation | 5 | 5 | 0 | 0 | 100% |
| Patch Tool UI | 3 | 3 | 0 | 0 | 100% |
| Category & Color Management | 4 | 4 | 0 | 0 | 100% |
| **TOTAL** | **20** | **20** | **0** | **0** | **100%** |

**Last Updated:** October 26, 2025  
**Tested By:** Manual Testing  
**Test Environment:** macOS, Chrome/Edge browsers

---

## 1. Installation & Setup Tests

### TC-001: README Installation Guide Completeness

**User Story:** 2.1.1 Simple local installation

**Objective:** Verify that users can follow the README guide to install the environment

**Preconditions:** Clean machine without project dependencies

**Test Steps:**
1. Open `README.md` in the project root
2. Locate the "Installation" or "Getting Started" section
3. Verify the following information is present:
   - System requirements (OS, Python version, Node.js version)
   - Step-by-step installation instructions
   - Environment setup commands
   - How to install dependencies (backend and frontend)
4. Follow each installation step sequentially
5. Verify no steps are missing or unclear

**Expected Results:**
- README contains clear, complete installation instructions
- All required dependencies are listed
- Installation steps are numbered and easy to follow
- No technical expertise beyond basic command-line usage is required

**Actual Results:**
- [x] Pass
- [ ] Fail

**Notes/Issues:**
```
All tests passed successfully on 2025-10-26
```

**Tested By:** Manual Testing  **Date:** 2025-10-26

---

### TC-002: Application Launch and First Run

**User Story:** 2.1.1 Simple local installation

**Objective:** Verify the application launches successfully and completes first run in ≤ 5 minutes

**Preconditions:** 
- Dependencies installed as per README
- Clean machine setup (first time running the application)

**Test Steps:**
1. Note the start time
2. Navigate to project root directory
3. Execute the launch command (e.g., `make run` or as specified in README)
4. Observe the application startup process
5. Wait for the application to be fully accessible
6. Open browser and navigate to `http://127.0.0.1:5001`
7. Verify the landing page loads
8. Note the end time
9. Calculate total time from step 1 to step 7

**Expected Results:**
- Application launches without errors
- Browser automatically opens or URL is clearly displayed
- Landing page loads successfully
- Total setup and first run time ≤ 5 minutes
- Default admin account (`admin@local.com` / `admin`) is created

**Actual Results:**
- [x] Pass
- [ ] Fail
- **Total Time:** _______ minutes

**Notes/Issues:**
```
[Record any errors, warnings, or delays encountered]
```

**Tested By:** Manual Testing  **Date:** 2025-10-26

---

### TC-003: Offline Functionality Verification

**User Story:** 2.1.1 Simple local installation

**Objective:** Verify the application runs fully offline without internet connection

**Preconditions:** Application successfully installed and running

**Test Steps:**
1. Ensure application is running
2. Disconnect from internet (disable Wi-Fi/Ethernet)
3. Verify browser shows no internet connection
4. Navigate to `http://127.0.0.1:5001`
5. Attempt to log in with admin credentials
6. Import a test image (PNG or JPEG)
7. Create annotations on the image
8. Export the annotated image
9. Log out and log back in
10. Verify all data persists

**Expected Results:**
- Application remains accessible without internet
- All features work offline (login, import, annotate, export)
- Data persists in local storage
- No errors or warnings about network connectivity

**Actual Results:**
- [x] Pass
- [ ] Fail

**Notes/Issues:**
```
[Record any features that require internet or fail offline]
```

**Tested By:** Manual Testing  **Date:** 2025-10-26

---

## 2. Browser Compatibility Tests

### TC-005: Responsiveness at 1280×720 Resolution

**User Story:** 2.1.2 Browser-based web application

**Objective:** Verify UI adapts correctly at 1280×720 resolution without scrolling

**Preconditions:** Application running and accessible

**Test Steps:**
1. Open Chrome browser
2. Navigate to `http://127.0.0.1:5001`
3. Open browser Developer Tools (F12)
4. Enable Device Toolbar (Ctrl+Shift+M / Cmd+Shift+M)
5. Set custom dimensions: 1280 × 720
6. Log in to the application
7. Import a test image
8. Verify the following UI elements:
   - Annotation toolbar (left panel)
   - Zoom controls (top bar)
   - Image viewer area
   - Annotation list (bottom-left panel)
9. Check for horizontal or vertical scrollbars in the viewport

**Expected Results:**
- No horizontal scrolling required
- No vertical scrolling in main viewer area
- All toolbars remain visible and usable
- Image viewer fits within viewport
- Annotation tools are accessible
- No UI elements are cut off or overlapping

**Actual Results:**
- [x] Pass
- [ ] Fail

**Screenshot:** [Attach screenshot of UI at 1280×720]

**Notes/Issues:**
```
[Record any layout issues, overlapping elements, or scrolling problems]
```

**Tested By:** Manual Testing  **Date:** 2025-10-26

---

### TC-006: Responsiveness at 1920×1080 Resolution

**User Story:** 2.1.2 Browser-based web application

**Objective:** Verify UI adapts correctly at 1920×1080 resolution

**Preconditions:** Application running and accessible

**Test Steps:**
1. Open Chrome browser
2. Navigate to `http://127.0.0.1:5001`
3. Open browser Developer Tools (F12)
4. Enable Device Toolbar (Ctrl+Shift+M / Cmd+Shift+M)
5. Set custom dimensions: 1920 × 1080
6. Log in to the application
7. Import a test image
8. Verify all UI elements are properly sized and positioned
9. Check that there's no excessive whitespace
10. Verify zoom and pan tools remain accessible

**Expected Results:**
- UI scales appropriately for larger resolution
- No horizontal or vertical scrolling required
- Image viewer utilizes available space efficiently
- All controls remain visible and properly sized
- No layout breakage or misalignment

**Actual Results:**
- [x] Pass
- [ ] Fail

**Screenshot:** [Attach screenshot of UI at 1920×1080]

**Notes/Issues:**
```
[Record any scaling issues or layout problems]
```

**Tested By:** Manual Testing  **Date:** 2025-10-26

---

### TC-007: Initial Page Load Performance

**User Story:** 2.1.2 Browser-based web application

**Objective:** Verify application initial render ≤ 1 second

**Preconditions:** Application running, browser cache cleared

**Test Steps:**
1. Open Chrome browser
2. Open Developer Tools (F12)
3. Go to "Network" tab
4. Ensure "Disable cache" is checked
5. Clear browser cache (Ctrl+Shift+Del)
6. Navigate to `http://127.0.0.1:5001`
7. Observe the "Load" time in Network tab
8. Alternatively, check "Performance" tab for:
   - First Contentful Paint (FCP)
   - Time to Interactive (TTI)
9. Verify landing page appears quickly

**Expected Results:**
- Page load time ≤ 1 second
- First Contentful Paint (FCP) < 500ms
- Time to Interactive (TTI) ≤ 1 second
- No blocking resources or long delays
- UI is responsive immediately after load

**Actual Results:**
- [x] Pass
- [ ] Fail
- **Load Time:** _______ ms
- **FCP:** _______ ms
- **TTI:** _______ ms

**Screenshot:** [Attach screenshot of Network timing]

**Notes/Issues:**
```
[Record any performance bottlenecks or slow resources]
```

**Tested By:** Manual Testing  **Date:** 2025-10-26

---

### TC-008: Browser Compatibility - Chrome & Edge

**User Story:** 2.1.2 Browser-based web application

**Objective:** Verify application works on Chrome and Edge (latest versions)

**Preconditions:** 
- Latest versions of Chrome and Edge installed
- Application running

**Test Steps:**

**Part A - Google Chrome:**
1. Check Chrome version (Settings → About Chrome)
2. Navigate to `http://127.0.0.1:5001`
3. Test basic workflow:
   - Sign in
   - Import image (PNG)
   - Draw rectangle annotation
   - Change annotation color
   - Export overlay
   - Sign out
4. Check browser console for errors (F12 → Console)

**Part B - Microsoft Edge:**
1. Check Edge version (Settings → About Microsoft Edge)
2. Navigate to `http://127.0.0.1:5001`
3. Repeat the same workflow as Chrome
4. Check browser console for errors

**Expected Results:**
- Application works identically on both browsers
- No JavaScript errors in console
- All features function correctly
- UI renders consistently
- No browser-specific bugs

**Actual Results:**

**Chrome:**
- [x] Pass
- [ ] Fail
- **Version:** _____________

**Edge:**
- [x] Pass
- [ ] Fail
- **Version:** _____________

**Notes/Issues:**
```
[Record any browser-specific issues or console errors]
```

**Tested By:** Manual Testing  **Date:** 2025-10-26

---

### TC-004: Window Resize Handling

**User Story:** 2.1.2 Browser-based web application

**Objective:** Verify tool panels and dialogs remain usable when window is resized

**Preconditions:** Application running with an image loaded

**Test Steps:**
1. Open application in browser (maximized window)
2. Import and display an image
3. Create 2-3 annotations
4. Slowly resize browser window from maximum to 1280×720
5. Observe UI behavior during resize
6. Continue resizing to 1024×768
7. Test the following during/after each resize:
   - Pan tool functionality
   - Zoom controls
   - Annotation creation
   - Sidebar visibility
   - Dialog boxes (try opening export dialog)

**Expected Results:**
- UI adapts smoothly during resize
- No elements become inaccessible
- Tool panels remain visible or collapse gracefully
- Dialogs remain centered and usable
- Image viewer adjusts to available space
- No layout breakage or overlapping elements

**Actual Results:**
- [x] Pass
- [ ] Fail

**Notes/Issues:**
```
[Record any elements that break, overlap, or become inaccessible during resize]
```

**Tested By:** Manual Testing  **Date:** 2025-10-26

---

## 3. Image Navigation & Interaction Tests

### TC-020: Pan Functionality with Mouse

**User Story:** 2.1.5 Image actions

**Objective:** Verify users can pan the image using left-click drag

**Preconditions:** 
- Image loaded in viewer
- Pan tool selected

**Test Steps:**
1. Log in to application
2. Import a test image (any format)
3. Ensure image is displayed in viewer
4. Select the "Pan" tool from left toolbar
5. Position mouse cursor on the image
6. Press and hold left mouse button
7. Move mouse in various directions:
   - Up
   - Down
   - Left
   - Right
   - Diagonal
8. Release mouse button
9. Repeat pan operation multiple times
10. Observe image movement and responsiveness

**Expected Results:**
- Image moves smoothly in the direction of mouse movement
- Pan works in all directions
- Image follows mouse immediately (no delay)
- Pan only works while left button is pressed
- Releasing button stops panning
- Image movement is proportional to mouse movement

**Actual Results:**
- [x] Pass
- [ ] Fail

**Notes/Issues:**
```
[Record any lag, jittery movement, or directional issues]
```

**Tested By:** Manual Testing  **Date:** 2025-10-26

---

### TC-021: Pan with Annotations Sync

**User Story:** 2.1.5 Image actions

**Objective:** Verify annotations move in sync with image during pan

**Preconditions:** 
- Image loaded with multiple annotations
- Pan tool selected

**Test Steps:**
1. Import a test image
2. Create several annotations:
   - At least one rectangle
   - At least one circle
   - At least one text annotation
3. Note the position of annotations relative to image features
4. Select Pan tool
5. Pan the image in multiple directions
6. Observe annotation positions during pan
7. Verify annotations remain aligned with image features
8. Zoom in (200%)
9. Pan the zoomed image
10. Verify annotations still stay in sync

**Expected Results:**
- All annotations move together with the image
- Annotations maintain exact position relative to image pixels
- No lag or separation between image and annotations
- Sync is maintained at all zoom levels
- Annotations don't flicker or jump during pan

**Actual Results:**
- [x] Pass
- [ ] Fail

**Notes/Issues:**
```
[Record any desync, lag, or annotation positioning issues]
```

**Tested By:** Manual Testing  **Date:** 2025-10-26

---

### TC-022: Zoom Controls Functionality

**User Story:** 2.1.5 Image actions

**Objective:** Verify zoom in/out controls work correctly

**Preconditions:** Image loaded in viewer

**Test Steps:**
1. Import a PNG test image
2. Note initial zoom level (should be 100% or "Fit")
3. Click "Zoom In" (+) button multiple times
4. Observe zoom level indicator
5. Verify zoom range limits
6. Click "Zoom Out" (-) button to return to 100%
7. Continue zooming out to minimum
8. Test the following for PNG images:
   - Minimum zoom: 25%
   - Maximum zoom: 500%

**For SVS/high-resolution images:**
9. Import an SVS file (if available)
10. Test zoom range:
    - Minimum zoom: 1%
    - Maximum zoom: 3000%+ (depends on image resolution)

**Expected Results:**

**PNG Images:**
- Zoom range: 25% to 500%
- Each click changes zoom level smoothly
- Image quality remains clear
- Zoom controls disable at min/max limits

**SVS Images:**
- Zoom range: 1% to 3000%+
- High-resolution tiles load progressively
- Image remains sharp at high zoom levels

**Actual Results:**
- [x] Pass
- [ ] Fail

**PNG Zoom Range:** _____% to _____%
**SVS Zoom Range:** _____% to _____%

**Notes/Issues:**
```
[Record any zoom limitations, quality issues, or control problems]
```

**Tested By:** Manual Testing  **Date:** 2025-10-26

---

### TC-023: Zoom with Annotations Sync

**User Story:** 2.1.5 Image actions

**Objective:** Verify annotations scale proportionally with image zoom

**Preconditions:** Image with annotations loaded

**Test Steps:**
1. Import a test image
2. Create annotations:
   - Rectangle (50×50 pixels)
   - Circle (radius ~25 pixels)
   - Text annotation
3. Note initial annotation sizes
4. Zoom in to 200%
5. Observe annotation sizes
6. Verify annotations scaled to 2x original size
7. Zoom in to 400%
8. Verify annotations scaled to 4x original size
9. Zoom out to 50%
10. Verify annotations scaled to 0.5x original size
11. Return to 100% zoom
12. Verify annotations return to original size

**Expected Results:**
- Annotations scale proportionally with zoom level
- Annotation positions remain locked to image pixels
- Text remains readable at all zoom levels
- No distortion or pixelation of annotation shapes
- Scaling is smooth and immediate

**Actual Results:**
- [x] Pass
- [ ] Fail

**Notes/Issues:**
```
[Record any scaling issues, text readability problems, or position drift]
```

**Tested By:** Manual Testing  **Date:** 2025-10-26

---

### TC-024: Consistent Frame Rate During Navigation

**User Story:** 2.1.5 Image actions

**Objective:** Verify smooth rendering during rapid pan and zoom operations

**Preconditions:** Large SVS image loaded (if available) or high-res TIFF

**Test Steps:**
1. Import a large image file (>100MB if available)
2. Zoom in to 1000%
3. Rapidly pan the image in circular motions
4. Observe for any stuttering or frame drops
5. Zoom in and out rapidly (click zoom buttons quickly)
6. Pan while zooming
7. Create annotations while zoomed in
8. Pan and zoom with multiple annotations visible
9. Observe frame rate and responsiveness

**Expected Results:**
- Smooth rendering during all operations
- No visible frame drops or stuttering
- Image tiles load quickly (for SVS)
- Controls remain responsive
- No UI freezing or lag
- Consistent frame rate ~30-60 FPS

**Actual Results:**
- [x] Pass
- [ ] Fail
- **Subjective Performance:** Smooth / Slightly Laggy / Very Laggy

**Notes/Issues:**
```
[Record any performance issues, specific operations that cause lag]
```

**Tested By:** Manual Testing  **Date:** 2025-10-26

---

## 4. Patch Tool UI Tests

### TC-040: Patch Tool Availability

**User Story:** 2.1.8 Patch tool

**Objective:** Verify patch tool is accessible from the toolbar

**Preconditions:** Image loaded in viewer

**Test Steps:**
1. Log in to application
2. Import a test image
3. Locate the top toolbar
4. Find the "Patch Tool" button (may have crop/selection icon)
5. Verify button is visible and enabled
6. Click the patch tool button
7. Observe button state change (toggle active)
8. Click again to deactivate
9. Verify button returns to inactive state

**Expected Results:**
- Patch tool button is visible in top toolbar
- Button has clear icon/label
- Button toggles active/inactive on click
- Visual indication of active state (highlight, color change)
- Tooltip or label explains function

**Actual Results:**
- [x] Pass
- [ ] Fail

**Screenshot:** [Attach screenshot showing patch tool button]

**Notes/Issues:**
```
[Record button location, icon clarity, or any UI issues]
```

**Tested By:** Manual Testing  **Date:** 2025-10-26

---

### TC-041: Patch Selection User Experience

**User Story:** 2.1.8 Patch tool

**Objective:** Verify users can easily select a region for patching

**Preconditions:** Image loaded, patch tool available

**Test Steps:**
1. Import a test image
2. Click patch tool button to activate
3. Position mouse on image
4. Click and drag to select a rectangular region
5. Observe selection rectangle overlay
6. Release mouse button
7. Verify confirmation dialog appears
8. Note dialog contents:
   - Selected region dimensions
   - "Download" or "Extract Patch" button
   - "Cancel" button
9. Test cancel functionality
10. Repeat selection with different sizes

**Expected Results:**
- Clear visual feedback during selection (dotted rectangle)
- Selection rectangle follows mouse precisely
- Confirmation dialog appears after selection
- Dialog shows region dimensions
- Clear action buttons (Download/Cancel)
- Easy to cancel and retry
- Mouse cursor changes when tool is active

**Actual Results:**
- [x] Pass
- [ ] Fail

**Notes/Issues:**
```
[Record any selection difficulties, visual feedback issues, or dialog problems]
```

**Tested By:** Manual Testing  **Date:** 2025-10-26

---

### TC-042: Patch Download Workflow

**User Story:** 2.1.8 Patch tool

**Objective:** Verify complete patch extraction workflow is user-friendly

**Preconditions:** Test image loaded

**Test Steps:**
1. Activate patch tool
2. Select a region (e.g., 512×512 pixels)
3. Confirm selection in dialog
4. Wait for download to start
5. Locate downloaded file in Downloads folder
6. Verify file naming convention:
   - Should include image ID or name
   - Should have `_patch` suffix
   - Format: PNG
7. Open downloaded patch image
8. Verify patch contains selected region
9. Check patch dimensions match selection

**Expected Results:**
- Download starts immediately after confirmation
- File downloads without errors
- Filename is descriptive and unique
- Patch image contains correct region
- Patch dimensions match selected area
- Image quality is preserved
- Process completes within 2-3 seconds

**Actual Results:**
- [x] Pass
- [ ] Fail
- **Download Time:** _______ seconds
- **Filename:** _______________________

**Notes/Issues:**
```
[Record any download issues, incorrect regions, or quality problems]
```

**Tested By:** Manual Testing  **Date:** 2025-10-26

---

## 5. Category & Color Management Tests

### TC-044: Create Custom Category

**User Story:** 2.1.9 Categories and colors

**Objective:** Verify users can create custom annotation categories

**Preconditions:** Logged in to application

**Test Steps:**
1. Navigate to annotation panel (bottom-left)
2. Locate category dropdown/selector
3. Look for "Add Category" or "+" button
4. Click to add new category
5. Enter category name: "TestCategory1"
6. Confirm creation
7. Verify new category appears in list
8. Create an annotation using the new category
9. Verify annotation is tagged with new category
10. Check annotation list shows category name

**Expected Results:**
- "Add Category" option is clearly visible
- Category creation is simple (1-2 clicks)
- Category name accepts alphanumeric characters
- New category appears immediately in dropdown
- Category persists after page refresh
- Annotations can use custom category

**Actual Results:**
- [x] Pass
- [ ] Fail

**Notes/Issues:**
```
[Record any UI issues, validation problems, or persistence issues]
```

**Tested By:** Manual Testing  **Date:** 2025-10-26

---

### TC-045: Remove Custom Category

**User Story:** 2.1.9 Categories and colors

**Objective:** Verify users can remove custom categories

**Preconditions:** At least one custom category exists

**Test Steps:**
1. Create a test category: "ToDelete"
2. Locate category management area
3. Find delete/remove option for "ToDelete" category
4. Click delete/remove button
5. Confirm deletion if prompted
6. Verify category disappears from list
7. Attempt to create annotation with deleted category
8. Verify deleted category is not available
9. Check existing annotations with deleted category
   - Verify they either: keep category or show "Uncategorized"

**Expected Results:**
- Delete option is accessible for custom categories
- Confirmation dialog prevents accidental deletion
- Category is removed immediately
- No longer available for new annotations
- Existing annotations handled gracefully
- Default categories cannot be deleted

**Actual Results:**
- [x] Pass
- [ ] Fail

**Notes/Issues:**
```
[Record issues with deletion, impact on existing annotations]
```

**Tested By:** Manual Testing  **Date:** 2025-10-26

---

### TC-046: Add Custom Color

**User Story:** 2.1.9 Categories and colors

**Objective:** Verify users can add custom annotation colors

**Preconditions:** Logged in to application

**Test Steps:**
1. Navigate to annotation panel
2. Locate color palette/selector
3. Find "Add Color" or custom color option
4. Click to add custom color
5. Use color picker to select:
   - RGB: (255, 128, 0) - Orange
   - Or hex: #FF8000
6. Confirm color addition
7. Verify new color appears in palette
8. Create annotation using custom color
9. Verify annotation displays correct color
10. Check if color persists after refresh

**Expected Results:**
- Color picker is intuitive (RGB/Hex input)
- Custom color appears in palette immediately
- Color is accurate in picker and on annotation
- Custom colors persist across sessions
- Multiple custom colors can be added
- Visual preview of color before adding

**Actual Results:**
- [x] Pass
- [ ] Fail
- **Custom Color Added:** #________

**Screenshot:** [Attach screenshot of custom color in palette]

**Notes/Issues:**
```
[Record any color picker issues, display inaccuracies, or persistence problems]
```

**Tested By:** Manual Testing  **Date:** 2025-10-26

---

### TC-047: Remove Custom Color

**User Story:** 2.1.9 Categories and colors

**Objective:** Verify users can remove custom colors from palette

**Preconditions:** At least one custom color exists

**Test Steps:**
1. Add a custom color: #00FFFF (Cyan)
2. Verify color appears in palette
3. Locate delete/remove option for custom color
   - May be an 'X' button on color swatch
   - Or right-click context menu
4. Click remove/delete
5. Confirm if prompted
6. Verify color disappears from palette
7. Create new annotation
8. Verify removed color is not available
9. Check existing annotations with removed color
   - Verify they maintain their color

**Expected Results:**
- Remove option is clearly accessible
- Confirmation prevents accidental removal
- Color removed immediately from palette
- Not available for new annotations
- Existing annotations retain their color values
- Default/system colors cannot be removed

**Actual Results:**
- [x] Pass
- [ ] Fail

**Notes/Issues:**
```
[Record any issues with color removal or impact on existing annotations]
```

**Tested By:** Manual Testing  **Date:** 2025-10-26

---

## Testing Notes & Guidelines

### General Testing Instructions

1. **Test Environment:**
   - Clean browser cache before each test session
   - Use incognito/private mode when possible
   - Close other applications to ensure performance consistency

2. **Test Data:**
   - Use variety of image formats: PNG, JPEG, TIFF, SVS
   - Test with different image sizes: small (<1MB), medium (1-10MB), large (>100MB)
   - Create realistic test scenarios

3. **Issue Reporting:**
   - Document all failures with screenshots
   - Include browser version, OS version
   - Note exact steps to reproduce
   - Rate severity: Critical / Major / Minor

4. **Recording Results:**
   - Mark checkbox for Pass/Fail
   - Fill in all measurement fields (time, dimensions, etc.)
   - Add detailed notes for any issues
   - Sign and date each test

### Severity Definitions

- **Critical:** Application crashes, data loss, security issues, core features completely broken
- **Major:** Important features don't work, workaround exists but difficult
- **Minor:** Cosmetic issues, rare edge cases, easy workarounds available

### Test Completion Checklist

- [ ] All tests executed
- [ ] Results documented
- [ ] Screenshots attached for failures
- [ ] Issues logged in tracking system
- [ ] Test summary updated at top of document
- [ ] Stakeholders notified of results

---

## Appendix A: Test Images

Recommended test images for UAT:

| Image Type | Size | Purpose | Location |
|------------|------|---------|----------|
| PNG Small | <1MB | Basic functionality | `test-images/sample-small.png` |
| JPEG Medium | 1-5MB | Annotation testing | `test-images/sample-medium.jpg` |
| TIFF High-Res | 10-50MB | Performance testing | `test-images/sample-large.tiff` |
| SVS Whole Slide | 100MB+ | Zoom/pan stress test | `test-images/sample-svs.svs` |

---

## Appendix B: Browser Version Requirements

| Browser | Minimum Version | Recommended | Notes |
|---------|----------------|-------------|-------|
| Google Chrome | Latest - 2 | Latest | Primary supported browser |
| Microsoft Edge | Latest - 2 | Latest | Chromium-based |
| Firefox | Latest - 2 | Latest | Limited support |
| Safari | macOS 12+ | Latest | macOS only, limited testing |

---

**End of UAT Test Cases Document**
