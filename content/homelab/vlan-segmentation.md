---
title: "Segmenting the home network into VLANs that actually isolate"
date: 2026-03-30
tags: ["networking", "pfsense", "security"]
section: homelab
description: "IoT on one VLAN, lab on another, trust nothing between them — a practical home segmentation setup."
---

The smart bulbs do not need to talk to the NAS. Ever.

## The layout

- **VLAN 10** — trusted (laptops, phones)
- **VLAN 20** — lab (Proxmox, Kubernetes)
- **VLAN 30** — IoT (anything with a cloud app I don't trust)
- **VLAN 40** — guest

## Firewall posture

Default deny between VLANs. IoT gets internet and nothing else. The lab can be reached from trusted, but can't initiate connections back — so a compromised container can't pivot to my laptop.

## Worth it?

Absolutely. When one IoT device started beaconing to an odd host, the blast radius was exactly one VLAN.
