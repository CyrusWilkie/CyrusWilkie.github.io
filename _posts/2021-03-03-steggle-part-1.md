---
layout: post
title: Steggle Development Part 1
subtitle: Exploring PNGs
gh-repo: CyrusWilkie/steggle
gh-badge: [star, fork, follow]
tags: [steggle, dev]
comments: true
---

In order to understand how to modify a PNG, the first step I knew I needed to take was to learn how exactly a PNG works, how it's structured and how I can go about changing its raw data. Naturally, my first step was to discover the structure of a PNG file, visiting [this website](https://shanereilly.net/posts/basic_steganography_and_png_files/) helped me enormously in learning some key information regarding PNG storage. First off I learnt about the basic building blocks that make up PNGs, chunks. PNG chunks are generally structured in the following way:

- **Length:** The first 4 bytes of the chunk contains the length of the data stored within the chunk.
- **Chunk Type:** These 4 bytes identify what type the chunk is (more detail on this a bit later.
- **Chunk Data:** The data contained within the chunk, can be numerous things, the length of which is determined by the value in the first 4 bytes.
- **CRC:** The last 4 bytes are a cyclic redundancy check value that can be used to check the data hasn't been corrupted.

The types of data stored within a chunk include:

- **IHDR:** The image header, contains basic format information and is the very first chunk.
- **PLTE:** Contains colour palette data.
- **IDAT:** The chunks that contain the actual image data.
- **IEND:** The final chunk, generally doesn't contain any data, is used to mark the end of the input stream.

From this reasearch it became pretty clear that if I wanted to conduct pixel steganography on a PNG file, then I would need to do it in the IDAT chunks. From here I started doing some experimentation, first off I wanted to see what the raw data within a PNG actually looked like, so I spun up a LInux virtual machine and used hexdump on a random PNG I had sitting in the file system:

![PNG](/assets/img/steggle-p1-1.JPG){: .mx-auto.d-block :}
(First few lines only)

The hexdump data I received lined up pretty well with how I'd understood PNGs from the research I'd done, the flags denoting the chunk types are clearly visible and their lengths are also clearly readable. One point that came as a bit of a surprise was the length provided in the 4 bytes immediately before the IDAT identifier which suggested that the chunk data was only 8192 bytes long. This seemed curious to me as I knew the whole image had to be far larger than that, searching through the raw data soon uncovered why this was the case however:

![IDAT](/assets/img/steggle-p1-2.JPG){: .mx-auto.d-block :}

The PNG file format is actually, generally, made up of far more than just one IDAT chunk, a point that my brief previous research had not made immediately obvious to me. Each IDAT chunk, with the exception of the very last one, contained exactly 8192 bytes of data. After having a poke around on the internet, I discovered that this is generally how PNG IDAT chunks are structured, dividing the image data up into successive chunks of 8192 bytes each.

Going into this, my only prior experience with image programming was with BMP files, which conveniently store their pixel data in raw form and as such can be easily manipulated. I was quickly realising that the strategies I had used for manipulating BMP files may run into some problems with the PNG format, at this point I was operating under the assumption that IDAT chunks contained bitmap data, so my first concern was the CRCs included in each chunk. In particular, I was concerned that altering any of the bytes within the PNG without recalculating the CRC of its respective chunk would break the file, so I decided to test this hypothesis out by writing a simple C program that altered a byte in the first IDAT chunk:

![C Code](/assets/img/steggle-p1-3.JPG){: .mx-auto.d-block :}

Running the code and opening the resulting file went about as well as I had expected:

![Error](/assets/img/steggle-p1-4.JPG){: .mx-auto.d-block :}

As I feared, changing data within a chunk meant that the CRC picked it up as corruption and failed to open the file. This information was not the only blow to my initial plan however, upon further research of this problem I soon found that the data stored within IDAT chunks wasn't actually bitmap pixel data, rather it was compressed data and thus couldn't be manipulated without going through a process of decompression. Clearly this would be a major obstacle to overcome, so as set out in my timetable, over the next week it is my intention to look deeper into the techniques used for digital steganography along with how I can manipulate the raw data of PNG files.
