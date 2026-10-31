# Uploads the Android upload key to GitHub Actions secrets so CI can sign release builds.
# Run it yourself: powershell -ExecutionPolicy Bypass -File tools\upload-secrets.ps1
$keys = 'F:\clade\sizeright-keys'
$gh = 'C:\Program Files\GitHub CLI\gh.exe'
$repo = 'StormRulzz/sizeright'

[Convert]::ToBase64String([IO.File]::ReadAllBytes("$keys\upload.keystore")) | & $gh secret set ANDROID_KEYSTORE_BASE64 --repo $repo
Get-Content "$keys\password.txt" -Raw | & $gh secret set ANDROID_KEYSTORE_PASSWORD --repo $repo
'upload' | & $gh secret set ANDROID_KEY_ALIAS --repo $repo
& $gh secret list --repo $repo
