$repo = "mairiciodepaula2005-creator/Drograrias-Pietrao2"

$headers = @{
    "Origin" = "https://mairiciodepaula2005-creator.github.io"
    "Access-Control-Request-Method" = "PUT"
    "Access-Control-Request-Headers" = "authorization,content-type,accept"
    "User-Agent" = "Mozilla/5.0"
}

$res = Invoke-WebRequest -Uri "https://api.github.com/repos/$repo/contents/db.json" -Method OPTIONS -Headers $headers
Write-Host "OPTIONS Status: $($res.StatusCode)"
Write-Host "Access-Control-Allow-Origin: $($res.Headers['Access-Control-Allow-Origin'])"
Write-Host "Access-Control-Allow-Headers: $($res.Headers['Access-Control-Allow-Headers'])"
