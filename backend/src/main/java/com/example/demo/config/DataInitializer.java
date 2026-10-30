package com.example.demo.config;

import com.example.demo.models.Paper;
import com.example.demo.models.User;
import com.example.demo.repos.PaperRepository;
import com.example.demo.repos.UserRepository;
import com.example.demo.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final PaperRepository paperRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    @Autowired
    public DataInitializer(PaperRepository paperRepository,
                           UserRepository userRepository,
                           UserService userService) {
        this.paperRepository = paperRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }

    @Override
    public void run(String... args) {
        seedUsers();
        seedPapers();
    }

    private void seedUsers() {
        if (!userRepository.existsByEmail("alex.chen@stanford.edu")) {
            userService.register(
                    "Alex Chen",
                    "alex.chen@stanford.edu",
                    "Password123!",
                    "Stanford University",
                    "Computer Science & AI Lab"
            );
            System.out.println("✅ Seeded default researcher: alex.chen@stanford.edu");
        }
    }

    private void seedPapers() {
        if (paperRepository.count() < 36) {
            // Clean reseed to ensure all 36 multi-disciplinary landmark papers are loaded
            paperRepository.deleteAll();

            List<Paper> papers = Arrays.asList(
                new Paper(
                    "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
                    "Patrick Lewis, Ethan Perez, Aleksandra Piktus, Fabio Petroni, Vladimir Karpukhin, et al.",
                    2020,
                    "Large pre-trained language models have been shown to store factual knowledge in their parameters, and achieve state-of-the-art results when fine-tuned on downstream NLP tasks. However, their ability to access and precisely manipulate knowledge is still limited. We propose Retrieval-Augmented Generation (RAG)\u2014a general-purpose fine-tuning method that combines pre-trained parametric memory with non-parametric retrieval from dense vector indexes.",
                    "10.48550/arXiv.2005.11401",
                    "Natural Language Processing",
                    "ai",
                    "NeurIPS",
                    "Dense retrieval for open-domain NLP",
                    3200,
                    "3.2k citations",
                    true,
                    "https://arxiv.org/abs/2005.11401",
                    "14 min read",
                    "@inproceedings{lewis2020rag,\n  title={Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks},\n  author={Lewis, Patrick and Perez, Ethan and Piktus, Aleksandra and Petroni, Fabio and Karpukhin, Vladimir and others},\n  booktitle={Advances in Neural Information Processing Systems (NeurIPS)},\n  volume={33},\n  pages={9459--9474},\n  year={2020}\n}",
                    Arrays.asList(
                        "Combines parametric language model weights with dense vector retrieval from Wikipedia/external corpora.",
                        "Reduces hallucinations and provides verifiable provenance for factual assertions.",
                        "Sets new state-of-the-art performance on open-domain question answering benchmarks (NQ, TriviaQA)."
                    )
                ),
                new Paper(
                    "Mamba: Linear-Time Sequence Modeling with Selective State Spaces",
                    "Albert Gu, Tri Dao",
                    2024,
                    "Fundamental sequence models largely rely on the Transformer architecture, which incurs quadratic computational complexity with respect to context length. We introduce Mamba, a selective state space model that incorporates a hardware-aware parallel scan and input-dependent parameterization, allowing it to scale linearly with sequence length while achieving superior throughput and language reasoning.",
                    "10.48550/arXiv.2312.00752",
                    "Machine Learning",
                    "ml",
                    "CoRR / arXiv",
                    "State space models in foundation models",
                    1100,
                    "1.1k citations",
                    true,
                    "https://arxiv.org/abs/2312.00752",
                    "18 min read",
                    "@article{gu2023mamba,\n  title={Mamba: Linear-time sequence modeling with selective state spaces},\n  author={Gu, Albert and Dao, Tri},\n  journal={arXiv preprint arXiv:2312.00752},\n  year={2023}\n}",
                    Arrays.asList(
                        "Introduces selective state space models (SSMs) with dynamic, input-dependent transitions.",
                        "Linear time complexity O(N) in sequence length, enabling 5x higher inference throughput.",
                        "Matches or outperforms Transformer architectures across language, audio, and genomics domains."
                    )
                ),
                new Paper(
                    "Learning skillful medium-range global weather forecasting",
                    "Remi Lam, Alvaro Sanchez-Gonzalez, Matthew Willson, Peter Wirnsberger, Meire Fortunato, et al.",
                    2023,
                    "Global weather prediction is traditionally based on numerical weather prediction (NWP) using physical atmospheric models on supercomputers. We introduce GraphCast, a machine learning weather forecasting system based on graph neural networks trained on 40 years of ECMWF reanalysis data. GraphCast produces 10-day forecasts of hundreds of weather variables in under 60 seconds at 0.25\u00b0 resolution, outperforming operational systems.",
                    "10.1126/science.adi2336",
                    "Climate Science",
                    "climate",
                    "Science",
                    "Graph neural networks for weather",
                    750,
                    "750+ citations",
                    true,
                    "https://arxiv.org/abs/2212.12794",
                    "16 min read",
                    "@article{lam2023learning,\n  title={Learning skillful medium-range global weather forecasting},\n  author={Lam, Remi and Sanchez-Gonzalez, Alvaro and Willson, Matthew and others},\n  journal={Science},\n  volume={382},\n  number={6677},\n  pages={1416--1421},\n  year={2023},\n  publisher={American Association for the Advancement of Science}\n}",
                    Arrays.asList(
                        "Trained on 39 years of historical atmospheric data across 37 vertical pressure levels.",
                        "Outperforms the world's leading numerical forecast system (HRES ECMWF) on 90% of verification targets.",
                        "Generates a 10-day global prediction in under 60 seconds on a single Google TPU v4."
                    )
                ),
                new Paper(
                    "Llama 2: Open Foundation and Fine-Tuned Chat Models",
                    "Hugo Touvron, Louis Martin, Kevin Stone, Peter Albert, Amjad Almahairi, et al.",
                    2023,
                    "In this work, we develop and release Llama 2, a collection of pretrained and fine-tuned large language models (LLMs) ranging in scale from 7 billion to 70 billion parameters. Our fine-tuned LLMs, called Llama 2-Chat, are optimized for dialogue use cases. Outperforming open-source chat models on most benchmarks, Llama 2 uses reinforcement learning from human feedback (RLHF) and ghost attention.",
                    "10.48550/arXiv.2307.09288",
                    "Artificial Intelligence",
                    "ai",
                    "CoRR / arXiv",
                    "Open foundation LLMs & RLHF safety",
                    14200,
                    "14.2k citations",
                    true,
                    "https://arxiv.org/abs/2307.09288",
                    "22 min read",
                    "@article{touvron2023llama,\n  title={Llama 2: Open foundation and fine-tuned chat models},\n  author={Touvron, Hugo and Martin, Louis and Stone, Kevin and Albert, Peter and Almahairi, Amjad and others},\n  journal={arXiv preprint arXiv:2307.09288},\n  year={2023}\n}",
                    Arrays.asList(
                        "Trained on 2 trillion tokens with double the context length (4096 tokens) of Llama 1.",
                        "Implements iterative RLHF with rejection sampling and proximal policy optimization (PPO).",
                        "Extensive safety mitigations including red teaming and constitutional safety alignment."
                    )
                ),
                new Paper(
                    "Highly accurate protein structure prediction with AlphaFold",
                    "John Jumper, Richard Evans, Alexander Pritzel, Tim Green, Michael Figurnov, et al.",
                    2021,
                    "Proteins are essential to life, and understanding their structure can facilitate a mechanistic understanding of their function. We introduce AlphaFold, a computational method that can regularly predict protein 3D structures with atomic accuracy even when no similar structure is known. AlphaFold incorporates novel neural network architectures based on evolutionary, physical, and geometric constraints.",
                    "10.1038/s41586-021-03819-2",
                    "Biotechnology & Medicine",
                    "bio",
                    "Nature",
                    "3D protein structure prediction & Evoformer",
                    22000,
                    "22k citations",
                    true,
                    "https://www.nature.com/articles/s41586-021-03819-2",
                    "25 min read",
                    "@article{jumper2021highly,\n  title={Highly accurate protein structure prediction with AlphaFold},\n  author={Jumper, John and Evans, Richard and Pritzel, Alexander and Green, Tim and Figurnov, Michael and others},\n  journal={Nature},\n  volume={596},\n  number={7873},\n  pages={583--589},\n  year={2021},\n  publisher={Nature Publishing Group}\n}",
                    Arrays.asList(
                        "Novel Evoformer neural blocks jointly process multiple sequence alignments (MSAs) and pair representations.",
                        "End-to-end differentiable structure module predicts 3D coordinates using invariant point attention (IPA).",
                        "Achieved competitive accuracy with X-ray crystallography across CASP14 target proteins."
                    )
                ),
                new Paper(
                    "Quantum computational supremacy using a programmable superconducting processor",
                    "Frank Arute, Kunal Arya, Ryan Babbush, Dave Bacon, Joseph C. Bardin, et al.",
                    2019,
                    "The promise of quantum computers is that certain computational tasks might be executed exponentially faster on a quantum processor than on a classical processor. We report quantum supremacy using a programmable superconducting processor with 53 qubits (named Sycamore). Our processor takes approximately 200 seconds to sample one instance of a quantum circuit a million times, benchmarked against supercomputers.",
                    "10.1038/s41586-019-1666-5",
                    "Quantum Computing",
                    "quantum",
                    "Nature",
                    "Quantum computational supremacy & superconducting circuits",
                    5400,
                    "5.4k citations",
                    true,
                    "https://www.nature.com/articles/s41586-019-1666-5",
                    "19 min read",
                    "@article{arute2019quantum,\n  title={Quantum supremacy using a programmable superconducting processor},\n  author={Arute, Frank and Arya, Kunal and Babbush, Ryan and Bacon, Dave and Bardin, Joseph C and others},\n  journal={Nature},\n  volume={574},\n  number={7779},\n  pages={505--510},\n  year={2019},\n  publisher={Nature Publishing Group}\n}",
                    Arrays.asList(
                        "Demonstrated random circuit sampling on 53 superconducting qubits with two-qubit gate fidelities over 99.4%.",
                        "Executed in 200 seconds a task calculated to take Summit supercomputer ~10,000 years classically.",
                        "Milestone verification of the Church-Turing thesis limits in macroscopic physical quantum systems."
                    )
                ),
                new Paper(
                    "Cortical Mapping of Semantic Representations Across the Human Brain",
                    "Alexander G. Huth, Wendy A. de Heer, Thomas L. Griffiths, Fr\u00e9d\u00e9ric E. Theunissen, Jack L. Gallant",
                    2016,
                    "The meaning of language is represented in cerebral cortex, but the organizational principles of these semantic representations have been difficult to map. Using functional MRI and voxel-wise encoding models, we construct an extensive semantic atlas describing how distinct conceptual domains tile the entire human neocortex across multiple subjects.",
                    "10.1038/nature17637",
                    "Neuroscience",
                    "neuro",
                    "Nature",
                    "Human semantic representation & fMRI encoding",
                    1850,
                    "1.8k citations",
                    true,
                    "https://www.nature.com/articles/nature17637",
                    "20 min read",
                    "@article{huth2016cortical,\n  title={Natural speech reveals the semantic maps that tile human cerebral cortex},\n  author={Huth, Alexander G and de Heer, Wendy A and Griffiths, Thomas L and Theunissen, Fr{'e}d{'e}ric E and Gallant, Jack L},\n  journal={Nature},\n  volume={532},\n  number={7600},\n  pages={453--458},\n  year={2016},\n  publisher={Nature Publishing Group}\n}",
                    Arrays.asList(
                        "Constructed continuous semantic topographic maps across human sensory and association cortices.",
                        "Reveals distributed, bilateral semantic networks rather than modular localized hubs.",
                        "Established foundational techniques for modern brain-to-text neural decoders."
                    )
                ),
                new Paper(
                    "Attention Is All You Need",
                    "Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, et al.",
                    2017,
                    "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being parallelizable.",
                    "10.48550/arXiv.1706.03762",
                    "Artificial Intelligence",
                    "ai",
                    "NeurIPS",
                    "Self-attention & Transformer architecture",
                    98000,
                    "98k citations",
                    true,
                    "https://arxiv.org/abs/1706.03762",
                    "15 min read",
                    "@inproceedings{vaswani2017attention,\n  title={Attention is all you need},\n  author={Vaswani, Ashish and Shazeer, Noam and Parmar, Niki and Uszkoreit, Jakob and Jones, Llion and Gomez, Aidan N and Kaiser, {\\L}ukasz and Polosukhin, Illia},\n  booktitle={Advances in Neural Information Processing Systems (NeurIPS)},\n  volume={30},\n  pages={5998--6008},\n  year={2017}\n}",
                    Arrays.asList(
                        "Eliminated sequential recurrence in favor of parallel multi-head self-attention mechanisms.",
                        "Positional encodings preserve temporal and sequence token ordering without recurrence.",
                        "Became the foundational architecture for modern LLMs including GPT-4, Gemini, Claude, and Llama."
                    )
                ),
                new Paper(
                    "Deep Residual Learning for Image Recognition",
                    "Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun",
                    2016,
                    "Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions. Comprehensive empirical evidence shows that these residual networks are easier to optimize.",
                    "10.1109/CVPR.2016.90",
                    "Machine Learning",
                    "ml",
                    "CVPR",
                    "Residual skip connections & deep CNNs",
                    170000,
                    "170k citations",
                    true,
                    "https://arxiv.org/abs/1512.03385",
                    "13 min read",
                    "@inproceedings{he2016deep,\n  title={Deep residual learning for image recognition},\n  author={He, Kaiming and Zhang, Xiangyu and Ren, Shaoqing and Sun, Jian},\n  booktitle={Proceedings of the IEEE conference on computer vision and pattern recognition (CVPR)},\n  pages={770--778},\n  year={2016}\n}",
                    Arrays.asList(
                        "Introduced identity skip connections (y = F(x) + x) solving vanishing/exploding gradient problems.",
                        "Trained 152-layer deep ResNets, winning 1st place in ImageNet and COCO competitions.",
                        "Residual connections became standard architectural primitives in all modern deep networks."
                    )
                ),
                new Paper(
                    "Neural Synaptic Plasticity and Long-Term Memory Consolidation",
                    "Sheena A. Josselyn, Susumu Tonegawa",
                    2020,
                    "How memories are physically encoded in the brain has captivated neuroscientists for over a century. Here we review experimental evidence for memory engrams\u2014ensembles of neurons that undergo lasting synaptic alterations following experience. Optogenetic activation and single-cell sequencing reveal how engrams are consolidated from hippocampus to neocortex.",
                    "10.1126/science.aaw4325",
                    "Neuroscience",
                    "neuro",
                    "Science",
                    "Memory engrams & synaptic consolidation",
                    920,
                    "920+ citations",
                    true,
                    "https://www.science.org/doi/10.1126/science.aaw4325",
                    "17 min read",
                    "@article{josselyn2020memory,\n  title={Memory engrams: Recalling the past and imagining the future},\n  author={Josselyn, Sheena A and Tonegawa, Susumu},\n  journal={Science},\n  volume={367},\n  number={6473},\n  pages={eaaw4325},\n  year={2020},\n  publisher={American Association for the Advancement of Science}\n}",
                    Arrays.asList(
                        "Demonstrates optogenetic tagging and artificial recall of specific memory engram populations.",
                        "Highlights structural dendritic spine remodeling during systems consolidation.",
                        "Bridges cellular synaptic mechanisms with cognitive behavioral recall."
                    )
                ),
                new Paper(
                    "Earth system predictability in the presence of climate change tipping points",
                    "Timothy M. Lenton, Johan Rockstr\u00f6m, Owen Gaffney, Stefan Rahmstorf, Katherine Richardson, et al.",
                    2019,
                    "Politicians and researchers frequently assume that catastrophic climate impacts are decades away. We synthesize observational evidence across the cryosphere, biosphere, and ocean currents indicating that nine key tipping points (including the West Antarctic Ice Sheet and Amazon rainforest) may be active and mutually reinforcing.",
                    "10.1038/d41586-019-03595-0",
                    "Climate Science",
                    "climate",
                    "Nature",
                    "Planetary climate tipping points & risk analysis",
                    2850,
                    "2.8k citations",
                    true,
                    "https://www.nature.com/articles/d41586-019-03595-0",
                    "14 min read",
                    "@article{lenton2019climate,\n  title={Climate tipping points\u2014too risky to bet against},\n  author={Lenton, Timothy M and Rockstr{\"o}m, Johan and Gaffney, Owen and others},\n  journal={Nature},\n  volume={575},\n  number={7784},\n  pages={592--595},\n  year={2019},\n  publisher={Nature Publishing Group}\n}",
                    Arrays.asList(
                        "Identifies 9 interdependent planetary tipping cascades.",
                        "Demonstrates nonlinear risk multipliers in ocean-atmospheric circulation models.",
                        "Calls for high-resolution AI tracking of early warning signals in earth system data."
                    )
                ),
                new Paper(
                    "Fault-Tolerant Quantum Computation with Surface Codes",
                    "Austin G. Fowler, Matteo Mariantoni, John M. Martinis, Andrew N. Cleland",
                    2012,
                    "A realistic roadmap towards practical quantum computing requires rigorous error correction. The surface code is the most promising quantum error-correcting architecture due to its high fault-tolerance threshold of ~1% per gate and strictly 2D nearest-neighbor coupling requirements on physical qubits.",
                    "10.1103/PhysRevA.86.032324",
                    "Quantum Computing",
                    "quantum",
                    "Physical Review A",
                    "Surface code quantum error correction",
                    3400,
                    "3.4k citations",
                    true,
                    "https://journals.aps.org/pra/abstract/10.1103/PhysRevA.86.032324",
                    "24 min read",
                    "@article{fowler2012surface,\n  title={Surface codes: Towards practical large-scale quantum computation},\n  author={Fowler, Austin G and Mariantoni, Matteo and Martinis, John M and Cleland, Andrew N},\n  journal={Physical Review A},\n  volume={86},\n  number={3},\n  pages={032324},\n  year={2012},\n  publisher={APS}\n}",
                    Arrays.asList(
                        "Established the 2D surface code as the leading practical topology for hardware implementation.",
                        "Calculated error correction budgets for factoring 2048-bit RSA numbers with topological braid logic.",
                        "Demonstrated syndrome extraction protocols compatible with superconducting transmons."
                    )
                ),
                new Paper(
                    "The Llama 3 Herd of Models",
                    "Abhimanyu Dubey, Jiahui Yu, Eric Michael Smith, Rohan Anil, Yasmine Babaei, et al.",
                    2024,
                    "We introduce Llama 3, a native multimodality foundation model collection spanning up to 405B parameters. Trained on 15 trillion multilingual tokens with synthetic data refinement, direct preference optimization (DPO), and grouped-query attention, Llama 3 matches proprietary frontiers across reasoning, math, and code synthesis.",
                    "10.48550/arXiv.2407.21783",
                    "Artificial Intelligence",
                    "ai",
                    "CoRR / arXiv",
                    "405B dense foundation models & synthetic data",
                    2800,
                    "2.8k citations",
                    true,
                    "https://arxiv.org/abs/2407.21783",
                    "28 min read",
                    "@article{dubey2024llama3,\n  title={The Llama 3 Herd of Models},\n  author={Dubey, Abhimanyu and Yu, Jiahui and Smith, Eric Michael and Anil, Rohan and others},\n  journal={arXiv preprint arXiv:2407.21783},\n  year={2024}\n}",
                    Arrays.asList(
                        "Demonstrates 405B dense parameter scaling with 16k context window and grouped query attention.",
                        "Employs extensive synthetic data filtering and multi-round iterative Direct Preference Optimization.",
                        "Demonstrates competitive reasoning against closed-source commercial frontier systems."
                    )
                ),
                new Paper(
                    "Mastering the Game of Go with Deep Neural Networks and Tree Search",
                    "David Silver, Aja Huang, Chris J. Maddison, Arthur Guez, Laurent Sifre, et al.",
                    2016,
                    "The game of Go has long been viewed as the most challenging of classic games for artificial intelligence owing to its enormous search space and the difficulty of evaluating board positions. We introduce AlphaGo, which combines Monte Carlo tree search with deep value networks and policy networks trained on supervised human games and reinforcement learning self-play.",
                    "10.1038/nature16961",
                    "Artificial Intelligence",
                    "ai",
                    "Nature",
                    "Reinforcement learning & Monte Carlo tree search",
                    14500,
                    "14.5k citations",
                    true,
                    "https://www.nature.com/articles/nature16961",
                    "21 min read",
                    "@article{silver2016mastering,\n  title={Mastering the game of Go with deep neural networks and tree search},\n  author={Silver, David and Huang, Aja and Maddison, Chris J and Guez, Arthur and others},\n  journal={Nature},\n  volume={529},\n  number={7587},\n  pages={484--489},\n  year={2016},\n  publisher={Nature Publishing Group}\n}",
                    Arrays.asList(
                        "Pioneered combining deep neural network evaluation with Monte Carlo tree search rollouts.",
                        "Defeated European champion 5-0 and world champion Lee Sedol 4-1 in historic milestone matches.",
                        "Paved the way for generalized self-play algorithms like AlphaZero and MuZero."
                    )
                ),
                new Paper(
                    "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models",
                    "Jason Wei, Xuezhi Wang, Dale Schuurmans, Maarten Bosma, Fei Xia, Ed Chi, Quoc V. Le, Denny Zhou",
                    2022,
                    "We explore how generating a chain of thought\u2014a series of intermediate reasoning steps\u2014significantly improves the ability of large language models to perform complex reasoning. In particular, we show that such reasoning abilities emerge naturally in sufficiently large models via chain-of-thought prompting.",
                    "10.48550/arXiv.2201.11903",
                    "Artificial Intelligence",
                    "ai",
                    "NeurIPS",
                    "Emergent reasoning & cognitive prompting",
                    6300,
                    "6.3k citations",
                    true,
                    "https://arxiv.org/abs/2201.11903",
                    "15 min read",
                    "@inproceedings{wei2022chain,\n  title={Chain-of-thought prompting elicits reasoning in large language models},\n  author={Wei, Jason and Wang, Xuezhi and Schuurmans, Dale and Bosma, Maarten and others},\n  booktitle={Advances in Neural Information Processing Systems (NeurIPS)},\n  volume={35},\n  pages={24824--24837},\n  year={2022}\n}",
                    Arrays.asList(
                        "Demonstrates that step-by-step rationales unlock complex multi-step arithmetic and symbolic reasoning.",
                        "Emergent behavior visible primarily in models with scale > 100 billion parameters.",
                        "Established the conceptual basis for modern reasoning models like OpenAI o1."
                    )
                ),
                new Paper(
                    "Direct Preference Optimization: Your Language Model is Secretly a Reward Model",
                    "Rafael Rafailov, Archit Sharma, Eric Mitchell, Stefano Ermon, Christopher D. Manning, Chelsea Finn",
                    2023,
                    "While RL from human feedback (RLHF) is effective for aligning language models, it is notoriously complex and unstable, requiring training a separate reward model and fine-tuning with PPO. We introduce Direct Preference Optimization (DPO), a mathematical derivation that directly optimizes language policies on preference data with a simple binary cross-entropy loss.",
                    "10.48550/arXiv.2305.18290",
                    "Artificial Intelligence",
                    "ai",
                    "NeurIPS",
                    "Alignment algorithms & reward-free optimization",
                    2400,
                    "2.4k citations",
                    true,
                    "https://arxiv.org/abs/2305.18290",
                    "17 min read",
                    "@inproceedings{rafailov2023dpo,\n  title={Direct preference optimization: Your language model is secretly a reward model},\n  author={Rafailov, Rafael and Sharma, Archit and Mitchell, Eric and Ermon, Stefano and Manning, Christopher D and Finn, Chelsea},\n  booktitle={Advances in Neural Information Processing Systems (NeurIPS)},\n  volume={36},\n  year={2023}\n}",
                    Arrays.asList(
                        "Eliminates reinforcement learning instabilities by formulating policy optimization as implicit classification.",
                        "Matches or exceeds PPO alignment performance with drastically lower compute and memory overhead.",
                        "Adopted across modern open weights models including Mistral, Zephyr, and Llama 3."
                    )
                ),
                new Paper(
                    "Adam: A Method for Stochastic Optimization",
                    "Diederik P. Kingma, Jimmy Ba",
                    2015,
                    "We introduce Adam, an algorithm for first-order gradient-based optimization of stochastic objective functions, based on adaptive estimates of lower-order moments. The method is straightforward to implement, computationally efficient, has little memory requirements, is invariant to diagonal rescaling of the gradients, and is well suited for problems with large datasets.",
                    "10.48550/arXiv.1412.6980",
                    "Machine Learning",
                    "ml",
                    "ICLR",
                    "Adaptive stochastic gradient descent",
                    155000,
                    "155k citations",
                    true,
                    "https://arxiv.org/abs/1412.6980",
                    "12 min read",
                    "@article{kingma2014adam,\n  title={Adam: A method for stochastic optimization},\n  author={Kingma, Diederik P and Ba, Jimmy},\n  journal={arXiv preprint arXiv:1412.6980},\n  year={2014}\n}",
                    Arrays.asList(
                        "Combines advantages of AdaGrad (frequent features) and RMSProp (non-stationary objectives).",
                        "Calculates individual adaptive learning rates using decaying averages of past gradients and squared gradients.",
                        "Remains the undisputed universal default optimizer for modern deep neural networks."
                    )
                ),
                new Paper(
                    "Generative Adversarial Nets",
                    "Ian Goodfellow, Jean Pouget-Abadie, Mehdi Mirza, Bing Xu, David Warde-Farley, et al.",
                    2014,
                    "We propose a new framework for estimating generative models via an adversarial process, in which we simultaneously train two models: a generative model G that captures the data distribution, and a discriminative model D that estimates the probability that a sample came from the training data rather than G. The training procedure for G is to maximize the probability of D making a mistake.",
                    "10.48550/arXiv.1406.2661",
                    "Machine Learning",
                    "ml",
                    "NeurIPS",
                    "Minimax game & adversarial generation",
                    68000,
                    "68k citations",
                    true,
                    "https://arxiv.org/abs/1406.2661",
                    "16 min read",
                    "@inproceedings{goodfellow2014generative,\n  title={Generative adversarial nets},\n  author={Goodfellow, Ian and Pouget-Abadie, Jean and Mirza, Mehdi and Xu, Bing and others},\n  booktitle={Advances in Neural Information Processing Systems (NeurIPS)},\n  volume={27},\n  year={2014}\n}",
                    Arrays.asList(
                        "Formulates generative modeling as a zero-sum two-player minimax game.",
                        "Avoids Markov chains and unrolled approximate inference during generation.",
                        "Catalyzed a decade of generative image synthesis breakthroughs leading to StyleGAN."
                    )
                ),
                new Paper(
                    "LoRA: Low-Rank Adaptation of Large Language Models",
                    "Edward J. Hu, Yelong Shen, Phillip Wallis, Zeyuan Allen-Zhu, Yuanzhi Li, et al.",
                    2022,
                    "An important paradigm of natural language processing consists of large-scale pre-training on general domain data and adaptation to specific tasks. However, as models grow, full fine-tuning becomes prohibitive. We propose Low-Rank Adaptation (LoRA), which freezes the pre-trained model weights and injects trainable rank decomposition matrices into each layer of the Transformer architecture.",
                    "10.48550/arXiv.2106.09685",
                    "Machine Learning",
                    "ml",
                    "ICLR",
                    "Parameter-efficient fine-tuning (PEFT)",
                    8900,
                    "8.9k citations",
                    true,
                    "https://arxiv.org/abs/2106.09685",
                    "15 min read",
                    "@inproceedings{hu2022lora,\n  title={LoRA: Low-rank adaptation of large language models},\n  author={Hu, Edward J and Shen, Yelong and Wallis, Phillip and Allen-Zhu, Zeyuan and others},\n  booktitle={International Conference on Learning Representations (ICLR)},\n  year={2022}\n}",
                    Arrays.asList(
                        "Reduces trainable parameters by 10,000x and GPU VRAM footprint by 3x with zero added latency.",
                        "Freezes original base weights W and decomposes weight delta as Delta_W = B * A with rank r << d.",
                        "De facto standard method for fine-tuning LLMs, diffusion models, and multimodal architectures."
                    )
                ),
                new Paper(
                    "Segment Anything",
                    "Alexander Kirillov, Eric Mintun, Nikhila Ravi, Hanzi Mao, Chloe Rolland, et al.",
                    2023,
                    "We present the Segment Anything (SA) project: a new task, model, and dataset for image segmentation. Using our efficient model in a data collection loop, we built the largest segmentation dataset to date (by far), with over 1 billion masks on 11M licensed and privacy-respecting images. The model is promptable and transfers zero-shot to diverse segmentation tasks.",
                    "10.48550/arXiv.2304.02643",
                    "Machine Learning",
                    "ml",
                    "ICCV",
                    "Promptable visual foundation models",
                    5100,
                    "5.1k citations",
                    true,
                    "https://arxiv.org/abs/2304.02643",
                    "20 min read",
                    "@inproceedings{kirillov2023segment,\n  title={Segment anything},\n  author={Kirillov, Alexander and Mintun, Eric and Ravi, Nikhila and Mao, Hanzi and others},\n  booktitle={Proceedings of the IEEE/CVF International Conference on Computer Vision (ICCV)},\n  pages={4015--4026},\n  year={2023}\n}",
                    Arrays.asList(
                        "Introduced promptable segmentation responding to points, bounding boxes, text, or freeform masks.",
                        "Released SA-1B dataset containing 1.1 billion high-quality segmentation masks.",
                        "Near real-time inference (50ms per prompt in browser via ONNX Runtime)."
                    )
                ),
                new Paper(
                    "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
                    "Jacob Devlin, Ming-Wei Chang, Kenton Lee, Kristina Toutanova",
                    2019,
                    "We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers. As a result, the pre-trained BERT model can be fine-tuned with just one additional output layer.",
                    "10.48550/arXiv.1810.04805",
                    "Natural Language Processing",
                    "ai",
                    "NAACL",
                    "Masked language modeling & bidirectional encoders",
                    84000,
                    "84k citations",
                    true,
                    "https://arxiv.org/abs/1810.04805",
                    "16 min read",
                    "@inproceedings{devlin2019bert,\n  title={BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding},\n  author={Devlin, Jacob and Chang, Ming-Wei and Lee, Kenton and Toutanova, Kristina},\n  booktitle={Proceedings of NAACL-HLT},\n  pages={4171--4186},\n  year={2019}\n}",
                    Arrays.asList(
                        "Introduced Masked Language Modeling (MLM) and Next Sentence Prediction (NSP) pretraining objectives.",
                        "Demonstrated bidirectional contextual representation across 11 NLP tasks simultaneously.",
                        "Fundamentally transformed Google Search semantic indexing and information retrieval."
                    )
                ),
                new Paper(
                    "Toolformer: Language Models Can Teach Themselves to Use Tools",
                    "Timo Schick, Jane Dwivedi-Yu, Roberto Dess\u00ec, Roberta Raileanu, Maria Lomeli, et al.",
                    2023,
                    "Language models exhibit remarkable abilities to solve new tasks from only a few examples, but they struggle with basic tasks such as arithmetic or factual lookup. In this paper, we show that LMs can teach themselves to use external tools via simple APIs in a self-supervised way. Toolformer learns to call calculators, Q&A systems, search engines, translation tools, and calendars.",
                    "10.48550/arXiv.2302.04761",
                    "Natural Language Processing",
                    "ai",
                    "NeurIPS",
                    "Autonomous tool calling & API grounding",
                    1450,
                    "1.4k citations",
                    true,
                    "https://arxiv.org/abs/2302.04761",
                    "17 min read",
                    "@inproceedings{schick2023toolformer,\n  title={Toolformer: Language models can teach themselves to use tools},\n  author={Schick, Timo and Dwivedi-Yu, Jane and Dess{\\`\\i}, Roberto and others},\n  booktitle={Advances in Neural Information Processing Systems (NeurIPS)},\n  volume={36},\n  year={2023}\n}",
                    Arrays.asList(
                        "Self-supervised dataset generation inserting API calls where they reduce future token perplexity.",
                        "Grounds model outputs with live calculators, search engines, and currency conversion APIs.",
                        "Demonstrates that 6.7B parameter models can outperform much larger models by using external tools."
                    )
                ),
                new Paper(
                    "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness",
                    "Tri Dao, Daniel Y. Fu, Stefano Ermon, Atri Rudra, Christopher R\u00e9",
                    2022,
                    "Transformers are slow and memory-hungry on long sequences, as the time and memory complexity of self-attention are quadratic in sequence length. We propose FlashAttention, an IO-aware exact attention algorithm that uses tiling to reduce the number of memory reads/writes between GPU high bandwidth memory (HBM) and GPU on-chip SRAM.",
                    "10.48550/arXiv.2205.14135",
                    "Natural Language Processing",
                    "ai",
                    "NeurIPS",
                    "GPU SRAM memory hierarchy & fast attention",
                    3800,
                    "3.8k citations",
                    true,
                    "https://arxiv.org/abs/2205.14135",
                    "19 min read",
                    "@inproceedings{dao2022flashattention,\n  title={FlashAttention: Fast and memory-efficient exact attention with IO-awareness},\n  author={Dao, Tri and Fu, Daniel Y and Ermon, Stefano and Rudra, Atri and R{\\'e}, Christopher},\n  booktitle={Advances in Neural Information Processing Systems (NeurIPS)},\n  volume={35},\n  pages={16344--16359},\n  year={2022}\n}",
                    Arrays.asList(
                        "Leverages GPU SRAM tiling and online softmax calculation to eliminate O(N^2) memory bottlenecks.",
                        "Achieves 2-4x wall-clock speedup for training and enables context scaling to tens of thousands of tokens.",
                        "Standard execution kernel incorporated in PyTorch 2.0 scaled dot product attention."
                    )
                ),
                new Paper(
                    "Constitutional AI: Harmlessness from AI Feedback",
                    "Yuntao Bai, Saurav Kadavath, Sandipan Kundu, Amanda Askell, John Kernion, et al.",
                    2022,
                    "As AI models become more capable, aligning them using human feedback becomes increasingly bottlenecked by human labeling cost and consistency. We propose Constitutional AI (CAI), a method for training a harmless AI assistant through self-improvement without human feedback labels for harmlessness. The model critiques and revises its own responses using a written constitution.",
                    "10.48550/arXiv.2212.08073",
                    "Artificial Intelligence",
                    "ai",
                    "CoRR / Anthropic",
                    "RLAIF & principle-based alignment",
                    1750,
                    "1.7k citations",
                    true,
                    "https://arxiv.org/abs/2212.08073",
                    "24 min read",
                    "@article{bai2022constitutional,\n  title={Constitutional AI: Harmlessness from AI feedback},\n  author={Bai, Yuntao and Kadavath, Saurav and Kundu, Sandipan and Askell, Amanda and others},\n  journal={arXiv preprint arXiv:2212.08073},\n  year={2022}\n}",
                    Arrays.asList(
                        "Introduces Reinforcement Learning from AI Feedback (RLAIF) using explicit human-written principles.",
                        "Automates iterative critique and revision pipelines to eliminate toxic or dangerous completions.",
                        "Core safety alignment methodology behind the Claude foundation model family."
                    )
                ),
                new Paper(
                    "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale",
                    "Alexey Dosovitskiy, Lucas Beyer, Alexander Kolesnikov, Dirk Weissenborn, Xiaohua Zhai, et al.",
                    2021,
                    "While the Transformer architecture has become the de-facto standard for natural language processing tasks, its applications to computer vision remain limited. In vision, attention is either applied in conjunction with convolutional networks, or used to replace certain components. We show that this reliance on CNNs is not necessary and a pure transformer applied directly to sequences of image patches can perform very well.",
                    "10.48550/arXiv.2010.11929",
                    "Machine Learning",
                    "ml",
                    "ICLR",
                    "Vision Transformers (ViT) & patch tokenization",
                    34000,
                    "34k citations",
                    true,
                    "https://arxiv.org/abs/2010.11929",
                    "15 min read",
                    "@inproceedings{dosovitskiy2020image,\n  title={An image is worth 16x16 words: Transformers for image recognition at scale},\n  author={Dosovitskiy, Alexey and Beyer, Lucas and Kolesnikov, Alexander and others},\n  booktitle={International Conference on Learning Representations (ICLR)},\n  year={2021}\n}",
                    Arrays.asList(
                        "Splits 2D images into 16x16 flattened linear patch tokens processed like NLP word sequences.",
                        "Discards inductive bias of spatial translation invariance in favor of large-scale pretraining.",
                        "Matches or outperforms state-of-the-art ResNet baselines on ImageNet with 4x less training compute."
                    )
                ),
                new Paper(
                    "Learning Transferable Visual Models From Natural Language Supervision",
                    "Alec Radford, Jong Wook Kim, Chris Hallacy, Aditya Ramesh, Gabriel Goh, et al.",
                    2021,
                    "State-of-the-art computer vision systems are trained to predict a fixed set of predetermined object categories. This restricted form of supervision limits their generality. We demonstrate that the simple pre-training task of predicting which caption goes with which image is an efficient and scalable way to learn SOTA image representations from scratch on a dataset of 400M image-text pairs.",
                    "10.48550/arXiv.2103.00020",
                    "Machine Learning",
                    "ml",
                    "ICML",
                    "CLIP & multimodal contrastive representation",
                    21500,
                    "21.5k citations",
                    true,
                    "https://arxiv.org/abs/2103.00020",
                    "22 min read",
                    "@inproceedings{radford2021learning,\n  title={Learning transferable visual models from natural language supervision},\n  author={Radford, Alec and Kim, Jong Wook and Hallacy, Chris and others},\n  booktitle={International Conference on Machine Learning (ICML)},\n  pages={8748--8763},\n  year={2021}\n}",
                    Arrays.asList(
                        "Pioneered multimodal contrastive learning between text transformer and vision encoder embeddings.",
                        "Enables zero-shot classification across diverse vision tasks without task-specific fine-tuning.",
                        "Forms the vision-language backbone for DALL-E, Stable Diffusion, and GPT-4 Vision."
                    )
                ),
                new Paper(
                    "High-Resolution Image Synthesis with Latent Diffusion Models",
                    "Robin Rombach, Andreas Blattmann, Dominik Lorenz, Patrick Esser, Bj\u00f6rn Ommer",
                    2022,
                    "By decomposing the image formation process into a sequential application of denoising autoencoders, diffusion models achieve state-of-the-art synthesis results on image data. However, operating directly in pixel space demands immense compute. We introduce Latent Diffusion Models (LDMs), which apply diffusion processes in the latent space of powerful pretrained autoencoders.",
                    "10.1109/CVPR.2022.01042",
                    "Machine Learning",
                    "ml",
                    "CVPR",
                    "Latent diffusion & Stable Diffusion architecture",
                    14800,
                    "14.8k citations",
                    true,
                    "https://arxiv.org/abs/2112.10752",
                    "18 min read",
                    "@inproceedings{rombach2022high,\n  title={High-resolution image synthesis with latent diffusion models},\n  author={Rombach, Robin and Blattmann, Andreas and Lorenz, Dominik and Esser, Patrick and Ommer, Bj{\\\"o}rn},\n  booktitle={Proceedings of the IEEE/CVF conference on computer vision and pattern recognition (CVPR)},\n  pages={10684--10695},\n  year={2022}\n}",
                    Arrays.asList(
                        "Reduces computational complexity by operating in perceptual latent space rather than raw pixels.",
                        "Cross-attention conditioning allows flexible synthesis guided by text prompts, depth maps, or layouts.",
                        "Open-sourced as Stable Diffusion, sparking the open-weights generative imagery revolution."
                    )
                ),
                new Paper(
                    "NeRF: Representing Scenes as Neural Radiance Fields for View Synthesis",
                    "Ben Mildenhall, Pratul P. Srinivasan, Matthew Tancik, Jonathan T. Barron, Ravi Ramamoorthi, Ren Ng",
                    2020,
                    "We present a method that achieves state-of-the-art results for synthesizing novel views of complex scenes by optimizing an underlying continuous volumetric scene function using a sparse set of input views. Our approach represents a scene using a fully-connected deep network, whose input is a single continuous 5D coordinate (spatial location (x,y,z) and viewing direction) and whose output is volume density and emitted radiance.",
                    "10.1007/978-3-030-58452-8_24",
                    "Machine Learning",
                    "ml",
                    "ECCV",
                    "Neural radiance fields & 3D view synthesis",
                    11200,
                    "11.2k citations",
                    true,
                    "https://arxiv.org/abs/2003.08934",
                    "17 min read",
                    "@inproceedings{mildenhall2020nerf,\n  title={NeRF: Representing scenes as neural radiance fields for view synthesis},\n  author={Mildenhall, Ben and Srinivasan, Pratul P and Tancik, Matthew and Barron, Jonathan T and others},\n  booktitle={European Conference on Computer Vision (ECCV)},\n  pages={405--421},\n  year={2020}\n}",
                    Arrays.asList(
                        "Continuous 5D neural scene representation optimized via classical volume rendering equations.",
                        "Positional encoding maps spatial coordinates to higher frequency domains, capturing fine details.",
                        "Sparked entire 3D generative AI field leading to 3D Gaussian Splatting and spatial computing."
                    )
                ),
                new Paper(
                    "Accurate structure prediction of biomolecular interactions with AlphaFold 3",
                    "Josh Abramson, Jonas Adler, Jack Dunger, Richard Evans, Tim Green, et al.",
                    2024,
                    "The structure and interactions of molecules are fundamental to understanding biological mechanisms and drug discovery. Here we present AlphaFold 3, with a substantially updated diffusion-based architecture capable of predicting the joint structure of complexes that include proteins, nucleic acids (DNA and RNA), small molecules, ions, and chemical modifications with unprecedented accuracy.",
                    "10.1038/s41586-024-07487-w",
                    "Biotechnology & Medicine",
                    "bio",
                    "Nature",
                    "Diffusion-based biomolecular complex prediction",
                    1950,
                    "1.9k citations",
                    true,
                    "https://www.nature.com/articles/s41586-024-07487-w",
                    "23 min read",
                    "@article{abramson2024accurate,\n  title={Accurate structure prediction of biomolecular interactions with AlphaFold 3},\n  author={Abramson, Josh and Adler, Jonas and Dunger, Jack and Evans, Richard and others},\n  journal={Nature},\n  volume={630},\n  pages={493--500},\n  year={2024}\n}",
                    Arrays.asList(
                        "Replaces Evoformer module with a streamlined Pairformer and 3D diffusion coordinate module.",
                        "Unifies prediction across proteins, DNA, RNA, ligands, and antibody-antigen complexes.",
                        "50% improvement in protein-ligand binding pose prediction compared to classical docking tools."
                    )
                ),
                new Paper(
                    "A programmable dual-RNA-guided DNA endonuclease in adaptive bacterial immunity",
                    "Martin Jinek, Krzysztof Chylinski, Ines Fonfara, Michael Hauer, Jennifer A. Doudna, Emmanuelle Charpentier",
                    2012,
                    "Clustered regularly interspaced short palindromic repeats (CRISPR) and CRISPR-associated (Cas) systems provide bacteria and archaea with adaptive immunity. We show that the Cas9 endonuclease from Streptococcus pyogenes can be programmed with single guide RNAs to introduce site-specific double-stranded breaks in target DNA sequences, creating a revolutionary tool for genome engineering.",
                    "10.1126/science.1225829",
                    "Biotechnology & Medicine",
                    "bio",
                    "Science",
                    "CRISPR-Cas9 genome editing & single guide RNA",
                    18200,
                    "18.2k citations",
                    true,
                    "https://www.science.org/doi/10.1126/science.1225829",
                    "16 min read",
                    "@article{jinek2012programmable,\n  title={A programmable dual-RNA-guided DNA endonuclease in adaptive bacterial immunity},\n  author={Jinek, Martin and Chylinski, Krzysztof and Fonfara, Ines and Hauer, Michael and Doudna, Jennifer A and Charpentier, Emmanuelle},\n  journal={Science},\n  volume={337},\n  number={6096},\n  pages={816--821},\n  year={2012}\n}",
                    Arrays.asList(
                        "Engineered chimeric single-guide RNA (sgRNA) directing Cas9 endonuclease to specific target DNA loci.",
                        "Demonstrated precise double-stranded cleavage triggering cellular repair pathways.",
                        "Awarded the 2020 Nobel Prize in Chemistry for establishing universal modern gene editing."
                    )
                ),
                new Paper(
                    "Evolutionary-scale prediction of atomic-level protein structure with a language model",
                    "Zeming Lin, Halil Akin, Roshan Rao, Brian Hie, Zhongkai Zhu, Wenting Lu, et al.",
                    2023,
                    "Large language models trained on evolutionary protein sequences learn representations that contain structural and biophysical information. We present ESMFold, an end-to-end atomic-level protein structure prediction model operating directly from single sequences using ESM-2 (up to 15B parameters), achieving accuracy comparable to AlphaFold while predicting structures up to 60x faster.",
                    "10.1126/science.ade2574",
                    "Biotechnology & Medicine",
                    "bio",
                    "Science",
                    "ESMFold & protein language models",
                    3100,
                    "3.1k citations",
                    true,
                    "https://www.science.org/doi/10.1126/science.ade2574",
                    "18 min read",
                    "@article{lin2023evolutionary,\n  title={Evolutionary-scale prediction of atomic-level protein structure with a language model},\n  author={Lin, Zeming and Akin, Halil and Rao, Roshan and Hie, Brian and Zhu, Zhongkai and others},\n  journal={Science},\n  volume={379},\n  number={6637},\n  pages={1123--1130},\n  year={2023}\n}",
                    Arrays.asList(
                        "Bypasses computationally expensive Multiple Sequence Alignment (MSA) search algorithms.",
                        "Enabled folding the entire ESM Metagenomic Atlas of 617 million environmental proteins.",
                        "Inference up to 60x faster than AlphaFold, enabling high-throughput synthetic protein design."
                    )
                ),
                new Paper(
                    "ClimaX: A foundation model for weather and climate",
                    "Tung Nguyen, Johannes Brandstetter, Ashwinee Kumar, Jayesh K. Gupta, Aditya Grover",
                    2023,
                    "We present ClimaX, a flexible foundation model for weather and climate science. Unlike specialized numerical forecasting models, ClimaX uses tokenized spatial attention and a novel variable-tokenization aggregation layer that allows pretraining on diverse climate datasets with arbitrary spatial resolutions and variable configurations.",
                    "10.48550/arXiv.2301.10343",
                    "Climate Science",
                    "climate",
                    "ICML",
                    "Foundation models for atmospheric climate",
                    420,
                    "420+ citations",
                    true,
                    "https://arxiv.org/abs/2301.10343",
                    "19 min read",
                    "@inproceedings{nguyen2023climax,\n  title={ClimaX: A foundation model for weather and climate},\n  author={Nguyen, Tung and Brandstetter, Johannes and Kumar, Ashwinee and Gupta, Jayesh K and Grover, Aditya},\n  booktitle={International Conference on Machine Learning (ICML)},\n  year={2023}\n}",
                    Arrays.asList(
                        "Introduced variable tokenization enabling single model inference across differing physical input modalities.",
                        "Pretrained on CMIP6 historical climate simulations and ERA5 reanalysis data.",
                        "Excels across downstream tasks: weather forecasting, extreme event projection, and regional downscaling."
                    )
                ),
                new Paper(
                    "Suppressing quantum errors by scaling a quantum error-correcting code",
                    "Google Quantum AI (Rajeev Acharya, Igor Aleiner, Richard Allen, Trond I. Andersen, et al.)",
                    2023,
                    "Practical quantum computing requires quantum error correction to protect fragile quantum information from environmental noise. Here we demonstrate a surface code memory on superconducting transmons where scaling from distance 3 (17 qubits) to distance 5 (49 qubits) suppressed logical error rates by more than a factor of two, meeting a foundational criterion for fault-tolerant quantum computing.",
                    "10.1038/s41586-022-05434-1",
                    "Quantum Computing",
                    "quantum",
                    "Nature",
                    "Physical surface code scaling & error suppression",
                    1600,
                    "1.6k citations",
                    true,
                    "https://www.nature.com/articles/s41586-022-05434-1",
                    "21 min read",
                    "@article{acharya2023suppressing,\n  title={Suppressing quantum errors by scaling a quantum error-correcting code},\n  author={Acharya, Rajeev and Aleiner, Igor and Allen, Richard and Andersen, Trond I and others},\n  journal={Nature},\n  volume={614},\n  number={7949},\n  pages={676--681},\n  year={2023}\n}",
                    Arrays.asList(
                        "First experimental demonstration that larger quantum error-correcting codes reduce logical errors.",
                        "Surface code distance-5 achieved lower logical error rates than distance-3 on 72-qubit Sycamore chip.",
                        "Crucial milestone proving physical viability of threshold-exceeding fault-tolerant quantum computers."
                    )
                ),
                new Paper(
                    "Quantum advantage in learning from experiments",
                    "Hsin-Yuan Huang, Michael Broughton, Jordan Cotler, Sitan Chen, Jerry Li, et al.",
                    2022,
                    "Quantum technology holds the promise to improve machine learning over classical approaches. In this work, we show that quantum computers can perform exponentially fewer measurements to learn properties of physical systems compared to any classical learner. We demonstrate this quantum advantage experimentally on the Sycamore quantum processor.",
                    "10.1126/science.abn7293",
                    "Quantum Computing",
                    "quantum",
                    "Science",
                    "Quantum machine learning & quantum state learning",
                    780,
                    "780+ citations",
                    true,
                    "https://www.science.org/doi/10.1126/science.abn7293",
                    "17 min read",
                    "@article{huang2022quantum,\n  title={Quantum advantage in learning from experiments},\n  author={Huang, Hsin-Yuan and Broughton, Michael and Cotler, Jordan and others},\n  journal={Science},\n  volume={376},\n  number={6598},\n  pages={1182--1186},\n  year={2022}\n}",
                    Arrays.asList(
                        "Proves exponential sample complexity advantage when quantum memory interfaces directly with experiments.",
                        "Experimentally verified quantum state classification on up to 40 qubits.",
                        "Bridges quantum sensory processing with advanced quantum machine learning algorithms."
                    )
                ),
                new Paper(
                    "A high-resolution brain-computer interface decodes speech from cortical activity",
                    "David A. Moses, Sean L. Metzger, Jessie R. Liu, Gopala K. Anumanchipalli, Edward F. Chang",
                    2021,
                    "Severe paralysis can lead to loss of the ability to speak. We developed a brain-computer interface (BCI) system that decodes full words and complete sentences directly from the cortical speech motor areas of an individual with anarthria. Using high-density subdural electrocorticography (ECoG) arrays and deep recurrent neural decoders, the system decoded natural conversational speech.",
                    "10.1056/NEJMoa2027540",
                    "Neuroscience",
                    "neuro",
                    "New England Journal of Medicine",
                    "ECoG brain-computer interface & speech neuroprosthesis",
                    1120,
                    "1.1k citations",
                    true,
                    "https://www.nejm.org/doi/full/10.1056/NEJMoa2027540",
                    "19 min read",
                    "@article{moses2021neuroprosthesis,\n  title={Neuroprosthesis for decoding speech in a person with paralysis},\n  author={Moses, David A and Metzger, Sean L and Liu, Jessie R and Anumanchipalli, Gopala K and Chang, Edward F},\n  journal={New England Journal of Medicine},\n  volume={385},\n  number={3},\n  pages={217--227},\n  year={2021}\n}",
                    Arrays.asList(
                        "Decoded vocabulary of words directly from cortical sensorimotor representations in real time.",
                        "Language model beam search decoding achieved median word error rates below 25%.",
                        "Milestone clinical proof-of-concept for direct neural communication prosthetics."
                    )
                ),
                new Paper(
                    "Whole-brain connectome of Drosophila melanogaster at synaptic resolution",
                    "FlyWire Consortium (Sven Dorkenwald, Arie Matsliah, Amy R. Sterling, Philipp Schlegel, et al.)",
                    2024,
                    "Mapping the complete connectivity of neural circuits is fundamental to deciphering how brains compute behavior. Here we present FlyWire, the complete synaptic connectome of an adult Drosophila melanogaster brain. The reconstruction comprises 139,255 neurons and 54.5 million chemical synapses, providing a comprehensive anatomical blueprint for neural dynamics.",
                    "10.1038/s41586-024-07558-9",
                    "Neuroscience",
                    "neuro",
                    "Nature",
                    "Synaptic connectomics & electron microscopy reconstruction",
                    380,
                    "380+ citations",
                    true,
                    "https://www.nature.com/articles/s41586-024-07558-9",
                    "22 min read",
                    "@article{dorkenwald2024neuronal,\n  title={Neuronal wiring diagram of an adult brain},\n  author={Dorkenwald, Sven and Matsliah, Arie and Sterling, Amy R and Schlegel, Philipp and others},\n  journal={Nature},\n  volume={634},\n  pages={124--138},\n  year={2024}\n}",
                    Arrays.asList(
                        "First complete adult insect connectome: 139,255 neurons and 54.5 million verified synaptic connections.",
                        "Utilized AI computer vision segmentation refined by global crowdsourced proofreading.",
                        "Enables whole-brain in silico circuit simulations linking sensory perception to motor actions."
                    )
                )
            );

            paperRepository.saveAll(papers);
            System.out.println("✅ Seeded " + papers.size() + " landmark research papers into MySQL database.");
        }
    }
}
