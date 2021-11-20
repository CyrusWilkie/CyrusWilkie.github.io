---
layout: post
title: Formatting a USB Drive in Linux
subtitle: Disk Formatting Fun
thumbnail-img: /assets/img/usben/usb.jpg
tags: [cheat-sheets]
comments: true
---

# Formatting the Drive

For a little while now I've been wanting to set up a USB drive that I could add to my keychain and use to store files that are useful to have with me. Since this might be something I need to do again in future, I though I might record my process so that I can refer back when I need to and also for the benefit of those who, for some reason, are wasting their finite time on this Earth reading this blog.

We begin by first checking to see where the character special file for our USB has been created in `/dev`, we can do this using the command `sudo fdisk -l`.

![Our drive](/assets/img/usben/usb1.png){: .mx-auto.d-block :}

The `/dev` directory essentially stores the files that allow our OS to interface with devices connected to our computer. We see here that the interface for our USB has been stored at `/dev/sdb`, now that we know the whereabouts of this interface we can use a disk partitioning program to format it as if it were any other disk. In this case I'm going to use `cfdisk` as it has the most intuitive CLI in my opinion, but `fdisk` is another option along with GUI programs such as `GParted`.

Our main goal here is simply to create one empty partition that encompasses all the space on our USB drive, we can start doing this by issuing the following command:

```bash
sudo cfdisk /dev/sdb
```

![The format of our drive](/assets/img/usben/usb2.png){: .mx-auto.d-block :}

From here we navigate to new, set our partition size (in my case the size of the disk) and make it primary. We then select the type:

![The format of our drive](/assets/img/usben/usb3.png){: .mx-auto.d-block :}

Mark our partition as bootable, after which point our partition table should look something like this:

![The format of our drive](/assets/img/usben/usb4.png){: .mx-auto.d-block :}

From here we can use the following command to create a FAT32 file system on our USB:

```bash
sudo mkfs.fat -F 32 /dev/sdb1
```

![The format of our drive](/assets/img/usben/usb4.png){: .mx-auto.d-block :}

And voila! Our USB is properly formatted.
