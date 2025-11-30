$source = "c:\Users\aharo\.gemini\antigravity\scratch\ein-tsofia-auth"
$destination = "c:\Users\aharo\.gemini\antigravity\scratch\ein-tsofia-project.zip"

Write-Host "Starting export..."
Write-Host "Source: $source"
Write-Host "Destination: $destination"

# Get all items excluding node_modules, .next, and .git
$items = Get-ChildItem -Path $source | Where-Object { @('node_modules', '.next', '.git') -notcontains $_.Name }

Write-Host "Compressing files (this may take a moment)..."
$items | Compress-Archive -DestinationPath $destination -Force

Write-Host "Success! Project exported to: $destination"
