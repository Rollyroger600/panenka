param([int]$MinOverall = 68)

$tmpDir = "$env:TEMP\xlsx_nat_fix"
$outFile = "$PSScriptRoot\..\lib\data\players.ts"

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
$natByNL['VS']                     = $natByEN['United States']
$natByNL['Saudi-Arabie']           = $natByEN['Saudi Arabia']
$natByNL['Saudi-Arabië']      = $natByEN['Saudi Arabia']
$natByNL['Saudi-Arabië']           = $natByEN['Saudi Arabia']
$natByNL['Bosnië-Herzegovina'] = $natByEN['Bosnia and Herzegovina']
$natByNL['Bosnië-Herzegovina']     = $natByEN['Bosnia and Herzegovina']
$natByNL['Kaapverdische Eil.']     = $natByEN['Cabo Verde']

function lookupNat($natName) {
    if ($natByEN.ContainsKey($natName)) { return $natByEN[$natName] }
    if ($natByNL.ContainsKey($natName)) { return $natByNL[$natName] }
    return $null
}

# Parse sofifa sheet (sheet181.xml)
# A=player_id, B=short_name, D=long_name, E=overall, F=player_positions
# G=age, H=dob(serial), I=league_id, J=league_name, M=club_name, O=nationality_name
$sofXml = [xml][System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes("$tmpDir\xl\worksheets\sheet181.xml"))

$players = [System.Collections.Generic.List[hashtable]]::new()
$skippedLow = 0; $skippedNoNat = 0

foreach ($row in $sofXml.worksheet.sheetData.row) {
    $rn = [int]$row.r; if ($rn -le 1) { continue }

    $sofPlayerId = getStr ($row.c | Where-Object { $_.r -eq "A$rn" })
    $shortName   = getStr ($row.c | Where-Object { $_.r -eq "B$rn" })
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
    if ($overall -lt $MinOverall) { $skippedLow++; continue }

    $info = lookupNat $natName
    if ($null -eq $info) { $skippedNoNat++; continue }

    $dob = excelDateToISO $dobSerial
    $age = if ($ageStr -ne '') { [int]$ageStr } else { 0 }
    $lgId = if ($lgIdStr -ne '') { [int]$lgIdStr } else { 0 }
    $sofId = if ($sofPlayerId -ne '') { [int]$sofPlayerId } else { 0 }

    # Positions: comma-separated, trim spaces
    $positions = ($posStr -split ',') | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }

    $players.Add(@{
        id = $sofId
        leagueId = $lgId
        name = $shortName
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
