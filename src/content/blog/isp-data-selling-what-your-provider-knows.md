---
title: "What your ISP knows about you — and who they sell it to"
description: "Every website you visit starts with a DNS lookup that travels in plain text to your internet provider. In the US, they can legally sell that data. Here's what they know, what they do with it, and what you can do about it."
pubDate: 2026-02-28
author: "Jayson Knight"
category: "education"
tags: ["isp", "dns", "privacy", "data-broker", "surveillance"]
draft: false
---

Your internet provider is not a neutral pipe. It's a company with a profitable side business: selling behavioral data derived from your internet usage.

In 2017, the US Congress voted to repeal FCC privacy regulations that would have required ISPs to get opt-in consent before sharing or selling browsing data. The repeal passed on a party-line vote and was signed into law. Since then, major US internet providers have been legally permitted to collect, analyze, and sell detailed behavioral profiles derived from your browsing history.

This is not a hypothetical. It has happened.

## What DNS metadata actually reveals

Your ISP doesn't need to decrypt your HTTPS traffic to build a detailed profile. They just need your DNS lookups — the requests your device makes to translate domain names into IP addresses. Those travel in plain text to your ISP's DNS server by default.

DNS metadata is surprisingly revealing:

**Health information**: Lookups to WebMD, specific clinic websites, mental health services, pharmaceutical information sites, or insurance comparison tools indicate health concerns. The pattern of queries — especially at specific times of day — suggests diagnoses without requiring a medical record.

**Financial situation**: Lookups to payday loan services, mortgage comparison sites, bankruptcy information sites, or specific bank domains reveal financial circumstances. The velocity and sequence of these queries can indicate financial stress before it appears in any credit record.

**Political and religious affiliation**: Queries to specific news sites, political organizations, religious institutions, or advocacy groups create a political and religious profile more detailed than a voter registration record.

**Relationship status and family situation**: Dating app lookups, pediatric clinic domains, fertility clinic queries, or legal service domains for family law matters.

**Employment concerns**: Queries to job boards, specific competitor companies, or professional licensing bodies.

This is what DNS metadata means in practice. Not "you visited a website" but "here is a detailed behavioral map of your household."

## What ISPs do with this data

Comcast, AT&T, Verizon, and other major US providers have all disclosed data-sharing arrangements with advertising networks. The specifics vary by provider and change over time, but the practice is documented and ongoing. Some providers have created dedicated advertising subsidiaries for precisely this purpose.

The data typically flows to data brokers, who aggregate it with information from other sources — loyalty card purchases, public records, social media activity — and sell it to advertisers, insurance companies, and other buyers.

Some ISPs offer opt-out mechanisms. These are typically difficult to find, apply only to advertising use, and don't cover all forms of data sharing.

## Encrypted DNS breaks this model

When you use DNS-over-HTTPS or DNS-over-TLS, your DNS queries are encrypted before they leave your device. Your ISP can see that you're making DNS requests. They cannot see which domains you're looking up. The metadata becomes opaque.

This is not a complete privacy solution — your IP addresses still route through your ISP, and ISPs can infer some information from traffic patterns and IP destinations. But it removes the most granular behavioral data from their collection pipeline.

## The simplest thing you can do

Change your DNS resolver from your ISP's default to one operated by a privacy-respecting provider (Cloudflare's 1.1.1.1, or your DNS filtering service), and configure that resolver to use DoH or DoT. This removes your ISP from the DNS data picture.

Bloqr handles this configuration as part of setup — you choose a DNS provider that you trust, and Bloqr configures encrypted DNS across your devices. Your browsing patterns stop being your ISP's data.

---

[Join the Bloqr waitlist](/#waitlist) to get early access and reclaim your DNS.
