# PowerShell Script to generate a complete valid 7-slide Sound of Times PPTX file
$ErrorActionPreference = "Stop"
[System.Reflection.Assembly]::LoadWithPartialName('System.IO.Compression.FileSystem') | Out-Null

$outputPptx = Join-Path $PSScriptRoot "..\Sound_of_Times_Presentation.pptx"
$tempDir = Join-Path $PSScriptRoot "pptx_build_temp"

if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
if (Test-Path $outputPptx) { Remove-Item -Force $outputPptx }

# Create folder structure
$dirs = @(
    "",
    "_rels",
    "ppt",
    "ppt\_rels",
    "ppt\slideMasters",
    "ppt\slideMasters\_rels",
    "ppt\slideLayouts",
    "ppt\slideLayouts\_rels",
    "ppt\slides",
    "ppt\slides\_rels",
    "ppt\theme"
)
foreach ($d in $dirs) {
    New-Item -ItemType Directory -Force -Path (Join-Path $tempDir $d) | Out-Null
}

# 1. [Content_Types].xml
$contentTypes = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  <Override PartName="/ppt/slides/slide1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide2.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide3.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide4.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide5.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide6.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
  <Override PartName="/ppt/slides/slide7.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>
</Types>
"@
[System.IO.File]::WriteAllText((Join-Path $tempDir "[Content_Types].xml"), $contentTypes.Trim(), [System.Text.Encoding]::UTF8)

# 2. _rels/.rels
$rootRels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>
"@
[System.IO.File]::WriteAllText((Join-Path $tempDir "_rels\.rels"), $rootRels.Trim(), [System.Text.Encoding]::UTF8)

# 3. ppt/_rels/presentation.xml.rels
$presRels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide2.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide3.xml"/>
  <Relationship Id="rId5" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide4.xml"/>
  <Relationship Id="rId6" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide5.xml"/>
  <Relationship Id="rId7" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide6.xml"/>
  <Relationship Id="rId8" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide7.xml"/>
  <Relationship Id="rId9" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>
</Relationships>
"@
[System.IO.File]::WriteAllText((Join-Path $tempDir "ppt\_rels\presentation.xml.rels"), $presRels.Trim(), [System.Text.Encoding]::UTF8)

# 4. ppt/presentation.xml
$presXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    <p:sldId id="256" r:id="rId2"/>
    <p:sldId id="257" r:id="rId3"/>
    <p:sldId id="258" r:id="rId4"/>
    <p:sldId id="259" r:id="rId5"/>
    <p:sldId id="260" r:id="rId6"/>
    <p:sldId id="261" r:id="rId7"/>
    <p:sldId id="262" r:id="rId8"/>
  </p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="screen16x9"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>
"@
[System.IO.File]::WriteAllText((Join-Path $tempDir "ppt\presentation.xml"), $presXml.Trim(), [System.Text.Encoding]::UTF8)

# 5. ppt/theme/theme1.xml (Dark Space Retro Synthwave Theme)
$themeXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="SpaceSoundsTheme">
  <a:themeElements>
    <a:clrScheme name="RetroSynthwave">
      <a:dk1><a:srgbClr val="070414"/></a:dk1>
      <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="160A2C"/></a:dk2>
      <a:lt2><a:srgbClr val="F3F0FA"/></a:lt2>
      <a:accent1><a:srgbClr val="47D8F2"/></a:accent1>
      <a:accent2><a:srgbClr val="FFD166"/></a:accent2>
      <a:accent3><a:srgbClr val="F28BBD"/></a:accent3>
      <a:accent4><a:srgbClr val="62C98A"/></a:accent4>
      <a:accent5><a:srgbClr val="9B5DE5"/></a:accent5>
      <a:accent6><a:srgbClr val="FF6B6B"/></a:accent6>
      <a:hlink><a:srgbClr val="47D8F2"/></a:hlink>
      <a:folHlink><a:srgbClr val="F28BBD"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="RetroMonospace">
      <a:majorFont>
        <a:latin typeface="Courier New"/>
        <a:ea typeface=""/>
        <a:cs typeface=""/>
      </a:majorFont>
      <a:minorFont>
        <a:latin typeface="Courier New"/>
        <a:ea typeface=""/>
        <a:cs typeface=""/>
      </a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Office">
      <a:fillStyleLst>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
        <a:gradFill rotWithShape="1">
          <a:gsLst>
            <a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="50000"/><a:satMod val="300000"/></a:schemeClr></a:gs>
            <a:gs pos="100000"><a:schemeClr val="phClr"><a:shade val="30000"/><a:satMod val="200000"/></a:schemeClr></a:gs>
          </a:gsLst>
        </a:gradFill>
        <a:gradFill rotWithShape="1">
          <a:gsLst>
            <a:gs pos="0"><a:schemeClr val="phClr"><a:tint val="80000"/></a:schemeClr></a:gs>
            <a:gs pos="100000"><a:schemeClr val="phClr"><a:shade val="50000"/></a:schemeClr></a:gs>
          </a:gsLst>
        </a:gradFill>
      </a:fillStyleLst>
      <a:lnStyleLst>
        <a:ln w="9525" cap="flat" cmpd="s" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
        <a:ln w="25400" cap="flat" cmpd="s" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
        <a:ln w="38100" cap="flat" cmpd="s" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>
      </a:lnStyleLst>
      <a:effectStyleLst>
        <a:effectStyle><a:effectLst/></a:effectStyle>
        <a:effectStyle><a:effectLst/></a:effectStyle>
        <a:effectStyle><a:effectLst/></a:effectStyle>
      </a:effectStyleLst>
      <a:bgFillStyleLst>
        <a:solidFill><a:schemeClr val="dk1"/></a:solidFill>
        <a:solidFill><a:schemeClr val="dk2"/></a:solidFill>
        <a:solidFill><a:schemeClr val="phClr"/></a:solidFill>
      </a:bgFillStyleLst>
    </a:fmtScheme>
  </a:themeElements>
</a:theme>
"@
[System.IO.File]::WriteAllText((Join-Path $tempDir "ppt\theme\theme1.xml"), $themeXml.Trim(), [System.Text.Encoding]::UTF8)

# 6. ppt/slideMasters/slideMaster1.xml
$masterXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg>
      <p:bgPr>
        <a:solidFill><a:srgbClr val="070414"/></a:solidFill>
        <a:effectLst/>
      </p:bgPr>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr>
        <p:cNvPr id="1" name=""/>
        <p:cNvGrpSpPr/>
        <p:nvPr/>
      </p:nvGrpSpPr>
      <p:grpSpPr>
        <a:xfrm>
          <a:off x="0" y="0"/>
          <a:ext cx="0" cy="0"/>
          <a:chOff x="0" y="0"/>
          <a:chExt cx="0" cy="0"/>
        </a:xfrm>
      </p:grpSpPr>
    </p:spTree>
  </p:cSld>
  <p:clrMap bg1="dk1" tx1="lt1" bg2="dk2" tx2="lt2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst>
    <p:sldLayoutId id="2147483649" r:id="rId1"/>
    <p:sldLayoutId id="2147483650" r:id="rId2"/>
  </p:sldLayoutIdLst>
</p:sldMaster>
"@
[System.IO.File]::WriteAllText((Join-Path $tempDir "ppt\slideMasters\slideMaster1.xml"), $masterXml.Trim(), [System.Text.Encoding]::UTF8)

# slideMaster1.xml.rels
$masterRels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>
</Relationships>
"@
[System.IO.File]::WriteAllText((Join-Path $tempDir "ppt\slideMasters\_rels\slideMaster1.xml.rels"), $masterRels.Trim(), [System.Text.Encoding]::UTF8)

# 7. slideLayout1.xml (Title Layout) & slideLayout2.xml (Content Layout)
$layout1Xml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="title" preserve="1">
  <p:cSld name="Title Slide">
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    </p:spTree>
  </p:cSld>
</p:sldLayout>
"@
[System.IO.File]::WriteAllText((Join-Path $tempDir "ppt\slideLayouts\slideLayout1.xml"), $layout1Xml.Trim(), [System.Text.Encoding]::UTF8)

$layout2Xml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="obj" preserve="1">
  <p:cSld name="Title and Content">
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    </p:spTree>
  </p:cSld>
</p:sldLayout>
"@
[System.IO.File]::WriteAllText((Join-Path $tempDir "ppt\slideLayouts\slideLayout2.xml"), $layout2Xml.Trim(), [System.Text.Encoding]::UTF8)

# slideLayout rels
$layoutRels = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>
</Relationships>
"@
[System.IO.File]::WriteAllText((Join-Path $tempDir "ppt\slideLayouts\_rels\slideLayout1.xml.rels"), $layoutRels.Trim(), [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText((Join-Path $tempDir "ppt\slideLayouts\_rels\slideLayout2.xml.rels"), $layoutRels.Trim(), [System.Text.Encoding]::UTF8)

# 8. Define the 7 Slides Content Data
$slidesData = @(
    @{
        Title = "SOUND OF TIMES"
        Subtitle = "An Interactive NASA Data Sonification & Retro Pixel-Art Game"
        Category = "MISSION PRESENTATION"
        Bullets = @(
            "Team: SPACE SOUNDS",
            "Team Members: Carol Pillai & Ziven Pereira",
            "Core Concept: Andy Weir's 'Project Hail Mary' Extraterrestrial Adaptation",
            "Key Innovation: Real-time Sonification of 4 NASA Earth Satellite Archives",
            "Tagline: 'A little piece of Earth, far away from home.'"
        )
    },
    @{
        Title = "PROJECT OVERVIEW & NARRATIVE"
        Subtitle = "The Story Arc on 40 Eridani & Across the Cosmos"
        Category = "WORLD BUILDING & LORE"
        Bullets = @(
            "Dr. Ryland Grace (Ryan): Human astronaut & teacher stranded on the alien world of Erid.",
            "Rocky: Five-legged Eridian engineer companion, master of materials science & xenonite.",
            "The Eridian Classroom: Ryan teaches young children ('the little ones') about planetary atmospheres on stepped basalt columns.",
            "The Buried Jukebox: An ancient 1940s-style retro Sol-3 archive holding the acoustic memory of planet Earth.",
            "Emotional Journey: A homesick human and an alien friend crossing the galaxy to reunite on Earth's Jurassic Coast."
        )
    },
    @{
        Title = "NASA DATA SONIFICATION PIPELINE"
        Subtitle = "Transforming Real Satellite Telemetry into Harmonic Symphony"
        Category = "SCIENTIFIC RIGOR"
        Bullets = @(
            "Record 001 - The Atmosphere (MERRA-2 & GPM IMERG): Pressure gradients & precipitation rates synthesizing pink-noise rain & thunder sub-bass.",
            "Record 002 - The Ocean (NASA ECCO V4r4 & SVS 3912): Daily potential temperatures (4-28 C) driving pitch across an oceanic Dorian scale; salinity (SALT PSU) controlling FM brightness.",
            "Record 003 - The Forest (NASA GEDI Lidar & MODIS NDVI): Lidar canopy height metrics generating wind rustle, stream gurgles, and authentic songbird choruses.",
            "Record 004 - Whole Earth (Sol-3 Repository): Unlocked planetary symphony uniting biosphere, hydrosphere, and atmosphere.",
            "Scientific Transparency: Real numerical data-driven synthesis, fully documented and mathematically verified."
        )
    },
    @{
        Title = "TECHNICAL ARCHITECTURE"
        Subtitle = "Zero-Dependency Client-Side Engine & Procedural Audio"
        Category = "SOFTWARE ENGINEERING"
        Bullets = @(
            "Vanilla JavaScript Stack: 100% pure ES6+ with HTML5 Canvas 2D and Tone.js; runs at 60 FPS in any browser.",
            "Web Audio API Synthesis: Custom pink/white noise generators, biquad filter sweeps, and multi-oscillator LFO modulation.",
            "Autoplay-Compliant Audio Gate: Upfront retro sci-fi permission dialog eliminating browser autoplay restrictions.",
            "Tactile Mechanical SFX: Turntable motor spin-up (45Hz-320Hz glide), needle contact thud, and mechanical carousel indexing.",
            "Input Stabilization: State-machine action clamps preventing dialogue key bleeding into gameplay mechanics."
        )
    },
    @{
        Title = "CHARACTERS & ENVIRONMENTS"
        Subtitle = "Hand-Crafted Pixel Art & Geological World Design"
        Category = "ART DIRECTION"
        Bullets = @(
            "Ryan Grace (~82px): Tailored EVA astronaut suit on Erid; cozy cream/chocolate mountain-ram fleece jacket on Earth.",
            "Rocky (~58px): Five articulated mineral legs, faceted carapace, and tailored geodesic xenonite pressure exoskeleton with golden struts.",
            "Young Eridian Students: 4 color/behavior variants (Obsidian stacker, Ochre listener, Turquoise leaper, Copper purrer) on basalt columns.",
            "Erid Environment: Deep cosmic violet night, glowing ringed sister gas giant, sister moon, and volcanic peaks.",
            "Jurassic Coast Finale: Pale misty daylight, turquoise rolling surf, and the iconic Durdle Door natural rock arch."
        )
    },
    @{
        Title = "GAMEPLAY FEATURES & CINEMA"
        Subtitle = "Interactive Console, Memory Vision & Beach Reunion"
        Category = "PLAYER EXPERIENCE"
        Bullets = @(
            "Andy Weir Script Engine: Authentic typewriter dialogue ('Amaze! Amaze! Amaze!', 'Question:', 'Fist my bump!').",
            "Interactive Jukebox Deck: Tactile record switching (1-4), play/pause, volume slider, and live NASA oscilloscope waveforms.",
            "4K Slow-Motion Memory Vision: Photorealistic memory cinema with variable speed toggles (0.2x Ultra Slow, 0.35x Slow-Mo, 1.0x Normal).",
            "Grand Finale Exploration: Player controls Ryan and Rocky walking along the pebble shore and sitting together watching the tide.",
            "Accessibility: Full keyboard navigation ([A/D], [Arrows], [ENTER], [M] mute, [F] fullscreen)."
        )
    },
    @{
        Title = "ACCOMPLISHMENTS & ROADMAP"
        Subtitle = "Educational Impact, Future Horizons & Closing"
        Category = "CONCLUSION"
        Bullets = @(
            "Core Accomplishment: Seamlessly merged NASA satellite observations with deep emotional narrative gaming.",
            "Pedagogical Power: Transforming abstract climate and environmental data into an intuitive sensory journey.",
            "Future Roadmap: Expanding to Mars seismic telemetry (InSight) and Jovian auroral radio frequencies (Juno).",
            "Classroom STEM Expansion: Interactive frequency-matching sound puzzles teaching physics across worlds.",
            "Space Sounds Sign-Off: 'Good. Proud. We saved two worlds, Grace. We are friends forever.'"
        )
    }
)

# 9. Generate Slide XML Files
for ($i = 0; $i -lt $slidesData.Count; $i++) {
    $idx = $i + 1
    $data = $slidesData[$i]
    $isHero = ($idx -eq 1)

    $bulletXml = ""
    foreach ($b in $data.Bullets) {
        $bulletXml += @"
          <a:p>
            <a:pPr lvl="0" marL="288000">
              <a:buClr><a:srgbClr val="FFD166"/></a:buClr>
              <a:buChar char="&#x25B6;"/>
            </a:pPr>
            <a:r>
              <a:rPr lang="en-US" sz="1500" b="0">
                <a:solidFill><a:srgbClr val="F3F0FA"/></a:solidFill>
                <a:latin typeface="Courier New"/>
              </a:rPr>
              <a:t>$([System.Security.SecurityElement]::Escape($b))</a:t>
            </a:r>
          </a:p>
"@
    }

    $slideXml = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld>
    <p:bg>
      <p:bgPr>
        <a:solidFill><a:srgbClr val="070414"/></a:solidFill>
      </p:bgPr>
    </p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      
      <!-- Top Category & Slide Indicator -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Category"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="822960" y="365760"/><a:ext cx="10543540" cy="365760"/></a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz" lIns="0" tIns="0" rIns="0" bIns="0"/>
          <a:p>
            <a:r>
              <a:rPr lang="en-US" sz="1000" b="1">
                <a:solidFill><a:srgbClr val="FFD166"/></a:solidFill>
                <a:latin typeface="Courier New"/>
              </a:rPr>
              <a:t>$([System.Security.SecurityElement]::Escape($data.Category)) // SLIDE 0$idx OF 07</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>

      <!-- Main Slide Title -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="3" name="Title"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="822960" y="731520"/><a:ext cx="10543540" cy="731520"/></a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz" lIns="0" tIns="0" rIns="0" bIns="0"/>
          <a:p>
            <a:r>
              <a:rPr lang="en-US" sz="2600" b="1">
                <a:solidFill><a:srgbClr val="47D8F2"/></a:solidFill>
                <a:latin typeface="Courier New"/>
              </a:rPr>
              <a:t>$([System.Security.SecurityElement]::Escape($data.Title))</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>

      <!-- Subtitle / Tagline -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="4" name="Subtitle"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="822960" y="1463040"/><a:ext cx="10543540" cy="457200"/></a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz" lIns="0" tIns="0" rIns="0" bIns="0"/>
          <a:p>
            <a:r>
              <a:rPr lang="en-US" sz="1300" i="1">
                <a:solidFill><a:srgbClr val="A89BC4"/></a:solidFill>
                <a:latin typeface="Courier New"/>
              </a:rPr>
              <a:t>$([System.Security.SecurityElement]::Escape($data.Subtitle))</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>

      <!-- Content Box Background Panel -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="5" name="ContentPanel"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="822960" y="2011680"/><a:ext cx="10543540" cy="4114800"/></a:xfrm>
          <a:prstGeom prst="roundRect"><a:avLst><a:gd name="adj" fmla="val 2000"/></a:avLst></a:prstGeom>
          <a:solidFill><a:srgbClr val="160A2C"/></a:solidFill>
          <a:ln w="25400"><a:solidFill><a:srgbClr val="4A2D75"/></a:solidFill></a:ln>
        </p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz" lIns="254000" tIns="254000" rIns="254000" bIns="254000"/>
          $bulletXml
        </p:txBody>
      </p:sp>

      <!-- Footer Team Branding -->
      <p:sp>
        <p:nvSpPr><p:cNvPr id="6" name="Footer"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr>
          <a:xfrm><a:off x="822960" y="6217920"/><a:ext cx="10543540" cy="365760"/></a:xfrm>
        </p:spPr>
        <p:txBody>
          <a:bodyPr vert="horz" lIns="0" tIns="0" rIns="0" bIns="0"/>
          <a:p>
            <a:r>
              <a:rPr lang="en-US" sz="900">
                <a:solidFill><a:srgbClr val="786694"/></a:solidFill>
                <a:latin typeface="Courier New"/>
              </a:rPr>
              <a:t>Sound of Times // Space Sounds (Carol Pillai &amp; Ziven Pereira)</a:t>
            </a:r>
          </a:p>
        </p:txBody>
      </p:sp>

    </p:spTree>
  </p:cSld>
</p:sld>
"@
    [System.IO.File]::WriteAllText((Join-Path $tempDir "ppt\slides\slide$idx.xml"), $slideXml.Trim(), [System.Text.Encoding]::UTF8)

    # Slide relationships
    $slideRel = @"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout2.xml"/>
</Relationships>
"@
    [System.IO.File]::WriteAllText((Join-Path $tempDir "ppt\slides\_rels\slide$idx.xml.rels"), $slideRel.Trim(), [System.Text.Encoding]::UTF8)
}

# 10. Zip directory to .pptx file with standard forward slashes
Write-Host "Compressing presentation package into $outputPptx ..." -ForegroundColor Cyan

Add-Type -AssemblyName System.IO.Compression
$zipArchive = [System.IO.Compression.ZipFile]::Open($outputPptx, [System.IO.Compression.ZipArchiveMode]::Create)
$allFiles = Get-ChildItem -Path $tempDir -Recurse -File
foreach ($file in $allFiles) {
    $relativePath = $file.FullName.Substring($tempDir.Length + 1).Replace('\', '/')
    $entry = $zipArchive.CreateEntry($relativePath, [System.IO.Compression.CompressionLevel]::Optimal)
    $fileStream = [System.IO.File]::OpenRead($file.FullName)
    $entryStream = $entry.Open()
    $fileStream.CopyTo($entryStream)
    $fileStream.Dispose()
    $entryStream.Dispose()
}
$zipArchive.Dispose()

# Cleanup temp build directory
Remove-Item -Recurse -Force $tempDir

if (Test-Path $outputPptx) {
    $size = (Get-Item $outputPptx).Length
    Write-Host ">>> SUCCESS: Sound_of_Times_Presentation.pptx generated successfully! ($size bytes)" -ForegroundColor Green
} else {
    Write-Error "Failed to produce PPTX file."
}
