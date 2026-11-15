@echo off
title Sound of Times - 4K Memory Cinema Launcher
cls
echo ======================================================================
echo           SOUND OF TIMES - 4K MEMORY CINEMA LAUNCHER
echo ======================================================================
echo.
echo Starting local game server on http://localhost:8080 ...
echo This allows all 4K YouTube memories (Black Forest, Ocean, Birds, Earth)
echo to stream and play directly in-game without browser Error 153!
echo.
echo ======================================================================

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ports = @(8080, 8088, 8888, 5500); $listener = $null; $chosenPort = 0; foreach ($p in $ports) { try { $l = New-Object System.Net.HttpListener; $l.Prefixes.Add('http://localhost:' + $p + '/'); $l.Start(); $listener = $l; $chosenPort = $p; break; } catch {} }; if ($listener) { Start-Process ('http://localhost:' + $chosenPort + '/index.html'); Write-Host ('>>> Sound of Times is LIVE at: http://localhost:' + $chosenPort + '/index.html') -ForegroundColor Green; Write-Host '>>> (Keep this window open while playing)' -ForegroundColor Yellow; while ($listener.IsListening) { $context = $listener.GetContext(); $req = $context.Request; $res = $context.Response; $path = '.' + $req.Url.LocalPath.Replace('/', '\'); if ($path -eq '.\') { $path = '.\index.html' }; if (Test-Path $path -PathType Leaf) { $bytes = [System.IO.File]::ReadAllBytes($path); $res.ContentLength64 = $bytes.Length; $ext = [System.IO.Path]::GetExtension($path).ToLower(); if ($ext -eq '.html') { $res.ContentType = 'text/html; charset=utf-8' } elseif ($ext -eq '.js') { $res.ContentType = 'application/javascript; charset=utf-8' } elseif ($ext -eq '.css') { $res.ContentType = 'text/css; charset=utf-8' } elseif ($ext -eq '.json') { $res.ContentType = 'application/json; charset=utf-8' } elseif ($ext -eq '.jpg' -or $ext -eq '.jpeg') { $res.ContentType = 'image/jpeg' } elseif ($ext -eq '.png') { $res.ContentType = 'image/png' } elseif ($ext -eq '.mp3') { $res.ContentType = 'audio/mpeg' }; $res.OutputStream.Write($bytes, 0, $bytes.Length) } else { $res.StatusCode = 404 }; $res.OutputStream.Close() } } else { Write-Host 'Could not bind local port. Opening index.html directly...' -ForegroundColor Red; Start-Process 'index.html' }"

pause
