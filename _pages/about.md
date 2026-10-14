---
permalink: /
title: ""
excerpt: ""
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

<span class='anchor' id='about-me'></span>

I am an AI-native Solutions Architect and HPC System Engineer at NVIDIA, where I have worked since January 2026. I received my Ph.D. in Computer Science from Texas Tech University. During my doctoral studies, I was a member of the [Data-Intensive Scalable Computing Laboratory (DISCL)](https://discl.cs.ttu.edu/doku.php?id=home), led by [Dr. Yong Chen](https://www.myweb.ttu.edu/yonchen/). I also collaborated with [Dr. Wei Zhang](https://tacc.utexas.edu/about/staff-directory/wei-zhang/) at the Texas Advanced Computing Center and [Dr. Suren Byna](https://sbyna.github.io/) at The Ohio State University. My research focuses on high-performance computing (HPC), energy-efficient computing frameworks, AI inference on HPC systems, and scientific data management.

<span class='anchor' id='experience'></span>

# 💼 Experience
<ul class="credential-list">
  <li class="credential-item">
    <span class="credential-logo credential-logo--nvidia" aria-hidden="true">
      <img src="{{ '/images/icons/nvidia.svg' | relative_url }}" alt="">
    </span>
    <span><em>2026.01 - Present</em>, AI-native Solutions Architect and HPC System Engineer, NVIDIA</span>
  </li>
</ul>

# 📖 Education
<ul class="credential-list">
  <li class="credential-item">
    <span class="credential-logo credential-logo--ttu" aria-hidden="true">
      <img src="{{ '/images/icons/ttu.svg' | relative_url }}" alt="">
    </span>
    <span><em>2019.06 - 2025.12</em>, PhD, Computer Science, Texas Tech University, Lubbock, Texas</span>
  </li>
  <li class="credential-item">
    <span class="credential-logo credential-logo--ustc" aria-hidden="true">
      <img src="{{ '/images/icons/ustc.png' | relative_url }}" alt="">
    </span>
    <span><em>2015.09 - 2018.06</em>, Master, Information Science and Technology, University of Science and Technology of China, China</span>
  </li>
  <li class="credential-item">
    <span class="credential-logo credential-logo--ustc" aria-hidden="true">
      <img src="{{ '/images/icons/ustc.png' | relative_url }}" alt="">
    </span>
    <span><em>2011.09 - 2015.06</em>, Bachelor, Mathematics, University of Science and Technology of China, China</span>
  </li>
</ul>

# 🔥 News
{% include news-list.html items=site.data.news %}

<span class='anchor' id='-publications'></span>

<div class="section-heading">
  <h1>📝 Selected Publications</h1>
  <a class="section-heading__link" href="{{ '/publications/' | relative_url }}">View all publications <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
</div>

{% assign selected_publications = site.data.publications | where: "selected", true %}
{% include publication-list.html papers=selected_publications %}

<span class='anchor' id='projects-software'></span>

<div class="section-heading">
  <h1>🧰 Selected Projects</h1>
  <a class="section-heading__link" href="{{ '/projects/' | relative_url }}">View all projects <i class="fas fa-arrow-right" aria-hidden="true"></i></a>
</div>

{% assign selected_projects = site.data.projects | where: "selected", true %}
{% include project-list.html projects=selected_projects %}

<span class='anchor' id='professional-service'></span>

# 💬 Professional Service
- *Program Committee Member*: AAAI ’27, AAAI ’26, BigData ’26, PEARC ’26
- *Reproducibility Committee Member*: SC ’25
- *Paper Reviewer*: NeurIPS Workshop ’26, ACM TiiS ’26, BigData ’25, CCGrid ’24, SSDBM ’24
- *Conference Volunteer*: SC ’21, SC ’24
