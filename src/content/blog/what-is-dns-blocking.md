---
title: "What is DNS blocking — and why should you care?"
description: "Your browser asks for directions to every website you visit. DNS blocking means some of those directions never arrive. Here's why that's a very good thing."
pubDate: 2026-04-01
author: "Bloqr Team"
category: "education"
tags: ["dns", "explainer", "privacy", "beginner"]
draft: false
---

Every time you open a tab and type a URL, your device does something you never think about: it asks a server somewhere in the world for directions. "Where does `tracker.adtech.example` live?" A DNS server answers with an IP address, your browser connects, and the tracker loads alongside whatever you actually wanted to read.

DNS blocking breaks that chain at the lookup step. Instead of getting directions, the request hits a wall. No IP address means no connection. No connection means no tracker, no ad, no malware domain.

## Why the DNS layer?

Most ad blockers work inside your browser — they load the page, then surgically remove the parts you don't want. That approach has two problems:

1. **It's reactive.** The request already went out. The tracking pixel already phoned home.
2. **It only covers one app.** Your browser gets cleaner. Your smart TV, your phone's native apps, your game console — they're all still talking to whoever they want.

DNS blocking works at the *network* level. It doesn't care which app made the request. If your router or DNS resolver is filtering, everything on your network gets the benefit: laptops, phones, TVs, thermostats, the printer that's definitely phoning home to someone.

## The filter list is the brain

A DNS blocker is only as good as its list. Filter lists are plain text files — essentially long lists of domains that should be blocked. The community has been building and refining these lists for decades. Hagezi, OISD, EasyList, Steven Black's hosts file — these are maintained by volunteers who track new trackers, verify false positives, and push updates constantly.

The catch: curating your own list across multiple devices, keeping it updated, and managing it for a family or small organization is genuinely tedious. That's the gap Bloqr fills.

## What gets blocked?

A well-curated filter list typically blocks:

- **Advertising networks** — the intermediaries that serve targeted ads
- **Tracking pixels and analytics** — the invisible 1x1 images that report back to data brokers
- **Malware and phishing domains** — newly registered domains used in attack campaigns
- **Telemetry** — the portion of telemetry that has no user benefit (your device doesn't need to phone home to an ad platform)

What *doesn't* get blocked: the websites and services you actually use. A good list targets the surveillance infrastructure, not the web itself.

## Is this a VPN?

No. A VPN routes your traffic through a third-party server to mask your IP address. DNS blocking doesn't reroute your traffic anywhere — your connection still goes directly from your device to the website. There's no intermediary, no latency added from tunneling, and no single company with a log of every site you visit.

They solve different problems. A VPN is about *who can see where you're going*. DNS blocking is about *stopping the things you never wanted to load in the first place*.

---

Next up: how filter lists actually work, and what "transformation" means when we talk about compiling a list.
