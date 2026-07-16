---
permalink: /
title: ""
excerpt: ""
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

{% if site.google_scholar_stats_use_cdn %}
{% assign gsDataBaseUrl = "https://cdn.jsdelivr.net/gh/" | append: site.repository | append: "@" %}
{% else %}
{% assign gsDataBaseUrl = "https://raw.githubusercontent.com/" | append: site.repository | append: "/" %}
{% endif %}
{% assign url = gsDataBaseUrl | append: "google-scholar-stats/gs_data_shieldsio.json" %}

<span class='anchor' id='about-me'></span>

I am an AI-native Solutions Architect and HPC System Engineer at NVIDIA, where I have worked since January 2026. I received my Ph.D. in Computer Science from Texas Tech University. During my doctoral studies, I worked with [Dr. Yong Chen](https://www.myweb.ttu.edu/yonchen/)'s research group and collaborated with researchers including [Dr. Wei Zhang](https://tacc.utexas.edu/about/staff-directory/wei-zhang/) at the Texas Advanced Computing Center and [Dr. Suren Byna](https://sbyna.github.io/) at The Ohio State University. My research focuses on high-performance computing (HPC), energy-efficient computing frameworks, AI inference on HPC systems, and scientific data management.

<!-- I have published several papers at the top international AI conferences with total <a href='https://scholar.google.com/citations?user=DhtAFkwAAAAJ'>google scholar citations <strong><span id='total_cit'>260000+</span></strong></a> (You can also use google scholar badge <a href='https://scholar.google.com/citations?user=DhtAFkwAAAAJ'><img src="https://img.shields.io/endpoint?url={{ url | url_encode }}&logo=Google%20Scholar&labelColor=f6f6f6&color=9cf&style=flat&label=citations"></a>). -->

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
      <img src="https://www.ttu.edu/brand/images/visual-identity/double-t.svg" alt="">
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
<ul class="news-list">
  <li class="news-item">
    <span class="news-logo news-logo--iccad" aria-hidden="true">
      <img src="{{ '/images/icons/conferences/iccad-2026.webp' | relative_url }}" alt="">
    </span>
    <span class="news-entry">
      <time class="news-date" datetime="2026-07">2026.07</time>
      <span>My paper <em>MicroEvo: Knowledge-Guided LLM Sampling for Efficient Microarchitecture Design Space Exploration.</em> has been accepted for presentation at ICCAD 2026.</span>
    </span>
  </li>
  <li class="news-item">
    <span class="news-logo news-logo--pearc" aria-hidden="true">
      <img src="{{ '/images/icons/conferences/pearc-2026.jpg' | relative_url }}" alt="">
    </span>
    <span class="news-entry">
      <time class="news-date" datetime="2026-06">2026.06</time>
      <span>My paper <a href="{{ '/assets/pdf/pearc2026-power-observability.pdf' | relative_url }}" target="_blank" rel="noopener noreferrer">Power-Centric Observability for HPC Systems: Design, Deployment, and Evaluation on REPACSS.</a> has been accepted at PEARC 2026.</span>
    </span>
  </li>
  <li class="news-item">
    <span class="news-logo news-logo--aaai" aria-hidden="true">
      <img src="{{ '/images/icons/conferences/aaai-2026.png' | relative_url }}" alt="">
    </span>
    <span class="news-entry">
      <time class="news-date" datetime="2026-04">2026.04</time>
      <span>My paper <a href="{{ '/assets/pdf/aaai2026-tokenpowerbench.pdf' | relative_url }}" target="_blank" rel="noopener noreferrer">TokenPowerBench: Benchmarking the Power Consumption of LLM Inference.</a> has been published in the Proceedings of AAAI 2026 (acceptance rate: 17.6%).</span>
    </span>
  </li>
  <li class="news-item">
    <span class="news-logo news-logo--nvidia" aria-hidden="true">
      <img src="{{ '/images/icons/nvidia.svg' | relative_url }}" alt="">
    </span>
    <span class="news-entry">
      <time class="news-date" datetime="2026-01">2026.01</time>
      <span>I joined NVIDIA in January 2026.</span>
    </span>
  </li>
</ul>

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
- *Program Committee Member*: AAAI ’26, PEARC ’26
- *Reproducibility Committee Member*: SC ’25
- *Paper Reviewer*: AAAI ’27, AAAI ’26, ACM TiiS ’26, BigData ’25, CCGrid ’24, SSDBM ’24
- *Conference Volunteer*: SC ’21, SC ’24
