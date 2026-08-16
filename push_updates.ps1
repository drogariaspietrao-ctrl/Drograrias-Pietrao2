$gh = "C:\Users\Samsung\AppData\Local\GitHubCLI\bin\gh.exe"
$git = "C:\Users\Samsung\AppData\Local\MinGit\cmd\git.exe"

$token = (& $gh auth token).Trim()

if (-not $token) {
    Write-Host "Erro: Token nao encontrado."
    exit 1
}

Write-Host "Adicionando todos os arquivos..."
& $git add -A

Write-Host "Realizando commit..."
& $git commit -m "feat: sincronizacao automatica via db.json do GitHub para multiplos dispositivos e correcao de cache"

Write-Host "Configurando URL com autenticacao..."
$authUrl = "https://x-access-token:$token@github.com/mairiciodepaula2005-creator/Drograrias-Pietrao2.git"
& $git remote set-url origin $authUrl

Write-Host "Enviando ao GitHub..."
& $git push origin main

Write-Host "Restaurando URL padrao..."
& $git remote set-url origin "https://github.com/mairiciodepaula2005-creator/Drograrias-Pietrao2.git"

Write-Host "Concluido com sucesso!"
