# Githru
### Visual Analytics for Understanding Software Development History Through Git Metadata Analysis
 
 <img src="https://user-images.githubusercontent.com/38465539/124102900-bb2ce600-da9b-11eb-903c-a5bcbbe3a295.gif"/>
 
Githru is an interactive visual analytics system that enables developers to effectively understand the context of development history through the interactive exploration of Git metadata. We design an interactive visual encoding idiom to represent a large Git graph in a scalable manner while preserving the topological structures in the Git graph. 

To enable scalable exploration of a large Git commit graph, we propose novel techniques (graph reconstruction, clustering, and Context-Preserving Squash Merge (CSM) methods) to abstract a large-scale Git commit graph. Based on these Git commit graph abstraction techniques, Githru provides an interactive summary view to help users gain an overview of the development history and a comparison view in which users can compare different clusters of commits. 
 
## Demo
Visit our [Demo page](https://githru.github.io/demo/)!!

## References
Youngtaek Kim, Jaeyoung Kim, Hyeon Jeon, Young-Ho Kim, Hyunjoo Song, Bohyoung Kim, and Jinwook Seo, "Githru: Visual Analytics for Understanding Software Development History Through Git Metadata Analysis", IEEE VIS 2020 (VAST)

- [IEEE](https://ieeexplore.ieee.org/abstract/document/9222261)
- [arXiv](https://arxiv.org/abs/2009.03115)


## Apply to your repo!!

TBD

## Video Preview
TBD

## Citation

#### bibtex

```
@ARTICLE{kim2021tvcg,
  author={Kim, Youngtaek and Kim, Jaeyoung and Jeon, Hyeon and Kim, Young-Ho and Song, Hyunjoo and Kim, Bohyoung and Seo, Jinwook},
  journal={IEEE Transactions on Visualization and Computer Graphics}, 
  title={Githru: Visual Analytics for Understanding Software Development History Through Git Metadata Analysis}, 
  year={2021},
  volume={27},
  number={2},
  pages={656-666},
  doi={10.1109/TVCG.2020.3030414}}
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
