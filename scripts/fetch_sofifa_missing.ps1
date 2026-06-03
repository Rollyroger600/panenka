<#
.SYNOPSIS
    Zoekt ontbrekende WK-spelers op sofifa.com en genereert TypeScript-entries.
.DESCRIPTION
    Leest wk_missing_excel.txt, zoekt per speler op sofifa.com (naam + nationaliteit),
    matcht op geboortedatum, en schrijft gevonden entries naar wk_sofifa_new_players.ts
    en niet-gevonden spelers naar wk_sofifa_notfound.txt.
.PARAMETER ExcelPath
    Pad naar de Master Excel (voor nat-lookup).
.PARAMETER MaxPlayers
    Test-modus: verwerk alleen eerste N spelers (0 = alle).
.PARAMETER SkipFirst
    Sla eerste N spelers over (voor hervatten na onderbreking).
.PARAMETER DelayMs
    Wachttijd (ms) tussen HTTP-requests om rate-limiting te voorkomen.
#>
param(
    [string]$ExcelPath  = "C:\RA\WK 2026\260603_WK 2026_Master.xlsx",
    [string]$InputFile  = "$PSScriptRoot\wk_missing_excel.txt",
    [string]$FoundTs    = "$PSScriptRoot\wk_sofifa_new_players.ts",
    [string]$NotFoundTxt = "$PSScriptRoot\wk_sofifa_notfound.txt",
    [int]$DelayMs       = 900,
    [int]$MaxPlayers    = 0,
    [int]$SkipFirst     = 0
)

$ErrorActionPreference = 'SilentlyContinue'
Set-StrictMode -Off

# ────────────────────────────────────────────────────────────────────────────
# 1.  NAT LOOKUP (hergebruik Excel sheet184, zelfde als build_players.ps1)
# ────────────────────────────────────────────────────────────────────────────

$tmpDir = "$env:TEMP\xlsx_wk_nat"
if (-not (Test-Path "$tmpDir\xl\worksheets\sheet184.xml")) {
    Write-Host "Extracting Excel nat data from $ExcelPath ..."
    if (Test-Path $tmpDir) { Remove-Item $tmpDir -Recurse -Force }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::ExtractToDirectory($ExcelPath, $tmpDir)
}

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

$natByNL = @{}
$natXml = [xml][System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes("$tmpDir\xl\worksheets\sheet184.xml"))
foreach ($row in $natXml.worksheet.sheetData.row) {
    $rn = [int]$row.r; if ($rn -le 1) { continue }
    $natEN = getStr ($row.c | Where-Object { $_.r -eq "B$rn" })
    $natNL = getStr ($row.c | Where-Object { $_.r -eq "D$rn" })
    $conf  = getStr ($row.c | Where-Object { $_.r -eq "E$rn" })
    $code  = getStr ($row.c | Where-Object { $_.r -eq "F$rn" })
    if ($natNL -ne '') { $natByNL[$natNL] = @{ EN=$natEN; Conf=$conf; Code=$code } }
}

# Aliassen voor namen die afwijken tussen FIFA-lijst en Excel
$aliases = @{
    'Bosnië en Herzegovina' = 'Bosnië-Herzegovina'
    "Haïti"                 = 'Haiti'
    "Curaçao"               = 'Curaçao'
    'DR Congo'              = 'Democratische Republiek Congo'
    'Ivoorkust'             = "Ivoorkust"
    'Trinidad en Tobago'    = 'Trinidad en Tobago'
    'Nieuw-Zeeland'         = 'Nieuw-Zeeland'
    'Oezbekistan'           = 'Oezbekistan'
    'Zuid-Afrika'           = 'Zuid-Afrika'
    'Zuid-Korea'            = 'Zuid-Korea'
}
foreach ($k in $aliases.Keys) {
    if (-not $natByNL[$k] -and $natByNL[$aliases[$k]]) {
        $natByNL[$k] = $natByNL[$aliases[$k]]
    }
}

Write-Host "Nat lookup geladen: $($natByNL.Count) landen"

# ────────────────────────────────────────────────────────────────────────────
# 2.  PARSE INPUT (markdown-tabel formaat)
# ────────────────────────────────────────────────────────────────────────────

$missing = @()
foreach ($line in (Get-Content $InputFile -Encoding UTF8)) {
    if ($line -match '^\| (.+?) \| (.+?) \| (.+?) \| (.+?) \|$') {
        $c = $Matches[1].Trim(); $n = $Matches[2].Trim()
        $po = $Matches[3].Trim(); $d = $Matches[4].Trim()
        if ($c -notmatch '^(Land|---)' -and $d -match '^\d{4}-\d{2}-\d{2}$') {
            $missing += [pscustomobject]@{ Country=$c; FifaName=$n; Pos=$po; DOB=$d }
        }
    }
}
Write-Host "Ontbrekende spelers geladen: $($missing.Count)"

# ────────────────────────────────────────────────────────────────────────────
# 3.  HTTP HELPER
# ────────────────────────────────────────────────────────────────────────────

$httpHeaders = @{
    'User-Agent'      = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    'Accept'          = 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    'Accept-Language' = 'en-US,en;q=0.9'
    'Connection'      = 'keep-alive'
}

function Get-Html($url) {
    try {
        $r = Invoke-WebRequest -Uri $url -Headers $httpHeaders -UseBasicParsing -TimeoutSec 20
        return $r.Content
    } catch {
        Write-Host "  HTTP fout [$url]: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# ────────────────────────────────────────────────────────────────────────────
# 4.  NAAM CONVERSIE  FIFA → zoektermen
#     "ABADA Achraf"    → ["Achraf Abada", "Abada"]
#     "DZEKO Edin"      → ["Edin Dzeko", "Dzeko"]
#     "WEVERTON"        → ["Weverton"]
# ────────────────────────────────────────────────────────────────────────────

function ConvertTo-SearchTerms([string]$fifaName) {
    $tc    = [System.Globalization.CultureInfo]::InvariantCulture.TextInfo
    $words = $fifaName.Trim() -split '\s+'

    if ($words.Count -eq 1) {
        return @($tc.ToTitleCase($words[0].ToLower()))
    }

    $lastName  = $tc.ToTitleCase($words[0].ToLower())
    $firstName = ($words[1..($words.Count-1)] -join ' ')
    return @("$firstName $lastName", $lastName)
}

# ────────────────────────────────────────────────────────────────────────────
# 5.  SOFIFA ZOEKACTIE
#     Retourneert lijst van {ID, Slug} kandidaten
# ────────────────────────────────────────────────────────────────────────────

function Search-Sofifa([string]$term, [string]$natCode) {
    $enc = [uri]::EscapeDataString($term)
    $url = "https://sofifa.com/players?keyword=$enc"
    if ($natCode) { $url += "&na=$natCode" }

    $html = Get-Html $url
    if (-not $html) { return @() }

    # Speler-links: /player/239085/erling-braut-haaland/
    $pattern = '/player/(\d+)/([^/"?#\s]+)'
    $ms      = [regex]::Matches($html, $pattern)

    $seen    = [System.Collections.Generic.HashSet[string]]::new()
    $results = @()
    foreach ($m in $ms) {
        $id   = $m.Groups[1].Value
        $slug = $m.Groups[2].Value
        if ($slug -eq 'loan' -or $slug -eq 'stats') { continue }  # filter non-player links
        if ($seen.Add($id)) {
            $results += [pscustomobject]@{ ID=[int]$id; Slug=$slug }
        }
    }
    return $results
}

# ────────────────────────────────────────────────────────────────────────────
# 6.  SPELER-PAGINA PARSEN
#     sofifa.com embeds __NEXT_DATA__ JSON in de HTML — daar halen we de data uit.
#     Fallback: regex op zichtbare HTML.
# ────────────────────────────────────────────────────────────────────────────

function Get-PlayerData([int]$id, [string]$slug) {
    $url  = "https://sofifa.com/player/$id/$slug/"
    $html = Get-Html $url
    if (-not $html) { return $null }

    $d = [ordered]@{
        ID       = $id
        Slug     = $slug
        DOBRaw   = ''
        DOB      = ''
        ShortName= ''
        MiddleName=''
        FullName  = ''
        Overall   = 0
        Positions = @()
        Age       = 0
        Club      = ''
        League    = ''
        LeagueId  = 0
        NatEN     = ''
        DebugUrl  = $url
    }

    # ── Probeer __NEXT_DATA__ JSON (meest betrouwbaar) ────────────────────
    if ($html -match '<script id="__NEXT_DATA__" type="application/json">(.+?)</script>') {
        try {
            $json = $Matches[1] | ConvertFrom-Json
            # Navigeer naar player data (structuur kan verschillen)
            $player = $null
            if ($json.props.pageProps.player)     { $player = $json.props.pageProps.player }
            elseif ($json.props.pageProps.data)   { $player = $json.props.pageProps.data   }

            if ($player) {
                if ($player.dob)               { $d.DOBRaw    = $player.dob }
                if ($player.short_name)        { $d.ShortName = $player.short_name }
                if ($player.long_name)         { $d.FullName  = $player.long_name  }
                if ($player.overall)           { $d.Overall   = [int]$player.overall }
                if ($player.player_positions)  { $d.Positions = ($player.player_positions -split ',') | ForEach-Object { $_.Trim() } | Where-Object { $_ } }
                if ($player.age)               { $d.Age       = [int]$player.age }
                if ($player.club_name)         { $d.Club      = $player.club_name }
                if ($player.league_name)       { $d.League    = $player.league_name }
                if ($player.league_id)         { $d.LeagueId  = [int]$player.league_id }
                if ($player.nationality_name)  { $d.NatEN     = $player.nationality_name }
            }
        } catch { }
    }

    # ── Fallback: regex patronen in HTML ─────────────────────────────────

    # DOB — probeer meerdere patronen
    if (-not $d.DOBRaw) {
        $dobPatterns = @(
            '"dob"\s*:\s*"(\d{4}-\d{2}-\d{2})"',
            'data-dob="(\d{4}-\d{2}-\d{2})"',
            '"birth_date"\s*:\s*"(\d{4}-\d{2}-\d{2})"',
            '(?:Born|DOB)[^\d]*(\d{4}-\d{2}-\d{2})',
            'class="[^"]*dob[^"]*"[^>]*>[^<]*?([A-Z][a-z]{2} \d{1,2}, \d{4})'
        )
        foreach ($pat in $dobPatterns) {
            if ($html -match $pat) { $d.DOBRaw = $Matches[1]; break }
        }
    }

    # Short name uit page title
    if (-not $d.ShortName -and $html -match '<title>([^<|]+?)(?:\s*\||\s*-\s*sofifa)') {
        $d.ShortName = $Matches[1].Trim()
    }

    # Overall
    if (-not $d.Overall -and $html -match '"overall"\s*:\s*(\d+)') {
        $d.Overall = [int]$Matches[1]
    }

    # Positions
    if (-not $d.Positions.Count -and $html -match '"player_positions"\s*:\s*"([^"]+)"') {
        $d.Positions = ($Matches[1] -split ',') | ForEach-Object { $_.Trim() } | Where-Object { $_ }
    }

    # Age
    if (-not $d.Age -and $html -match '"age"\s*:\s*(\d+)') {
        $d.Age = [int]$Matches[1]
    }

    # Club
    if (-not $d.Club -and $html -match '"club_name"\s*:\s*"([^"]+)"') {
        $d.Club = $Matches[1]
    }

    # League
    if (-not $d.League -and $html -match '"league_name"\s*:\s*"([^"]+)"') {
        $d.League = $Matches[1]
    }

    # League ID
    if (-not $d.LeagueId -and $html -match '"league_id"\s*:\s*(\d+)') {
        $d.LeagueId = [int]$Matches[1]
    }

    # Full name
    if (-not $d.FullName -and $html -match '"long_name"\s*:\s*"([^"]+)"') {
        $d.FullName = $Matches[1]
    }

    return $d
}

# ────────────────────────────────────────────────────────────────────────────
# 7.  DOB NORMALISATIE  "Jun 15, 1999" → "1999-06-15"
# ────────────────────────────────────────────────────────────────────────────

function Normalize-DOB([string]$raw) {
    if ($raw -match '^\d{4}-\d{2}-\d{2}$') { return $raw }
    $fmts = @('MMM d, yyyy', 'MMMM d, yyyy', 'MMM dd, yyyy', 'MMMM dd, yyyy')
    $cult  = [System.Globalization.CultureInfo]::InvariantCulture
    foreach ($fmt in $fmts) {
        try {
            $dt = [datetime]::ParseExact($raw, $fmt, $cult)
            return $dt.ToString('yyyy-MM-dd')
        } catch { }
    }
    return ''
}

# ────────────────────────────────────────────────────────────────────────────
# 8.  TYPESCRIPT ENTRY FORMATTER
# ────────────────────────────────────────────────────────────────────────────

function tsStr([string]$s) { '"' + ($s -replace '\\','\\' -replace '"','\"') + '"' }

function Format-Entry($pd, [string]$country, [string]$conf, [string]$fifaPos) {
    $posArr  = if ($pd.Positions.Count) {
                   ($pd.Positions | ForEach-Object { '"' + $_ + '"' }) -join ', '
               } else {
                   '"' + $fifaPos + '"'   # fallback: FIFA positie
               }
    $lgId    = if ($pd.LeagueId) { $pd.LeagueId } else { 0 }
    $overall = if ($pd.Overall)  { $pd.Overall  } else { 70 }
    $age     = if ($pd.Age)      { $pd.Age      } else { 0 }
    $club    = if ($pd.Club)     { $pd.Club     } else { '' }
    $league  = if ($pd.League)   { $pd.League   } else { '' }
    $full    = if ($pd.FullName)  { $pd.FullName  } else { $pd.ShortName }
    $mid     = if ($pd.ShortName) { $pd.ShortName } else { $full }

    return "  { id: $($pd.ID), leagueId: $lgId, name: $(tsStr $mid), middleName: $(tsStr $mid), fullName: $(tsStr $full), country: $(tsStr $country), overall: $overall, positions: [$posArr], age: $age, dob: $(tsStr $pd.DOB), club: $(tsStr $club), league: $(tsStr $league), confederation: $(tsStr $conf) },"
}

# ────────────────────────────────────────────────────────────────────────────
# 9.  HOOFDLUS
# ────────────────────────────────────────────────────────────────────────────

$foundEntries = [System.Collections.Generic.List[string]]::new()
$notFoundList = [System.Collections.Generic.List[string]]::new()

$toProcess = $missing | Select-Object -Skip $SkipFirst
if ($MaxPlayers -gt 0) { $toProcess = $toProcess | Select-Object -First $MaxPlayers }
$total     = @($toProcess).Count

Write-Host "Verwerken: $total spelers (skip=$SkipFirst, max=$MaxPlayers)"
Write-Host ""

$idx = 0; $nFound = 0; $nNotFound = 0

foreach ($p in $toProcess) {
    $idx++
    $natInfo = $natByNL[$p.Country]
    $natCode = if ($natInfo) { $natInfo.Code } else { '' }
    $natConf = if ($natInfo) { $natInfo.Conf } else { 'UEFA' }

    Write-Host "[$idx/$total] $($p.Country) | $($p.FifaName) ($($p.DOB))" -ForegroundColor Cyan

    $matched  = $null
    $terms    = ConvertTo-SearchTerms $p.FifaName

    :termLoop foreach ($term in $terms) {
        Start-Sleep -Milliseconds $DelayMs

        $candidates = Search-Sofifa $term $natCode
        Write-Host "  Zoekterm '$term' (na=$natCode) → $($candidates.Count) kandidaten"

        # Bekijk maximaal 5 kandidaten per zoekterm
        foreach ($c in ($candidates | Select-Object -First 5)) {
            Start-Sleep -Milliseconds ([int]($DelayMs * 0.6))

            $pd = Get-PlayerData $c.ID $c.Slug
            if (-not $pd) { continue }

            $dob = if ($pd.DOBRaw) { Normalize-DOB $pd.DOBRaw } else { '' }

            if ($dob -eq $p.DOB) {
                $pd.DOB = $dob
                Write-Host "  ✓ GEVONDEN  id=$($c.ID)  overall=$($pd.Overall)  club='$($pd.Club)'" -ForegroundColor Green
                $matched = $pd
                break termLoop
            } else {
                # Debug: toon waarom het niet matcht
                if ($dob) {
                    Write-Host "    id=$($c.ID): DOB=$dob ≠ $($p.DOB)" -ForegroundColor DarkGray
                }
            }
        }
    }

    if ($matched) {
        $entry = Format-Entry $matched $p.Country $natConf $p.Pos
        $foundEntries.Add($entry)
        $nFound++
    } else {
        Write-Host "  ✗ Niet gevonden" -ForegroundColor Yellow
        $notFoundList.Add("$($p.Country) | $($p.FifaName) | $($p.Pos) | $($p.DOB)")
        $nNotFound++
    }
}

# ────────────────────────────────────────────────────────────────────────────
# 10.  OUTPUT SCHRIJVEN
# ────────────────────────────────────────────────────────────────────────────

$tsHeader = @(
    '// Auto-generated door scripts/fetch_sofifa_missing.ps1'
    "// Gevonden: $nFound | Niet gevonden: $nNotFound"
    '// Voeg de onderstaande entries toe aan de WK_PLAYERS array in lib/data/players.ts'
    '// of run scripts/merge_sofifa_players.ps1 voor automatische merge.'
    ''
    '// prettier-ignore'
    'const WK_EXTRA_PLAYERS = ['
)
$tsFooter = @(']')

$tsLines = $tsHeader + $foundEntries + $tsFooter
[System.IO.File]::WriteAllLines($FoundTs,    $tsLines,       [System.Text.UTF8Encoding]::new($false))
[System.IO.File]::WriteAllLines($NotFoundTxt, $notFoundList, [System.Text.UTF8Encoding]::new($false))

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Green
Write-Host " KLAAR" -ForegroundColor Green
Write-Host "═══════════════════════════════════════" -ForegroundColor Green
Write-Host " Gevonden:      $nFound spelers"
Write-Host " Niet gevonden: $nNotFound spelers"
Write-Host " Output TS:     $FoundTs"
Write-Host " Niet gevonden: $NotFoundTxt"
