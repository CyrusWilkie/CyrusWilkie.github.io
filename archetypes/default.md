---
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
date: {{ .Date }}
tags: []
section: {{ trim .File.Dir "/" }}
description: ""
draft: true
---
