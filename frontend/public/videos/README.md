# 📹 Screen Recording Instructions for TechLearn Solutions

## 🎯 Overview
Replace the 3D model placeholders with actual screen recordings of the TechLearn platform. These videos will serve as interactive previews for users.

## 📋 Required Recordings

### 1. **Courses Preview** (`courses-preview.mp4`)
**Duration:** 15-20 seconds  
**Quality:** 1080p, 30fps  
**Content to Record:**
- Start on the main courses page (`/learn/courses`)
- Scroll through the course cards smoothly
- Click on a course to open course details
- Show the "View Notes" or course content briefly
- Navigate to topics page
- Click "Take Quiz" button
- Show quiz interface for 2-3 seconds
- Scroll down to show a live batches card
- **Keep it smooth and professional**

**Recording Tips:**
- Use a clean browser window (no bookmarks bar, extensions)
- Ensure good lighting on screen
- Record at consistent speed
- No mouse cursor jitter

---

### 2. **Exercises Preview** (`exercises-preview.mp4`)
**Duration:** 12-15 seconds  
**Quality:** 1080p, 30fps  
**Content to Record:**
- Navigate to exercises/compiler page (`/learn/exercises`)
- Show the compiler interface clearly
- Type a simple "Hello World" program:
  ```javascript
  console.log("Hello, World!");
  ```
- Click the "Run" or "Submit" button
- Show the output appearing
- **Focus on the coding experience**

**Recording Tips:**
- Type at a natural, readable pace
- Show the full IDE interface
- Ensure code is clearly visible
- Include the output/result

---

### 3. **Certificate Preview** (`certificate-preview.mp4`)
**Duration:** 10-12 seconds  
**Quality:** 1080p, 30fps  
**Content to Record:**
- Use an actual certificate from the platform
- **MASK/BLUR sensitive information:**
  - Student name → "John Doe" or blur
  - Certificate ID → blur or replace
  - Any personal details → blur
- Show the certificate design clearly
- Highlight key elements (logo, course name, etc.)
- **Keep the professional appearance**

**Recording Tips:**
- Use high-quality certificate image
- Apply consistent masking/blurring
- Maintain certificate authenticity feel
- Show certificate in good lighting

---

## 🛠️ Technical Requirements

### **File Specifications:**
- **Format:** MP4 (H.264 codec)
- **Resolution:** 1920x1080 (1080p)
- **Frame Rate:** 30fps
- **Bitrate:** 5-8 Mbps for good quality
- **Audio:** None (muted videos)
- **File Size:** Keep under 10MB each

### **Recommended Tools:**
- **OBS Studio** (Free, professional)
- **Loom** (Easy, web-based)
- **QuickTime** (Mac users)
- **Windows Game Bar** (Windows users)

---

## 📁 File Naming & Location

Place the recorded videos in this directory with exact names:
```
frontend/public/videos/
├── courses-preview.mp4
├── exercises-preview.mp4
└── certificate-preview.mp4
```

**⚠️ Important:** Use exact file names as they're hardcoded in the component.

---

## 🎨 Recording Best Practices

### **Visual Quality:**
- ✅ Clean, professional browser appearance
- ✅ Consistent mouse movements
- ✅ Good contrast and readability
- ✅ Smooth scrolling and transitions
- ❌ No browser notifications or popups
- ❌ No personal information visible
- ❌ No jerky mouse movements

### **Content Flow:**
- ✅ Show key features naturally
- ✅ Demonstrate real user journey
- ✅ Highlight important UI elements
- ✅ Keep timing consistent
- ❌ Don't rush through content
- ❌ Don't show error states
- ❌ Don't include loading delays

### **Technical Quality:**
- ✅ Stable frame rate
- ✅ Clear text and UI elements
- ✅ Proper aspect ratio
- ✅ Optimized file size
- ❌ No compression artifacts
- ❌ No audio (keep muted)
- ❌ No watermarks

---

## 🔄 Integration Status

The VideoPreview component is already implemented and will:
- ✅ Display placeholder content until videos are added
- ✅ Show "RECORD" indicator for missing videos
- ✅ Automatically play videos when available
- ✅ Include hover controls for play/pause
- ✅ Maintain responsive design

---

## 📞 Questions?

If you need clarification on any recording requirements or technical specifications, please ask before starting the recordings to ensure consistency across all videos.

**Goal:** Create professional, engaging previews that showcase the platform's capabilities and encourage user interaction.
