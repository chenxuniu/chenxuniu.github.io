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

I am an AI-native Solutions Architect and HPC System Engineer at NVIDIA, where I have worked since January 2026. I received my Ph.D. in Computer Science from Texas Tech University. During my doctoral studies, I worked with Dr. Yong Chen's research group and collaborated with researchers including Dr. Wei Zhang at the Texas Advanced Computing Center and Dr. Suren Byna at The Ohio State University. My research focuses on high-performance computing (HPC), energy-efficient computing frameworks, AI inference on HPC systems, and scientific data management.

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

# 📝 Publications

{% for paper in site.data.publications %}
<div class='paper-box'>
  <div class='paper-box-image'>
    <div>
      <div class="badge">{{ paper.venue }}</div>
      <img src='{{ paper.image | relative_url }}' alt="Preview figure for {{ paper.title }}" width="800" height="350" loading="{% if forloop.first %}eager{% else %}lazy{% endif %}" decoding="async">
    </div>
  </div>
  <div class='paper-box-text'>
    {% assign primary_link = paper.links | where: "label", "DOI" | first %}
    {% unless primary_link %}
      {% assign primary_link = paper.links | where: "label", "PDF" | first %}
    {% endunless %}
    {% if primary_link %}
      {% assign title_url = primary_link.url %}
      {% unless title_url contains '://' %}
        {% assign title_url = title_url | relative_url %}
      {% endunless %}
      <p class="paper-title"><a href="{{ title_url }}" target="_blank" rel="noopener noreferrer">{{ paper.title }}</a></p>
    {% else %}
      <p class="paper-title">{{ paper.title }}</p>
    {% endif %}
    <p class="paper-authors">{{ paper.authors | markdownify | remove: '<p>' | remove: '</p>' }}</p>
    {% if paper.links %}
      <p class="paper-links">
        {% for link in paper.links %}
          {% assign link_url = link.url %}
          {% unless link_url contains '://' %}
            {% assign link_url = link_url | relative_url %}
          {% endunless %}
          <a href="{{ link_url }}" target="_blank" rel="noopener noreferrer">{{ link.label }}</a>{% unless forloop.last %}<span class="paper-link-separator">|</span>{% endunless %}
        {% endfor %}
      </p>
    {% endif %}
  </div>
</div>
{% endfor %}

<span class='anchor' id='projects-software'></span>

# 🧰 Projects / Software

{% for project in site.data.projects %}
<div class="project-box">
  {% assign project_primary_link = project.links | first %}
  {% assign project_title_url = project_primary_link.url %}
  {% unless project_title_url contains '://' %}
    {% assign project_title_url = project_title_url | relative_url %}
  {% endunless %}
  <p class="project-title"><a href="{{ project_title_url }}" target="_blank" rel="noopener noreferrer">{{ project.name }}</a></p>
  <p class="project-type">{{ project.type }}</p>
  <p class="project-description">{{ project.description }}</p>
  {% if project.tags %}
    <p class="project-tags">
      {% for tag in project.tags %}
        <span>{{ tag }}</span>
      {% endfor %}
    </p>
  {% endif %}
  {% if project.links %}
    <p class="project-links">
      {% for link in project.links %}
        {% assign link_url = link.url %}
        {% unless link_url contains '://' %}
          {% assign link_url = link_url | relative_url %}
        {% endunless %}
        <a href="{{ link_url }}" target="_blank" rel="noopener noreferrer">{{ link.label }}</a>{% unless forloop.last %}<span class="paper-link-separator">|</span>{% endunless %}
      {% endfor %}
    </p>
  {% endif %}
</div>
{% endfor %}

<span class='anchor' id='awards-service'></span>

# 🎖 Honors and Awards
- *2015* Third Prize, Mathematical and Cryptographic Algorithm Contest, China.
- *2014* Third Prize, China Undergraduate Mathematical Contest in Modeling.
- *2012-2015* First-Class Undergraduate Scholarship, University of Science and Technology of China (top 10%).

# 💬 Professional Service
- *Program Committee Member*: AAAI ’26, PEARC ’26
- *Reproducibility Committee Member*: SC ’25
- *Paper Reviewer*: AAAI ’27, AAAI ’26, ACM TiiS ’26, BigData ’25, CCGrid ’24, SSDBM ’24
- *Conference Volunteer*: SC ’21, SC ’24

# 🌍 Visitor Map

<div align="center" style="margin: 40px 0;">
  <script type="text/javascript" id="mapmyvisitors" src="//mapmyvisitors.com/map.js?d=dK4rYKej1PnyXS_m0Mykn13KyymmNpSGZ9e3m0xODOk&cl=ffffff&w=300"></script>
</div>
