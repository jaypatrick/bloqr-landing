---
title: "AdGuard vs. uBlock Origin vs. Bloqr: browser blocking vs. network blocking"
description: "Browser extensions block ads on the page. DNS blocking stops the request before it ever leaves your device. Here's the actual difference — and why they're not competing for the same job."
pubDate: 2026-02-14
author: "Jayson Knight"
category: "industry"
tags: ["adguard", "ublock-origin", "ad-blocker", "dns-blocking", "comparison", "browser-extension"]
draft: false
---

A common question when someone starts thinking about DNS blocking: "But I already have uBlock Origin. Why do I need something else?"

The short answer: you don't need to choose. These tools operate at different layers of the stack and are genuinely complementary. Understanding the difference is useful regardless of which combination you end up using.

## How browser extension ad blockers work

uBlock Origin, AdGuard browser extension, and similar tools intercept network requests *inside your browser* before the page renders. When your browser would load a tracking script, the extension checks the request URL against its filter lists. If it matches, the request is blocked before it goes out.

This is reactive protection at the browser level. The browser makes a decision to not send a request that it would otherwise have sent.

Key properties:
- **Scope**: One browser, one device
- **Timing**: The browser initiates the request, then blocks it (the DNS lookup still happens)
- **Visibility**: Works only on HTTP/HTTPS traffic through that browser
- **Granularity**: Can block specific URLs, not just domains

## How DNS-level blocking works

DNS blocking operates before the browser layer. When any application on your device (browser, app, game, smart TV, firmware) looks up a domain name, the DNS resolver intercepts the lookup. If the domain is on a blocklist, the resolver returns nothing (or a blocked response) before the browser ever initiates a connection.

Key properties:
- **Scope**: Every device on your network, every application
- **Timing**: The connection never begins — no request leaves the device
- **Visibility**: Works for all traffic, not just browser traffic
- **Granularity**: Works at the domain level, not the URL level

## The Manifest V3 problem

Google's Manifest V3 change to the Chrome Extension APIs (which also affects all Chromium-based browsers including Edge, Brave's built-in engine, and others) significantly weakened what browser extensions can do. The technical details are complicated, but the practical effect is that the most capable blocking extensions — particularly uBlock Origin — are less effective in newer Chrome versions than they were.

This is not hypothetical. The EFF has documented it. Mozilla (Firefox) has committed to preserving the older APIs for extensions, making Firefox the preferred browser for extension-based blocking going forward. But Chrome is the dominant browser, and millions of users are running a weakened version of their ad blocker without realizing it.

DNS blocking is not affected by Manifest V3. It happens outside the browser entirely.

## Why they're complementary, not competing

The best privacy hygiene uses both layers:

**Browser extension blocking** catches tracking that happens within the page — inline scripts, embedded analytics, A/B testing frameworks, and per-URL blocking that DNS can't do (since DNS works at the domain level, not the URL level).

**DNS blocking** covers everything the browser extension doesn't see: apps, IoT devices, smart TVs, gaming consoles, operating system telemetry, and any browser traffic that leaks past the extension.

A tracker that loses its browser-level blocking can't fall back to a DNS-level approach if that domain is also blocked at DNS. Both layers together create defense in depth.

## The practical recommendation

If you're using uBlock Origin: keep using it. It's excellent for browser-level protection. Add DNS blocking for network-wide coverage.

If you're using Chrome and concerned about Manifest V3 weakening your browser extension: switch to Firefox for maximum extension effectiveness, or lean more heavily on DNS blocking to compensate.

If you're starting from scratch: Bloqr with DNS blocking plus uBlock Origin in Firefox is the strongest consumer privacy stack currently available without enterprise tooling.

---

[Join the Bloqr waitlist](/#waitlist) and bring your existing setup — Bloqr works with AdGuard, NextDNS, Pi-hole, and your browser extensions as a complement, not a replacement.
