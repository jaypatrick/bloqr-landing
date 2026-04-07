---
title: "What is a filter list — and why yours is probably outdated"
description: "Filter lists are the brain behind DNS blocking. They're plain text files listing domains to block — but they're only as good as their last update. Here's how they work, who makes them, and why automation changes everything."
pubDate: 2026-01-20
author: "Jayson Knight"
category: "education"
tags: ["filter-list", "dns-blocking", "adblock", "hagezi", "oisd", "adguard-home", "explainer"]
draft: false
---

At the core of every DNS blocker — Pi-hole, AdGuard Home, NextDNS, pfBlockerNG, or any other — is a file.

A plain text file. One domain per line. A list of internet addresses that should be blocked. This is a filter list, and it is, in a meaningful sense, the entire intelligence of your blocking setup. The hardware, the software, the configuration — all of it just enforces what's in this file.

## What a filter list looks like

```
# Advertising networks
doubleclick.net
googleadservices.com
ads.google.com
# Tracking and analytics
tracking.example.com
pixel.ad.io
analytics.spyware.net
```

That's it. Domain name, one per line. Comments start with `#`. Your DNS resolver checks every outbound domain lookup against this list. If it matches, the lookup returns nothing. The request doesn't complete. The tracker doesn't load.

This simplicity is the list's greatest strength and its greatest weakness. Adding a domain to the list is trivial. Knowing which domains to add — and which to leave off — requires continuous human judgment.

## Who makes these lists

Several large community-maintained lists have become the de facto standard:

**Hagezi's DNS Blocklists** are among the most actively maintained and carefully curated. Hagezi (a pseudonymous volunteer) maintains multiple tiers of aggressiveness, from a light list that minimizes false positives to a comprehensive list that blocks known tracking infrastructure aggressively. These are the lists Bloqr uses as a foundation.

**OISD** (One Internet Stuff Domain) is another highly regarded community list that focuses on minimizing false positives while maintaining broad coverage of advertising and tracking domains.

**StevenBlack's unified hosts** aggregates multiple sources into a single list. Widely used, comprehensive, but less frequently updated than dedicated blocklists.

**EasyList** is the original ad blocking list, created for browser extension blockers like AdBlock and uBlock Origin. It also has DNS-specific variants.

**AdGuard DNS filter** is maintained by the AdGuard team specifically for DNS-level blocking.

## Why lists go stale

Tracking domains are not static infrastructure. Advertising networks and data brokers continuously register new domains, rotate through subdomains, and shift their technical infrastructure to evade blocklists. When a domain appears on a popular list, traffic drops off within days — so the network registers a new domain.

A list that was accurate last month may be 15–20% less effective this month. A list that hasn't been updated in six months may be missing hundreds of active tracker domains.

This creates a maintenance burden that most users ignore. The default lists loaded into Pi-hole at installation don't update themselves. You have to configure automatic updates, know which lists to follow, and manage conflicts when multiple lists block different things.

## The deduplication and conflict problem

If you run multiple lists — which every serious setup does — you quickly accumulate duplicate entries and conflicting rules. Duplicates waste memory and slow query resolution. Conflicting allowlist and blocklist rules can produce unexpected behavior depending on your resolver's rule priority logic.

Managing list hygiene across multiple instances (your home Pi-hole, the AdGuard instance at your parents' house, the NextDNS config on your phone) is the kind of work that falls to the back of your queue indefinitely.

## What Bloqr's compiler does about this

The adblock-compiler at the core of Bloqr — which is [open source on GitHub](https://github.com/jaypatrick/adblock-compiler) — is specifically designed to solve the list management problem.

It pulls from authoritative source lists, deduplicates across sources, validates entries, and produces a clean merged list optimized for DNS resolver performance. It runs on a schedule. When a new tracker domain appears in Hagezi's list, it propagates to your filtering setup automatically.

You specify which sources to include and what deduplication logic to apply. The compiler handles the rest. The result is a list that's fresh, deduplicated, and consistent — without manual maintenance.

This is the most direct expression of what Bloqr is: the automation layer between the communities who maintain blocklists and the devices that enforce them.

---

[Join the Bloqr waitlist](/#waitlist) to get early access and bring your existing DNS setup with you.
