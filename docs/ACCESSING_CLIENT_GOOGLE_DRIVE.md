# Accessing Client's Google Drive Folder

## Problem

Your client created OAuth credentials in their Google Cloud project and added you as a tester. However, when you authenticated with your own Google account, the system is accessing **your** Google Drive folder instead of the **client's** folder.

## Why This Happens

OAuth authentication is tied to the **account that signs in**, not the account that created the OAuth app. When you authenticate with your Google account, you're accessing your own Drive, not the client's.

## Solution: Share Folder + Use Your Account

The best approach is to have the client **share their Google Drive folder with your Google account**. This way:
- ✅ You authenticate with your own account (which you already did)
- ✅ The system can access the client's shared folder
- ✅ No need to re-authenticate or use the client's credentials

---

## Step-by-Step Instructions

### Step 1: Client Shares Folder with You

**Ask your client to:**

1. Open their Google Drive (https://drive.google.com)
2. Find the folder they want you to monitor
3. Right-click the folder → **"Share"**
4. Add your Google account email address
5. Set permission to **"Viewer"** or **"Editor"** (depending on needs)
6. Click **"Send"**

### Step 2: Accept the Share Invitation

**On your end:**

1. Check your email for the share invitation
2. Click **"Open in Google Drive"** or go to https://drive.google.com
3. You should see the shared folder in **"Shared with me"** section
4. **Important:** The folder should now appear when you search for it

### Step 3: Verify You Can See the Folder

**Test the connection:**

```powershell
cd "C:\Users\Admin\Desktop\Suresh\Sybil-BE"
python run_gdrive.py test
```

This will:
- Authenticate with your account
- List all accessible folders (including shared ones)
- Show which folders are owned vs shared

**Expected output:**
```
Found X accessible folders:
  [SHARED] Client Folder Name
      ID: 17ks1ygaaWB9RefEmUaUkGl3IaQ7FaWib
      Owner: client@example.com
```

### Step 4: Update Configuration

**Update `config/gdrive_config.json`:**

1. Note the exact folder name from Step 3
2. Open the config file:
   ```powershell
   notepad config\gdrive_config.json
   ```

3. Update the folder name:
   ```json
   {
     "google_drive": {
       "folder_name": "Client Folder Name",  // ← Use exact name from test
       "folder_id": null,                     // ← Will auto-populate
       ...
     }
   }
   ```

4. Save the file

### Step 5: Run Setup to Find Folder ID

**Run setup to automatically find and save the folder ID:**

```powershell
python run_gdrive.py setup
```

**Expected output:**
```
[OK] Found folder 'Client Folder Name' (shared folder): 17ks1ygaaWB9RefEmUaUkGl3IaQ7FaWib
[INFO] Folder owner: client@example.com
[OK] Folder ID saved to config
```

### Step 6: Test Access

**Verify you can access files:**

```powershell
python run_gdrive.py batch
```

This will list all documents in the client's folder. If you see files, you're all set!

---

## Alternative: Direct Folder ID Method

If you know the folder ID directly (from the Google Drive URL), you can skip the folder name search:

### Get Folder ID from URL

1. Client shares folder with you
2. You open the folder in Google Drive
3. Look at the URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
4. Copy the `FOLDER_ID_HERE` part

### Update Config Directly

```json
{
  "google_drive": {
    "folder_name": "Any Name",           // ← Can be anything
    "folder_id": "FOLDER_ID_HERE",        // ← Paste actual ID
    ...
  }
}
```

The system will use the `folder_id` directly and skip the name search.

---

## Troubleshooting

### Issue: "Folder not found" after sharing

**Possible causes:**
1. **Share not accepted:** Make sure you clicked "Open in Google Drive" on the invitation
2. **Wrong folder name:** Folder names are case-sensitive. Use exact name from test output
3. **Folder in trash:** Check if folder was accidentally deleted

**Solution:**
```powershell
# List all folders to see what's accessible
python run_gdrive.py test

# Use the exact folder name from the output
```

### Issue: "Permission denied" when accessing folder

**Possible causes:**
1. Client revoked access
2. Insufficient permissions (need at least "Viewer")
3. Folder was unshared

**Solution:**
- Ask client to verify folder is still shared with your account
- Check your Google Drive "Shared with me" section
- Re-run `python run_gdrive.py test` to verify access

### Issue: Multiple folders with same name

**Solution:**
The system will use the first one found. To use a specific folder:
1. Use the folder ID method (see "Alternative" section above)
2. Or rename one of the folders to make names unique

---

## Summary

**Quick Steps:**
1. ✅ Client shares folder with your Google account
2. ✅ Accept share invitation
3. ✅ Run `python run_gdrive.py test` to verify access
4. ✅ Update `folder_name` in `config/gdrive_config.json`
5. ✅ Run `python run_gdrive.py setup` to save folder ID
6. ✅ Test with `python run_gdrive.py batch`

**Key Points:**
- ✅ You authenticate with **your** account (already done)
- ✅ Client shares **their** folder with you
- ✅ System accesses shared folder through your account
- ✅ No need to re-authenticate or use client's credentials

---

## Related Documentation

- `GOOGLE_MONITORING_ACCOUNT_MIGRATION.md` - Full migration guide
- `GDRIVE_SETUP_GUIDE.md` - Initial setup guide
- `SERVICE_ACCOUNT_GUIDE.md` - Alternative service account approach

---

**Last Updated:** December 2024









