# Build 100% Native PowerPoint Presentation using PowerPoint COM Object
$ErrorActionPreference = "Stop"

$workspace = "C:\Users\Lenovo\Desktop\Sound of time"
$outputPptx = Join-Path $workspace "Sound_of_Times_Presentation.pptx"
$assetsDir = Join-Path $workspace "assets\presentation"

Write-Output "Starting PowerPoint application..."
$ppt = New-Object -ComObject PowerPoint.Application

try {
    # Create presentation in 16:9 widescreen
    # MsoTriState: msoFalse = 0, msoTrue = -1
    $pres = $ppt.Presentations.Add(0) # 0 = WithWindow: False
    $pres.PageSetup.SlideWidth = 960  # 16:9 widescreen in points
    $pres.PageSetup.SlideHeight = 540

    # Color definitions (RGB integers: B*65536 + G*256 + R)
    function RgbColor([int]$r, [int]$g, [int]$b) {
        return ($b * 65536) + ($g * 256) + $r
    }

    $cBg = RgbColor 7 4 20          # #070414
    $cCardBg = RgbColor 18 10 36    # #120A24
    $cCyan = RgbColor 71 216 242    # #47D8F2
    $cGold = RgbColor 255 209 102   # #FFD166
    $cPink = RgbColor 242 139 189   # #F28BBD
    $cGreen = RgbColor 98 201 138   # #62C98A
    $cPurple = RgbColor 155 93 229  # #9B5DE5
    $cTextLight = RgbColor 243 240 250
    $cTextDim = RgbColor 168 155 196
    $cBorder = RgbColor 70 40 115

    # Helper function to create base slide with background and footer
    function Init-Slide($slideNum, $categoryText, $titleText) {
        $slide = $pres.Slides.Add($slideNum, 12) # 12 = ppLayoutBlank
        
        # Background
        $slide.Background.Fill.Solid()
        $slide.Background.Fill.ForeColor.RGB = $cBg

        # Top Category Tag
        $catBox = $slide.Shapes.AddTextbox(1, 40, 20, 880, 24) # 1 = msoTextOrientationHorizontal
        $catBox.TextFrame.MarginLeft = 0; $catBox.TextFrame.MarginTop = 0
        $catBox.TextFrame.WordWrap = 0
        $catRange = $catBox.TextFrame.TextRange
        $catRange.Text = $categoryText.ToUpper()
        $catRange.Font.Name = "Courier New"
        $catRange.Font.Size = 10
        $catRange.Font.Bold = -1
        $catRange.Font.Color.RGB = $cGold

        # Slide Number Pill
        $numBox = $slide.Shapes.AddTextbox(1, 800, 20, 120, 24)
        $numBox.TextFrame.MarginLeft = 0; $numBox.TextFrame.MarginTop = 0
        $numRange = $numBox.TextFrame.TextRange
        $numRange.Text = "SLIDE 0$slideNum / 07"
        $numRange.ParagraphFormat.Alignment = 3 # 3 = ppAlignRight
        $numRange.Font.Name = "Courier New"
        $numRange.Font.Size = 10
        $numRange.Font.Bold = -1
        $numRange.Font.Color.RGB = $cCyan

        # Slide Main Title
        $titleBox = $slide.Shapes.AddTextbox(1, 40, 42, 880, 36)
        $titleBox.TextFrame.MarginLeft = 0; $titleBox.TextFrame.MarginTop = 0
        $titleRange = $titleBox.TextFrame.TextRange
        $titleRange.Text = $titleText
        $titleRange.Font.Name = "Courier New"
        $titleRange.Font.Size = 20
        $titleRange.Font.Bold = -1
        $titleRange.Font.Color.RGB = $cCyan

        # Divider line
        $line = $slide.Shapes.AddLine(40, 82, 920, 82)
        $line.Line.ForeColor.RGB = $cBorder
        $line.Line.Weight = 1.5

        # Footer
        $footerLine = $slide.Shapes.AddLine(40, 508, 920, 508)
        $footerLine.Line.ForeColor.RGB = $cBorder
        $footerLine.Line.Weight = 1

        $footBox = $slide.Shapes.AddTextbox(1, 40, 512, 880, 20)
        $footBox.TextFrame.MarginLeft = 0; $footBox.TextFrame.MarginTop = 0
        $footRange = $footBox.TextFrame.TextRange
        $footRange.Text = "SOUND OF TIMES // TEAM SPACE SOUNDS (CAROL PILLAI & ZIVEN PEREIRA) // NASA DATA SONIFICATION"
        $footRange.Font.Name = "Courier New"
        $footRange.Font.Size = 8
        $footRange.Font.Color.RGB = $cTextDim

        return $slide
    }

    # Helper function to add a styled card
    function Add-Card($slide, $x, $y, $w, $h, $heading, $body, $accentColor) {
        # Card background rectangle (1 = msoShapeRectangle)
        $rect = $slide.Shapes.AddShape(1, $x, $y, $w, $h)
        $rect.Fill.Solid()
        $rect.Fill.ForeColor.RGB = $cCardBg
        $rect.Line.ForeColor.RGB = $accentColor
        $rect.Line.Weight = 1.5

        # Content Textbox
        $tbox = $slide.Shapes.AddTextbox(1, $x + 12, $y + 10, $w - 24, $h - 20)
        $tbox.TextFrame.WordWrap = -1
        $tbox.TextFrame.MarginLeft = 0; $tbox.TextFrame.MarginTop = 0; $tbox.TextFrame.MarginRight = 0; $tbox.TextFrame.MarginBottom = 0

        $tr = $tbox.TextFrame.TextRange
        $tr.Text = "$heading`r`n$body"
        $tr.Font.Name = "Courier New"
        $tr.Font.Size = 10
        $tr.Font.Color.RGB = $cTextLight

        # Format Heading paragraph
        $p1 = $tr.Paragraphs(1)
        $p1.Font.Bold = -1
        $p1.Font.Size = 11
        $p1.Font.Color.RGB = $accentColor

        return $null
    }

    # ==========================================
    # SLIDE 1: TITLE & TEAM SHOWCASE
    # ==========================================
    Write-Output "Generating Slide 1..."
    $s1 = Init-Slide 1 "NASA DATA SONIFICATION & PIXEL-ART ADVENTURE" "PROJECT PRESENTATION"

    # Big Hero Box
    $heroBox = $s1.Shapes.AddShape(1, 40, 100, 880, 180)
    $heroBox.Fill.Solid()
    $heroBox.Fill.ForeColor.RGB = $cCardBg
    $heroBox.Line.ForeColor.RGB = $cGold
    $heroBox.Line.Weight = 2

    $htBox = $s1.Shapes.AddTextbox(1, 60, 115, 840, 150)
    $htBox.TextFrame.WordWrap = -1
    $htRange = $htBox.TextFrame.TextRange
    $htRange.Text = "SOUND OF TIMES`r`n`"A LITTLE PIECE OF EARTH, FAR AWAY FROM HOME.`"`r`n`r`nPROJECT CREATORS & ENGINEERS: TEAM SPACE SOUNDS`r`n⭐ Carol Pillai  [Engineering & Audio Synthesis]`r`n⭐ Ziven Pereira [Systems Architecture & World Design]"
    $htRange.Font.Name = "Courier New"
    $htRange.Font.Color.RGB = $cTextLight
    $htRange.ParagraphFormat.Alignment = 2 # Center

    $pTitle = $htRange.Paragraphs(1)
    $pTitle.Font.Size = 28
    $pTitle.Font.Bold = -1
    $pTitle.Font.Color.RGB = $cGold

    $pTag = $htRange.Paragraphs(2)
    $pTag.Font.Size = 13
    $pTag.Font.Color.RGB = $cCyan

    # 4 Stat Cards
    Add-Card $s1 40  300 205 185 "4 NASA ARCHIVES" "Ingests and sonifies real telemetry from GEDI canopy lidar, ECCO ocean temperature/salinity, MERRA-2 atmosphere, and whole-planet Sol-3." $cCyan
    Add-Card $s1 265 300 205 185 "8 NARRATIVE SCENES" "Emotional story arc spanning the 40 Eridani classroom, the underground shelter, the buried Sol-3 jukebox, and the Jurassic Coast homecoming." $cPink
    Add-Card $s1 490 300 205 185 "WEB AUDIO + TONE.JS" "Zero external audio files. 100% procedural Web Audio synthesis for rain, waves, wind, birdsong, and 1940s analog jukebox mechanics." $cGreen
    Add-Card $s1 715 300 205 185 "4K MEMORY CINEMA" "Photorealistic slow-motion memory vision overlays (0.2x to 1.0x) depicting Dr. Ryan Grace's vivid recollections of Earth." $cGold

    # ==========================================
    # SLIDE 2: NARRATIVE & PROJECT OVERVIEW
    # ==========================================
    Write-Output "Generating Slide 2..."
    $s2 = Init-Slide 2 "NARRATIVE GENESIS & INSPIRATION" "PROJECT OVERVIEW: THE ERID JOURNEY"

    # Left Column: 3 Cards
    Add-Card $s2 40 100 480 120 "🌌 THE CORE PREMISE" "Inspired by Andy Weir's 'Project Hail Mary', following human astronaut Dr. Ryland Grace (Ryan) and extraterrestrial engineer Rocky on the alien world of 40 Eridani." $cGold
    Add-Card $s2 40 232 480 120 "🏫 TEACHING ON ALIEN SOIL" "Ryan teaches young Eridian children ('the little ones') about planetary atmospheres and liquid water oceans in a natural amphitheater of basalt pillars." $cCyan
    Add-Card $s2 40 364 480 120 "📻 THE BURIED SOL-3 JUKEBOX" "An ancient 1940s-style retro jukebox buried in volcanic dust holds the only surviving acoustic recordings of Earth's ecosystems, sparking an emotional reunion." $cPink

    # Right Column: Screenshot & Box
    $imgJukebox = Join-Path $assetsDir "scene_jukebox.png"
    if (Test-Path $imgJukebox) {
        $pic2 = $s2.Shapes.AddPicture($imgJukebox, 0, -1, 545, 100, 375, 230)
        $pic2.Line.ForeColor.RGB = $cCyan
        $pic2.Line.Weight = 2
    }
    Add-Card $s2 545 342 375 142 "EMOTIONAL NARRATIVE ARC" "• Exile on Erid: Isolation, longing, cross-species science.`r`n• Acoustic Discovery: Unlocking Earth's winds and oceans.`r`n• Rocky's Loyalty: 'I will not let you travel alone!'`r`n• The Homecoming: Standing together on Earth's pebble coast." $cGold

    # ==========================================
    # SLIDE 3: NASA DATA SONIFICATION PIPELINE
    # ==========================================
    Write-Output "Generating Slide 3..."
    $s3 = Init-Slide 3 "SCIENTIFIC DATA ARCHITECTURE" "REAL NASA SATELLITE SONIFICATION PIPELINE"

    Add-Card $s3 40 100 480 120 "🌊 RECORD 002: THE OCEAN (NASA ECCO V4r4)" "Daily potential temperatures (4°C-28°C) drive pitch along an oceanic Dorian scale. Salinity (SALT PSU) modulates FM synthesis brightness; surface flow steers spatial panning." $cCyan
    Add-Card $s3 40 232 480 120 "🌲 RECORD 003: THE FOREST (NASA GEDI LIDAR & MODIS)" "Spaceborne 1064nm lidar canopy heights (L4B Biomass) control granular wind resonant filters. Algorithmic synthesizers voice authentic Nightingale and Mourning Dove calls." $cGreen
    Add-Card $s3 40 364 480 120 "🌧️ RECORD 001: THE ATMOSPHERE (MERRA-2 & GPM)" "Precipitation rates (mm/hr) synthesize textured pink-noise raindrops and micro-droplet clicks. Barometric gradients govern resonant thunder sub-bass rumbles." $cPink

    $imgForest = Join-Path $assetsDir "scene_forest.jpg"
    if (Test-Path $imgForest) {
        $pic3 = $s3.Shapes.AddPicture($imgForest, 0, -1, 545, 100, 375, 230)
        $pic3.Line.ForeColor.RGB = $cGreen
        $pic3.Line.Weight = 2
    }
    Add-Card $s3 545 342 375 142 "SCIENCE -> SOUND PIPELINE" "1. Ingest Daily Numerical NASA Datasets`r`n2. Normalize Physical Variables to [0.0 - 1.0]`r`n3. Mathematical Musical Scale Quantization`r`n4. Real-Time Tone.js / Web Audio Generation`r`n5. Live Oscilloscope Waveform Canvas Rendering" $cCyan

    # ==========================================
    # SLIDE 4: TECHNICAL ARCHITECTURE & WEB AUDIO
    # ==========================================
    Write-Output "Generating Slide 4..."
    $s4 = Init-Slide 4 "ENGINEERING & AUDIO SYSTEMS" "TECHNICAL ARCHITECTURE & WEB AUDIO ENGINE"

    Add-Card $s4 40 100 480 120 "💻 ZERO-DEPENDENCY ENGINE" "Pure modern ES6+ JavaScript, HTML5 Canvas 2D, and Tone.js. No heavy frameworks, zero backend latency, loads in <400ms at rock-solid 60 FPS on any modern browser." $cCyan
    Add-Card $s4 40 232 480 120 "🔊 COMPLIANT AUDIO PERMISSION GATE" "Eliminated browser autoplay blocks via a dedicated retro sci-fi Permission Gate dialog that primes the AudioContext upon first interaction. Includes [M] instant mute hotkey." $cGold
    Add-Card $s4 40 364 480 120 "📼 TACTILE MECHANICAL ANALOG SFX" "Custom procedural synthesizers emulate authentic 1940s mechanics: turntable motor spin-up gliding from 45Hz to 320Hz, stylus needle contact thud, and ratchet carousel clicks." $cPink

    $imgSnow = Join-Path $assetsDir "scene_snow.jpg"
    if (Test-Path $imgSnow) {
        $pic4 = $s4.Shapes.AddPicture($imgSnow, 0, -1, 545, 100, 375, 230)
        $pic4.Line.ForeColor.RGB = $cGold
        $pic4.Line.Weight = 2
    }
    Add-Card $s4 545 342 375 142 "CORE SYSTEM ARCHITECTURE" "• Canvas Renderer: 640x360 pixel art engine with dynamic lighting.`r`n• Sonification Suites: 4 procedural Web Audio synth engines.`r`n• Cinema Overlay: Full HD memory vision with slow-mo drift.`r`n• Dialogue Engine: Non-blocking typewriter queue with SFX." $cGold

    # ==========================================
    # SLIDE 5: CHARACTERS & WORLD BUILDING
    # ==========================================
    Write-Output "Generating Slide 5..."
    $s5 = Init-Slide 5 "PIXEL ART DIRECTION & WORLD BUILDING" "CHARACTERS & DUAL ENVIRONMENTS"

    Add-Card $s5 40 100 480 120 "🧑‍🚀 DR. RYAN GRACE (~82px)" "Human astronaut and teacher. Dressed in his EVA spacesuit on Erid, and his iconic cream-and-chocolate mountain-ram fleece jacket when relaxing by the Jurassic Coast." $cCyan
    Add-Card $s5 40 232 480 120 "🦀 ROCKY THE ERIDIAN (~58px)" "Five-legged rock carapace engineer. For visiting Earth, equipped with an articulated form-fitting geodesic xenonite exoskeleton with golden triangular struts and pressurized atmosphere." $cPink
    Add-Card $s5 40 364 480 120 "🪨 YOUNG ERIDIANS ('LITTLE ONES')" "4 color & behavioral variants (Obsidian stacker, Ochre listener, Turquoise leaper, Copper purrer) seated on chiseled basalt amphitheater columns." $cGreen

    # Right Column: Side by side images
    $imgRocky = Join-Path $assetsDir "rocky_exoskeleton.png"
    $imgKids = Join-Path $assetsDir "eridian_children.jpg"
    if (Test-Path $imgRocky) {
        $pRocky = $s5.Shapes.AddPicture($imgRocky, 0, -1, 545, 100, 180, 215)
        $pRocky.Line.ForeColor.RGB = $cGold
        $pRocky.Line.Weight = 2
    }
    if (Test-Path $imgKids) {
        $pKids = $s5.Shapes.AddPicture($imgKids, 0, -1, 740, 100, 180, 215)
        $pKids.Line.ForeColor.RGB = $cCyan
        $pKids.Line.Weight = 2
    }
    Add-Card $s5 545 328 375 156 "ENVIRONMENT CONTRAST" "• 40 ERIDANI (Night World): Deep purple cosmos, glowing ringed gas giant, sister moon, and obsidian volcanic peaks.`r`n• JURASSIC COAST (Earth Finale): Pale misty daylight, Durdle Door sea arch, multi-depth turquoise waves & pebble shoreline." $cCyan

    # ==========================================
    # SLIDE 6: INTERACTIVE GAMEPLAY & CINEMA
    # ==========================================
    Write-Output "Generating Slide 6..."
    $s6 = Init-Slide 6 "PLAYER EXPERIENCE & FEATURES" "INTERACTIVE GAMEPLAY & MEMORY CINEMA"

    Add-Card $s6 40 100 480 120 "💬 ANDY WEIR DIALOGUE ENGINE" "Typewriter text with authentic dialogue patterns: Rocky's iconic 'Question:', 'Amaze! Amaze! Amaze!', and 'Fist my bump!' with synced harmonic spark animations." $cCyan
    Add-Card $s6 40 232 480 120 "🎛️ PHYSICAL JUKEBOX DECK" "Tactile interactive shelf to switch records (1-4), toggle power, play/pause, adjust volume sliders, and view real-time NASA waveform oscilloscope readout." $cGold
    Add-Card $s6 40 364 480 120 "🎞️ FULL HD SLOW-MOTION MEMORY CINEMA" "Zoom into Ryan's memories of Black Forest, ocean surf, and birds with speed controls (0.2x Ultra Slow, 0.35x Slow-Mo, 1.0x Normal) and photorealistic particulate drift." $cPink

    $imgBeach = Join-Path $assetsDir "beach_reunion.jpg"
    if (Test-Path $imgBeach) {
        $pic6 = $s6.Shapes.AddPicture($imgBeach, 0, -1, 545, 100, 375, 230)
        $pic6.Line.ForeColor.RGB = $cCyan
        $pic6.Line.Weight = 2
    }
    Add-Card $s6 545 342 375 142 "PLAYER KEYBOARD CONTROLS" "• [A/D] or [← / →]: Walk characters across terrain`r`n• [ENTER] or [E]: Inspect, advance dialogue, sit by coast`r`n• [1] - [4]: Select Earth environmental records`r`n• [SPACE]: Play / pause jukebox turntable`r`n• [M]: Instant audio mute / unmute toggle`r`n• [F]: Seamless arcade fullscreen toggle" $cGold

    # ==========================================
    # SLIDE 7: SUMMARY & ROADMAP
    # ==========================================
    Write-Output "Generating Slide 7..."
    $s7 = Init-Slide 7 "ACCOMPLISHMENTS & FUTURE HORIZONS" "CONCLUSION & FUTURE EXPANSION ROADMAP"

    Add-Card $s7 40 100 480 190 "🌟 KEY ACCOMPLISHMENTS" "• Merged rigorous NASA satellite telemetry with an emotionally compelling narrative game.`r`n• Engineered 4 procedural Tone.js sonification suites converting scientific numbers into symphony.`r`n• Hand-crafted a rich pixel universe with authentic extraterrestrial biology and environments.`r`n• 100% web-native, zero dependencies, responsive 60 FPS on desktop and mobile." $cCyan
    Add-Card $s7 40 302 480 182 "🚀 FUTURE EXPANSION ROADMAP" "• Planetary Archives: Ingest Mars seismic telemetry (InSight) and Jovian radio waves (Juno).`r`n• Classroom STEM Mode: Interactive acoustic physics puzzles teaching sound waves to young Eridians.`r`n• MIDI Hardware Support: Allow players to plug in physical synthesizers to jam with Rocky." $cPink

    $imgDurdle = Join-Path $assetsDir "durdle_door.jpg"
    if (Test-Path $imgDurdle) {
        $pic7 = $s7.Shapes.AddPicture($imgDurdle, 0, -1, 545, 100, 375, 215)
        $pic7.Line.ForeColor.RGB = $cGold
        $pic7.Line.Weight = 2
    }
    Add-Card $s7 545 328 375 156 "PROJECT CLOSING & CREDITS" "`"Good. Proud. We saved two worlds, Grace. We are friends forever. Fist my bump!`"`r`n`r`nTEAM SPACE SOUNDS`r`nCarol Pillai & Ziven Pereira`r`nSound of Times • 2026" $cGold

    # Save presentation
    if (Test-Path $outputPptx) { Remove-Item -Force $outputPptx }
    Write-Output "Saving presentation to $outputPptx..."
    $pres.SaveAs($outputPptx)
    $pres.Close()
    Write-Output "SUCCESS: Presentation created and saved successfully!"
}
catch {
    Write-Error "ERROR: $($_.Exception.ToString())"
}
finally {
    $ppt.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null
}
