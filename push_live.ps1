$gh = "C:\Users\Samsung\AppData\Local\GitHubCLI\bin\gh.exe"
$git = "C:\Users\Samsung\AppData\Local\MinGit\cmd\git.exe"

$token = (& $gh auth token).Trim()

& $git add -A
& $git commit -m "feat: integracao e sincronizacao multi-dispositivos via GitHub com responsividade mobile otimizada"
$authUrl = "https://x-access-token:$token@github.com/mairiciodepaula2005-creator/Drograrias-Pietrao2.git"
& $git remote set-url origin $authUrl
& $git push origin main
& $git remote set-url origin "https://github.com/mairiciodepaula2005-creator/Drograrias-Pietrao2.git"
Remove-Item push_live.ps1 -Force -ErrorAction SilentlyContinue

Write-Host "Commit e push concluidos com sucesso!"
