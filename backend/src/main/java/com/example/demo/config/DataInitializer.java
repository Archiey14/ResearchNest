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
        if (paperRepository.count() < 12) {
            // Remove initial dummy test records if any to ensure clean seed
            paperRepository.deleteAll();

            List<Paper> papers = Arrays.asList(
                new Paper(
                    "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
                    "Patrick Lewis, Ethan Perez, Aleksandra Piktus, Fabio Petroni, Vladimir Karpukhin, et al.",
                    2020,
                    "Large pre-trained language models have been shown to store factual knowledge in their parameters, and achieve state-of-the-art results when fine-tuned on downstream NLP tasks. However, their ability to access and precisely manipulate knowledge is still limited. We propose Retrieval-Augmented Generation (RAG)—a general-purpose fine-tuning method that combines pre-trained parametric memory with non-parametric retrieval from dense vector indexes.",
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
                    "Global weather prediction is traditionally based on numerical weather prediction (NWP) using physical atmospheric models on supercomputers. We introduce GraphCast, a machine learning weather forecasting system based on graph neural networks trained on 40 years of ECMWF reanalysis data. GraphCast produces 10-day forecasts of hundreds of weather variables in under 60 seconds at 0.25° resolution, outperforming operational systems.",
                    "10.1126/science.adi2336",
                    "Climate Science",
                    "climate",
                    "Science",
                    "Graph neural networks for weather",
                    750,
                    "750+ citations",
                    true,
                    "https://www.science.org/doi/10.1126/science.adi2336",
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
                    "We develop and release Llama 2, a collection of pretrained and fine-tuned large language models (LLMs) ranging in scale from 7 billion to 70 billion parameters. Our fine-tuned LLMs, called Llama 2-Chat, are optimized for dialogue use cases through Reinforcement Learning from Human Feedback (RLHF) and demonstrate competitive safety and helpfulness across standard benchmarks.",
                    "10.48550/arXiv.2307.09288",
                    "Artificial Intelligence",
                    "ai",
                    "arXiv",
                    "Open LLM development and alignment",
                    15400,
                    "15.4k citations",
                    true,
                    "https://arxiv.org/abs/2307.09288",
                    "22 min read",
                    "@article{touvron2023llama,\n  title={Llama 2: Open foundation and fine-tuned chat models},\n  author={Touvron, Hugo and Martin, Louis and Stone, Kevin and others},\n  journal={arXiv preprint arXiv:2307.09288},\n  year={2023}\n}",
                    Arrays.asList(
                        "Full family of open models (7B, 13B, 70B) pretrained on 2 trillion tokens.",
                        "Novel safety alignment protocols with rejection sampling and iterative PPO.",
                        "Pioneered ghost attention (GAtt) to control dialogue context over multi-turn interactions."
                    )
                ),
                new Paper(
                    "Highly accurate protein structure prediction with AlphaFold",
                    "John Jumper, Richard Evans, Alexander Pritzel, Tim Green, Michael Figurnov, et al.",
                    2021,
                    "Proteins are essential to life, and understanding their structure can provide atomic-level insights into biological processes. In CASP14, AlphaFold demonstrated atomic accuracy with median backbone errors of less than 1 Ångström. Here we describe the full Evoformer architecture and structural refinement module that enables end-to-end protein folding from primary amino acid sequences.",
                    "10.1038/s41586-021-03819-2",
                    "Biotechnology & Medicine",
                    "bio",
                    "Nature",
                    "Deep learning for protein structure folding",
                    24800,
                    "24.8k citations",
                    true,
                    "https://www.nature.com/articles/s41586-021-03819-2",
                    "25 min read",
                    "@article{jumper2021highly,\n  title={Highly accurate protein structure prediction with AlphaFold},\n  author={Jumper, John and Evans, Richard and Pritzel, Alexander and others},\n  journal={Nature},\n  volume={596},\n  number={7873},\n  pages={583--589},\n  year={2021},\n  publisher={Nature Publishing Group}\n}",
                    Arrays.asList(
                        "Solved the 50-year-old protein folding grand challenge in computational biology.",
                        "Novel Evoformer neural module reasons over multiple sequence alignments and spatial coordinates.",
                        "Predicts confidence metrics (pLDDT, PAE) at per-residue atomic resolution."
                    )
                ),
                new Paper(
                    "Quantum computational supremacy using a programmable superconducting processor",
                    "Frank Arute, Kunal Arya, Ryan Babbush, Dave Bacon, Joseph C. Bardin, et al.",
                    2019,
                    "The promise of quantum computers is that certain computational tasks might be executed exponentially faster on a quantum processor than on a classical computer. We demonstrate quantum supremacy using a programmable superconducting processor known as Sycamore, consisting of 53 qubits with high-fidelity single and two-qubit quantum gates.",
                    "10.1038/s41586-019-1666-5",
                    "Quantum Computing",
                    "quantum",
                    "Nature",
                    "Superconducting quantum processors",
                    6300,
                    "6.3k citations",
                    true,
                    "https://www.nature.com/articles/s41586-019-1666-5",
                    "15 min read",
                    "@article{arute2019quantum,\n  title={Quantum computational supremacy using a programmable superconducting processor},\n  author={Arute, Frank and Arya, Kunal and Babbush, Ryan and others},\n  journal={Nature},\n  volume={574},\n  number={7779},\n  pages={505--510},\n  year={2019},\n  publisher={Nature Publishing Group}\n}",
                    Arrays.asList(
                        "Demonstrated sampling from a pseudorandom quantum circuit in 200 seconds.",
                        "Cross-entropy benchmarking confirmed 53 entangled physical qubits operating coherently.",
                        "Milestone experiment demonstrating superpolynomial quantum advantage over classical supercomputers."
                    )
                ),
                new Paper(
                    "Cortical Mapping of Semantic Representations Across the Human Brain",
                    "Alexander G. Huth, Wendy A. de Heer, Thomas L. Griffiths, Frédéric E. Theunissen, Jack L. Gallant",
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
                    "@article{huth2016cortical,\n  title={Natural speech reveals the semantic maps that tile human cerebral cortex},\n  author={Huth, Alexander G and de Heer, Wendy A and Griffiths, Thomas L and Theunissen, Fr{\'e}d{\'e}ric E and Gallant, Jack L},\n  journal={Nature},\n  volume={532},\n  number={7600},\n  pages={453--458},\n  year={2016},\n  publisher={Nature Publishing Group}\n}",
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
                    "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks. We propose the Transformer, a model architecture eschewing recurrence and entirely relying on an attention mechanism to draw global dependencies between input and output. The Transformer allows for significantly more parallelization and establishes state-of-the-art results.",
                    "10.48550/arXiv.1706.03762",
                    "Artificial Intelligence",
                    "ai",
                    "NeurIPS",
                    "Multi-head attention & Transformer foundations",
                    124000,
                    "124.0k citations",
                    true,
                    "https://arxiv.org/abs/1706.03762",
                    "15 min read",
                    "@inproceedings{vaswani2017attention,\n  title={Attention is all you need},\n  author={Vaswani, Ashish and Shazeer, Noam and Parmar, Niki and others},\n  booktitle={Advances in Neural Information Processing Systems (NeurIPS)},\n  volume={30},\n  year={2017}\n}",
                    Arrays.asList(
                        "Invented the multi-head self-attention mechanism, discarding recurrent and convolutional layers.",
                        "Reduced training times by orders of magnitude while drastically scaling sequence context.",
                        "Became the foundational architecture for modern AI systems including GPT, Claude, Gemini, and BERT."
                    )
                ),
                new Paper(
                    "Deep Residual Learning for Image Recognition",
                    "Kaiming He, Xiangyu Zhang, Shaoqing Ren, Jian Sun",
                    2016,
                    "Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those previously used. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, solving the vanishing gradient problem and enabling networks of over 150 layers.",
                    "10.1109/CVPR.2016.90",
                    "Machine Learning",
                    "ml",
                    "CVPR",
                    "Deep residual networks & skip connections",
                    215000,
                    "215.0k citations",
                    true,
                    "https://arxiv.org/abs/1512.03385",
                    "12 min read",
                    "@inproceedings{he2016deep,\n  title={Deep residual learning for image recognition},\n  author={He, Kaiming and Zhang, Xiangyu and Ren, Shaoqing and Sun, Jian},\n  booktitle={Proceedings of the IEEE conference on computer vision and pattern recognition (CVPR)},\n  pages={770--778},\n  year={2016}\n}",
                    Arrays.asList(
                        "Introduced identity shortcut connections (skip connections) that let gradients flow unobstructed.",
                        "Trained 152-layer deep ResNets, winning 1st place in ImageNet and COCO competitions.",
                        "Residual connections became standard architectural primitives in all modern deep networks."
                    )
                ),
                new Paper(
                    "Neural Synaptic Plasticity and Long-Term Memory Consolidation",
                    "Sheena A. Josselyn, Susumu Tonegawa",
                    2020,
                    "How memories are physically encoded in the brain has captivated neuroscientists for over a century. Here we review experimental evidence for memory engrams—ensembles of neurons that undergo lasting synaptic alterations following experience. Optogenetic activation and single-cell sequencing reveal how engrams are consolidated from hippocampus to neocortex.",
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
                    "Timothy M. Lenton, Johan Rockström, Owen Gaffney, Stefan Rahmstorf, Katherine Richardson, et al.",
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
                    "@article{lenton2019climate,\n  title={Climate tipping points—too risky to bet against},\n  author={Lenton, Timothy M and Rockstr{\"o}m, Johan and Gaffney, Owen and others},\n  journal={Nature},\n  volume={575},\n  number={7784},\n  pages={592--595},\n  year={2019},\n  publisher={Nature Publishing Group}\n}",
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
                )
            );

            paperRepository.saveAll(papers);
            System.out.println("✅ Seeded " + papers.size() + " landmark research papers into MySQL database.");
        }
    }
}
