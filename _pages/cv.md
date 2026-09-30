---
permalink: /cv/
title: "Curriculum Vitae"
layout: cv
redirect_from:
  - /cv
---

<article class="cv-document">
  <header class="cv-heading">
    <h1>Chenxu Niu</h1>
    <p>AI-native Solutions Architect and HPC System Engineer, NVIDIA</p>
    <p class="cv-contact">
      <a href="mailto:{{ site.author.email }}">{{ site.author.email }}</a> ·
      <a href="{{ site.url }}">chenxuniu.github.io</a> ·
      <a href="{{ site.author.googlescholar }}">Google Scholar</a> ·
      <a href="https://github.com/{{ site.author.github }}">GitHub</a> ·
      <a href="https://www.linkedin.com/in/{{ site.author.linkedin }}">LinkedIn</a>
    </p>
  </header>

  <section class="cv-section" aria-labelledby="cv-interests">
    <h2 id="cv-interests">Research Interests</h2>
    <p>High-performance computing systems, energy-efficient computing, AI inference on HPC systems, and scientific data management.</p>
  </section>

  <section class="cv-section" aria-labelledby="cv-education">
    <h2 id="cv-education">Education</h2>
    <div class="cv-entry">
      <div class="cv-entry-heading"><h3>Ph.D. in Computer Science, Texas Tech University</h3><span class="cv-date">Jun 2019 - Dec 2025</span></div>
      <p class="cv-subline">Lubbock, Texas</p>
      <p>Dissertation: Accelerating Scientific Dataset Discovery with Semantic Metadata Search and Large Language Models.</p>
    </div>
    <div class="cv-entry">
      <div class="cv-entry-heading"><h3>M.S. in Information Science and Technology, University of Science and Technology of China</h3><span class="cv-date">Sep 2015 - Jun 2018</span></div>
      <p class="cv-subline">Hefei, China</p>
    </div>
    <div class="cv-entry">
      <div class="cv-entry-heading"><h3>B.E. in Mathematics, University of Science and Technology of China</h3><span class="cv-date">Sep 2011 - Jun 2015</span></div>
      <p class="cv-subline">Hefei, China</p>
    </div>
  </section>

  <section class="cv-section" aria-labelledby="cv-experience">
    <h2 id="cv-experience">Professional Experience</h2>
    <div class="cv-entry">
      <div class="cv-entry-heading"><h3>AI-native Solutions Architect and HPC System Engineer</h3><span class="cv-date">Jan 2026 - Present</span></div>
      <p class="cv-subline">NVIDIA</p>
      <ul>
        <li>Work with AI-native, consumer internet, and enterprise customers on GPU server, networking, and data center deployments.</li>
        <li>Guide network, compute, and storage design discussions and support server and cluster bring-up.</li>
        <li>Analyze and debug compute and network configuration and performance issues.</li>
      </ul>
    </div>
    <div class="cv-entry">
      <div class="cv-entry-heading"><h3>HPC Systems Administrator and Research Assistant</h3><span class="cv-date">Jun 2019 - Dec 2025</span></div>
      <p class="cv-subline">Texas Tech University · Lubbock, Texas</p>
      <ul>
        <li>Administered Slurm and the software stack for research clusters serving hundreds of users.</li>
        <li>Built monitoring infrastructure for power, thermal, and resource utilization using iDRAC, Redfish, and Grafana.</li>
        <li>Automated cluster deployment and updates with Ansible; deployed distributed LLM training and inference on GPU clusters.</li>
      </ul>
    </div>
  </section>

  <section class="cv-section" aria-labelledby="cv-publications">
    <h2 id="cv-publications">Peer-Reviewed and Accepted Publications</h2>
    {% assign publication_number = 1 %}
    {% for paper in site.data.publications %}
      {% unless paper.venue contains 'arXiv' %}{% assign publication_number = publication_number | plus: 1 %}{% endunless %}
    {% endfor %}
    <h3 class="cv-pub-year">2026</h3>
    <ol class="cv-publications" reversed start="{{ publication_number }}">
      <li>
        H. Chen, X. Liu, Y. Liu, J. Jiang, X. Liu, <strong>C. Niu</strong>, and B. He.
        <strong class="cv-pub-title">The 1/W Law: Context Length is the Dominant Energy Lever in LLM Inference Fleets</strong>.
        <cite>Conference on Neural Information Processing Systems (NeurIPS '26)</cite>, 2026. Accepted; proceedings version forthcoming.
      </li>
      {% assign publication_number = publication_number | minus: 1 %}
      {% assign current_year = 2026 %}
      {% for paper in site.data.publications %}
        {% unless paper.venue contains 'arXiv' %}
          {% if paper.year != current_year %}
            </ol>
            <h3 class="cv-pub-year">{{ paper.year }}</h3>
            <ol class="cv-publications" reversed start="{{ publication_number }}">
            {% assign current_year = paper.year %}
          {% endif %}
          {% include cv-publication.html paper=paper %}
          {% assign publication_number = publication_number | minus: 1 %}
        {% endunless %}
      {% endfor %}
    </ol>
  </section>

  <section class="cv-section" aria-labelledby="cv-preprints">
    <h2 id="cv-preprints">Preprints</h2>
    <ul class="cv-publications">
      {% for paper in site.data.publications %}
        {% if paper.venue contains 'arXiv' %}
          {% include cv-publication.html paper=paper %}
        {% endif %}
      {% endfor %}
    </ul>
  </section>

  <section class="cv-section" aria-labelledby="cv-projects">
    <h2 id="cv-projects">Research Projects</h2>
    <div class="cv-entry">
      <div class="cv-entry-heading"><h3>HPC Data Center Design and Implementation, NSF REPACSS</h3><span class="cv-date">Sep 2023 - Dec 2025</span></div>
      <ul>
        <li>Led design and deployment work for a renewable energy-powered HPC facility.</li>
        <li>Implemented an iDRAC, Redfish, Grafana, and TimescaleDB monitoring stack to track power, carbon, thermal, and utilization metrics across more than 1,000 sensors.</li>
        <li>Worked on 200 Gbps InfiniBand and 100 Gbps Ethernet network topology for AI and scientific workloads.</li>
      </ul>
    </div>
    <div class="cv-entry">
      <div class="cv-entry-heading"><h3>Distributed LLM Inference Monitoring and Optimization</h3><span class="cv-date">Sep 2023 - Jun 2025</span></div>
      <ul>
        <li>Built monitoring dashboards for GPU utilization, memory bandwidth, power draw, and thermal throttling.</li>
        <li>Benchmarked vLLM, TensorRT-LLM, and Ray Serve across hardware configurations and model sizes.</li>
        <li>Developed TokenPowerBench to measure the power consumption and performance of open-source LLM inference.</li>
      </ul>
    </div>
  </section>

  <section class="cv-section" aria-labelledby="cv-service">
    <h2 id="cv-service">Professional Service</h2>
    <ul>
      <li><strong>Program Committee:</strong> AAAI 2027, AAAI 2026, BigData 2026, PEARC 2026.</li>
      <li><strong>Reproducibility Committee:</strong> SC 2025.</li>
      <li><strong>Paper Reviewer:</strong> NeurIPS Workshop 2026, ACM TiiS 2026, BigData 2025, CCGrid 2024, SSDBM 2024.</li>
      <li><strong>Conference Volunteer:</strong> SC 2021 and SC 2024.</li>
    </ul>
  </section>

  <section class="cv-section" aria-labelledby="cv-teaching">
    <h2 id="cv-teaching">Teaching Experience</h2>
    <div class="cv-entry">
      <div class="cv-entry-heading"><h3>Graduate Teaching Assistant, Texas Tech University</h3><span class="cv-date">2020 - 2022</span></div>
      <ul>
        <li>Computational Thinking with Data Science (Fall 2021 - Fall 2022).</li>
        <li>Advanced Operating System Design (Spring 2021).</li>
        <li>Analysis of Algorithms (Spring 2020).</li>
      </ul>
    </div>
  </section>

  <section class="cv-section" aria-labelledby="cv-talks">
    <h2 id="cv-talks">Invited Talks and Presentations</h2>
    <p>Semantic Search and Natural Language Query over HDF5. HDF5 User Group Meeting (HUG24), 2024.</p>
  </section>

  <section class="cv-section" aria-labelledby="cv-skills">
    <h2 id="cv-skills">Technical Skills</h2>
    <p><strong>Programming and DevOps:</strong> Python, C/C++, CUDA, Docker, Kubernetes, Terraform, Ansible, Git.</p>
    <p><strong>HPC and infrastructure:</strong> Slurm, Warewulf, Spack, InfiniBand, Lustre/GPFS, MPI, OpenMP, Linux administration.</p>
    <p><strong>AI and monitoring:</strong> PyTorch, vLLM, TensorRT-LLM, Ray, DeepSpeed, Prometheus, Grafana, Redfish.</p>
  </section>
</article>
