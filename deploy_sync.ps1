$gh = "C:\Users\Samsung\AppData\Local\GitHubCLI\bin\gh.exe"
$git = "C:\Users\Samsung\AppData\Local\MinGit\cmd\git.exe"

$token = (& $gh auth token).Trim()

& $git add -A
& $git commit -m "feat: sincronizacao automatica nativa em tempo real entre dispositivos via GitHub Cloud Sync"

$authUrl = "https://x-access-token:$token@github.com/mairiciodepaula2005-creator/Drograrias-Pietrao2.git"
& $git remote set-url origin $authUrl
& $git push origin main
& $git remote set-url origin "https://github.com/mairiciodepaula2005-creator/Drograrias-Pietrao2.git"
Remove-Item deploy_sync.ps1 -Force -ErrorAction SilentlyContinue

Write-Host "Enviado com sucesso!"
