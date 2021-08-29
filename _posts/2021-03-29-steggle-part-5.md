---
layout: post
title: Steggle Development Part 5
subtitle: Implementing Read
gh-repo: CyrusWilkie/steggle
gh-badge: [star, fork, follow]
tags: [steggle, dev]
comments: true
---

With the write system proven to work based on my previous experimentation, this week I set about implementing a read system that could take written messages within images and easily decode them for display to the user. My process for collecting data from the image's bitmap was pretty much the same as the process I implemented for the write function. Essentially what the program is does is collect the values of the last bit of each byte in the bitmap and store them in the appropriate locations within a byte until that byte has been fully constructed, at which point it is then added to a buffer.

![Diagram](/assets/img/steggle5/readdiagram.png){: .mx-auto.d-block :}

In practise, this was achieved by using a char iterator that was always iterated by 1 mod 8. Whenever a bit is read in, it's value is shifted left by the value of char iterator and then added to the byte that is currently being constructed, when char iterator is equal to 7 a full byte has been constructed and that byte is added to the relevant buffers.

Using this technique, I developed a program that performed this process for every single byte in a previously encoded image and printed out each character rather than adding it to a buffer. This testing gave me the following result at the beginning of the file where the message was encoded:

![Output](/assets/img/steggle5/stegworks.png){: .mx-auto.d-block :}

With this result it was clear that my implementation could successfully grab characters encoded within the images bitmap. The next step now was finding a way to identify which parts of the image contain messages and which parts are just random noise. When creating the write function, I added the convention of starting messages with '_HSTEG' and ending them with '_ESTEG' to make developing this functionality much simpler. Using this convention, I created a six character long buffer within the read function the stored the last six characters read from the image, if the buffer ever contains '_HSTEG' then the function sets a read flag to true and begins reading subsequent characters into a buffer intended for display to the user until '_ESTEG' is encountered, at which point read is set to false and the contents of the now populated buffer is displayed to the user, containing the encoded message.

Using this technique, I was able to fully construct the read functionality of my digital steganography program, testing this program bore the following results:

![Output](/assets/img/steggle5/output.png){: .mx-auto.d-block :}

Success!

From this testing it was clear that my program was able to read and write data to the bitmaps of PNG images using least significant bit steganography. Since this means I have essentially achieved the objective of my project, over the next week I have set myself a couple of objectives for extending the functionality of my program:
- Add the ability to select where in an image messages are encoded
- Add the ability to encode binary files into an image

Based on the code I have already written, I believe these objective should be fairly achievable over the next week and would turn my program into somewhat useful, if fairly basic, steganographic tool.