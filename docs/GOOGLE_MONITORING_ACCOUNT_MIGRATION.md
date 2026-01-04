# Google Monitoring Service - Account Migration Guide

Complete guide for migrating Google Drive monitoring service from one Gmail account to another.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Migration Process](#step-by-step-migration-process)
4. [Enabling Google APIs](#enabling-google-apis)
5. [Setting Up OAuth Credentials](#setting-up-oauth-credentials)
6. [Getting Authentication Token](#getting-authentication-token)
7. [Updating Folder Configuration](#updating-folder-configuration)
8. [Renaming Folders and IDs](#renaming-folders-and-ids)
9. [Testing the New Setup](#testing-the-new-setup)
10. [Troubleshooting](#troubleshooting)
11. [Quick Reference Checklist](#quick-reference-checklist)

---

## Overview

This guide covers migrating the Google Drive monitoring service to a different Gmail account. The process involves:

- Creating new OAuth credentials in the new Google account
- Authenticating with the new account
- Updating folder names and IDs in configuration
- Testing and verifying the migration

**Estimated Time:** 15-20 minutes

---

## Prerequisites

Before starting, ensure you have:

- ✅ Access to the **NEW** Gmail account
- ✅ Access to Google Cloud Console (console.cloud.google.com)
- ✅ Access to the server/computer where the monitoring service runs
- ✅ Python environment with required packages installed
- ✅ Backup of current configuration files (optional but recommended)

**Required Python Packages:**
```bash
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

---

## Step-by-Step Migration Process

### Phase 1: Preparation

#### Step 1.1: Stop the Monitoring Service

**On Windows (if running as service):**
```powershell
# Stop any running processes
Get-Process python | Where-Object {$_.CommandLine -like "*gdrive*"} | Stop-Process
```

**On Linux/VPS (if running as systemd service):**
```bash
sudo systemctl stop gdrive-monitor
sudo systemctl status gdrive-monitor  # Verify stopped
```

**Expected output:** `Active: inactive (dead)`

#### Step 1.2: Backup Current Configuration

**Create backup directory:**
```bash
# On Windows PowerShell
cd "C:\Users\Admin\Desktop\Suresh\Sybil-BE"
mkdir backups
Copy-Item config\gdrive_config.json backups\gdrive_config.json.backup
Copy-Item config\token.pickle backups\token.pickle.backup 2>$null
Copy-Item config\credentials.json backups\credentials.json.backup 2>$null

# On Linux/VPS
cd ~/Sybil-BE
mkdir -p backups
cp config/gdrive_config.json backups/gdrive_config.json.backup
cp config/token.pickle backups/token.pickle.backup 2>/dev/null
cp config/credentials.json backups/credentials.json.backup 2>/dev/null
```

#### Step 1.3: Delete Old Authentication Token

**This forces re-authentication with the new account:**
```bash
# On Windows
Remove-Item config\token.pickle -ErrorAction SilentlyContinue

# On Linux/VPS
rm config/token.pickle
```

**Verify deletion:**
```bash
# Should show "file not found" or empty result
ls config/token.pickle 2>&1
```

---

## Enabling Google APIs

### Step 2.1: Access Google Cloud Console

1. **Open browser** and go to: https://console.cloud.google.com/
2. **Sign in** with your **NEW** Gmail account
3. **Select or create a project:**
   - If you have an existing project, select it from the dropdown
   - If creating new: Click "Select a project" → "New Project"
     - Project name: `Sybil Google Drive Monitor` (or your preferred name)
     - Click "Create"

### Step 2.2: Enable Google Drive API

1. **Navigate to APIs & Services:**
   - Click hamburger menu (☰) → "APIs & Services" → "Library"

2. **Search for Google Drive API:**
   - In search bar, type: `Google Drive API`
   - Click on "Google Drive API" from results

3. **Enable the API:**
   - Click the blue "ENABLE" button
   - Wait for confirmation (may take 10-30 seconds)
   - You should see: "API enabled" message

### Step 2.3: Verify API is Enabled

1. Go to "APIs & Services" → "Enabled APIs & services"
2. You should see "Google Drive API" in the list
3. Status should show as "Enabled"

---

## Setting Up OAuth Credentials

### Step 3.1: Configure OAuth Consent Screen

**First-time setup only** (skip if already configured):

1. **Navigate to OAuth Consent Screen:**
   - Go to "APIs & Services" → "OAuth consent screen"

2. **Select User Type:**
   - Choose **"External"** (unless you have Google Workspace)
   - Click "Create"

3. **Fill in App Information:**
   - **App name:** `Sybil Google Drive Monitor` (or your preferred name)
   - **User support email:** Select your email from dropdown
   - **Developer contact information:** Your email address
   - Click "Save and Continue"

4. **Add Scopes:**
   - Click "Add or Remove Scopes"
   - Search for: `https://www.googleapis.com/auth/drive.readonly`
   - Check the box next to it
   - Click "Update" → "Save and Continue"

5. **Test Users (if External):**
   - Add your email address as a test user
   - Click "Save and Continue"

6. **Summary:**
   - Review settings
   - Click "Back to Dashboard"

### Step 3.2: Create OAuth 2.0 Credentials

1. **Navigate to Credentials:**
   - Go to "APIs & Services" → "Credentials"
   - Click "+ CREATE CREDENTIALS" at the top
   - Select "OAuth client ID"

2. **If prompted for consent screen:**
   - Complete Step 3.1 first, then return here

3. **Configure OAuth Client:**
   - **Application type:** Select **"Desktop app"** ⚠️ **IMPORTANT: Must be Desktop app, not Web application**
   - **Name:** `Sybil Drive Monitor` (or your preferred name)
   - Click "CREATE"

4. **Download Credentials:**
   - A popup will appear with your Client ID and Client Secret
   - **DO NOT close this popup yet**
   - Click the **download button (⬇)** in the top-right corner
   - Save the file as `credentials.json`

5. **Save Credentials File:**
   - **On Windows:** Save to `C:\Users\Admin\Desktop\Suresh\Sybil-BE\config\credentials.json`
   - **On Linux/VPS:** You'll upload it later (see Step 3.3)

### Step 3.3: Upload Credentials to Server (If Applicable)

**If running on remote server (Linux/VPS):**

**From Windows PowerShell:**
```powershell
cd "C:\Users\Admin\Desktop\Suresh\Sybil-BE"
scp -i .\gdrive.txt config\credentials.json ubuntu@YOUR_SERVER_IP:~/Sybil-BE/config/
```

**Replace:**
- `YOUR_SERVER_IP` with your actual server IP address
- `gdrive.txt` with your SSH key file path (if using key-based auth)
- Or use password-based authentication if preferred

**Verify on server:**
```bash
ls -la ~/Sybil-BE/config/credentials.json
# Should show file exists
```

---

## Getting Authentication Token

### Step 4.1: Run Authentication Setup

**On Windows:**
```powershell
cd "C:\Users\Admin\Desktop\Suresh\Sybil-BE"
python run_gdrive.py setup
```

**On Linux/VPS:**
```bash
cd ~/Sybil-BE
source venv/bin/activate  # If using virtual environment
python run_gdrive.py setup
```

### Step 4.2: Complete OAuth Flow

**You'll see output like:**
```
[INFO] Starting Google Drive authentication...
[INFO] No existing token found. Starting OAuth flow...
Please visit this URL to authorize this application:
https://accounts.google.com/o/oauth2/auth?client_id=...
```

**Option A: Browser Opens Automatically (Local Machine)**
1. Browser should open automatically
2. **Sign in with your NEW Gmail account** ⚠️ **CRITICAL: Use the new account!**
3. Click "Allow" or "Continue" when prompted
4. You may see a warning about "Google hasn't verified this app" - click "Advanced" → "Go to [App Name] (unsafe)"
5. Grant permissions
6. Return to terminal - should show success message

**Option B: Manual URL Copy (Server/Remote)**
1. **Copy the entire URL** shown in terminal
2. **Paste in your local browser** (on your Windows machine)
3. **Sign in with your NEW Gmail account** ⚠️ **CRITICAL: Use the new account!**
4. Grant permissions
5. You'll see an authorization code like: `4/0AeanS...`
6. **Copy the authorization code**
7. **Paste it back into the terminal** where prompted
8. Press Enter

### Step 4.3: Verify Token Creation

**Check that token was created:**
```bash
# On Windows
Test-Path config\token.pickle
# Should return: True

# On Linux/VPS
ls -la config/token.pickle
# Should show file with size > 0
```

**Expected terminal output:**
```
[OK] Successfully authenticated with Google Drive
[OK] Token saved to config/token.pickle
```

---

## Updating Folder Configuration

### Step 5.1: Identify Target Folder

**Decide which folder to monitor:**

**Option A: Use Existing Folder in New Account**
- If the new account already has a folder you want to monitor
- Note the exact folder name (case-sensitive)

**Option B: Create New Folder**
1. Go to https://drive.google.com
2. Sign in with **NEW** Gmail account
3. Click "New" → "Folder"
4. Name it: `RAG Documents` (or your preferred name)
5. Click "Create"

**Option C: Share Folder from Old Account**
1. In old account's Google Drive, right-click folder → "Share"
2. Add new Gmail account email
3. Grant "Viewer" or "Editor" access
4. Accept share in new account

### Step 5.2: Update Configuration File

**Edit `config/gdrive_config.json`:**

**On Windows:**
```powershell
notepad config\gdrive_config.json
```

**On Linux/VPS:**
```bash
nano config/gdrive_config.json
```

**Update the following section:**
```json
{
  "google_drive": {
    "credentials_file": "config/credentials.json",
    "token_file": "config/token.pickle",
    "state_file": "config/gdrive_state.json",
    "folder_name": "RAG Documents",  // ← Update this to your folder name
    "folder_id": null,                // ← Keep as null initially (will be auto-filled)
    "monitor_interval_seconds": 60
  }
}
```

**Important:**
- Set `folder_id` to `null` initially
- The system will automatically find and save the folder ID during setup
- Make sure `folder_name` matches **exactly** (case-sensitive, including spaces)

**Save the file:**
- Windows: `Ctrl+S` → Close Notepad
- Linux: `Ctrl+X` → `Y` → `Enter`

---

## Renaming Folders and IDs

### Step 6.1: Understanding Folder IDs

**Folder IDs vs Folder Names:**
- **Folder Name:** Human-readable name (e.g., "RAG Documents")
- **Folder ID:** Unique Google Drive identifier (e.g., "17ks1ygaaWB9RefEmUaUkGl3IaQ7FaWib")
- The system uses **both** - name for initial lookup, ID for actual monitoring

### Step 6.2: Finding Folder ID

**Method 1: Automatic (Recommended)**
Run setup again - it will find and save the folder ID:
```bash
python run_gdrive.py setup
```

**Expected output:**
```
[INFO] Searching for folder: RAG Documents
[OK] Found folder 'RAG Documents': 17ks1ygaaWB9RefEmUaUkGl3IaQ7FaWib
[OK] Folder ID saved to config
```

**Method 2: Manual Lookup**
```bash
python run_gdrive.py test
# This will list all folders with their IDs
```

**Method 3: From Google Drive URL**
1. Open folder in Google Drive
2. Look at URL: `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
3. Copy the ID after `/folders/`

### Step 6.3: Updating Folder ID in Config

**If folder ID wasn't auto-saved, edit manually:**

```json
{
  "google_drive": {
    "folder_name": "RAG Documents",
    "folder_id": "17ks1ygaaWB9RefEmUaUkGl3IaQ7FaWib",  // ← Paste your folder ID here
    "monitor_interval_seconds": 60
  }
}
```

### Step 6.4: Renaming Folders in Google Drive

**To rename a folder:**

1. Go to https://drive.google.com
2. Right-click folder → "Rename"
3. Enter new name
4. Click "OK"
5. **Update `folder_name` in config** to match new name
6. **Keep `folder_id` unchanged** (ID doesn't change when renaming)

**Important:** After renaming, update `gdrive_config.json`:
```json
{
  "google_drive": {
    "folder_name": "New Folder Name",  // ← Update this
    "folder_id": "17ks1ygaaWB9RefEmUaUkGl3IaQ7FaWib",  // ← Keep same ID
    ...
  }
}
```

---

## Testing the New Setup

### Step 7.1: Test Authentication

```bash
python run_gdrive.py setup
```

**Expected output:**
```
[INFO] Authenticating with Google Drive...
[OK] Authentication successful!
[OK] Found folder 'RAG Documents': 17ks1ygaaWB9RefEmUaUkGl3IaQ7FaWib
[OK] Folder ID saved to config
```

### Step 7.2: Test Folder Access

**List files in folder:**
```bash
python run_gdrive.py batch
```

**Expected output:**
```
[INFO] Found X files in folder
[INFO] Processing Y new files...
```

**If you see errors:**
- Check folder name matches exactly
- Verify folder exists in new account's Drive
- Ensure folder is not in trash
- Check folder permissions

### Step 7.3: Verify Account

**Check which account is authenticated:**

**Method 1: Check token info**
```python
# Create test script: test_account.py
import pickle
import os

token_file = 'config/token.pickle'
if os.path.exists(token_file):
    with open(token_file, 'rb') as f:
        creds = pickle.load(f)
        print(f"Token valid: {creds.valid}")
        if hasattr(creds, 'id_token'):
            # Decode to see email (requires additional parsing)
            print("Token exists and is valid")
else:
    print("No token file found")
```

**Method 2: Test with actual API call**
```bash
python run_gdrive.py batch
# Check logs - should show folder from new account
```

### Step 7.4: Test Monitoring (Optional)

**Start monitoring for a short test:**
```bash
# Run for 2 minutes, then Ctrl+C to stop
timeout 120 python run_gdrive.py monitor
# Or on Windows: Start-Process python -ArgumentList "run_gdrive.py monitor" -PassThru
```

**Expected behavior:**
- Should check folder every 60 seconds
- Should detect new files if any
- Should process them automatically

---

## Troubleshooting

### Issue 1: "Credentials file not found"

**Symptoms:**
```
[ERROR] Credentials file not found: config/credentials.json
```

**Solution:**
1. Verify `credentials.json` exists:
   ```bash
   ls config/credentials.json  # Linux
   Test-Path config\credentials.json  # Windows
   ```
2. If missing, re-download from Google Cloud Console (Step 3.2)
3. Ensure file is in correct location: `config/credentials.json`

---

### Issue 2: "Folder not found"

**Symptoms:**
```
[WARN] Folder 'RAG Documents' not found
```

**Solutions:**

**A. Check folder name spelling:**
- Folder names are **case-sensitive**
- Check for extra spaces
- Verify exact name in Google Drive

**B. Verify folder exists:**
```bash
python run_gdrive.py test
# Lists all folders - find yours in the list
```

**C. Check folder is not in trash:**
- Go to Google Drive → Trash
- If folder is there, restore it

**D. Verify account access:**
- Ensure you authenticated with the account that owns the folder
- If folder is shared, ensure you accepted the share

---

### Issue 3: "Invalid grant" or "Token expired"

**Symptoms:**
```
[ERROR] Token has been expired or revoked
```

**Solution:**
```bash
# Delete token and re-authenticate
rm config/token.pickle  # Linux
Remove-Item config\token.pickle  # Windows

# Re-run setup
python run_gdrive.py setup
```

---

### Issue 4: "redirect_uri_mismatch"

**Symptoms:**
```
[ERROR] redirect_uri_mismatch
```

**Cause:** OAuth credentials created as "Web application" instead of "Desktop app"

**Solution:**
1. Go to Google Cloud Console → Credentials
2. Delete the incorrect OAuth client
3. Create new one as **"Desktop app"** (Step 3.2)
4. Download new `credentials.json`
5. Re-authenticate

---

### Issue 5: Wrong Account Authenticated

**Symptoms:** System accessing folder from old account instead of new

**Solution:**
```bash
# Delete token
rm config/token.pickle

# Verify credentials.json is from new account
# Check file modification date or re-download

# Re-authenticate - IMPORTANT: Use new account when prompted
python run_gdrive.py setup
```

**Prevention:** Always double-check which account you're signing into during OAuth flow

---

### Issue 6: "Permission denied" when accessing folder

**Symptoms:**
```
[ERROR] Permission denied
[ERROR] Insufficient permissions
```

**Solutions:**

**A. Check OAuth scopes:**
- Ensure `https://www.googleapis.com/auth/drive.readonly` is enabled
- Re-authenticate if scopes changed

**B. Check folder permissions:**
- Verify new account has access to folder
- If shared folder, ensure share was accepted
- Check folder owner hasn't revoked access

**C. Verify API is enabled:**
- Go to Google Cloud Console → Enabled APIs
- Ensure "Google Drive API" is enabled

---

### Issue 7: Service Won't Start After Migration

**Symptoms:** Monitoring service fails to start

**Solution:**
```bash
# Check logs
tail -f ~/gdrive-monitor.log  # Linux
# Or check systemd logs
sudo journalctl -u gdrive-monitor -n 50

# Test manually first
python run_gdrive.py batch

# If manual works, restart service
sudo systemctl restart gdrive-monitor  # Linux
```

---

## Quick Reference Checklist

### Pre-Migration
- [ ] Stop monitoring service
- [ ] Backup current configuration files
- [ ] Delete old `token.pickle`
- [ ] Note current folder name and ID (for reference)

### Google Cloud Setup (New Account)
- [ ] Sign in to Google Cloud Console with **NEW** account
- [ ] Create/select project
- [ ] Enable Google Drive API
- [ ] Configure OAuth consent screen
- [ ] Create OAuth 2.0 credentials (**Desktop app**)
- [ ] Download `credentials.json`
- [ ] Upload `credentials.json` to server (if remote)

### Authentication
- [ ] Place `credentials.json` in `config/` directory
- [ ] Run `python run_gdrive.py setup`
- [ ] Complete OAuth flow with **NEW** account
- [ ] Verify `token.pickle` was created

### Configuration
- [ ] Update `folder_name` in `gdrive_config.json`
- [ ] Set `folder_id` to `null` (will auto-populate)
- [ ] Run setup again to find folder ID
- [ ] Verify folder ID was saved to config

### Testing
- [ ] Test authentication: `python run_gdrive.py setup`
- [ ] Test folder access: `python run_gdrive.py batch`
- [ ] Verify correct account is being used
- [ ] Test monitoring (optional): `python run_gdrive.py monitor`

### Post-Migration
- [ ] Restart monitoring service
- [ ] Verify service is running
- [ ] Check logs for errors
- [ ] Upload test file to folder and verify it's processed

---

## File Locations Reference

### Configuration Files
- **Credentials:** `config/credentials.json`
- **Token:** `config/token.pickle`
- **Config:** `config/gdrive_config.json`
- **State:** `config/gdrive_state.json`

### Backup Location
- **Recommended:** `backups/` directory

### Important Notes
- ✅ `credentials.json` - Safe to backup/share (contains OAuth client info)
- ❌ `token.pickle` - **NEVER** share/commit (contains access tokens)
- ✅ `gdrive_config.json` - Safe to backup (but contains API keys)
- ✅ `gdrive_state.json` - Safe to delete (will reprocess files)

---

## Additional Resources

- **Google Cloud Console:** https://console.cloud.google.com/
- **Google Drive:** https://drive.google.com/
- **OAuth 2.0 Documentation:** https://developers.google.com/identity/protocols/oauth2
- **Google Drive API Docs:** https://developers.google.com/drive/api

---

## Related Documentation

- `docs/GDRIVE_SETUP_GUIDE.md` - Initial setup guide
- `docs/GOOGLE_OAUTH_SETUP.md` - OAuth authentication details
- `docs/CHANGE_CREDENTIALS_GUIDE.md` - Alternative credential change guide
- `docs/SERVICE_ACCOUNT_GUIDE.md` - Service account setup (advanced)

---

## Summary

**Migration Steps (Quick Version):**

1. Stop service → Delete `token.pickle`
2. Create OAuth credentials in new Google account
3. Download `credentials.json` → Place in `config/`
4. Run `python run_gdrive.py setup` → Authenticate with **new account**
5. Update `folder_name` in `gdrive_config.json`
6. Run setup again → Folder ID auto-populates
7. Test with `python run_gdrive.py batch`
8. Restart service

**Time Estimate:** 15-20 minutes

**Critical Points:**
- ⚠️ Always authenticate with the **NEW** Gmail account during OAuth
- ⚠️ OAuth credentials must be **"Desktop app"** type
- ⚠️ Folder names are **case-sensitive**
- ⚠️ Never commit `token.pickle` to version control

---

**Last Updated:** December 2024

**Need Help?** Check troubleshooting section or review related documentation files.



