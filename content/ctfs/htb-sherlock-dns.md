---
title: "HTB Sherlock: reconstructing an intrusion from four log sources"
date: 2026-07-01
tags: ["forensics", "htb"]
section: ctfs
description: "A HackTheBox Sherlock walkthrough — correlating Sysmon, DNS, proxy and auth logs to rebuild the kill chain."
---

`root@ctf:~#` This Sherlock hands you four log files and a vague brief: *"something got in."* Here's the reconstruction.

## Initial access

The Sysmon logs showed `winword.exe` spawning `powershell.exe` with an encoded command — the classic macro-dropper pattern.

```powershell
powershell -enc SQBFAFgAKAAuAC4A...
```

Base64-decoding the payload gave a download cradle pointing at a raw GitHub gist.

## Lateral movement

Auth logs then showed the same service account authenticating to three hosts within ninety seconds — impossible for a human, obvious for a script.

## The flag

The flag was hiding in the exfil archive name, which the proxy log recorded in full. `HTB{dns_never_lies}`.
