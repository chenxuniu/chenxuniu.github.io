---
tldr: "MicroEvo couples off-the-shelf LLMs with Monte Carlo Tree Search to explore microarchitecture design spaces, improving Pareto-front quality by up to 36.2% and search efficiency by 10.6× over NSGA-II."
figures:
  - src: "/images/papers/microevo/figure-5.png"
    width: 1600
    height: 266
    alt: "Pipeline diagram: LLM-driven initialization, Monte Carlo Tree Search with Pareto-UCT selection, LLM-operator expansion and PPA simulation, guided by active knowledge accumulation and state-aware directives, producing Pareto-optimal designs."
    caption: "Figure 5. Overview of MicroEvo: LLM-driven initialization and expansion, Pareto-UCT selection in the MCTS tree, PPA evaluation, active knowledge accumulation and state-aware directives."
  - src: "/images/papers/microevo/figure-8.png"
    width: 1452
    height: 594
    alt: "Two scatter plots of power and area against CPI for six design-space exploration methods; MicroEvo's points form the lowest and broadest Pareto front."
    caption: "Figure 8. Pareto fronts of different design-space exploration methods in the CPI–Power and CPI–Area spaces."
  - src: "/images/papers/microevo/figure-9.png"
    width: 1482
    height: 560
    alt: "Left: hypervolume against number of explorations, where MicroEvo rises fastest. Right: time to reach a hypervolume of 0.74, 23.3 minutes for MicroEvo against 117 to 280 minutes for the other methods."
    caption: "Figure 9. Convergence efficiency and time-to-target comparison."
---
Microarchitecture design space exploration suffers from expansive search spaces and expensive PPA evaluation, leaving only a small simulation budget for design decision-making. Existing methods perform blind search without considering microarchitectural dependencies and fail to learn from the iterative search effectively, leading to wasted evaluations and weak Pareto convergence. In this paper, we propose MicroEvo, a knowledge-guided framework that couples off-the-shelf LLMs with Monte Carlo Tree Search (MCTS) for multi-objective microarchitecture optimization. MicroEvo combines LLM-driven evolutionary operators, a Pareto-aware tree policy that balances Pareto contribution and diversity, an active knowledge accumulation mechanism that extracts and reuses optimization insights, and state-aware directives that adapt the search behavior online. Experiments show that MicroEvo improves Pareto-front quality by up to 36.2% over NSGA-II and achieves 10.6× higher search efficiency, and also demonstrates strong scalability to a complex industrial-scale core. The code repository is available at: <https://github.com/GEAR-SEU/MicroEvo-ICCAD-26>.
