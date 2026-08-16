$gh = "C:\Users\Samsung\AppData\Local\GitHubCLI\bin\gh.exe"
$git = "C:\Users\Samsung\AppData\Local\MinGit\cmd\git.exe"

$token = (& $gh auth token).Trim()

& $git add -A
& $git commit -m "fix: impedir sobrescrita de novos produtos e validar timestamps na sincronizacao"

$authUrl = "https://x-access-token:$token@github.com/mairiciodepaula2005-creator/Drograrias-Pietrao2.git"
& $git remote set-url origin $authUrl
& $git push origin main
& $git remote set-url origin "https://github.com/mairiciodepaula2005-creator/Drograrias-Pietrao2.git"

Write-Host "Fix enviado com sucesso!"
