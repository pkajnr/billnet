# Quick Start - File Upload & Investment Fields Testing

## What's New

### ✨ Features Added
1. **File Upload System** - Users can upload documents to support their posts
2. **Investment-Critical Fields** - Type-specific fields for Ideas, Businesses, and Shares
3. **Document Display in Feed** - Supporting documents visible to investors with download links
4. **File Management** - Upload, delete, and organize documents

---

## Testing the New Features

### Step 1: Test Idea Post with Files

**Action:**
1. Go to `/explore` page
2. Click "💡 Idea" button on create post card
3. Fill in:
   - Title: "AI-Powered Tutoring Platform"
   - Description: "Personalized math tutoring using AI"
   - Category: "Education"
   - Funding Goal: $250,000
   - Market Size: "$15 billion"
   - Target Audience: "K-12 students in US"
   - Revenue Projection: $500,000
   - Break-Even Months: 18
   - Team Size: 5
   - Website: https://example.com
4. Upload:
   - Business Plan PDF
   - Market Analysis Excel
5. Click "Post"

**Expected Result:**
✅ Post appears in feed with Idea design (blue)
✅ Shows funding progress bar
✅ Investment fields visible in modal
✅ Documents section shows 2 files
✅ Can download both documents

---

### Step 2: Test Business Post with Files

**Action:**
1. Go to `/explore` page
2. Click "🏢 Business" button
3. Fill in:
   - Title: "Digital Marketing Agency"
   - Description: "Full-service agency specializing in e-commerce"
   - Category: "Marketing"
   - Asking Price: $500,000
   - Years Active: 7
   - Annual Revenue: $1,200,000
   - Employee Count: 12
   - Growth Rate: 35%
4. Upload:
   - Tax Returns PDF
   - Business License image
   - Financial Statements Excel
5. Click "Post"

**Expected Result:**
✅ Post appears with Business design (purple)
✅ Shows asking price prominently
✅ Badge says "Established Business"
✅ Documents section shows 3 files
✅ File types displayed correctly (📝 📄 💹)

---

### Step 3: Test Share Post with Files

**Action:**
1. Go to `/explore` page
2. Click "📈 Shares" button
3. Fill in:
   - Title: "TechStartup Inc."
   - Description: "We build cloud solutions for enterprises"
   - Category: "Technology"
   - Price per Share: $100
   - Equity Offering: 10%
   - Company Valuation: $5,000,000
   - Shares Offered: 50,000
4. Upload:
   - Financial Statements PDF
   - Investor Deck PowerPoint
   - Cap Table Excel
5. Click "Post"

**Expected Result:**
✅ Post appears with Share design (green)
✅ Shows price per share and equity %
✅ Price calculation works: $100 × 50,000 shares = $5M
✅ Documents section shows 3 files
✅ File types show correct icons (💹 🎯 ⚖️)

---

### Step 4: Test File Management

**Action:**
1. After posting idea, view it in feed
2. Scroll down to "Supporting Documents" section
3. Hover over a file - should show download arrow
4. Click a file - should open in new tab
5. In modal (if edit available), click "Remove" on a file

**Expected Result:**
✅ File hover shows visual feedback
✅ Download link opens correct file
✅ File size displays (e.g., "245 KB")
✅ Document type shows human-readable label

---

### Step 5: Test Field Validation

**Action - File Size:**
1. Try uploading a file > 10MB
2. Should show error: "File is too large (max 10MB)"

**Action - File Type:**
1. Try uploading .exe or .zip file
2. Should be rejected by upload input

**Action - Missing Required Fields:**
1. Leave Funding Goal empty for Idea
2. Try to post
3. Should show validation error

**Expected Result:**
✅ File size validation works
✅ File type restrictions enforced
✅ Required fields validated before submission

---

## File Upload Specifications

### Supported Documents

**For Ideas:**
- 📋 Business Plan (PDF, DOCX)
- 📊 Market Analysis (PDF, XLS, XLSX, DOCX)

**For Businesses:**
- 📝 Tax Returns (PDF, XLS, XLSX)
- 🏛️ Business License (PDF, JPG, PNG)
- 💹 Financial Statements (PDF, XLS, XLSX)

**For Shares:**
- 💹 Financial Statements (PDF, XLS, XLSX)
- 🎯 Investor Deck (PDF, PPTX)
- ⚖️ Cap Table / Legal Docs (PDF, XLS, XLSX)

### Size Limits
- Per file: 10 MB
- Total per post: 50 MB
- Recommended: Keep files < 5 MB for faster uploads

---

## Troubleshooting

### Issue: File won't upload
**Check:**
- File size < 10 MB?
- File type supported? (PDF, DOCX, XLS, XLSX, PNG, JPG, PPTX)
- Not already uploaded same filename?

### Issue: Documents not showing in feed
**Check:**
- Post was created successfully?
- Files uploaded before clicking Post?
- Page refreshed to see new files?
- Browser console for errors (F12)

### Issue: Can't download file
**Check:**
- Backend running on port 5000?
- `/uploads` folder exists and has files?
- File permissions correct?

---

## Backend Setup Checklist

- [ ] Run `npm install` in backend folder (installs multer)
- [ ] Check database creates tables (check logs on first run)
- [ ] Verify `/backend/uploads` folder exists
- [ ] Start backend: `npm run dev`
- [ ] Test API: curl http://localhost:5000/api/ideas

---

## Frontend Setup Checklist

- [ ] Updated CreatePost component in place ✅
- [ ] Updated ExploreIdeas component in place ✅
- [ ] New file display section renders correctly ✅
- [ ] Start frontend: `npm run dev`
- [ ] Navigate to /explore and test

---

## Data Structure Reference

### Idea Object (in Feed)
```json
{
  "id": 1,
  "title": "AI Tutoring",
  "description": "...",
  "category": "education",
  "fundingGoal": 250000,
  "currentFunding": 0,
  "status": "active",
  "postType": "idea",
  "equityPercentage": null,
  "files": [
    {
      "name": "business-plan.pdf",
      "url": "/uploads/1234567890-business-plan.pdf",
      "type": "business_plan",
      "size": 245000
    }
  ]
}
```

### File Upload Types
```
idea: business_plan, market_analysis
business: tax_returns, business_license, financials
share: financials, pitch_deck, legal_docs
other: any other document
```

---

## Performance Tips

1. **Compress PDFs** before uploading (reduce to < 2MB)
2. **Limit documents** to 3-5 files per post
3. **Use appropriate formats** (PDF for documents, XLSX for spreadsheets)
4. **Delete old versions** when updating documents

---

## Next Steps (Future Enhancements)

- [ ] Move uploads to cloud storage (AWS S3, Azure)
- [ ] Add document preview without download
- [ ] Implement file versioning
- [ ] Add virus scanning
- [ ] Create audit log for file access
- [ ] Add document expiration dates
- [ ] Enable file sharing permissions
- [ ] Analytics on file downloads

---

**Ready to Test?** 🚀
1. Navigate to http://localhost:3000
2. Log in as entrepreneur or investor
3. Follow testing steps above
4. Report any issues

For detailed implementation docs, see:
- `FILE_UPLOAD_IMPLEMENTATION.md` - Technical details
- `INVESTMENT_FIELDS_GUIDE.md` - Field specifications
