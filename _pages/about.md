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

I am a Ph.D. candidate in the Department of Computer Science at Texas Tech University. I am part of the research team led by Dr. Yong Chen, collaborating with experts like Dr. Wei Zhang from Texas Advanced Computing Center and Dr. Suren Byna from The Ohio State University. My research focuses on High-Performance Computing (HPC), energy-efficient framework, AI inference on HPC and scientific data management.

<!-- I have published several papers at the top international AI conferences with total <a href='https://scholar.google.com/citations?user=DhtAFkwAAAAJ'>google scholar citations <strong><span id='total_cit'>260000+</span></strong></a> (You can also use google scholar badge <a href='https://scholar.google.com/citations?user=DhtAFkwAAAAJ'><img src="https://img.shields.io/endpoint?url={{ url | url_encode }}&logo=Google%20Scholar&labelColor=f6f6f6&color=9cf&style=flat&label=citations"></a>). -->

# 📖 Educations
- *2019.06 - 2025.12*, PhD, Computer Science, Texas Tech University, Lubbock, Texas
- *2015.09 - 2018.06*, Master, Information Science and Technology, University of Science and Technology of China, China
- *2011.09 - 2015.06*, Bachelor, Mathematics, University of Science and Technology of China, China

# 🔥 News
- *2026.02*: &nbsp;🎉🎉 I will attend <a href='https://aaai.org/conference/aaai/aaai-26/submission-instructions/'> AAAI' 26 conference </a> and gave a presentation named "TokenPoweBench: Benchmarking the Power Consumption of LLM Inference."
- *2025.07*: &nbsp;🎉🎉 I attended <a href='https://www.hdfgroup.org/hug/hug24/'> HotCarbon' 25 workshop </a> and gave a presentation named " Energy Efficient or Exhaustive? Benchmarking Power Consumption of LLM Inference Engines."

# 📝 Publications 

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">AAAI 2026</div><img src='images/AAAI.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">
    
[TokenPoweBench: Benchmarking the Power Consumption of LLM Inference.](https://discl.cs.ttu.edu/lib/exe/fetch.php?media=wiki:papers:niu_aaai_2026.pdf)
    
**Chenxu Niu**, Wei Zhang, Jie Li, Yongjian Zhao, Tongyang Wang, Xi Wang and Yong Chen. 
    
</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">HotCarbon 2025</div><img src='images/hotcarbon.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

[Energy Efficient or Exhaustive? Benchmarking Power Consumption of LLM Inference Engines. ](https://github.com/chenxuniu/LLM-Inference-Engine-Benchmark/blob/main/Camera%20Ready%20Chenxu%20Niu%20Benchmarking%20Power%20Consumption%20of%20LLM%20Inference%20Engines.pdf)

**Chenxu Niu**, Wei Zhang, Yongjian Zhao, Yong Chen

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">SSDBM 2025</div><img src='images/ICEAGE.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

[ICEAGE: Intelligent Contextual Exploration and Answer Generation Engine for Scientific Data Discovery. ](https://sbyna.github.io/research/papers/2023/202312-pre-PSQS-Niu.pdf)

**Chenxu Niu**, Wei Zhang, Mert Side, Yong Chen

</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">Big Data 2023</div><img src='images/PSQS.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

[PSQS: Parallel Semantic Querying Service for Self-describing File Formats](https://sbyna.github.io/research/papers/2023/202312-pre-PSQS-Niu.pdf)

**Chenxu Niu**, Wei Zhang, Suren Byna, Yong Chen

</div>
</div>

<!-- [**Project**](https://scholar.google.com/citations?view_op=view_citation&hl=zh-CN&user=DhtAFkwAAAAJ&citation_for_view=DhtAFkwAAAAJ:ALROH1vI_8AC) <strong><span class='show_paper_citations' data='DhtAFkwAAAAJ:ALROH1vI_8AC'></span></strong>
- Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet. 
</div>
</div> -->

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">HPEC 2022</div><img src='images/kv2vec.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

[Kv2vec: A distributed representation method for key-value pairs from metadata attributes](https://drive.google.com/file/d/19UUCLtrfQIrLnXcQ2KJowbsGGyP4MydT/view)

**Chenxu Niu**, Wei Zhang, Suren Byna, Yong Chen

</div>
</div>

<!-- [**Project**](https://scholar.google.com/citations?view_op=view_citation&hl=zh-CN&user=DhtAFkwAAAAJ&citation_for_view=DhtAFkwAAAAJ:ALROH1vI_8AC) <strong><span class='show_paper_citations' data='DhtAFkwAAAAJ:ALROH1vI_8AC'></span></strong>
- Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus ornare aliquet ipsum, ac tempus justo dapibus sit amet. 
</div>
</div> -->

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">HiPC 2019</div><img src='images/explore.png' alt="sym" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

[Exploring metadata search essentials for scientific data management](https://sdm.lbl.gov/~sbyna/research/papers/2019/201912-EOD_HDF5_Metadata_Queries-HiPC_2019-DOI.pdf)

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

# 💬 Sicieties and community contributions
- *2024*, Student volunteer at Supercomputing 2024 (The International Conference for High Performance
Computing, Networking, Storage, and Analysis)
- *2016*, Student volunteer at Mathematics Theory of Chinese Association of Cryptography Conference.
- *2015*, Student volunteer at first Post Quantum Cryptography Asia Forum (PQCAM).
