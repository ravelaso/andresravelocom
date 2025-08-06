---
title: "Personal Portfolio Website"
description: "A modern portfolio built with Astro, React, and Tailwind CSS"
date: 2024-12-01
tags: ["astro", "react", "typescript", "tailwindcss"]
url: "https://github.com/username/portfolio"
tech: ["Astro", "React", "TypeScript", "Tailwind CSS", "Cloudflare Pages", "Cloudflare R2"]
category: "web"
coverImage: "@/assets/photogallerybackground.jpg"
---

# Personal Portfolio Website

This portfolio website showcases my work in development, and photography. Built with modern web technologies for optimal performance and user experience.

## Features

- **Lightning Fast**: Built with Astro for optimal performance
- **Interactive Elements**: React components for dynamic functionality
- **Responsive Design**: Tailwind CSS for mobile-first responsive design
- **Image Gallery**: Custom photo gallery with lazy loading

## Technical Highlights

### Architecture
- **Static Site Generation**: Astro generates static pages for fast loading
- **Island Architecture**: React components are hydrated only when needed
- **Content Collections**: Markdown-based content management
- **Cloudflare**: R2 bucket storage for images

## Challenges & Solutions

### Challenge: Image Gallery Performance
Loading hundreds of photos from Cloudflare R2 efficiently.

**Solution**: Implemented infinite scroll with intersection observer API and lazy loading to only load images as they come into viewport.