---
layout: post
title: Steggle Development Part 3
subtitle: Image Manipulation
gh-repo: CyrusWilkie/steggle
gh-badge: [star, fork, follow]
thumbnail-img: /assets/img/steggle3/python_output2.png
tags: [steggle, dev]
comments: true
---

With all the planning research work out of the way, this week I finally started work on producing the program itself. My primary objective of this week's work was to produce code that acted as a proof of concept, code that could conclusively show that the solution I have been planning up is achievable. My first goal was to prove that I could use the PIL library to manipulate an image's individual pixels, to do this I wrote up the following code:

```python
from PIL import Image

'''
Program that takes an image and fills in the top left
quarter with red 
'''

# Open and load bitmap
picture = Image.open('preview.png').convert('RGB')
bitmap = picture.load()

# Get size
width, height = picture.size

for xcoor in range(0, width):
    for ycoor in range(0, height):
        if xcoor < width/2 and ycoor < height/2:
            # Changing pixel colour
            bitmap[xcoor, ycoor] = (255, 0, 0)
        else:
            bitmap[xcoor, ycoor] = (bitmap[xcoor, ycoor][0], bitmap[xcoor, ycoor][1], bitmap[xcoor, ycoor][2])

picture.save('python_output.png')
```

The function of the code is fairly simple, it takes in an image file, loads its bitmap and then goes through that bitmap pixel by pixel setting those in the correct locations to red, or RGB (255,0,0). Using this code on a random PNG I found online produced the following results:

**Image Before**
![Before Galaxy](/assets/img/steggle3/preview.png){: .mx-auto.d-block :}

**Image After**
![After Galaxy](/assets/img/steggle3/python_output2.png){: .mx-auto.d-block :}

Success! It was clear that manipulating the bitmap of a PNG pixel by pixel is something that I can feasibly do with the tools I had previously researched. There was still a significant question remained however, could I manipulate those pixels in the way I needed to to achieve least significant bit steganography? As explained in my previous post, in order to encode messages I would need to be able to perform bit operations to make subtle changes to the bytes that make up each pixel, subtle enough that the alterations made would not be noticable to the human eye. To test this, I wrote up a program that took an image and changed every byte in its bitmap so that they all ended with a 1, it did this by checking each byte's last bit and adding 1 to any byte that ended with a 0. Upon first testing this program, I got the following result.

**Image Before**
![Before Sun](/assets/img/steggle3/Firefox_wallpaper.png){: .mx-auto.d-block :}

**Image After**
![After Sun](/assets/img/steggle3/examplesteg1.png){: .mx-auto.d-block :}

Clearly, these images were substantially more different than I would have anticipated for such a small change to the pixel values. From here I began investigating why exactly the colour values of the output image did not reflect the values that I had anticipated, in particular I tried several variations of the code where new values are reassigned to the bitmap. In the code I used above, I had set the values by using a separate variable that would copy the value in the bitmap and then be updated before being set as the new value in the bitmap. After a bit of poking around a struck on a new approach that bore the results I was looking for:

**Image After**
![After Sun](/assets/img/steggle3/python_output.png){: .mx-auto.d-block :}

This result, upon direct comparison with the before picture, is indistinguishable to my eyes. In fact, this output was so indistinguishable that I was a little suspicious about whether or not it had actually been altered, so I added a counter to my program which counted the number of times a byte ending with a 0 was detected and altered during the course of execution and then ran the original through before running the processed image back through again, knowing that the processed image should never have to be altered:

![Prompt](/assets/img/steggle3/prompt.png){: .mx-auto.d-block :}

With that result I had confirmation that I had performed an extremely basic example of least significant bit steganography with the following code:

```python
from PIL import Image
import sys

'''
Simple program that changes all bytes in an image's bitmap
to end with 1
'''

# Open and load bitmap
picture = Image.open(sys.argv[1]).convert('RGB')
bitmap = picture.load()

# Get size
width, height = picture.size

pixels_changed = 0

for xcoor in range(0, width):
    for ycoor in range(0, height):
        
        # List determines how much the pixels need to be altered
        alter_by = [0,0,0]

        for byte in range(0, 2):
            # Changes every byte to end in a 1 bit
            if bitmap[xcoor, ycoor][byte] & 1 != 1:                
                alter_by[byte] = 1
                pixels_changed += 1
        
        # Assign new pixel value
        bitmap[xcoor, ycoor] = (bitmap[xcoor, ycoor][0] + alter_by[0], bitmap[xcoor, ycoor][1] + alter_by[1], bitmap[xcoor, ycoor][2] + alter_by[2])

print(f'pixels changed: {pixels_changed}')
picture.save('python_output.png')
```

Admittedly, I never entirely figured out why my previous approach didn't work as expected, my best guess is that it may have something to do with the data type that colour values are stored as by the PIL library. Nevertheless, the solution I stumbled upon worked so it's what I'll stick with.

**What I've Learned**

Through being able to get hands on and implement some of the ideas I'd researched previously I now believe I have the ability and the tools to complete this project. Moreover, the code I've developed this week will also act as a very useful basis for further development as it is already able to carry out very basic steganography. Next week I intend to write the functionality necessary to write basic messages steganographically.