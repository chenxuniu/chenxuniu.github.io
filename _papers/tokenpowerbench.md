---
tldr: "An open-source benchmark that measures LLM inference power at the GPU, node and system level without special power meters, and attributes energy to the prefill and decode phase of every request."
figures:
  - src: "/images/papers/tokenpowerbench/figure-1.png"
    width: 1601
    height: 468
    alt: "Architecture diagram: a configuration stage (model, inference engine, benchmark), an execution and measurement stage that follows each request through prefill and decode while collecting CPU and GPU power, and a report stage with energy during setup, per token, per second and per response."
    caption: "Figure 1. Overview of the TokenPowerBench architecture."
  - src: "/images/papers/tokenpowerbench/figure-2.png"
    width: 1600
    height: 474
    alt: "Two log-scale bar charts comparing Transformers, DeepSpeed, TensorRT-LLM and vLLM on ten models from Llama3-1B to Qwen-32B: prefill energy on top and decode energy per token below."
    caption: "Figure 2. Prefill energy (a) and decode energy per token (b) across models and inference engines."
  - src: "/images/papers/tokenpowerbench/figure-4.png"
    width: 1358
    height: 1176
    alt: "Four line charts of energy per token against batch sizes from 32 to 1024 for Llama, Qwen, Falcon and the largest models; energy per token falls as the batch grows and flattens beyond 256."
    caption: "Figure 4. Total energy per token across models at varying batch sizes."
---
Large language model (LLM) services now answer billions of queries per day, and industry reports show that inference, not training, accounts for more than 90% of total power consumption. However, existing benchmarks focus on either training/fine-tuning or performance of inference and provide little support for power consumption measurement and analysis of inference. We introduce TokenPowerBench, the first lightweight and extensible benchmark designed for LLM-inference power consumption studies. The benchmark combines (i) a declarative configuration interface covering model choice, prompt set, and inference engine, (ii) a measurement layer that captures GPU-, node-, and system-level power without specialized power meters, and (iii) a phase-aligned metrics pipeline that attributes energy to the prefill and decode stages of every request. These elements make it straightforward to explore the power consumed by an LLM inference run; furthermore, by varying batch size, context length, parallelism strategy and quantization, users can quickly assess how each setting affects joules per token and other energy-efficiency metrics. We evaluate TokenPowerBench on four of the most widely used model series (Llama, Falcon, Qwen, and Mistral). Our experiments cover from 1 billion parameters up to the frontier-scale Llama3-405B model. Furthermore, we release TokenPowerBench as open source to help users to measure power consumption, forecast operating expenses, and meet sustainability targets when deploying LLM services.
