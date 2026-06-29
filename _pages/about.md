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

I joined NVIDIA as a AI native solutions architect, HPC system engineer from Jan 2026. I received my PhD degree in the Department of Computer Science at Texas Tech University. I was part of the research team led by Dr. Yong Chen, collaborating with experts like Dr. Wei Zhang from Texas Advanced Computing Center and Dr. Suren Byna from The Ohio State University. My research focused on High-Performance Computing (HPC), energy-efficient framework, AI inference on HPC and scientific data management.

<!-- I have published several papers at the top international AI conferences with total <a href='https://scholar.google.com/citations?user=DhtAFkwAAAAJ'>google scholar citations <strong><span id='total_cit'>260000+</span></strong></a> (You can also use google scholar badge <a href='https://scholar.google.com/citations?user=DhtAFkwAAAAJ'><img src="https://img.shields.io/endpoint?url={{ url | url_encode }}&logo=Google%20Scholar&labelColor=f6f6f6&color=9cf&style=flat&label=citations"></a>). -->

# 📖 Educations
- *2019.06 - 2025.12*, PhD, Computer Science, Texas Tech University, Lubbock, Texas
- *2015.09 - 2018.06*, Master, Information Science and Technology, University of Science and Technology of China, China
- *2011.09 - 2015.06*, Bachelor, Mathematics, University of Science and Technology of China, China

# 🔥 News
- *2026.01*: &nbsp;🎉🎉 I joined NVIDIA from Jan 2026.
- *2025.11*: &nbsp;🎉🎉 My paper "TokenPoweBench: Benchmarking the Power Consumption of LLM Inference." has been accepted by " <a href='https://aaai.org/conference/aaai/aaai-26/submission-instructions/'> AAAI' 26 conference (acceptance rate = 17.6%)
- *2025.11*: &nbsp;🎉🎉 My paper "FIXME: Towards End-to-End Benchmarking of LLM-Aided Design Verification." has been accepted by " <a href='https://aaai.org/conference/aaai/aaai-26/submission-instructions/'> AAAI' 26 conference (acceptance rate = 17.6%)

# 📝 Publications

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">AAAI 2026</div><img src='images/AAAI.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">
    
[TokenPoweBench: Benchmarking the Power Consumption of LLM Inference.](/assets/pdf/aaai2026-tokenpowerbench.pdf)
    
**Chenxu Niu**, Wei Zhang, Jie Li, Yongjian Zhao, Tongyang Wang, Xi Wang and Yong Chen. 
    
</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">AAAI 2026</div><img src='images/Fixme.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">
    
[Fixme: Towards end-to-end benchmarking of llm-aided design verification.](/assets/pdf/aaai2026-fixme.pdf)

Gwok-Waa Wan, SamZaak Wong, Shengchu Su, **Chenxu Niu**, Ning Wang, Xinlai Wan, Qixiang Chen, Mengnv Xing, Jingyi Zhang, Jianmin Ye, Yubo Wang, Rongchang Song, Tao Ni, Qiang Xu, Nan Guan, Zhe Jiang, Xi Wang, Yong Chen, Jun Yang
    
</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">HotCarbon 2025</div><img src='images/hotcarbon.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

[Energy Efficient or Exhaustive? Benchmarking Power Consumption of LLM Inference Engines.](/assets/pdf/hotcarbon2025-llm-inference-engines.pdf)

**Chenxu Niu**, Wei Zhang, Yongjian Zhao, Yong Chen

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">PEARC 2026</div><img src='images/pearc2026.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

[Power-Centric Observability for HPC Systems: Design, Deployment, and Evaluation on REPACSS.](/assets/pdf/pearc2026-power-observability.pdf)

Yongjian Zhao, Jie Li, **Chenxu Niu**, Alan Sill, Yong Chen

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">SSDBM 2025</div><img src='images/ICEAGE.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

[ICEAGE: Intelligent Contextual Exploration and Answer Generation Engine for Scientific Data Discovery.](/assets/pdf/ssdbm2025-iceage.pdf)

**Chenxu Niu**, Wei Zhang, Mert Side, Yong Chen

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">Big Data 2023</div><img src='images/PSQS.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

[PSQS: Parallel Semantic Querying Service for Self-describing File Formats](/assets/pdf/bigdata2023-psqs.pdf)

**Chenxu Niu**, Wei Zhang, Suren Byna, Yong Chen

</div>
</div>

<!-- [**Project**](https://scholar.google.com/citations?view_op=view_citation&hl=zh-CN&user=DhtAFkwAAAAJ&citation_for_view=DhtAFkwAAAAJ:ALROH1vI_8AC) <strong><span class='show_paper_citations' data='DhtAFkwAAAAJ:ALROH1vI_8AC'></span></strong>
- Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet. 
</div>
</div> -->

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">HPEC 2022</div><img src='images/kv2vec.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

[Kv2vec: A distributed representation method for key-value pairs from metadata attributes](/assets/pdf/hpec2022-kv2vec.pdf)

**Chenxu Niu**, Wei Zhang, Suren Byna, Yong Chen

</div>
</div>

<!-- [**Project**](https://scholar.google.com/citations?view_op=view_citation&hl=zh-CN&user=DhtAFkwAAAAJ&citation_for_view=DhtAFkwAAAAJ:ALROH1vI_8AC) <strong><span class='show_paper_citations' data='DhtAFkwAAAAJ:ALROH1vI_8AC'></span></strong>
- Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet. 
</div>
</div> -->

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">HiPC 2019</div><img src='images/explore.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

[Exploring metadata search essentials for scientific data management](/assets/pdf/hipc2019-metadata-search.pdf)

Wei Zhang, Suren Byna, **Chenxu Niu**, Yong Chen

</div>
</div>

<!-- [**Project**](https://scholar.google.com/citations?view_op=view_citation&hl=zh-CN&user=DhtAFkwAAAAJ&citation_for_view=DhtAFkwAAAAJ:ALROH1vI_8AC) <strong><span class='show_paper_citations' data='DhtAFkwAAAAJ:ALROH1vI_8AC'></span></strong>
- Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet. 
</div>
</div> -->

<!-- - [Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet](https://github.com), A, B, C, **CVPR 2020** -->

# 🎖 Honors and Awards
- *2015* National third-class prize of Mathematical and Cryptographic Algorithm Contest in China 2015.
- *2014* National third-class prize of China Undergraduate Mathematical Contest in Modelling in China.
- *2012-2015* First-class undergraduate scholarship of USTC. (top 10%)

# 💬 Professional Service
- *Program Committee Member*: AAAI ’26, PEARC ’26
- *Reproducibility Committee Member*: SC ’25
- *Paper Reviewer*: AAAI ’25, BigData ’25, CCGrid ’24, SSDBM ’24
- *Conference Volunteer*: SC ’21, SC ’24

# 🌍 Visitor Map

<div align="center" style="margin: 40px 0;">
  <script type="text/javascript" id="mapmyvisitors" src="//mapmyvisitors.com/map.js?d=dK4rYKej1PnyXS_m0Mykn13KyymmNpSGZ9e3m0xODOk&cl=ffffff&w=300"></script>
</div>
