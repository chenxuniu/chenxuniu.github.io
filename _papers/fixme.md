---
tldr: "The first end-to-end benchmark for LLMs in hardware functional verification: 747 tasks from real-world designs across five verification sub-tasks, revealing where state-of-the-art LLMs still fall short."
figures:
  - src: "/images/papers/fixme/figure-1.png"
    width: 1387
    height: 584
    alt: "Diagram of a modern hardware development flow from frontend design through functional verification and backend design to tape-out, with functional verification taking at least 50% of the time."
    caption: "Figure 1. Typical IC development workflow; verification typically takes over half of the time."
  - src: "/images/papers/fixme/figure-5.jpg"
    width: 1020
    height: 1216
    alt: "Three-part diagram: A, the FIXME benchmark evaluation flow; B, dataset construction through agent and human expert collaboration; C, example questions and answers for each FIXME sub-set."
    caption: "Figure 5. FIXME workflow, construction and task examples."
  - src: "/images/papers/fixme/figure-6.png"
    width: 1601
    height: 722
    alt: "Heatmap of pass rates for ten LLMs, including GPT-4.1, Claude Sonnet 4 and Gemini 2.5 Flash, across nine FIXME task metrics; functional pass rates are far lower than syntax pass rates."
    caption: "Figure 6. Pass rates of state-of-the-art LLMs across FIXME's tasks."
---
We introduce FIXME, the first end-to-end and large-scale benchmark for evaluating Large Language Models (LLMs) in hardware design functional verification (FV). Comprising 747 tasks derived from real-world hardware designs, FIXME spans five core FV sub-sets: specification comprehension, reference model generation, testbench generation, assertion design, and RTL debugging. To ensure high data quality, we developed an AI-human collaborative framework for agile data curation and annotation. This process resulted in 25,000 lines of verified RTL, 35,000 lines of enhanced testbenches, and over 1,200 SystemVerilog Assertions. Furthermore, through expert-guided optimization within the multi-agent aided flow, we achieved a remarkable 45.57% improvement in average functional coverage, underscoring the benchmark's robustness. Through evaluation of state-of-the-art LLMs like GPT-4.1, FIXME identifies key limitations and provides actionable insights, advancing the potential of LLM-driven automation in hardware design functional verification.
