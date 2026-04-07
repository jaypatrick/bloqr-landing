---
title: "Browser fingerprinting: the tracking method that ignores your cookie settings"
description: "You rejected all cookies. You cleared your history. You're still being tracked — with a method that's more accurate, more durable, and invisible to most people. Here's how it works."
pubDate: 2026-03-10
author: "Jayson Knight"
category: "education"
tags: ["fingerprinting", "tracking", "privacy", "cookies", "browser-security"]
draft: false
---

Every website you visit that has a "Manage Cookies" popup — and most of them do — is complying with a regulation designed to give you control over tracking. You click "Reject All." You feel like you've won.

You haven't.

The most sophisticated form of web tracking doesn't use cookies at all. It uses information your browser reveals automatically, every single visit, without any choice or consent mechanism. You cannot delete it. You cannot opt out. Most people don't know it exists.

It's called browser fingerprinting.

## What browser fingerprinting is

When your browser loads a web page, it provides a remarkable amount of technical information to that page's JavaScript:

- Your browser type and version
- Your operating system and version
- Your screen resolution and color depth
- What fonts are installed on your system
- Your timezone
- Your system language settings
- Whether you have an ad blocker
- Your graphics card's WebGL capabilities
- Audio processing characteristics from your sound card

None of these facts are particularly unique on their own. But combined into a single hash, they create an identifier that is statistically unique to your device — often more reliably than a cookie.

## The specific techniques

**Canvas fingerprinting** works by having JavaScript draw invisible shapes and text using your browser's HTML5 Canvas API. Because fonts, graphics card drivers, and anti-aliasing settings vary across devices, the rendered output looks slightly different on every machine. The page hashes the output and uses it as an identifier.

**WebGL fingerprinting** uses your GPU's 3D rendering capabilities similarly. Your graphics card has specific capabilities, driver versions, and rendering characteristics that produce unique output when given the same input.

**AudioContext fingerprinting** processes audio through your device's sound card and captures subtle variations in the output waveform. Like canvas and WebGL, the output varies across hardware configurations.

**Font enumeration** checks which fonts your system has installed. This is particularly good for identifying specific machines — the font set on a corporate laptop is different from a personal MacBook or a freshly installed Linux system.

**Combined signals** — when these techniques are layered together, the resulting fingerprint can identify a specific device with extremely high confidence across multiple browsing sessions, incognito mode, cleared cookies, or even different browsers.

## Why the GDPR cookie law doesn't cover this

The EU's General Data Protection Regulation required websites to get consent before setting cookies. Most sites implemented "cookie banners" to comply. Many of them, however, do not ask for consent before using fingerprinting — and regulators have been slow to treat fingerprinting as equivalent to cookie tracking under GDPR.

The legal position is contested and varies by jurisdiction. In practice: clicking "Reject All Cookies" does exactly that. It does not disable fingerprinting.

## Testing your own fingerprint

The EFF's [Cover Your Tracks](https://coveryourtracks.eff.org/) tool tests your browser's fingerprint and shows whether you're uniquely identifiable. Most people are. The results are instructive — and often uncomfortable.

## The DNS layer doesn't solve this

We want to be clear: DNS-level blocking addresses a different layer of the tracking problem. When Bloqr blocks a fingerprinting service's domain at the DNS level, the JavaScript that would perform the fingerprinting never loads. This is effective for *known* fingerprinting domains. But first-party fingerprinting (where the site you're actually visiting performs the fingerprint itself) isn't addressed by DNS blocking.

Comprehensive anti-fingerprinting is on the Bloqr v2 roadmap. The first version focuses on what DNS filtering can solve — which is substantial. Fingerprinting resistance at the browser level is a harder problem that requires coordination with browser vendors or browser extensions.

For now: DNS blocking removes the fingerprinting infrastructure operated by third-party tracking networks. The site you're reading this on can still fingerprint you. The 40 third-party trackers it loads cannot.

---

VPNs also don't solve fingerprinting — that myth is addressed in detail on our [VPN Myths page](/vpn-myths). Understanding what each tool does and doesn't do is the only way to make good choices about your privacy.

[Join the Bloqr waitlist](/#waitlist) to get early access.
