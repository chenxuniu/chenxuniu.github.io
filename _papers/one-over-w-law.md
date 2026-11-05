---
tldr: "For decode-dominated LLM serving, tokens per watt scale inversely with the serving context window, so routing requests by context length is the largest single lever on fleet energy efficiency."
figures:
  - src: "/images/papers/one-over-w-law/figure-1.png"
    width: 1602
    height: 676
    alt: "Two panels. Left: log-log plot of tokens per watt against serving context windows from 2K to 128K for H100 and B200, both falling with a slope close to −1 for a spread of about 40×. Right: fleet tokens per watt on the Azure trace, from 5.58 for a homogeneous H100 fleet to 32.12 for B200 with FleetOpt routing."
    caption: "Figure 1. Single-GPU tokens per watt for Llama-3.1-70B on H100 and calibrated B200 across serving context windows from 2K to 128K (a), and fleet-level tok/W on the Azure trace at λ = 1,000 req/s (b)."
  - src: "/images/papers/one-over-w-law/figure-2.png"
    width: 1601
    height: 637
    alt: "Two panels. Left: GPU power saturates at low concurrency while decode throughput keeps rising with concurrency, one curve per context window. Right: tokens-per-watt curves per context window, whose operating points fall along a line of slope close to −1."
    caption: "Figure 2. Mechanism behind the 1/W law on H100: GPU power and decode throughput versus concurrency (a), and per-context tok/W curves with their operating points (b)."
  - src: "/images/papers/one-over-w-law/figure-3.png"
    width: 1598
    height: 621
    alt: "Grouped bar charts of fleet tokens per watt on the Azure and LMSYS-Chat-1M traces for homogeneous 64K, pool-routing and FleetOpt topologies; B200 bars are higher than H100 in every topology and reach 32.12 on Azure."
    caption: "Figure 3. Fleet tok/W at λ = 1,000 req/s for Llama-3.1-70B under homogeneous, two-pool and FleetOpt topologies on H100 and B200."
---
Energy efficiency in LLM inference is often treated as a property of the model, the hardware, or the serving software. We show that, for decode-dominated serving, a simpler systems variable dominates: the serving context window. Because KV-cache memory is finite, increasing the context window reduces the number of concurrent sequences a GPU can hold. Under continuous batching, this concurrency limit directly sets decode throughput, while GPU power remains nearly flat over most of the operating range. The result is a simple 1/*W* law: tokens per watt scale inversely with the serving context window *W*, with log-log exponent −1 in the power-saturated regime and a bounded, predictable shortfall outside it, as we derive from KV-cache capacity and a logistic GPU power model. On identical H100 hardware and software, Llama-3.1-70B tok/W varies by nearly 40× across the 2K–128K context range, and fitted exponents for four model scales from 1B to 70B match predictions fixed before fitting to within 0.003. The same mechanism determines fleet-level efficiency. On the short-context-dominant Azure trace, two-pool context-length routing improves tok/W by 2.5× over a homogeneous NVIDIA H100 fleet under measured H100 power, a gain reproduced in closed form without simulation; an NVIDIA B200 estimate anchored at one measured operating point (±15%) adds 2.0× at fixed topology, and the two levers combine approximately multiplicatively to 5.76×. Finally, sparse MoE weight streaming is a third lever whose sign is set by deployment topology: up to 5.1× in a large expert-parallel deployment, but at or below 1× in the single-node TP=8 configuration studied here once batch-level expert coverage is counted. These results suggest a deployment order for energy-efficient LLM serving: route by context length first, upgrade hardware second, and exploit sparse architectures where expert parallelism amortizes expert coverage.
