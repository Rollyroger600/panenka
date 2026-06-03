param(
    [int]$MinOverall = 68,
    [string]$ExcelPath = "C:\RA\WK 2026\260603_WK 2026_Master.xlsx",
    [string]$OverrideIdsFile = "$PSScriptRoot\wk_excel_override_ids.txt"
)

$tmpDir = "$env:TEMP\xlsx_nat_fix"
$outFile = "$PSScriptRoot\..\lib\data\players.ts"

Add-Type -AssemblyName System.IO.Compression.FileSystem

# Load WK override IDs (players to include regardless of overall)
$wkOverrideIds = @{}
if (Test-Path $OverrideIdsFile) {
    Get-Content $OverrideIdsFile -Encoding UTF8 | Where-Object { $_ -match '^\d+$' } | ForEach-Object {
        $wkOverrideIds[[int]$_] = $true
    }
    Write-Host "Loaded $($wkOverrideIds.Count) WK override IDs"
}

# Re-extract Excel if not yet done for this file
if (-not (Test-Path "$tmpDir\xl\worksheets\sheet181.xml")) {
    Write-Host "Extracting Excel from $ExcelPath..."
    if (Test-Path $tmpDir) { Remove-Item $tmpDir -Recurse -Force }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::ExtractToDirectory($ExcelPath, $tmpDir)
}

# Load shared strings with UTF-8
$sharedStrings = @()
$ssXml = [xml][System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes("$tmpDir\xl\sharedStrings.xml"))
foreach ($item in $ssXml.sst.si) {
    $texts = $item.SelectNodes('.//*[local-name()="t"]') | ForEach-Object { $_.InnerText }
    $sharedStrings += ($texts -join '')
}

function getStr($cell) {
    if ($null -eq $cell) { return '' }
    if ($cell.t -eq 's') { return $sharedStrings[[int]$cell.v] }
    if ($cell.v) { return [string]$cell.v } else { return '' }
}

function excelDateToISO($serial) {
    if (-not $serial -or $serial -eq '') { return '' }
    $d = [datetime]'1899-12-30'
    return $d.AddDays([double]$serial).ToString('yyyy-MM-dd')
}

# Parse Nat_TR (sheet184.xml): B=Nat_EN, D=Nat_NL, E=Conf, F=Code
$natXml = [xml][System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes("$tmpDir\xl\worksheets\sheet184.xml"))
$natByEN = @{}; $natByNL = @{}
foreach ($row in $natXml.worksheet.sheetData.row) {
    $rn = [int]$row.r; if ($rn -le 1) { continue }
    $natEN = getStr ($row.c | Where-Object { $_.r -eq "B$rn" })
    $natNL = getStr ($row.c | Where-Object { $_.r -eq "D$rn" })
    $conf  = getStr ($row.c | Where-Object { $_.r -eq "E$rn" })
    $code  = getStr ($row.c | Where-Object { $_.r -eq "F$rn" })
    if ($natEN -ne '') { $natByEN[$natEN] = @{ NL = $natNL; Conf = $conf; Code = $code } }
    if ($natNL -ne '' -and $natNL -ne $natEN) { $natByNL[$natNL] = @{ NL = $natNL; Conf = $conf; Code = $code } }
}
# Manual aliases for sofifa variant spellings
$natByNL['VS']                        = $natByEN['United States']
$natByNL['Saudi-Arabie']              = $natByEN['Saudi Arabia']
$natByNL['Saudi-Arabië']              = $natByEN['Saudi Arabia']
$natByNL['Bosnië-Herzegovina']        = $natByEN['Bosnia and Herzegovina']
$natByNL['Bosnië en Herzegovina']     = $natByEN['Bosnia and Herzegovina']
$natByNL['Kaapverdische Eil.']        = $natByEN['Cabo Verde']

function lookupNat($natName) {
    if ($natByEN.ContainsKey($natName)) { return $natByEN[$natName] }
    if ($natByNL.ContainsKey($natName)) { return $natByNL[$natName] }
    return $null
}

# Parse sofifa sheet (sheet181.xml)
# A=player_id, B=short_name, C=middle_name, D=long_name, E=overall, F=player_positions
# G=age, H=dob(serial), I=league_id, J=league_name, M=club_name, O=nationality_name
$sofXml = [xml][System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes("$tmpDir\xl\worksheets\sheet181.xml"))

$players = [System.Collections.Generic.List[hashtable]]::new()
$skippedLow = 0; $skippedNoNat = 0

foreach ($row in $sofXml.worksheet.sheetData.row) {
    $rn = [int]$row.r; if ($rn -le 1) { continue }

    $sofPlayerId = getStr ($row.c | Where-Object { $_.r -eq "A$rn" })
    $shortName   = getStr ($row.c | Where-Object { $_.r -eq "B$rn" })
    $middleName  = getStr ($row.c | Where-Object { $_.r -eq "C$rn" })
    $longName    = getStr ($row.c | Where-Object { $_.r -eq "D$rn" })
    $overallStr  = getStr ($row.c | Where-Object { $_.r -eq "E$rn" })
    $posStr      = getStr ($row.c | Where-Object { $_.r -eq "F$rn" })
    $ageStr      = getStr ($row.c | Where-Object { $_.r -eq "G$rn" })
    $dobSerial   = getStr ($row.c | Where-Object { $_.r -eq "H$rn" })
    $lgIdStr     = getStr ($row.c | Where-Object { $_.r -eq "I$rn" })
    $lgName      = getStr ($row.c | Where-Object { $_.r -eq "J$rn" })
    $clubName    = getStr ($row.c | Where-Object { $_.r -eq "M$rn" })
    $natName     = getStr ($row.c | Where-Object { $_.r -eq "O$rn" })

    if ($overallStr -eq '') { continue }
    $overall = [int]$overallStr
    $sofIdInt = if ($sofPlayerId -ne '') { [int]$sofPlayerId } else { 0 }
    if ($overall -lt $MinOverall -and -not $wkOverrideIds.ContainsKey($sofIdInt)) { $skippedLow++; continue }

    $info = lookupNat $natName
    if ($null -eq $info) { $skippedNoNat++; continue }

    $dob = excelDateToISO $dobSerial
    $age = if ($ageStr -ne '') { [int]$ageStr } else { 0 }
    $lgId = if ($lgIdStr -ne '') { [int]$lgIdStr } else { 0 }
    $sofId = $sofIdInt

    # Positions: comma-separated, trim spaces
    $positions = ($posStr -split ',') | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }

    $players.Add(@{
        id = $sofId
        leagueId = $lgId
        name = $shortName
        middleName = $middleName
        fullName = $longName
        country = $info.NL
        overall = $overall
        positions = $positions
        age = $age
        dob = $dob
        club = $clubName
        league = $lgName
        confederation = $info.Conf
    })
}

Write-Host "Players: $($players.Count) | Skipped (low): $skippedLow | Skipped (no nat): $skippedNoNat"

# ── Extra spelers uit wk_not_in_excel.xlsx ──────────────────────────────────
# Alle sheets behalve de eerste ("WK Missing Players") worden ingelezen.
# Verwacht kolomformaat: A=player_id B=short_name C=middle_name D=long_name
#   E=overall F=player_positions G=age H=dob(serial) I=league_id J=league_name
#   M=club_name O=nationality_name
$extraExcelPath = "$PSScriptRoot\wk_not_in_excel.xlsx"
if (Test-Path $extraExcelPath) {
    $extraTmp  = "$env:TEMP\xlsx_extra_players"
    $extraCopy = "$env:TEMP\wk_not_in_excel_build.xlsx"

    # Shadow-copy zodat het bestand open mag staan in Excel
    $ok = $true
    try {
        $rfs  = [System.IO.File]::Open($extraExcelPath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read, [System.IO.FileShare]::ReadWrite)
        $wfs  = [System.IO.File]::Create($extraCopy)
        $rfs.CopyTo($wfs); $wfs.Close(); $rfs.Close()
    } catch { Write-Host "Waarschuwing: wk_not_in_excel.xlsx niet leesbaar: $_"; $ok = $false }

    if ($ok) {
        if (Test-Path $extraTmp) { Remove-Item $extraTmp -Recurse -Force }
        [System.IO.Compression.ZipFile]::ExtractToDirectory($extraCopy, $extraTmp)

        # Eigen shared strings voor dit bestand
        $extraSS = @()
        $extraSsXml = [xml][System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes("$extraTmp\xl\sharedStrings.xml"))
        foreach ($item in $extraSsXml.sst.si) {
            $t = $item.SelectNodes('.//*[local-name()="t"]') | ForEach-Object { $_.InnerText }
            $extraSS += ($t -join '')
        }
        function getExStr($cell) {
            if ($null -eq $cell) { return '' }
            if ($cell.t -eq 's') { return $extraSS[[int]$cell.v] }
            if ($cell.v) { return [string]$cell.v } else { return '' }
        }

        # Sheet-relaties (rId → bestandspad)
        $wbRels = [xml][System.IO.File]::ReadAllText("$extraTmp\xl\_rels\workbook.xml.rels")
        $extraSheetFiles = @{}
        foreach ($r in $wbRels.Relationships.Relationship) { $extraSheetFiles[$r.Id] = $r.Target }

        # Workbook sheets
        $wbXml = [xml][System.IO.File]::ReadAllText("$extraTmp\xl\workbook.xml")
        $sheets = @($wbXml.workbook.sheets.sheet)

        # Bijhouden welke IDs al bestaan (voorkomt dupes)
        $existingIds = @{}
        $players | ForEach-Object { $existingIds[$_.id] = $true }

        $extraAdded = 0; $extraDupe = 0; $extraNoNat = 0
        $isFirst = $true

        foreach ($sheet in $sheets) {
            if ($isFirst) { $isFirst = $false; continue }  # sla "WK Missing Players" over

            $shPath = "$extraTmp\xl\$($extraSheetFiles[$sheet.id])"
            if (-not (Test-Path $shPath)) { continue }

            $shXml = [xml][System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes($shPath))

            foreach ($row in $shXml.worksheet.sheetData.row) {
                $rn = [int]$row.r; if ($rn -le 1) { continue }

                $exId = getExStr ($row.c | Where-Object { $_.r -eq "A$rn" })
                if ($exId -eq '' -or $exId -eq '0') { continue }
                $pidInt = [int]$exId

                if ($existingIds[$pidInt]) { $extraDupe++; continue }

                $eShort  = getExStr ($row.c | Where-Object { $_.r -eq "B$rn" })
                $eMid    = getExStr ($row.c | Where-Object { $_.r -eq "C$rn" })
                $eLong   = getExStr ($row.c | Where-Object { $_.r -eq "D$rn" })
                $eOvr    = getExStr ($row.c | Where-Object { $_.r -eq "E$rn" })
                $ePos    = getExStr ($row.c | Where-Object { $_.r -eq "F$rn" })
                $eAge    = getExStr ($row.c | Where-Object { $_.r -eq "G$rn" })
                $eDob    = getExStr ($row.c | Where-Object { $_.r -eq "H$rn" })
                $eLgId   = getExStr ($row.c | Where-Object { $_.r -eq "I$rn" })
                $eLgName = getExStr ($row.c | Where-Object { $_.r -eq "J$rn" })
                $eClub   = getExStr ($row.c | Where-Object { $_.r -eq "M$rn" })
                $eNat    = getExStr ($row.c | Where-Object { $_.r -eq "O$rn" })

                if ($eOvr -eq '') { continue }

                $info = lookupNat $eNat
                if ($null -eq $info) {
                    Write-Host "  Extra: nat onbekend '$eNat' (sheet=$($sheet.name) rij=$rn)" -ForegroundColor Yellow
                    $extraNoNat++; continue
                }

                $players.Add(@{
                    id         = $pidInt
                    leagueId   = if ($eLgId -ne '') { [int]$eLgId } else { 0 }
                    name       = $eShort
                    middleName = $eMid
                    fullName   = $eLong
                    country    = $info.NL
                    overall    = [int]$eOvr
                    positions  = ($ePos -split ',') | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
                    age        = if ($eAge -ne '') { [int]$eAge } else { 0 }
                    dob        = excelDateToISO $eDob
                    club       = $eClub
                    league     = $eLgName
                    confederation = $info.Conf
                })
                $existingIds[$pidInt] = $true
                $extraAdded++
            }
        }
        Write-Host "Extra (wk_not_in_excel.xlsx): +$extraAdded toegevoegd | $extraDupe dupes | $extraNoNat nat-onbekend"
    }
}
# ────────────────────────────────────────────────────────────────────────────

# Sort by overall desc, then name
$sorted = $players | Sort-Object { -$_.overall }, { $_.name }

# Generate TS
function tsStr($s) {
    # JSON-encode the string (handles Unicode, quotes, etc.)
    return '"' + ($s -replace '\\', '\\' -replace '"', '\"') + '"'
}

$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('export interface Player {')
$lines.Add('  id: number')
$lines.Add('  leagueId: number')
$lines.Add('  name: string')
$lines.Add('  middleName: string')
$lines.Add('  fullName: string')
$lines.Add('  country: string')
$lines.Add('  overall: number')
$lines.Add('  positions: string[]')
$lines.Add('  age: number')
$lines.Add('  dob: string')
$lines.Add('  club: string')
$lines.Add('  league: string')
$lines.Add('  confederation: string')
$lines.Add('}')
$lines.Add('')
$lines.Add('export const WK_PLAYERS: Player[] = [')

foreach ($p in $sorted) {
    $posArr = ($p.positions | ForEach-Object { '"' + $_ + '"' }) -join ', '
    $line = '  { ' +
        "id: $($p.id), " +
        "leagueId: $($p.leagueId), " +
        "name: $(tsStr $p.name), " +
        "middleName: $(tsStr $p.middleName), " +
        "fullName: $(tsStr $p.fullName), " +
        "country: $(tsStr $p.country), " +
        "overall: $($p.overall), " +
        "positions: [$posArr], " +
        "age: $($p.age), " +
        "dob: $(tsStr $p.dob), " +
        "club: $(tsStr $p.club), " +
        "league: $(tsStr $p.league), " +
        "confederation: $(tsStr $p.confederation) " +
        '},'
    $lines.Add($line)
}

$lines.Add(']')

[System.IO.File]::WriteAllLines($outFile, $lines, [System.Text.UTF8Encoding]::new($false))
Write-Host "Written to $outFile"
