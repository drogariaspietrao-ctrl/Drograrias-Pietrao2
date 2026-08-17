$gh = "C:\Users\Samsung\AppData\Local\GitHubCLI\bin\gh.exe"
$git = "C:\Users\Samsung\AppData\Local\MinGit\cmd\git.exe"

$token = (& $gh auth token).Trim()

& $git add -A
& $git commit -m "revert: retornar ao modelo anterior de sincronizacao nativa via GitHub Cloud Engine"

$authUrl = "https://x-access-token:$token@github.com/mairiciodepaula2005-creator/Drograrias-Pietrao2.git"
& $git remote set-url origin $authUrl
& $git push origin main --force
& $git remote set-url origin "https://github.com/mairiciodepaula2005-creator/Drograrias-Pietrao2.git"
Remove-Item push_revert.ps1 -Force -ErrorAction SilentlyContinue

Write-Host "Reversao enviada com sucesso ao GitHub!"
