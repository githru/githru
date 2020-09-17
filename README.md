# Githru
### Visual Analytics for Understanding Software Development History Through Git Metadata Analysis
 
 <img src="http://hcil.snu.ac.kr/system/researches/representative_images/61/retina/89860877934ce486cdfe2caadd884eb77de5a289.png"/>
 
Githru is an interactive visual analytics system that enables developers to effectively understand the context of development history through the interactive exploration of Git metadata. We design an interactive visual encoding idiom to represent a large Git graph in a scalable manner while preserving the topological structures in the Git graph. 

To enable scalable exploration of a large Git commit graph, we propose novel techniques (graph reconstruction, clustering, and Context-Preserving Squash Merge (CSM) methods) to abstract a large-scale Git commit graph. Based on these Git commit graph abstraction techniques, Githru provides an interactive summary view to help users gain an overview of the development history and a comparison view in which users can compare different clusters of commits. 
 
## Demo
Visit our [Demo page](https://githru.github.io/demo/)!!

## References
Youngtaek Kim, Jaeyoung Kim, Hyeon Jeon, Young-Ho Kim, Hyunjoo Song, Bohyoung Kim, and Jinwook Seo, "Githru: Visual Analytics for Understanding Software Development History Through Git Metadata Analysis", IEEE VIS 2020 (VAST)

- [arXiv](https://arxiv.org/abs/2009.03115)
- [PDF](http://hcil.snu.ac.kr/system/publications/pdfs/000/000/146/original/Githru__git_graph_visualization_for_understanding_code_history_IEEE_CPS.pdf?1599199367)


## Apply to your repo!!

TBD

## Video Preview
TBD

## Citation

#### bibtex

```
@misc{kim2020githru,
    title={Githru: Visual Analytics for Understanding Software Development History Through Git Metadata Analysis},
    author={Youngtaek Kim and Jaeyoung Kim and Hyeon Jeon and Young-Ho Kim and Hyunjoo Song and Bohyoung Kim and Jinwook Seo},
    year={2020},
    eprint={2009.03115},
    archivePrefix={arXiv},
    primaryClass={cs.SE}
}
```

## Install and Run
```
git clone https://github.com/githru/githru.git
cd frontend
npm i
npm start
```

visit 
- http://localhost:3000/v2/realm-java/v
- http://localhost:3000/v2/vue
