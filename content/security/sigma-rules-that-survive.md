---
title: "Writing Sigma rules that survive contact with production"
date: 2026-05-14
tags: ["detection", "sigma", "blue-team"]
section: security
description: "Detection rules rot. A few habits that keep Sigma rules alive past the first noisy week."
---

Every detection engineer has shipped a rule that fired 4,000 times overnight. Here's how I stopped doing that.

## Anchor on behaviour, not strings

Matching a specific malware filename is a rule with a shelf life of one rename. Match the *behaviour* — a signed binary spawning a shell, an office process writing to a startup folder — and it outlives the sample.

## Budget for noise before you ship

I now write the tuning exceptions in the same PR as the rule. If I can't articulate the expected false positives, I don't understand the rule well enough to deploy it.

## Version everything

Sigma rules live in git alongside the detections-as-code pipeline. A rule that isn't in version control isn't a detection, it's a liability.
