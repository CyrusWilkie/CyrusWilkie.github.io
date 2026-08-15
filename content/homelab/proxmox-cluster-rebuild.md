---
title: "Rebuilding the Proxmox cluster without downtime (mostly)"
date: 2026-06-10
tags: ["proxmox", "virtualization"]
section: homelab
description: "Migrating three nodes to a fresh Proxmox 8 cluster while keeping the important VMs alive."
---

Three nodes, one weekend, zero tolerance from the household for the internet going down.

## The plan

Ceph made this survivable. With the storage replicated across all three nodes, I could evacuate one node at a time, reinstall it, and rejoin the cluster while VMs kept running on the other two.

## What broke

The corosync ring didn't like the new node ordering and split-brained for about ten tense minutes. Pinning the `corosync.conf` node IDs explicitly fixed it.

## Rack diagram

The lab now runs pfSense, a Kubernetes control plane, and a very over-provisioned Minecraft server on 96 GB of RAM it does not need.
