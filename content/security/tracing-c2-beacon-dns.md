---
title: "Tracing a C2 beacon through DNS logs"
date: 2026-06-28
tags: ["forensics", "detection", "dns"]
section: security
description: "How periodic DNS queries with high-entropy subdomains gave away a beacon that slipped past the proxy."
---

The proxy logs were clean. The DNS logs were not.

## The tell

Beacons hate being regular, but they can't help it. When I bucketed queries per hostname by minute, one internal host was resolving `*.telemetry-cdn[.]net` every 63 seconds, plus or minus a couple of seconds of jitter. Legitimate CDNs don't breathe that evenly.

```sql
SELECT client_ip, query, COUNT(*) c,
       STDDEV(EXTRACT(EPOCH FROM ts) - LAG(...)) jitter
FROM dns_logs
GROUP BY client_ip, query
HAVING c > 200 AND jitter < 5
ORDER BY c DESC;
```

## Entropy over the subdomain

The label to the left of the registered domain was 18 characters of base32-looking noise, different every request. Shannon entropy above ~3.5 bits/char over a sliding window flagged it cleanly and gave almost no false positives against the day's normal traffic.

## Takeaway

DNS is the exfil channel everyone forgets to watch. A cheap periodicity-plus-entropy detection would have caught this on day one.
