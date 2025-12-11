# Repository Cleanup Script
# This script will delete development-only files and scripts

$rootDir = "d:/Avadhut/ZCode/Digial Marketing/Zecode-Website/Zecode-New/zecode-frontend"
$scriptsDir = "$rootDir/scripts"

Write-Host "Repository Cleanup Script" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

# Track deletions
$deleted = @()
$errors = @()

# Function to safely delete files
function Remove-Files {
    param(
        [string]$Pattern,
        [string]$Description
    )
    
    Write-Host "Deleting: $Description" -ForegroundColor Yellow
    $files = Get-ChildItem -Path $Pattern -ErrorAction SilentlyContinue
    
    foreach ($file in $files) {
        try {
            Remove-Item -Path $file.FullName -Force
            $deleted += $file.Name
            Write-Host "  ✓ Deleted: $($file.Name)" -ForegroundColor Green
        }
        catch {
            $errors += "Failed to delete $($file.Name): $_"
            Write-Host "  ✗ Failed: $($file.Name)" -ForegroundColor Red
        }
    }
}

Write-Host "Step 1: Deleting development scripts..." -ForegroundColor Cyan

# Delete fix-* scripts (except the 3 we just updated)
Remove-Files "$scriptsDir/fix-*.js" "Fix scripts (one-time fixes)"

# Delete analyze-* scripts
Remove-Files "$scriptsDir/analyze-*.js" "Analysis scripts"

# Delete verify-* scripts
Remove-Files "$scriptsDir/verify-*.js" "Verification scripts"

# Delete test-* scripts
Remove-Files "$scriptsDir/test-*.js" "Test scripts"

# Delete find-* scripts
Remove-Files "$scriptsDir/find-*.js" "Find/search scripts"

# Delete debug-* scripts
Remove-Files "$scriptsDir/debug-*.js" "Debug scripts"

# Delete specific development scripts
$devScripts = @(
    "ai-improve-product-names.js",
    "apply-comprehensive-fix.js",
    "apply-improvements.js",
    "audit-categories.js",
    "clear-kids-images.js",
    "cleanup-fake-stores.js",
    "compare-images.js",
    "comprehensive-fix.js",
    "comprehensive-kids-cleanup.js",
    "delete-dummy-store.js",
    "export-used-cloudinary-ids.js",
    "fetch-directus-images.js",
    "fetch-store-photos.js",
    "fetch-store-places.js",
    "final-summary.js",
    "full-audit.js",
    "gen-one.js",
    "generate-pending-poses.js",
    "generate-remaining-poses.js",
    "generate_images.js",
    "generate_model_images_v2.js",
    "generate_model_poses_node.js",
    "generate_group_banners_node.js",
    "improve-dress-names.js",
    "improve-generic-names-simple.js",
    "improve-generic-names.js",
    "improve-products.js",
    "inspect-stores.js",
    "list-cloudinary-images.js",
    "list-used-product-images.js",
    "match-by-name.js",
    "migrate-directus-complete.js",
    "migrate-pages-settings.js",
    "migrate-to-render.js",
    "move-jacket-to-activewear.js",
    "opencv-match.js",
    "process-references.js",
    "quick-check.js",
    "regenerate-all-slugs.js",
    "regenerate-slugs.js",
    "remove-ethnic-subcategories.js",
    "save-pending-products.js",
    "sync_directus.js",
    "temp-check.js",
    "update-ethnic.js",
    "update-products-from-csv.js",
    "update-slugs.js",
    "update-specific-product.js",
    "upload-matches-v2.js",
    "upload-matches.js",
    "upload-to-cloudinary.js",
    "upload_local_model_images.js"
)

foreach ($script in $devScripts) {
    $path = "$scriptsDir/$script"
    if (Test-Path $path) {
        try {
            Remove-Item -Path $path -Force
            $deleted += $script
            Write-Host "  ✓ Deleted: $script" -ForegroundColor Green
        }
        catch {
            $errors += "Failed to delete $script: $_"
            Write-Host "  ✗ Failed: $script" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Step 2: Deleting Python scripts..." -ForegroundColor Cyan
Remove-Files "$scriptsDir/*.py" "Python development scripts"

Write-Host ""
Write-Host "Step 3: Deleting temporary data files..." -ForegroundColor Cyan

# Delete JSON files (except package files)
$jsonFiles = Get-ChildItem "$scriptsDir/*.json" -ErrorAction SilentlyContinue | Where-Object { 
    $_.Name -ne "package.json" -and $_.Name -ne "package-lock.json" 
}
foreach ($file in $jsonFiles) {
    try {
        Remove-Item -Path $file.FullName -Force
        $deleted += $file.Name
        Write-Host "  ✓ Deleted: $($file.Name)" -ForegroundColor Green
    }
    catch {
        $errors += "Failed to delete $($file.Name): $_"
        Write-Host "  ✗ Failed: $($file.Name)" -ForegroundColor Red
    }
}

# Delete CSV files
Remove-Files "$scriptsDir/*.csv" "CSV data files"

# Delete HTML files
Remove-Files "$scriptsDir/*.html" "HTML debug files"

# Delete TXT files
Remove-Files "$scriptsDir/*.txt" "Text files"

Write-Host ""
Write-Host "Step 4: Deleting generated directories..." -ForegroundColor Cyan

$dirsToDelete = @(
    "$scriptsDir/generated-banners",
    "$scriptsDir/generated-model-poses",
    "$scriptsDir/pending-model-images"
)

foreach ($dir in $dirsToDelete) {
    if (Test-Path $dir) {
        try {
            Remove-Item -Path $dir -Recurse -Force
            $deleted += (Split-Path $dir -Leaf)
            Write-Host "  ✓ Deleted directory: $(Split-Path $dir -Leaf)" -ForegroundColor Green
        }
        catch {
            $errors += "Failed to delete directory $(Split-Path $dir -Leaf): $_"
            Write-Host "  ✗ Failed: $(Split-Path $dir -Leaf)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Step 5: Deleting internal documentation..." -ForegroundColor Cyan

$docsToDelete = @(
    "$scriptsDir/README-PRICE-UPDATE.md",
    "$scriptsDir/README-TOKEN-REFRESH.md",
    "$scriptsDir/home_slider_banner_workflow.md",
    "$rootDir/DEPLOYMENT.md",
    "$rootDir/DIRECTUS_BACKEND_SETUP.md",
    "$rootDir/DIRECTUS_THEME_SETUP.md",
    "$rootDir/INSTAGRAM_SETUP.md",
    "$rootDir/STORE_MANAGEMENT_GUIDE.md",
    "$rootDir/STORE_PHOTO_GALLERY_GUIDE.md"
)

foreach ($doc in $docsToDelete) {
    if (Test-Path $doc) {
        try {
            Remove-Item -Path $doc -Force
            $deleted += (Split-Path $doc -Leaf)
            Write-Host "  ✓ Deleted: $(Split-Path $doc -Leaf)" -ForegroundColor Green
        }
        catch {
            $errors += "Failed to delete $(Split-Path $doc -Leaf): $_"
            Write-Host "  ✗ Failed: $(Split-Path $doc -Leaf)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Step 6: Deleting root directory artifacts..." -ForegroundColor Cyan

$rootArtifacts = @(
    "$rootDir/debug_count.js",
    "$rootDir/diagnose_mens_products.js",
    "$rootDir/diagnosis_output.txt",
    "$rootDir/cloudinary-images.json",
    "$rootDir/directus-image-references.json",
    "$rootDir/directus_products.json",
    "$rootDir/directus_slides.json",
    "$rootDir/images-to-delete.txt",
    "$rootDir/kids.html",
    "$rootDir/men.html",
    "$rootDir/package.json.bak",
    "$rootDir/product_catalogue.csv",
    "$rootDir/product_catalogue.old.csv",
    "$rootDir/unused-images-report.json",
    "$rootDir/zecode-frontend.zip",
    "$rootDir/tsconfig.tsbuildinfo"
)

foreach ($artifact in $rootArtifacts) {
    if (Test-Path $artifact) {
        try {
            Remove-Item -Path $artifact -Force
            $deleted += (Split-Path $artifact -Leaf)
            Write-Host "  ✓ Deleted: $(Split-Path $artifact -Leaf)" -ForegroundColor Green
        }
        catch {
            $errors += "Failed to delete $(Split-Path $artifact -Leaf): $_"
            Write-Host "  ✗ Failed: $(Split-Path $artifact -Leaf)" -ForegroundColor Red
        }
    }
}

# Delete scripts/.env (API key file)
if (Test-Path "$scriptsDir/.env") {
    try {
        Remove-Item -Path "$scriptsDir/.env" -Force
        $deleted += "scripts/.env"
        Write-Host "  ✓ Deleted: scripts/.env" -ForegroundColor Green
    }
    catch {
        $errors += "Failed to delete scripts/.env: $_"
        Write-Host "  ✗ Failed: scripts/.env" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "Cleanup Summary" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host "Total files/directories deleted: $($deleted.Count)" -ForegroundColor Green

if ($errors.Count -gt 0) {
    Write-Host "Errors encountered: $($errors.Count)" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  - $error" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Cleanup complete!" -ForegroundColor Green
