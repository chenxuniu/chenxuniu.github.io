---
tldr: "Benchmarking vLLM, TensorRT-LLM, DeepSpeed and Transformers on H100 GPUs across the inference lifecycle shows where energy goes by stage and component, and that no single engine is the most efficient in every scenario."
figures:
  - src: "/images/papers/llm-inference-engines/figure-1.png"
    width: 1379
    height: 568
    alt: "Three heatmaps of energy per token for 1B, 3B and 8B models across Transformers, DeepSpeed, TensorRT-LLM and vLLM under standard, high-concurrency and high-throughput workloads; vLLM and TensorRT-LLM have the lowest values."
    caption: "Figure 1. Energy per token across all engines and workloads."
  - src: "/images/papers/llm-inference-engines/figure-2.png"
    width: 1389
    height: 1473
    alt: "Bar charts of total and per-component (GPU, CPU, DRAM) energy per token for each engine and workload, with a table for the 8B model under high throughput where vLLM uses 0.143 J per token."
    caption: "Figure 2. Component-wise (GPU, CPU, DRAM) energy per token across inference engines."
  - src: "/images/papers/llm-inference-engines/figure-5.png"
    width: 1379
    height: 1043
    alt: "Scatter plot of energy per token against throughput for four engines; energy per token drops steeply as throughput rises and levels off above about 5,000 tokens per second."
    caption: "Figure 5. Energy per token versus throughput."
---
Large Language Models (LLMs) have remarkable advancements in recent years and have revolutionized the field of natural language processing. To reduce latency and improve inference throughput, many inference engines have been proposed such as vLLM, TensorRT-LLM, and DeepSpeed. However, there is no comprehensive analysis on the power consumption and energy efficiency of these inference engines. In this paper, we benchmark the power consumption of LLM inference engines on one single GPU node with 2 H100 GPUs and provide a fine-grained analysis by decomposing the inference lifecycle into two stages: the setup stage including engine initialization and model loading; and the token generation stage. For each stage, we further measure power consumption across key system components, including GPU, CPU, and DRAM. This breakdown analysis allows us to identify energy bottlenecks of inference lifecycle and gain deeper insights into the energy efficiency of modern inference engines.
