---
title: "DNS-over-HTTPS explained: why the last plaintext protocol matters"
description: "Your browser encrypts the page. Your email encrypts the message. DNS — the system that looks up every website you visit — still travels in plain text. Here's why that gap matters, and what seals it."
pubDate: 2026-04-02
author: "Jayson Knight"
category: "education"
tags: ["dns", "doh", "dot", "encryption", "explainer", "privacy"]
draft: false
---

In 1987, a group of engineers published a specification for a new internet service. It would translate human-readable domain names — like `example.com` — into numerical IP addresses that computers could route traffic to. The system they designed, the Domain Name System, has been the backbone of every internet connection made since.

They did not encrypt it.

This was not an oversight. In 1987, the internet was a handful of universities and government research labs. Privacy was not a design consideration. The protocol was optimized for speed and reliability. Encryption was computationally expensive and unnecessary. The spec shipped without it.

That spec is still running your internet today.

## What plain-text DNS actually means

Every time you type a URL, tap a link, or open an app that connects to the internet, your device asks a question: "What's the IP address for this domain?" That question — and the answer — travels over the network in plain text. Unencrypted. Readable by anyone with access to the network path between you and the DNS server.

This is what your router owner sees. Your ISP sees. Every network hop between your device and the DNS resolver sees.

HTTPS (the padlock in your browser) was added to the web starting in the 1990s and became standard in the 2010s. It encrypts the content of the page — the letter inside the envelope. What it doesn't encrypt is the address lookup that got you there. That still happens in plain text, before the HTTPS connection is established.

## DoH vs. DoT: two solutions to the same problem

Encrypted DNS comes in two main flavors.

**DNS-over-HTTPS (DoH)** wraps DNS queries inside regular HTTPS traffic on port 443 — the same port used for web browsing. Because it looks like ordinary web traffic, it's difficult for ISPs and network operators to distinguish or block. This is both a feature and, depending on your perspective, a concern — it makes DNS filtering bypass harder but also makes censorship bypass easier.

**DNS-over-TLS (DoT)** encrypts DNS using TLS but on its own dedicated port (853). This is easier for network operators to identify and optionally block, but it's also cleaner architecturally — there's no ambiguity about what's happening.

Both accomplish the same core goal: the DNS query is encrypted in transit. Your ISP can see that you made a DNS request. They cannot see what domain you were looking up.

## Who can see your DNS lookups right now

If you haven't changed your DNS settings — and most people haven't — your queries go to your ISP's DNS resolver. Your ISP logs them. Depending on your country, they may sell that data to advertisers. In the US, the FCC rolled back ISP privacy regulations in 2017, explicitly permitting this.

Even if you're using a VPN, there's a gap: most consumer VPNs don't configure encrypted DNS for you. A misconfigured or leaking DNS setup can expose your browsing habits even through a VPN tunnel. This is called a DNS leak — and it's common.

## DoH is not the same as a VPN

A VPN routes all your traffic through a third-party server. It changes your apparent IP address and protects traffic in transit to the VPN server. DNS-over-HTTPS does something narrower and more specific: it encrypts only the DNS lookup. Your traffic still goes directly from your device to whatever website you're visiting. No proxy. No rerouting. No new party in your connection path.

These solve different problems. A VPN is about who can see where you're going. DoH is about ensuring the lookup that precedes your connection is also private.

## How Bloqr enables encrypted DNS

Bloqr integrates with your existing DNS filtering provider — AdGuard Home, NextDNS, Pi-hole, or others — and configures encrypted DNS as part of setup. If you use a provider that supports DoH or DoT, Bloqr handles the configuration. If your devices don't yet support encrypted DNS natively, Bloqr's resolver handles the upgrade transparently.

The result: every DNS lookup from every device on your network is encrypted before it leaves your network. Your ISP sees connection volume. They don't see destinations.

That's the gap DNS-over-HTTPS seals. After 38 years, it's finally closeable without a PhD in network engineering.

---

Ready to close the gap? [Join the Bloqr waitlist](/#waitlist) and get early access when we launch.
