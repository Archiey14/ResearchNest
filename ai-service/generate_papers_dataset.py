import json

papers = [
    {
        "title": "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
        "authors": "Patrick Lewis, Ethan Perez, Aleksandra Piktus, Fabio Petroni, Vladimir Karpukhin, et al.",
        "year": 2020,
        "abstract": "Large pre-trained language models have been shown to store factual knowledge in their parameters, and achieve state-of-the-art results when fine-tuned on downstream NLP tasks. However, their ability to access and precisely manipulate knowledge is still limited. We propose Retrieval-Augmented Generation (RAG)—a general-purpose fine-tuning method that combines pre-trained parametric memory with non-parametric retrieval from dense vector indexes.",
        "doi": "10.48550/arXiv.2005.11401",
        "field": "Natural Language Processing",
        "fieldId": "ai",
        "venue": "NeurIPS",
        "topicTag": "Dense retrieval for open-domain NLP",
        "citations": 3200,
        "citationLabel": "3.2k citations",
        "openAccess": True,
        "pdfUrl": "https://arxiv.org/abs/2005.11401",
        "readingTime": "14 min read",
        "bibtex": "@inproceedings{lewis2020rag,\n  title={Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks},\n  author={Lewis, Patrick and Perez, Ethan and Piktus, Aleksandra and Petroni, Fabio and Karpukhin, Vladimir and others},\n  booktitle={Advances in Neural Information Processing Systems (NeurIPS)},\n  volume={33},\n  pages={9459--9474},\n  year={2020}\n}",
        "takeaways": [
            "Combines parametric language model weights with dense vector retrieval from Wikipedia/external corpora.",
            "Reduces hallucinations and provides verifiable provenance for factual assertions.",
            "Sets new state-of-the-art performance on open-domain question answering benchmarks (NQ, TriviaQA)."
        ]
    },
    {
        "title": "Mamba: Linear-Time Sequence Modeling with Selective State Spaces",
        "authors": "Albert Gu, Tri Dao",
        "year": 2024,
        "abstract": "Fundamental sequence models largely rely on the Transformer architecture, which incurs quadratic computational complexity with respect to context length. We introduce Mamba, a selective state space model that incorporates a hardware-aware parallel scan and input-dependent parameterization, allowing it to scale linearly with sequence length while achieving superior throughput and language reasoning.",
        "doi": "10.48550/arXiv.2312.00752",
        "field": "Machine Learning",
        "fieldId": "ml",
        "venue": "CoRR / arXiv",
        "topicTag": "State space models in foundation models",
        "citations": 1100,
        "citationLabel": "1.1k citations",
        "openAccess": True,
        "pdfUrl": "https://arxiv.org/abs/2312.00752",
        "readingTime": "18 min read",
        "bibtex": "@article{gu2023mamba,\n  title={Mamba: Linear-time sequence modeling with selective state spaces},\n  author={Gu, Albert and Dao, Tri},\n  journal={arXiv preprint arXiv:2312.00752},\n  year={2023}\n}",
        "takeaways": [
            "Introduces selective state space models (SSMs) with dynamic, input-dependent transitions.",
            "Linear time complexity O(N) in sequence length, enabling 5x higher inference throughput.",
            "Matches or outperforms Transformer architectures across language, audio, and genomics domains."
        ]
    },
    {
        "title": "Learning skillful medium-range global weather forecasting",
        "authors": "Remi Lam, Alvaro Sanchez-Gonzalez, Matthew Willson, Peter Wirnsberger, Meire Fortunato, et al.",
        "year": 2023,
        "abstract": "Global weather prediction is traditionally based on numerical weather prediction (NWP) using physical atmospheric models on supercomputers. We introduce GraphCast, a machine learning weather forecasting system based on graph neural networks trained on 40 years of ECMWF reanalysis data. GraphCast produces 10-day forecasts of hundreds of weather variables in under 60 seconds at 0.25° resolution, outperforming operational systems.",
        "doi": "10.1126/science.adi2336",
        "field": "Climate Science",
        "fieldId": "climate",
        "venue": "Science",
        "topicTag": "Graph neural networks for weather",
        "citations": 750,
        "citationLabel": "750+ citations",
        "openAccess": True,
        "pdfUrl": "https://www.science.org/doi/10.1126/science.adi2336",
        "readingTime": "16 min read",
        "bibtex": "@article{lam2023learning,\n  title={Learning skillful medium-range global weather forecasting},\n  author={Lam, Remi and Sanchez-Gonzalez, Alvaro and Willson, Matthew and others},\n  journal={Science},\n  volume={382},\n  number={6677},\n  pages={1416--1421},\n  year={2023},\n  publisher={American Association for the Advancement of Science}\n}",
        "takeaways": [
            "Trained on 39 years of historical atmospheric data across 37 vertical pressure levels.",
            "Outperforms the world's leading numerical forecast system (HRES ECMWF) on 90% of verification targets.",
            "Generates a 10-day global prediction in under 60 seconds on a single Google TPU v4."
        ]
    },
    {
        "title": "Llama 2: Open Foundation and Fine-Tuned Chat Models",
        "authors": "Hugo Touvron, Louis Martin, Kevin Stone, Peter Albert, Amjad Almahairi, et al.",
        "year": 2023,
        "abstract": "In this work, we develop and release Llama 2, a collection of pretrained and fine-tuned large language models (LLMs) ranging in scale from 7 billion to 70 billion parameters. Our fine-tuned LLMs, called Llama 2-Chat, are optimized for dialogue use cases. Outperforming open-source chat models on most benchmarks, Llama 2 uses reinforcement learning from human feedback (RLHF) and ghost attention.",
        "doi": "10.48550/arXiv.2307.09288",
        "field": "Artificial Intelligence",
        "fieldId": "ai",
        "venue": "CoRR / arXiv",
        "topicTag": "Open foundation LLMs & RLHF safety",
        "citations": 14200,
        "citationLabel": "14.2k citations",
        "openAccess": True,
        "pdfUrl": "https://arxiv.org/abs/2307.09288",
        "readingTime": "22 min read",
        "bibtex": "@article{touvron2023llama,\n  title={Llama 2: Open foundation and fine-tuned chat models},\n  author={Touvron, Hugo and Martin, Louis and Stone, Kevin and Albert, Peter and Almahairi, Amjad and others},\n  journal={arXiv preprint arXiv:2307.09288},\n  year={2023}\n}",
        "takeaways": [
            "Trained on 2 trillion tokens with double the context length (4096 tokens) of Llama 1.",
            "Implements iterative RLHF with rejection sampling and proximal policy optimization (PPO).",
            "Extensive safety mitigations including red teaming and constitutional safety alignment."
        ]
    },
    {
        "title": "Highly accurate protein structure prediction with AlphaFold",
        "authors": "John Jumper, Richard Evans, Alexander Pritzel, Tim Green, Michael Figurnov, et al.",
        "year": 2021,
        "abstract": "Proteins are essential to life, and understanding their structure can facilitate a mechanistic understanding of their function. We introduce AlphaFold, a computational method that can regularly predict protein 3D structures with atomic accuracy even when no similar structure is known. AlphaFold incorporates novel neural network architectures based on evolutionary, physical, and geometric constraints.",
        "doi": "10.1038/s41586-021-03819-2",
        "field": "Biotechnology & Medicine",
        "fieldId": "bio",
        "venue": "Nature",
        "topicTag": "3D protein structure prediction & Evoformer",
        "citations": 22000,
        "citationLabel": "22k citations",
        "openAccess": True,
        "pdfUrl": "https://www.nature.com/articles/s41586-021-03819-2",
        "readingTime": "25 min read",
        "bibtex": "@article{jumper2021highly,\n  title={Highly accurate protein structure prediction with AlphaFold},\n  author={Jumper, John and Evans, Richard and Pritzel, Alexander and Green, Tim and Figurnov, Michael and others},\n  journal={Nature},\n  volume={596},\n  number={7873},\n  pages={583--589},\n  year={2021},\n  publisher={Nature Publishing Group}\n}",
        "takeaways": [
            "Novel Evoformer neural blocks jointly process multiple sequence alignments (MSAs) and pair representations.",
            "End-to-end differentiable structure module predicts 3D coordinates using invariant point attention (IPA).",
            "Achieved competitive accuracy with X-ray crystallography across CASP14 target proteins."
        ]
    },
    {
        "title": "Quantum computational supremacy using a programmable superconducting processor",
        "authors": "Frank Arute, Kunal Arya, Ryan Babbush, Dave Bacon, Joseph C. Bardin, et al.",
        "year": 2019,
        "abstract": "The promise of quantum computers is that certain computational tasks might be executed exponentially faster on a quantum processor than on a classical processor. We report quantum supremacy using a programmable superconducting processor with 53 qubits (named Sycamore). Our processor takes approximately 200 seconds to sample one instance of a quantum circuit a million times, benchmarked against supercomputers.",
        "doi": "10.1038/s41586-019-1666-5",
        "field": "Quantum Computing",
        "fieldId": "quantum",
        "venue": "Nature",
        "topicTag": "Quantum computational supremacy & superconducting circuits",
        "citations": 5400,
        "citationLabel": "5.4k citations",
        "openAccess": True,
        "pdfUrl": "https://www.nature.com/articles/s41586-019-1666-5",
        "readingTime": "19 min read",
        "bibtex": "@article{arute2019quantum,\n  title={Quantum supremacy using a programmable superconducting processor},\n  author={Arute, Frank and Arya, Kunal and Babbush, Ryan and Bacon, Dave and Bardin, Joseph C and others},\n  journal={Nature},\n  volume={574},\n  number={7779},\n  pages={505--510},\n  year={2019},\n  publisher={Nature Publishing Group}\n}",
        "takeaways": [
            "Demonstrated random circuit sampling on 53 superconducting qubits with two-qubit gate fidelities over 99.4%.",
            "Executed in 200 seconds a task calculated to take Summit supercomputer ~10,000 years classically.",
            "Milestone verification of the Church-Turing thesis limits in macroscopic physical quantum systems."
        ]
    },
    {
        "title": "Cortical Mapping of Semantic Representations Across the Human Brain",
        "authors": "Alexander G. Huth, Wendy A. de Heer, Thomas L. Griffiths, Frédéric E. Theunissen, Jack L. Gallant",
        "year": 2016,
        "abstract": "The meaning of language is represented in cerebral cortex, but the organizational principles of these semantic representations have been difficult to map. Using functional MRI and voxel-wise encoding models, we construct an extensive semantic atlas describing how distinct conceptual domains tile the entire human neocortex across multiple subjects.",
        "doi": "10.1038/nature17637",
        "field": "Neuroscience",
        "fieldId": "neuro",
        "venue": "Nature",
        "topicTag": "Human semantic representation & fMRI encoding",
        "citations": 1850,
        "citationLabel": "1.8k citations",
        "openAccess": True,
        "pdfUrl": "https://www.nature.com/articles/nature17637",
        "readingTime": "20 min read",
        "bibtex": "@article{huth2016cortical,\n  title={Natural speech reveals the semantic maps that tile human cerebral cortex},\n  author={Huth, Alexander G and de Heer, Wendy A and Griffiths, Thomas L and Theunissen, Fr{'e}d{'e}ric E and Gallant, Jack L},\n  journal={Nature},\n  volume={532},\n  number={7600},\n  pages={453--458},\n  year={2016},\n  publisher={Nature Publishing Group}\n}",
        "takeaways": [
            "Constructed continuous semantic topographic maps across human sensory and association cortices.",
            "Reveals distributed, bilateral semantic networks rather than modular localized hubs.",
            "Established foundational techniques for modern brain-to-text neural decoders."
        ]
    },
    {
        "title": "Attention Is All You Need",
        "authors": "Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, et al.",
        "year": 2017,
        "abstract": "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Experiments on two machine translation tasks show these models to be superior in quality while being parallelizable.",
        "doi": "10.48550/arXiv.1706.03762",
        "field": "Artificial Intelligence",
        "fieldId": "ai",
        "venue": "NeurIPS",
        "topicTag": "Self-attention & Transformer architecture",
        "citations": 98000,
        "citationLabel": "98k citations",
        "openAccess": True,
        "pdfUrl": "https://arxiv.org/abs/1706.03762",
        "readingTime": "15 min read",
        "bibtex": "@inproceedings{vaswani2017attention,\n  title={Attention is all you need},\n  author={Vaswani, Ashish and Shazeer, Noam and Parmar, Niki and Uszkoreit, Jakob and Jones, Llion and Gomez, Aidan N and Kaiser, {\\L}ukasz and Polosukhin, Illia},\n  booktitle={Advances in Neural Information Processing Systems (NeurIPS)},\n  volume={30},\n  pages={5998--6008},\n  year={2017}\n}",
        "takeaways": [
            "Eliminated sequential recurrence in favor of parallel multi-head self-attention mechanisms.",
            "Positional encodings preserve temporal and sequence token ordering without recurrence.",
            "Became the foundational architecture for modern LLMs including GPT-4, Gemini, Claude, and Llama."
        ]
    },
    {
        "title": "Deep Residual Learning for Image Recognition",
        "authors": "Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun",
        "year": 2016,
        "abstract": "Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those used previously. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions. Comprehensive empirical evidence shows that these residual networks are easier to optimize.",
        "doi": "10.1109/CVPR.2016.90",
        "field": "Machine Learning",
        "fieldId": "ml",
        "venue": "CVPR",
        "topicTag": "Residual skip connections & deep CNNs",
        "citations": 170000,
        "citationLabel": "170k citations",
        "openAccess": True,
        "pdfUrl": "https://arxiv.org/abs/1512.03385",
        "readingTime": "13 min read",
        "bibtex": "@inproceedings{he2016deep,\n  title={Deep residual learning for image recognition},\n  author={He, Kaiming and Zhang, Xiangyu and Ren, Shaoqing and Sun, Jian},\n  booktitle={Proceedings of the IEEE conference on computer vision and pattern recognition (CVPR)},\n  pages={770--778},\n  year={2016}\n}",
        "takeaways": [
            "Introduced identity skip connections (y = F(x) + x) solving vanishing/exploding gradient problems.",
            "Trained 152-layer deep ResNets, winning 1st place in ImageNet and COCO competitions.",
            "Residual connections became standard architectural primitives in all modern deep networks."
        ]
    },
    {
        "title": "Neural Synaptic Plasticity and Long-Term Memory Consolidation",
        "authors": "Sheena A. Josselyn, Susumu Tonegawa",
        "year": 2020,
        "abstract": "How memories are physically encoded in the brain has captivated neuroscientists for over a century. Here we review experimental evidence for memory engrams—ensembles of neurons that undergo lasting synaptic alterations following experience. Optogenetic activation and single-cell sequencing reveal how engrams are consolidated from hippocampus to neocortex.",
        "doi": "10.1126/science.aaw4325",
        "field": "Neuroscience",
        "fieldId": "neuro",
        "venue": "Science",
        "topicTag": "Memory engrams & synaptic consolidation",
        "citations": 920,
        "citationLabel": "920+ citations",
        "openAccess": True,
        "pdfUrl": "https://www.science.org/doi/10.1126/science.aaw4325",
        "readingTime": "17 min read",
        "bibtex": "@article{josselyn2020memory,\n  title={Memory engrams: Recalling the past and imagining the future},\n  author={Josselyn, Sheena A and Tonegawa, Susumu},\n  journal={Science},\n  volume={367},\n  number={6473},\n  pages={eaaw4325},\n  year={2020},\n  publisher={American Association for the Advancement of Science}\n}",
        "takeaways": [
            "Demonstrates optogenetic tagging and artificial recall of specific memory engram populations.",
            "Highlights structural dendritic spine remodeling during systems consolidation.",
            "Bridges cellular synaptic mechanisms with cognitive behavioral recall."
        ]
    },
    {
        "title": "Earth system predictability in the presence of climate change tipping points",
        "authors": "Timothy M. Lenton, Johan Rockström, Owen Gaffney, Stefan Rahmstorf, Katherine Richardson, et al.",
        "year": 2019,
        "abstract": "Politicians and researchers frequently assume that catastrophic climate impacts are decades away. We synthesize observational evidence across the cryosphere, biosphere, and ocean currents indicating that nine key tipping points (including the West Antarctic Ice Sheet and Amazon rainforest) may be active and mutually reinforcing.",
        "doi": "10.1038/d41586-019-03595-0",
        "field": "Climate Science",
        "fieldId": "climate",
        "venue": "Nature",
        "topicTag": "Planetary climate tipping points & risk analysis",
        "citations": 2850,
        "citationLabel": "2.8k citations",
        "openAccess": True,
        "pdfUrl": "https://www.nature.com/articles/d41586-019-03595-0",
        "readingTime": "14 min read",
        "bibtex": "@article{lenton2019climate,\n  title={Climate tipping points—too risky to bet against},\n  author={Lenton, Timothy M and Rockstr{\"o}m, Johan and Gaffney, Owen and others},\n  journal={Nature},\n  volume={575},\n  number={7784},\n  pages={592--595},\n  year={2019},\n  publisher={Nature Publishing Group}\n}",
        "takeaways": [
            "Identifies 9 interdependent planetary tipping cascades.",
            "Demonstrates nonlinear risk multipliers in ocean-atmospheric circulation models.",
            "Calls for high-resolution AI tracking of early warning signals in earth system data."
        ]
    },
    {
        "title": "Fault-Tolerant Quantum Computation with Surface Codes",
        "authors": "Austin G. Fowler, Matteo Mariantoni, John M. Martinis, Andrew N. Cleland",
        "year": 2012,
        "abstract": "A realistic roadmap towards practical quantum computing requires rigorous error correction. The surface code is the most promising quantum error-correcting architecture due to its high fault-tolerance threshold of ~1% per gate and strictly 2D nearest-neighbor coupling requirements on physical qubits.",
        "doi": "10.1103/PhysRevA.86.032324",
        "field": "Quantum Computing",
        "fieldId": "quantum",
        "venue": "Physical Review A",
        "topicTag": "Surface code quantum error correction",
        "citations": 3400,
        "citationLabel": "3.4k citations",
        "openAccess": True,
        "pdfUrl": "https://journals.aps.org/pra/abstract/10.1103/PhysRevA.86.032324",
        "readingTime": "24 min read",
        "bibtex": "@article{fowler2012surface,\n  title={Surface codes: Towards practical large-scale quantum computation},\n  author={Fowler, Austin G and Mariantoni, Matteo and Martinis, John M and Cleland, Andrew N},\n  journal={Physical Review A},\n  volume={86},\n  number={3},\n  pages={032324},\n  year={2012},\n  publisher={APS}\n}",
        "takeaways": [
            "Established the 2D surface code as the leading practical topology for hardware implementation.",
            "Calculated error correction budgets for factoring 2048-bit RSA numbers with topological braid logic.",
            "Demonstrated syndrome extraction protocols compatible with superconducting transmons."
        ]
    },
    {
        "title": "The Llama 3 Herd of Models",
        "authors": "Abhimanyu Dubey, Jiahui Yu, Eric Michael Smith, Rohan Anil, Yasmine Babaei, et al.",
        "year": 2024,
        "abstract": "We introduce Llama 3, a native multimodality foundation model collection spanning up to 405B parameters. Trained on 15 trillion multilingual tokens with synthetic data refinement, direct preference optimization (DPO), and grouped-query attention, Llama 3 matches proprietary frontiers across reasoning, math, and code synthesis.",
        "doi": "10.48550/arXiv.2407.21783",
        "field": "Artificial Intelligence",
        "fieldId": "ai",
        "venue": "CoRR / arXiv",
        "topicTag": "405B dense foundation models & synthetic data",
        "citations": 2800,
        "citationLabel": "2.8k citations",
        "openAccess": True,
        "pdfUrl": "https://arxiv.org/abs/2407.21783",
        "readingTime": "28 min read",
        "bibtex": "@article{dubey2024llama3,\n  title={The Llama 3 Herd of Models},\n  author={Dubey, Abhimanyu and Yu, Jiahui and Smith, Eric Michael and Anil, Rohan and others},\n  journal={arXiv preprint arXiv:2407.21783},\n  year={2024}\n}",
        "takeaways": [
            "Demonstrates 405B dense parameter scaling with 16k context window and grouped query attention.",
            "Employs extensive synthetic data filtering and multi-round iterative Direct Preference Optimization.",
            "Demonstrates competitive reasoning against closed-source commercial frontier systems."
        ]
    },
    {
        "title": "Mastering the Game of Go with Deep Neural Networks and Tree Search",
        "authors": "David Silver, Aja Huang, Chris J. Maddison, Arthur Guez, Laurent Sifre, et al.",
        "year": 2016,
        "abstract": "The game of Go has long been viewed as the most challenging of classic games for artificial intelligence owing to its enormous search space and the difficulty of evaluating board positions. We introduce AlphaGo, which combines Monte Carlo tree search with deep value networks and policy networks trained on supervised human games and reinforcement learning self-play.",
        "doi": "10.1038/nature16961",
        "field": "Artificial Intelligence",
        "fieldId": "ai",
        "venue": "Nature",
        "topicTag": "Reinforcement learning & Monte Carlo tree search",
        "citations": 14500,
        "citationLabel": "14.5k citations",
        "openAccess": True,
        "pdfUrl": "https://www.nature.com/articles/nature16961",
        "readingTime": "21 min read",
        "bibtex": "@article{silver2016mastering,\n  title={Mastering the game of Go with deep neural networks and tree search},\n  author={Silver, David and Huang, Aja and Maddison, Chris J and Guez, Arthur and others},\n  journal={Nature},\n  volume={529},\n  number={7587},\n  pages={484--489},\n  year={2016},\n  publisher={Nature Publishing Group}\n}",
        "takeaways": [
            "Pioneered combining deep neural network evaluation with Monte Carlo tree search rollouts.",
            "Defeated European champion 5-0 and world champion Lee Sedol 4-1 in historic milestone matches.",
            "Paved the way for generalized self-play algorithms like AlphaZero and MuZero."
        ]
    },
    {
        "title": "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models",
        "authors": "Jason Wei, Xuezhi Wang, Dale Schuurmans, Maarten Bosma, Fei Xia, Ed Chi, Quoc V. Le, Denny Zhou",
        "year": 2022,
        "abstract": "We explore how generating a chain of thought—a series of intermediate reasoning steps—significantly improves the ability of large language models to perform complex reasoning. In particular, we show that such reasoning abilities emerge naturally in sufficiently large models via chain-of-thought prompting.",
        "doi": "10.48550/arXiv.2201.11903",
        "field": "Artificial Intelligence",
        "fieldId": "ai",
        "venue": "NeurIPS",
        "topicTag": "Emergent reasoning & cognitive prompting",
        "citations": 6300,
        "citationLabel": "6.3k citations",
        "openAccess": True,
        "pdfUrl": "https://arxiv.org/abs/2201.11903",
        "readingTime": "15 min read",
        "bibtex": "@inproceedings{wei2022chain,\n  title={Chain-of-thought prompting elicits reasoning in large language models},\n  author={Wei, Jason and Wang, Xuezhi and Schuurmans, Dale and Bosma, Maarten and others},\n  booktitle={Advances in Neural Information Processing Systems (NeurIPS)},\n  volume={35},\n  pages={24824--24837},\n  year={2022}\n}",
        "takeaways": [
            "Demonstrates that step-by-step rationales unlock complex multi-step arithmetic and symbolic reasoning.",
            "Emergent behavior visible primarily in models with scale > 100 billion parameters.",
            "Established the conceptual basis for modern reasoning models like OpenAI o1."
        ]
    },
    {
        "title": "Direct Preference Optimization: Your Language Model is Secretly a Reward Model",
        "authors": "Rafael Rafailov, Archit Sharma, Eric Mitchell, Stefano Ermon, Christopher D. Manning, Chelsea Finn",
        "year": 2023,
        "abstract": "While RL from human feedback (RLHF) is effective for aligning language models, it is notoriously complex and unstable, requiring training a separate reward model and fine-tuning with PPO. We introduce Direct Preference Optimization (DPO), a mathematical derivation that directly optimizes language policies on preference data with a simple binary cross-entropy loss.",
        "doi": "10.48550/arXiv.2305.18290",
        "field": "Artificial Intelligence",
        "fieldId": "ai",
        "venue": "NeurIPS",
        "topicTag": "Alignment algorithms & reward-free optimization",
        "citations": 2400,
        "citationLabel": "2.4k citations",
        "openAccess": True,
        "pdfUrl": "https://arxiv.org/abs/2305.18290",
        "readingTime": "17 min read",
        "bibtex": "@inproceedings{rafailov2023dpo,\n  title={Direct preference optimization: Your language model is secretly a reward model},\n  author={Rafailov, Rafael and Sharma, Archit and Mitchell, Eric and Ermon, Stefano and Manning, Christopher D and Finn, Chelsea},\n  booktitle={Advances in Neural Information Processing Systems (NeurIPS)},\n  volume={36},\n  year={2023}\n}",
        "takeaways": [
            "Eliminates reinforcement learning instabilities by formulating policy optimization as implicit classification.",
            "Matches or exceeds PPO alignment performance with drastically lower compute and memory overhead.",
            "Adopted across modern open weights models including Mistral, Zephyr, and Llama 3."
        ]
    },
    {
        "title": "Adam: A Method for Stochastic Optimization",
        "authors": "Diederik P. Kingma, Jimmy Ba",
        "year": 2015,
        "abstract": "We introduce Adam, an algorithm for first-order gradient-based optimization of stochastic objective functions, based on adaptive estimates of lower-order moments. The method is straightforward to implement, computationally efficient, has little memory requirements, is invariant to diagonal rescaling of the gradients, and is well suited for problems with large datasets.",
        "doi": "10.48550/arXiv.1412.6980",
        "field": "Machine Learning",
        "fieldId": "ml",
        "venue": "ICLR",
        "topicTag": "Adaptive stochastic gradient descent",
        "citations": 155000,
        "citationLabel": "155k citations",
        "openAccess": True,
        "pdfUrl": "https://arxiv.org/abs/1412.6980",
        "readingTime": "12 min read",
        "bibtex": "@article{kingma2014adam,\n  title={Adam: A method for stochastic optimization},\n  author={Kingma, Diederik P and Ba, Jimmy},\n  journal={arXiv preprint arXiv:1412.6980},\n  year={2014}\n}",
        "takeaways": [
            "Combines advantages of AdaGrad (frequent features) and RMSProp (non-stationary objectives).",
            "Calculates individual adaptive learning rates using decaying averages of past gradients and squared gradients.",
            "Remains the undisputed universal default optimizer for modern deep neural networks."
        ]
    },
    {
        "title": "Generative Adversarial Nets",
        "authors": "Ian Goodfellow, Jean Pouget-Abadie, Mehdi Mirza, Bing Xu, David Warde-Farley, et al.",
        "year": 2014,
        "abstract": "We propose a new framework for estimating generative models via an adversarial process, in which we simultaneously train two models: a generative model G that captures the data distribution, and a discriminative model D that estimates the probability that a sample came from the training data rather than G. The training procedure for G is to maximize the probability of D making a mistake.",
        "doi": "10.48550/arXiv.1406.2661",
        "field": "Machine Learning",
        "fieldId": "ml",
        "venue": "NeurIPS",
        "topicTag": "Minimax game & adversarial generation",
        "citations": 68000,
        "citationLabel": "68k citations",
        "openAccess": True,
        "pdfUrl": "https://arxiv.org/abs/1406.2661",
        "readingTime": "16 min read",
        "bibtex": "@inproceedings{goodfellow2014generative,\n  title={Generative adversarial nets},\n  author={Goodfellow, Ian and Pouget-Abadie, Jean and Mirza, Mehdi and Xu, Bing and others},\n  booktitle={Advances in Neural Information Processing Systems (NeurIPS)},\n  volume={27},\n  year={2014}\n}",
        "takeaways": [
            "Formulates generative modeling as a zero-sum two-player minimax game.",
            "Avoids Markov chains and unrolled approximate inference during generation.",
            "Catalyzed a decade of generative image synthesis breakthroughs leading to StyleGAN."
        ]
    },
    {
        "title": "LoRA: Low-Rank Adaptation of Large Language Models",
        "authors": "Edward J. Hu, Yelong Shen, Phillip Wallis, Zeyuan Allen-Zhu, Yuanzhi Li, et al.",
        "year": 2022,
        "abstract": "An important paradigm of natural language processing consists of large-scale pre-training on general domain data and adaptation to specific tasks. However, as models grow, full fine-tuning becomes prohibitive. We propose Low-Rank Adaptation (LoRA), which freezes the pre-trained model weights and injects trainable rank decomposition matrices into each layer of the Transformer architecture.",
        "doi": "10.48550/arXiv.2106.09685",
        "field": "Machine Learning",
        "fieldId": "ml",
        "venue": "ICLR",
        "topicTag": "Parameter-efficient fine-tuning (PEFT)",
        "citations": 8900,
        "citationLabel": "8.9k citations",
        "openAccess": True,
        "pdfUrl": "https://arxiv.org/abs/2106.09685",
        "readingTime": "15 min read",
        "bibtex": "@inproceedings{hu2022lora,\n  title={LoRA: Low-rank adaptation of large language models},\n  author={Hu, Edward J and Shen, Yelong and Wallis, Phillip and Allen-Zhu, Zeyuan and others},\n  booktitle={International Conference on Learning Representations (ICLR)},\n  year={2022}\n}",
        "takeaways": [
            "Reduces trainable parameters by 10,000x and GPU VRAM footprint by 3x with zero added latency.",
            "Freezes original base weights W and decomposes weight delta as Delta_W = B * A with rank r << d.",
            "De facto standard method for fine-tuning LLMs, diffusion models, and multimodal architectures."
        ]
    },
    {
        "title": "Segment Anything",
        "authors": "Alexander Kirillov, Eric Mintun, Nikhila Ravi, Hanzi Mao, Chloe Rolland, et al.",
        "year": 2023,
        "abstract": "We present the Segment Anything (SA) project: a new task, model, and dataset for image segmentation. Using our efficient model in a data collection loop, we built the largest segmentation dataset to date (by far), with over 1 billion masks on 11M licensed and privacy-respecting images. The model is promptable and transfers zero-shot to diverse segmentation tasks.",
        "doi": "10.48550/arXiv.2304.02643",
        "field": "Machine Learning",
        "fieldId": "ml",
        "venue": "ICCV",
        "topicTag": "Promptable visual foundation models",
        "citations": 5100,
        "citationLabel": "5.1k citations",
        "openAccess": True,
        "pdfUrl": "https://arxiv.org/abs/2304.02643",
        "readingTime": "20 min read",
        "bibtex": "@inproceedings{kirillov2023segment,\n  title={Segment anything},\n  author={Kirillov, Alexander and Mintun, Eric and Ravi, Nikhila and Mao, Hanzi and others},\n  booktitle={Proceedings of the IEEE/CVF International Conference on Computer Vision (ICCV)},\n  pages={4015--4026},\n  year={2023}\n}",
        "takeaways": [
            "Introduced promptable segmentation responding to points, bounding boxes, text, or freeform masks.",
            "Released SA-1B dataset containing 1.1 billion high-quality segmentation masks.",
            "Near real-time inference (50ms per prompt in browser via ONNX Runtime)."
        ]
    },
    {
        "title": "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
        "authors": "Jacob Devlin, Ming-Wei Chang, Kenton Lee, Kristina Toutanova",
        "year": 2019,
        "abstract": "We introduce a new language representation model called BERT, which stands for Bidirectional Encoder Representations from Transformers. Unlike recent language representation models, BERT is designed to pre-train deep bidirectional representations from unlabeled text by jointly conditioning on both left and right context in all layers. As a result, the pre-trained BERT model can be fine-tuned with just one additional output layer.",
        "doi": "10.48550/arXiv.1810.04805",
        "field": "Natural Language Processing",
        "fieldId": "ai",
        "venue": "NAACL",
        "topicTag": "Masked language modeling & bidirectional encoders",
        "citations": 84000,
        "citationLabel": "84k citations",
        "openAccess": True,
        "pdfUrl": "https://arxiv.org/abs/1810.04805",
        "readingTime": "16 min read",
        "bibtex": "@inproceedings{devlin2019bert,\n  title={BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding},\n  author={Devlin, Jacob and Chang, Ming-Wei and Lee, Kenton and Toutanova, Kristina},\n  booktitle={Proceedings of NAACL-HLT},\n  pages={4171--4186},\n  year={2019}\n}",
        "takeaways": [
            "Introduced Masked Language Modeling (MLM) and Next Sentence Prediction (NSP) pretraining objectives.",
            "Demonstrated bidirectional contextual representation across 11 NLP tasks simultaneously.",
            "Fundamentally transformed Google Search semantic indexing and information retrieval."
        ]
    },
    {
        "title": "Toolformer: Language Models Can Teach Themselves to Use Tools",
        "authors": "Timo Schick, Jane Dwivedi-Yu, Roberto Dessì, Roberta Raileanu, Maria Lomeli, et al.",
        "year": 2023,
        "abstract": "Language models exhibit remarkable abilities to solve new tasks from only a few examples, but they struggle with basic tasks such as arithmetic or factual lookup. In this paper, we show that LMs can teach themselves to use external tools via simple APIs in a self-supervised way. Toolformer learns to call calculators, Q&A systems, search engines, translation tools, and calendars.",
        "doi": "10.48550/arXiv.2302.04761",
        "field": "Natural Language Processing",
        "fieldId": "ai",
        "venue": "NeurIPS",
        "topicTag": "Autonomous tool calling & API grounding",
        "citations": 1450,
        "citationLabel": "1.4k citations",
        "openAccess": True,
        "pdfUrl": "https://arxiv.org/abs/2302.04761",
        "readingTime": "17 min read",
        "bibtex": "@inproceedings{schick2023toolformer,\n  title={Toolformer: Language models can teach themselves to use tools},\n  author={Schick, Timo and Dwivedi-Yu, Jane and Dess{\\`\\i}, Roberto and others},\n  booktitle={Advances in Neural Information Processing Systems (NeurIPS)},\n  volume={36},\n  year={2023}\n}",
        "takeaways": [
            "Self-supervised dataset generation inserting API calls where they reduce future token perplexity.",
            "Grounds model outputs with live calculators, search engines, and currency conversion APIs.",
            "Demonstrates that 6.7B parameter models can outperform much larger models by using external tools."
        ]
    },
    {
        "title": "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness",
        "authors": "Tri Dao, Daniel Y. Fu, Stefano Ermon, Atri Rudra, Christopher Ré",
        "year": 2022,
        "abstract": "Transformers are slow and memory-hungry on long sequences, as the time and memory complexity of self-attention are quadratic in sequence length. We propose FlashAttention, an IO-aware exact attention algorithm that uses tiling to reduce the number of memory reads/writes between GPU high bandwidth memory (HBM) and GPU on-chip SRAM.",
        "doi": "10.48550/arXiv.2205.14135",
        "field": "Natural Language Processing",
        "fieldId": "ai",
        "venue": "NeurIPS",
        "topicTag": "GPU SRAM memory hierarchy & fast attention",
        "citations": 3800,
        "citationLabel": "3.8k citations",
        "openAccess": True,
        "pdfUrl": "https://arxiv.org/abs/2205.14135",
        "readingTime": "19 min read",
        "bibtex": "@inproceedings{dao2022flashattention,\n  title={FlashAttention: Fast and memory-efficient exact attention with IO-awareness},\n  author={Dao, Tri and Fu, Daniel Y and Ermon, Stefano and Rudra, Atri and R{\\'e}, Christopher},\n  booktitle={Advances in Neural Information Processing Systems (NeurIPS)},\n  volume={35},\n  pages={16344--16359},\n  year={2022}\n}",
        "takeaways": [
            "Leverages GPU SRAM tiling and online softmax calculation to eliminate O(N^2) memory bottlenecks.",
            "Achieves 2-4x wall-clock speedup for training and enables context scaling to tens of thousands of tokens.",
            "Standard execution kernel incorporated in PyTorch 2.0 scaled dot product attention."
        ]
    },
    {
        "title": "Constitutional AI: Harmlessness from AI Feedback",
        "authors": "Yuntao Bai, Saurav Kadavath, Sandipan Kundu, Amanda Askell, John Kernion, et al.",
        "year": 2022,
        "abstract": "As AI models become more capable, aligning them using human feedback becomes increasingly bottlenecked by human labeling cost and consistency. We propose Constitutional AI (CAI), a method for training a harmless AI assistant through self-improvement without human feedback labels for harmlessness. The model critiques and revises its own responses using a written constitution.",
        "doi": "10.48550/arXiv.2212.08073",
        "field": "Artificial Intelligence",
        "fieldId": "ai",
        "venue": "CoRR / Anthropic",
        "topicTag": "RLAIF & principle-based alignment",
        "citations": 1750,
        "citationLabel": "1.7k citations",
        "openAccess": True,
        "pdfUrl": "https://arxiv.org/abs/2212.08073",
        "readingTime": "24 min read",
        "bibtex": "@article{bai2022constitutional,\n  title={Constitutional AI: Harmlessness from AI feedback},\n  author={Bai, Yuntao and Kadavath, Saurav and Kundu, Sandipan and Askell, Amanda and others},\n  journal={arXiv preprint arXiv:2212.08073},\n  year={2022}\n}",
        "takeaways": [
            "Introduces Reinforcement Learning from AI Feedback (RLAIF) using explicit human-written principles.",
            "Automates iterative critique and revision pipelines to eliminate toxic or dangerous completions.",
            "Core safety alignment methodology behind the Claude foundation model family."
        ]
    },
    {
        "title": "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale",
        "authors": "Alexey Dosovitskiy, Lucas Beyer, Alexander Kolesnikov, Dirk Weissenborn, Xiaohua Zhai, et al.",
        "year": 2021,
        "abstract": "While the Transformer architecture has become the de-facto standard for natural language processing tasks, its applications to computer vision remain limited. In vision, attention is either applied in conjunction with convolutional networks, or used to replace certain components. We show that this reliance on CNNs is not necessary and a pure transformer applied directly to sequences of image patches can perform very well.",
        "doi": "10.48550/arXiv.2010.11929",
        "field": "Machine Learning",
        "fieldId": "ml",
        "venue": "ICLR",
        "topicTag": "Vision Transformers (ViT) & patch tokenization",
        "citations": 34000,
        "citationLabel": "34k citations",
        "openAccess": True,
        "pdfUrl": "https://arxiv.org/abs/2010.11929",
        "readingTime": "15 min read",
        "bibtex": "@inproceedings{dosovitskiy2020image,\n  title={An image is worth 16x16 words: Transformers for image recognition at scale},\n  author={Dosovitskiy, Alexey and Beyer, Lucas and Kolesnikov, Alexander and others},\n  booktitle={International Conference on Learning Representations (ICLR)},\n  year={2021}\n}",
        "takeaways": [
            "Splits 2D images into 16x16 flattened linear patch tokens processed like NLP word sequences.",
            "Discards inductive bias of spatial translation invariance in favor of large-scale pretraining.",
            "Matches or outperforms state-of-the-art ResNet baselines on ImageNet with 4x less training compute."
        ]
    },
    {
        "title": "Learning Transferable Visual Models From Natural Language Supervision",
        "authors": "Alec Radford, Jong Wook Kim, Chris Hallacy, Aditya Ramesh, Gabriel Goh, et al.",
        "year": 2021,
        "abstract": "State-of-the-art computer vision systems are trained to predict a fixed set of predetermined object categories. This restricted form of supervision limits their generality. We demonstrate that the simple pre-training task of predicting which caption goes with which image is an efficient and scalable way to learn SOTA image representations from scratch on a dataset of 400M image-text pairs.",
        "doi": "10.48550/arXiv.2103.00020",
        "field": "Machine Learning",
        "fieldId": "ml",
        "venue": "ICML",
        "topicTag": "CLIP & multimodal contrastive representation",
        "citations": 21500,
        "citationLabel": "21.5k citations",
        "openAccess": True,
        "pdfUrl": "https://arxiv.org/abs/2103.00020",
        "readingTime": "22 min read",
        "bibtex": "@inproceedings{radford2021learning,\n  title={Learning transferable visual models from natural language supervision},\n  author={Radford, Alec and Kim, Jong Wook and Hallacy, Chris and others},\n  booktitle={International Conference on Machine Learning (ICML)},\n  pages={8748--8763},\n  year={2021}\n}",
        "takeaways": [
            "Pioneered multimodal contrastive learning between text transformer and vision encoder embeddings.",
            "Enables zero-shot classification across diverse vision tasks without task-specific fine-tuning.",
            "Forms the vision-language backbone for DALL-E, Stable Diffusion, and GPT-4 Vision."
        ]
    },
    {
        "title": "High-Resolution Image Synthesis with Latent Diffusion Models",
        "authors": "Robin Rombach, Andreas Blattmann, Dominik Lorenz, Patrick Esser, Björn Ommer",
        "year": 2022,
        "abstract": "By decomposing the image formation process into a sequential application of denoising autoencoders, diffusion models achieve state-of-the-art synthesis results on image data. However, operating directly in pixel space demands immense compute. We introduce Latent Diffusion Models (LDMs), which apply diffusion processes in the latent space of powerful pretrained autoencoders.",
        "doi": "10.1109/CVPR.2022.01042",
        "field": "Machine Learning",
        "fieldId": "ml",
        "venue": "CVPR",
        "topicTag": "Latent diffusion & Stable Diffusion architecture",
        "citations": 14800,
        "citationLabel": "14.8k citations",
        "openAccess": True,
        "pdfUrl": "https://arxiv.org/abs/2112.10752",
        "readingTime": "18 min read",
        "bibtex": "@inproceedings{rombach2022high,\n  title={High-resolution image synthesis with latent diffusion models},\n  author={Rombach, Robin and Blattmann, Andreas and Lorenz, Dominik and Esser, Patrick and Ommer, Bj{\\\"o}rn},\n  booktitle={Proceedings of the IEEE/CVF conference on computer vision and pattern recognition (CVPR)},\n  pages={10684--10695},\n  year={2022}\n}",
        "takeaways": [
            "Reduces computational complexity by operating in perceptual latent space rather than raw pixels.",
            "Cross-attention conditioning allows flexible synthesis guided by text prompts, depth maps, or layouts.",
            "Open-sourced as Stable Diffusion, sparking the open-weights generative imagery revolution."
        ]
    },
    {
        "title": "NeRF: Representing Scenes as Neural Radiance Fields for View Synthesis",
        "authors": "Ben Mildenhall, Pratul P. Srinivasan, Matthew Tancik, Jonathan T. Barron, Ravi Ramamoorthi, Ren Ng",
        "year": 2020,
        "abstract": "We present a method that achieves state-of-the-art results for synthesizing novel views of complex scenes by optimizing an underlying continuous volumetric scene function using a sparse set of input views. Our approach represents a scene using a fully-connected deep network, whose input is a single continuous 5D coordinate (spatial location (x,y,z) and viewing direction) and whose output is volume density and emitted radiance.",
        "doi": "10.1007/978-3-030-58452-8_24",
        "field": "Machine Learning",
        "fieldId": "ml",
        "venue": "ECCV",
        "topicTag": "Neural radiance fields & 3D view synthesis",
        "citations": 11200,
        "citationLabel": "11.2k citations",
        "openAccess": True,
        "pdfUrl": "https://arxiv.org/abs/2003.08934",
        "readingTime": "17 min read",
        "bibtex": "@inproceedings{mildenhall2020nerf,\n  title={NeRF: Representing scenes as neural radiance fields for view synthesis},\n  author={Mildenhall, Ben and Srinivasan, Pratul P and Tancik, Matthew and Barron, Jonathan T and others},\n  booktitle={European Conference on Computer Vision (ECCV)},\n  pages={405--421},\n  year={2020}\n}",
        "takeaways": [
            "Continuous 5D neural scene representation optimized via classical volume rendering equations.",
            "Positional encoding maps spatial coordinates to higher frequency domains, capturing fine details.",
            "Sparked entire 3D generative AI field leading to 3D Gaussian Splatting and spatial computing."
        ]
    },
    {
        "title": "Accurate structure prediction of biomolecular interactions with AlphaFold 3",
        "authors": "Josh Abramson, Jonas Adler, Jack Dunger, Richard Evans, Tim Green, et al.",
        "year": 2024,
        "abstract": "The structure and interactions of molecules are fundamental to understanding biological mechanisms and drug discovery. Here we present AlphaFold 3, with a substantially updated diffusion-based architecture capable of predicting the joint structure of complexes that include proteins, nucleic acids (DNA and RNA), small molecules, ions, and chemical modifications with unprecedented accuracy.",
        "doi": "10.1038/s41586-024-07487-w",
        "field": "Biotechnology & Medicine",
        "fieldId": "bio",
        "venue": "Nature",
        "topicTag": "Diffusion-based biomolecular complex prediction",
        "citations": 1950,
        "citationLabel": "1.9k citations",
        "openAccess": True,
        "pdfUrl": "https://www.nature.com/articles/s41586-024-07487-w",
        "readingTime": "23 min read",
        "bibtex": "@article{abramson2024accurate,\n  title={Accurate structure prediction of biomolecular interactions with AlphaFold 3},\n  author={Abramson, Josh and Adler, Jonas and Dunger, Jack and Evans, Richard and others},\n  journal={Nature},\n  volume={630},\n  pages={493--500},\n  year={2024}\n}",
        "takeaways": [
            "Replaces Evoformer module with a streamlined Pairformer and 3D diffusion coordinate module.",
            "Unifies prediction across proteins, DNA, RNA, ligands, and antibody-antigen complexes.",
            "50% improvement in protein-ligand binding pose prediction compared to classical docking tools."
        ]
    },
    {
        "title": "A programmable dual-RNA-guided DNA endonuclease in adaptive bacterial immunity",
        "authors": "Martin Jinek, Krzysztof Chylinski, Ines Fonfara, Michael Hauer, Jennifer A. Doudna, Emmanuelle Charpentier",
        "year": 2012,
        "abstract": "Clustered regularly interspaced short palindromic repeats (CRISPR) and CRISPR-associated (Cas) systems provide bacteria and archaea with adaptive immunity. We show that the Cas9 endonuclease from Streptococcus pyogenes can be programmed with single guide RNAs to introduce site-specific double-stranded breaks in target DNA sequences, creating a revolutionary tool for genome engineering.",
        "doi": "10.1126/science.1225829",
        "field": "Biotechnology & Medicine",
        "fieldId": "bio",
        "venue": "Science",
        "topicTag": "CRISPR-Cas9 genome editing & single guide RNA",
        "citations": 18200,
        "citationLabel": "18.2k citations",
        "openAccess": True,
        "pdfUrl": "https://www.science.org/doi/10.1126/science.1225829",
        "readingTime": "16 min read",
        "bibtex": "@article{jinek2012programmable,\n  title={A programmable dual-RNA-guided DNA endonuclease in adaptive bacterial immunity},\n  author={Jinek, Martin and Chylinski, Krzysztof and Fonfara, Ines and Hauer, Michael and Doudna, Jennifer A and Charpentier, Emmanuelle},\n  journal={Science},\n  volume={337},\n  number={6096},\n  pages={816--821},\n  year={2012}\n}",
        "takeaways": [
            "Engineered chimeric single-guide RNA (sgRNA) directing Cas9 endonuclease to specific target DNA loci.",
            "Demonstrated precise double-stranded cleavage triggering cellular repair pathways.",
            "Awarded the 2020 Nobel Prize in Chemistry for establishing universal modern gene editing."
        ]
    },
    {
        "title": "Evolutionary-scale prediction of atomic-level protein structure with a language model",
        "authors": "Zeming Lin, Halil Akin, Roshan Rao, Brian Hie, Zhongkai Zhu, Wenting Lu, et al.",
        "year": 2023,
        "abstract": "Large language models trained on evolutionary protein sequences learn representations that contain structural and biophysical information. We present ESMFold, an end-to-end atomic-level protein structure prediction model operating directly from single sequences using ESM-2 (up to 15B parameters), achieving accuracy comparable to AlphaFold while predicting structures up to 60x faster.",
        "doi": "10.1126/science.ade2574",
        "field": "Biotechnology & Medicine",
        "fieldId": "bio",
        "venue": "Science",
        "topicTag": "ESMFold & protein language models",
        "citations": 3100,
        "citationLabel": "3.1k citations",
        "openAccess": True,
        "pdfUrl": "https://www.science.org/doi/10.1126/science.ade2574",
        "readingTime": "18 min read",
        "bibtex": "@article{lin2023evolutionary,\n  title={Evolutionary-scale prediction of atomic-level protein structure with a language model},\n  author={Lin, Zeming and Akin, Halil and Rao, Roshan and Hie, Brian and Zhu, Zhongkai and others},\n  journal={Science},\n  volume={379},\n  number={6637},\n  pages={1123--1130},\n  year={2023}\n}",
        "takeaways": [
            "Bypasses computationally expensive Multiple Sequence Alignment (MSA) search algorithms.",
            "Enabled folding the entire ESM Metagenomic Atlas of 617 million environmental proteins.",
            "Inference up to 60x faster than AlphaFold, enabling high-throughput synthetic protein design."
        ]
    },
    {
        "title": "ClimaX: A foundation model for weather and climate",
        "authors": "Tung Nguyen, Johannes Brandstetter, Ashwinee Kumar, Jayesh K. Gupta, Aditya Grover",
        "year": 2023,
        "abstract": "We present ClimaX, a flexible foundation model for weather and climate science. Unlike specialized numerical forecasting models, ClimaX uses tokenized spatial attention and a novel variable-tokenization aggregation layer that allows pretraining on diverse climate datasets with arbitrary spatial resolutions and variable configurations.",
        "doi": "10.48550/arXiv.2301.10343",
        "field": "Climate Science",
        "fieldId": "climate",
        "venue": "ICML",
        "topicTag": "Foundation models for atmospheric climate",
        "citations": 420,
        "citationLabel": "420+ citations",
        "openAccess": True,
        "pdfUrl": "https://arxiv.org/abs/2301.10343",
        "readingTime": "19 min read",
        "bibtex": "@inproceedings{nguyen2023climax,\n  title={ClimaX: A foundation model for weather and climate},\n  author={Nguyen, Tung and Brandstetter, Johannes and Kumar, Ashwinee and Gupta, Jayesh K and Grover, Aditya},\n  booktitle={International Conference on Machine Learning (ICML)},\n  year={2023}\n}",
        "takeaways": [
            "Introduced variable tokenization enabling single model inference across differing physical input modalities.",
            "Pretrained on CMIP6 historical climate simulations and ERA5 reanalysis data.",
            "Excels across downstream tasks: weather forecasting, extreme event projection, and regional downscaling."
        ]
    },
    {
        "title": "Suppressing quantum errors by scaling a quantum error-correcting code",
        "authors": "Google Quantum AI (Rajeev Acharya, Igor Aleiner, Richard Allen, Trond I. Andersen, et al.)",
        "year": 2023,
        "abstract": "Practical quantum computing requires quantum error correction to protect fragile quantum information from environmental noise. Here we demonstrate a surface code memory on superconducting transmons where scaling from distance 3 (17 qubits) to distance 5 (49 qubits) suppressed logical error rates by more than a factor of two, meeting a foundational criterion for fault-tolerant quantum computing.",
        "doi": "10.1038/s41586-022-05434-1",
        "field": "Quantum Computing",
        "fieldId": "quantum",
        "venue": "Nature",
        "topicTag": "Physical surface code scaling & error suppression",
        "citations": 1600,
        "citationLabel": "1.6k citations",
        "openAccess": True,
        "pdfUrl": "https://www.nature.com/articles/s41586-022-05434-1",
        "readingTime": "21 min read",
        "bibtex": "@article{acharya2023suppressing,\n  title={Suppressing quantum errors by scaling a quantum error-correcting code},\n  author={Acharya, Rajeev and Aleiner, Igor and Allen, Richard and Andersen, Trond I and others},\n  journal={Nature},\n  volume={614},\n  number={7949},\n  pages={676--681},\n  year={2023}\n}",
        "takeaways": [
            "First experimental demonstration that larger quantum error-correcting codes reduce logical errors.",
            "Surface code distance-5 achieved lower logical error rates than distance-3 on 72-qubit Sycamore chip.",
            "Crucial milestone proving physical viability of threshold-exceeding fault-tolerant quantum computers."
        ]
    },
    {
        "title": "Quantum advantage in learning from experiments",
        "authors": "Hsin-Yuan Huang, Michael Broughton, Jordan Cotler, Sitan Chen, Jerry Li, et al.",
        "year": 2022,
        "abstract": "Quantum technology holds the promise to improve machine learning over classical approaches. In this work, we show that quantum computers can perform exponentially fewer measurements to learn properties of physical systems compared to any classical learner. We demonstrate this quantum advantage experimentally on the Sycamore quantum processor.",
        "doi": "10.1126/science.abn7293",
        "field": "Quantum Computing",
        "fieldId": "quantum",
        "venue": "Science",
        "topicTag": "Quantum machine learning & quantum state learning",
        "citations": 780,
        "citationLabel": "780+ citations",
        "openAccess": True,
        "pdfUrl": "https://www.science.org/doi/10.1126/science.abn7293",
        "readingTime": "17 min read",
        "bibtex": "@article{huang2022quantum,\n  title={Quantum advantage in learning from experiments},\n  author={Huang, Hsin-Yuan and Broughton, Michael and Cotler, Jordan and others},\n  journal={Science},\n  volume={376},\n  number={6598},\n  pages={1182--1186},\n  year={2022}\n}",
        "takeaways": [
            "Proves exponential sample complexity advantage when quantum memory interfaces directly with experiments.",
            "Experimentally verified quantum state classification on up to 40 qubits.",
            "Bridges quantum sensory processing with advanced quantum machine learning algorithms."
        ]
    },
    {
        "title": "A high-resolution brain-computer interface decodes speech from cortical activity",
        "authors": "David A. Moses, Sean L. Metzger, Jessie R. Liu, Gopala K. Anumanchipalli, Edward F. Chang",
        "year": 2021,
        "abstract": "Severe paralysis can lead to loss of the ability to speak. We developed a brain-computer interface (BCI) system that decodes full words and complete sentences directly from the cortical speech motor areas of an individual with anarthria. Using high-density subdural electrocorticography (ECoG) arrays and deep recurrent neural decoders, the system decoded natural conversational speech.",
        "doi": "10.1056/NEJMoa2027540",
        "field": "Neuroscience",
        "fieldId": "neuro",
        "venue": "New England Journal of Medicine",
        "topicTag": "ECoG brain-computer interface & speech neuroprosthesis",
        "citations": 1120,
        "citationLabel": "1.1k citations",
        "openAccess": True,
        "pdfUrl": "https://www.nejm.org/doi/full/10.1056/NEJMoa2027540",
        "readingTime": "19 min read",
        "bibtex": "@article{moses2021neuroprosthesis,\n  title={Neuroprosthesis for decoding speech in a person with paralysis},\n  author={Moses, David A and Metzger, Sean L and Liu, Jessie R and Anumanchipalli, Gopala K and Chang, Edward F},\n  journal={New England Journal of Medicine},\n  volume={385},\n  number={3},\n  pages={217--227},\n  year={2021}\n}",
        "takeaways": [
            "Decoded vocabulary of words directly from cortical sensorimotor representations in real time.",
            "Language model beam search decoding achieved median word error rates below 25%.",
            "Milestone clinical proof-of-concept for direct neural communication prosthetics."
        ]
    },
    {
        "title": "Whole-brain connectome of Drosophila melanogaster at synaptic resolution",
        "authors": "FlyWire Consortium (Sven Dorkenwald, Arie Matsliah, Amy R. Sterling, Philipp Schlegel, et al.)",
        "year": 2024,
        "abstract": "Mapping the complete connectivity of neural circuits is fundamental to deciphering how brains compute behavior. Here we present FlyWire, the complete synaptic connectome of an adult Drosophila melanogaster brain. The reconstruction comprises 139,255 neurons and 54.5 million chemical synapses, providing a comprehensive anatomical blueprint for neural dynamics.",
        "doi": "10.1038/s41586-024-07558-9",
        "field": "Neuroscience",
        "fieldId": "neuro",
        "venue": "Nature",
        "topicTag": "Synaptic connectomics & electron microscopy reconstruction",
        "citations": 380,
        "citationLabel": "380+ citations",
        "openAccess": True,
        "pdfUrl": "https://www.nature.com/articles/s41586-024-07558-9",
        "readingTime": "22 min read",
        "bibtex": "@article{dorkenwald2024neuronal,\n  title={Neuronal wiring diagram of an adult brain},\n  author={Dorkenwald, Sven and Matsliah, Arie and Sterling, Amy R and Schlegel, Philipp and others},\n  journal={Nature},\n  volume={634},\n  pages={124--138},\n  year={2024}\n}",
        "takeaways": [
            "First complete adult insect connectome: 139,255 neurons and 54.5 million verified synaptic connections.",
            "Utilized AI computer vision segmentation refined by global crowdsourced proofreading.",
            "Enables whole-brain in silico circuit simulations linking sensory perception to motor actions."
        ]
    }
]

print(f"Total papers defined: {len(papers)}")

# Generate Java code for DataInitializer.java
java_entries = []
for p in papers:
    takeaways_str = ",\n                        ".join([json.dumps(t) for t in p["takeaways"]])
    entry = f'''                new Paper(
                    {json.dumps(p['title'])},
                    {json.dumps(p['authors'])},
                    {p['year']},
                    {json.dumps(p['abstract'])},
                    {json.dumps(p['doi'])},
                    {json.dumps(p['field'])},
                    {json.dumps(p['fieldId'])},
                    {json.dumps(p['venue'])},
                    {json.dumps(p['topicTag'])},
                    {p['citations']},
                    {json.dumps(p['citationLabel'])},
                    true,
                    {json.dumps(p['pdfUrl'])},
                    {json.dumps(p['readingTime'])},
                    {json.dumps(p['bibtex'])},
                    Arrays.asList(
                        {takeaways_str}
                    )
                )'''
    java_entries.append(entry)

java_code = f'''package com.example.demo.config;

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
public class DataInitializer implements CommandLineRunner {{

    private final PaperRepository paperRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    @Autowired
    public DataInitializer(PaperRepository paperRepository,
                           UserRepository userRepository,
                           UserService userService) {{
        this.paperRepository = paperRepository;
        this.userRepository = userRepository;
        this.userService = userService;
    }}

    @Override
    public void run(String... args) {{
        seedUsers();
        seedPapers();
    }}

    private void seedUsers() {{
        if (!userRepository.existsByEmail("alex.chen@stanford.edu")) {{
            userService.register(
                    "Alex Chen",
                    "alex.chen@stanford.edu",
                    "Password123!",
                    "Stanford University",
                    "Computer Science & AI Lab"
            );
            System.out.println("✅ Seeded default researcher: alex.chen@stanford.edu");
        }}
    }}

    private void seedPapers() {{
        if (paperRepository.count() < 36) {{
            // Clean reseed to ensure all 36 multi-disciplinary landmark papers are loaded
            paperRepository.deleteAll();

            List<Paper> papers = Arrays.asList(
{",\n".join(java_entries)}
            );

            paperRepository.saveAll(papers);
            System.out.println("✅ Seeded " + papers.size() + " landmark research papers into MySQL database.");
        }}
    }}
}}
'''

with open("/Users/Windows/Desktop/researchnest/backend/src/main/java/com/example/demo/config/DataInitializer.java", "w") as f:
    f.write(java_code)

print("✅ Successfully updated DataInitializer.java with 36 papers!")

# Generate mockPapers.js
js_papers = []
for idx, p in enumerate(papers):
    js_paper = {
        "id": f"paper-{idx + 1}",
        "title": p["title"],
        "field": p["field"],
        "fieldId": p["fieldId"],
        "authors": p["authors"],
        "year": p["year"],
        "abstract": p["abstract"],
        "doi": p["doi"],
        "venue": p["venue"],
        "topicTag": p["topicTag"],
        "citations": p["citations"],
        "citationLabel": p["citationLabel"],
        "openAccess": True,
        "pdfUrl": p["pdfUrl"],
        "readingTime": p["readingTime"],
        "bibtex": p["bibtex"],
        "takeaways": p["takeaways"]
    }
    js_papers.append(js_paper)

js_content = f'''/**
 * ResearchNest Mock Data & Scholarly Repository
 * 36 real landmark scientific papers across 8 disciplines with rich abstracts, metadata, takeaways, and citation generators.
 */

export const DEMO_DISCLAIMER =
  "Scholarly discovery workspace · Real landmark publications and synthesized academic takeaways.";

export const trendingTopics = [
  {{ id: "all", label: "All Disciplines", color: "purple" }},
  {{ id: "ai", label: "Artificial Intelligence", color: "purple" }},
  {{ id: "ml", label: "Machine Learning", color: "blue" }},
  {{ id: "climate", label: "Climate Science", color: "green" }},
  {{ id: "neuro", label: "Neuroscience", color: "peach" }},
  {{ id: "quantum", label: "Quantum Computing", color: "lavender" }},
  {{ id: "bio", label: "Biotechnology & Medicine", color: "emerald" }},
];

export const mockStacks = [
  {{
    id: "stack-ai",
    name: "AI & Neural Reasoning",
    description: "Foundational attention models, state spaces, and cognitive architectures.",
    color: "#7c3aed",
    count: 12,
    icon: "sparkles",
  }},
  {{
    id: "stack-foundation",
    name: "Foundation Models & LLMs",
    description: "Large scale sequence modeling, alignment, and parameter efficiency.",
    color: "#3b82f6",
    count: 8,
    icon: "layers",
  }},
  {{
    id: "stack-climate",
    name: "Climate & Planetary AI",
    description: "Deep learning applied to global weather systems, forecasting, and earth observation.",
    color: "#10b981",
    count: 4,
    icon: "compass",
  }},
  {{
    id: "stack-neuro",
    name: "Neuroscience & Memory",
    description: "Cortical mapping, synaptic plasticity, and neural interface protocols.",
    color: "#f97316",
    count: 3,
    icon: "book",
  }},
  {{
    id: "stack-bio",
    name: "Biotech & Structural Biology",
    description: "AlphaFold, CRISPR, and deep protein language models.",
    color: "#059669",
    count: 4,
    icon: "dna",
  }},
  {{
    id: "stack-quantum",
    name: "Quantum Computing",
    description: "Surface codes, error suppression, and quantum supremacy.",
    color: "#8b5cf6",
    count: 3,
    icon: "cpu",
  }},
];

export const mockPapers = {json.dumps(js_papers, indent=2)};
'''

with open("/Users/Windows/Desktop/researchnest/frontend/src/data/mockPapers.js", "w") as f:
    f.write(js_content)

print("✅ Successfully updated mockPapers.js with 36 papers!")
