Add-Type -AssemblyName System.Drawing
$imagePath = "c:\Users\WPENL0053369\Desktop\Invitation\images\thumbnail.jpg"
$outputPath = "c:\Users\WPENL0053369\Desktop\Invitation\images\thumbnail_resized.jpg"

try {
    $img = [System.Drawing.Image]::FromFile($imagePath)
    $bmp = New-Object System.Drawing.Bitmap(1200, 630)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $g.DrawImage($img, 0, 0, 1200, 630)
    
    $img.Dispose()
    $g.Dispose()
    
    # Save with high quality JPEG setting
    $encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.FormatDescription -eq "JPEG" }
    $parameters = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $parameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 90)
    
    $bmp.Save($outputPath, $encoder, $parameters)
    $bmp.Dispose()
    
    Remove-Item $imagePath
    Rename-Item $outputPath "thumbnail.jpg"
    Write-Output "SUCCESS: Image resized to 1200x630"
} catch {
    Write-Error "Failed to resize image: $_"
    exit 1
}
