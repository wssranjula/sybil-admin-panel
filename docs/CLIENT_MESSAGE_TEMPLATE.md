# Message Template for Client - Google Drive Folder Organization

## Suggested Message

---

**Subject:** Google Drive Folder Setup for RAG Pipeline - Quick Clarification Needed

Hi [Client Name],

I wanted to clarify how our Google Drive monitoring system works and confirm the best setup approach.

**Current Implementation:**
Our RAG pipeline is configured to monitor **one specific folder** in Google Drive. The system will:
- ✅ Monitor the designated folder continuously
- ✅ Process files in subfolders recursively (any depth)
- ✅ Automatically extract and push documents to Neo4j when new files are added
- ✅ Support multiple file types (PDF, DOCX, Excel, etc.)

**Important Limitation:**
The system monitors **one folder only** - it does not scan your entire Google Drive. It focuses on the specific folder you designate.

**What We Need:**
To set this up effectively, we need you to:
1. **Organize all documents** that should be processed into **one main folder** (or confirm if you already have such a folder)
2. This folder can have any number of subfolders - our system will process files from all subfolders automatically
3. **Share this folder** with my Google account: [YOUR_EMAIL@example.com]

**Example Structure:**
```
Main Folder (e.g., "RAG Documents" or "Knowledge Base")
├── Subfolder 1
│   ├── document1.pdf
│   └── document2.docx
├── Subfolder 2
│   ├── document3.xlsx
│   └── nested_folder
│       └── document4.pdf
└── document5.pdf
```

All files in this structure will be automatically processed.

**Questions:**
1. Do you already have a folder where you'd like to organize these documents?
2. If not, would it be possible to create one folder and organize the relevant files there?
3. What would you like to name this folder? (We can use any name you prefer)

Once you confirm the folder name and share it with me, I can complete the setup and the system will start monitoring it automatically.

Let me know if you have any questions or if you'd prefer a different approach!

Best regards,
[Your Name]

---

## Alternative Shorter Version

**Subject:** Google Drive Setup - Folder Organization Needed

Hi [Client Name],

Quick clarification on the Google Drive setup:

Our RAG pipeline monitors **one specific folder** (not your entire Drive). It processes all files in that folder and its subfolders recursively.

**What we need:**
- One main folder containing all documents to be processed
- This folder can have subfolders (we'll process everything)
- Share the folder with: [YOUR_EMAIL@example.com]

**Questions:**
1. Do you have a folder ready, or should we create one?
2. What should we name it?

Once you share the folder, I'll complete the setup!

Thanks,
[Your Name]

---

## Key Points to Emphasize

✅ **One folder** - not scanning entire Drive
✅ **Recursive subfolders** - can organize files in subfolders
✅ **Automatic processing** - files are picked up automatically
✅ **Flexible structure** - they can organize however they want within that folder

---

## Technical Details (For Your Reference)

- The system uses `folder_id` to target one specific folder
- `list_documents_in_folder()` has `recursive=True` by default
- Files are processed as they're added to the folder or subfolders
- State tracking prevents reprocessing the same file









