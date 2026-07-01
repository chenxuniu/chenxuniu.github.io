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

# 📖 Educations
- *2019.06 - 2025.12*, PhD, Computer Science, Texas Tech University, Lubbock, Texas
- *2015.09 - 2018.06*, Master, Information Science and Technology, University of Science and Technology of China, China
- *2011.09 - 2015.06*, Bachelor, Mathematics, University of Science and Technology of China, China

# 🔥 News
- *2026.06*: &nbsp;🎉🎉 My paper [Power-Centric Observability for HPC Systems: Design, Deployment, and Evaluation on REPACSS.](https://chenxuniu.github.io/assets/pdf/pearc2026-power-observability.pdf) has been accepted to PEARC 2026.
- *2026.04*: &nbsp;🎉🎉 My paper [TokenPoweBench: Benchmarking the Power Consumption of LLM Inference.](/assets/pdf/aaai2026-tokenpowerbench.pdf) has been published at AAAI 2026 (acceptance rate = 17.6%).
- *2026.04*: &nbsp;🎉🎉 My paper [FIXME: Towards End-to-End Benchmarking of LLM-Aided Design Verification.](/assets/pdf/aaai2026-fixme.pdf) has been published at AAAI 2026 (acceptance rate = 17.6%).
- *2026.01*: &nbsp;🎉🎉 I joined NVIDIA from Jan 2026.

# 📝 Publications

{% for paper in site.data.publications %}
<div class='paper-box'>
  <div class='paper-box-image'>
    <div>
      <div class="badge">{{ paper.venue }}</div>
      <img src='{{ paper.image | relative_url }}' alt="{{ paper.venue }} publication preview" width="100%">
    </div>
  </div>
  <div class='paper-box-text'>
    {% assign primary_link = paper.links | where: "label", "PDF" | first %}
    {% if primary_link %}
      {% assign title_url = primary_link.url %}
      {% unless title_url contains '://' %}
        {% assign title_url = title_url | relative_url %}
      {% endunless %}
      <p class="paper-title"><a href="{{ title_url }}">{{ paper.title }}</a></p>
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
          <a href="{{ link_url }}">{{ link.label }}</a>{% unless forloop.last %}<span class="paper-link-separator">|</span>{% endunless %}
        {% endfor %}
      </p>
    {% endif %}
  </div>
</div>
{% endfor %}

# 🎖 Honors and Awards
- *2015* National third-class prize of Mathematical and Cryptographic Algorithm Contest in China 2015.
- *2014* National third-class prize of China Undergraduate Mathematical Contest in Modelling in China.
- *2012-2015* First-class undergraduate scholarship of USTC. (top 10%)

# 💬 Professional Service
- *Program Committee Member*: AAAI ’26, PEARC ’26
- *Reproducibility Committee Member*: SC ’25
- *Paper Reviewer*: AAAI ’27, AAAI ’26, BigData ’25, CCGrid ’24, SSDBM ’24
- *Conference Volunteer*: SC ’21, SC ’24

# 🌍 Visitor Map

<div align="center" style="margin: 40px 0;">
  <script type="text/javascript" id="mapmyvisitors" src="//mapmyvisitors.com/map.js?d=dK4rYKej1PnyXS_m0Mykn13KyymmNpSGZ9e3m0xODOk&cl=ffffff&w=300"></script>
</div>
