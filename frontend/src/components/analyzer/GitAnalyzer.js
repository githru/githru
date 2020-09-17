import { CommitCluster, CommitNode, CommitEdge, CommitAttributeNames, PreferenceWeights, BranchTypes } from "./GithruClasses";
import * as d3 from 'd3';
import { BranchColors, Tableau10, AttributeColors } from "../ColorClasses";
import { getScoreTemp } from "../CalSimilarity";

export class GitAnalyzer {
    "use strict";

    constructor(json, scoreJson, corpusJson, pullJson, defaultThresholdStep, repoName, releasePrefix = "", mainStemBranchName) {
        this.lowLevel = 2;

        this.roots = [];
        this.allNodeList = [];
        this.nodesMap = {};
        this.edges = [];

        this.firstParentIdMap = {};
        this.childIdMap = {};
        this.parentIdMap = {};

        this.maxY = 0;
        this.headId = "";

        this.branchesMap = {};

        this.gitData = json;
        this.scoreData = scoreJson;
        this.corpusData = corpusJson;
        this.pullData = (pullJson === undefined ? [] : pullJson);
        this.pullMapByNumber = {};
        this.defaultThresholdStep = defaultThresholdStep;
        this.pref = PreferenceWeights;

        this.repoName = repoName;
        this.mainStemBranchName = mainStemBranchName;
        // this.pullMap = {};
        this.releasePrefix = (releasePrefix === undefined ? "" : releasePrefix);
console.log("URL Params:", this.repoName, this.mainStemBranchName);
        this.mergeSquashCommitNumber = -1;

        this.buildContextAbstractionGraph();
    }

    getNodeById(id) {
        return this.nodesMap[id];
    }

    addRoot(node) {
        node.isRoot = true;
        this.roots.push(node);
    }

    addNode(node) {
        // if (node.commit.isHead === true) {
        if ( (this.mainStemBranchName === undefined && node.commit.isHead === true)
                || (this.mainStemBranchName !== undefined 
                    && node.commit.branches !== undefined
                    && node.commit.branches.filter( b => b === "origin/" + this.mainStemBranchName).length > 0)) {
            this.headId = node.id;
            node.isMainStem = true;
            node.implicitBranchNo = 0;
            // node.y = 1;
console.log("meet head", node);
        }
        this.nodesMap[node.id] = node;
    }

    // 중복처리 해야함.
    addEdge(edge) {
        if (edge.fromNodeId in this.parentIdMap) this.parentIdMap[edge.fromNodeId].push(edge.toNodeId);
        else this.parentIdMap[edge.fromNodeId] = [edge.toNodeId];

        if (edge.toNodeId in this.childIdMap) this.childIdMap[edge.toNodeId].push(edge.fromNodeId);
        else this.childIdMap[edge.toNodeId] = [edge.fromNodeId];

        this.edges.push(edge);
    }

    getChildNodes(node) {
        if (this.childIdMap[node.id] === undefined) return [];
        return this.childIdMap[node.id].map( (id) => this.getNodeById(id));
    }

    getParentNodes(node) {
        if (this.parentIdMap[node.id] === undefined) return [];
        return this.parentIdMap[node.id].map( (id) => this.getNodeById(id));
    }
    
    ////////////////////////////////////////////////
    // RECURSIVELY FIND MERGE NODES
    findMerges(rootNode) {
if (rootNode.id.startsWith("461cc1")) console.log("rootNode", rootNode)
        let initStack = rootNode.commit["parents"]
            .filter( (d, i) => i !== 0 ) // not first Parent
            .map( id => this.getNodeById(id))
            .filter( node => (!node.isMainStem && !node.isMergeTraversed && (node.implicitBranchNo !== rootNode.implicitBranchNo) ));
        
        while (initStack.length > 0) {
            let n = initStack.pop();
            n.isMergeTraversed = true;
            n.mergedToNode = rootNode;
            rootNode.mergeNodes.push(n);
            if (n.isRelease) rootNode.mergeNodesContainRelease = true;
            if (n.isMajorRelease) rootNode.mergeNodesContainMajorRelease = true;

            let more = n.commit["parents"]
                .map( id => this.getNodeById(id) )
                .filter( node => (!node.isMainStem && !node.isMergeTraversed && node.implicitBranchNo !== rootNode.implicitBranchNo) );
                // .filter( node => (!node.isMainStem && !node.isMergeTraversed) );// &&node.implicitBranchNo !== rootNode.implicitBranchNo) );
            if (more.length > 0) initStack = initStack.concat(more);
// if (n.id.startsWith("1848f7d")) console.log("root ", rootNode, initStack.map(d=>d))
// if (n.id.startsWith("461cc1")) console.log("got it", n, n.commit["parents"].map( id => this.getNodeById(id) )[0].isMergeTraversed, initStack.map(d=>d));
        }

        // MAKE SQUASH COMMIT FOR HEURISTIC MERGE
        if (rootNode.mergeNodes.length === 0) return;

        rootNode.mergeSquashCommit = {
            no: this.mergeSquashCommitNumber--,
            author: Array.from([rootNode, ...rootNode.mergeNodes].reduce( (prev, n) => prev.add(n.commit.author), new Set())),
            commitType: Array.from([rootNode, ...rootNode.mergeNodes].reduce( (prev, n) => prev.add(n.commit.commitType), new Set())),
            diffStat: rootNode.commit.diffStat,
            corpus: Array.from(
                [rootNode, ...rootNode.mergeNodes].reduce( (prev, n) => {
                    [
                        ...n.commit.corpus, 
                        ...n.pullRequestHeads.reduce( (p, number) => p.concat(this.pullMapByNumber[number].corpus), [])
                    ].forEach(corpus => prev.add(corpus));
                    
                    return prev;
                }, new Set())),
            tfidf: [rootNode, ...rootNode.mergeNodes].reduce( (prev, n) => {
                    let tfidfList = Object.entries(n.commit.tfidf);
                    n.pullRequestHeads.map(number => this.pullMapByNumber[number]).forEach(pull => {
                        tfidfList = tfidfList.concat(Object.entries(pull.tfidf));
                    });
                    tfidfList.forEach( entry => {
                        let [key, value] = entry;
                        if (key in prev) prev[key] += value;
                        else prev[key] = value;
                    });
                    return prev;
                }, {}),
            date:rootNode.commit.date,
        }
    }

    buildContextAbstractionGraph() {
        let commits = this.gitData.reverse();
        
        // nodes
        commits.forEach( (commit, index) => {
            let node = new CommitNode(commit.id, commit);
            this.addNode(node);
            this.allNodeList.push(node);

            node.seq = index;

            // root check.
            if (commit.parents.length === 0) {
                this.addRoot(node);
            } else {
                this.firstParentIdMap[node.id] = commit.parents[0];
            }

            // merge commit check
            if ("merge" in commit && commit["merge"].length > 0) {
                node.isMergeCommit = true;
            }

            node.cloc = node.commit["diffStat"]["insertions"] + node.commit["diffStat"]["deletions"];
        });

        ///////////////////////////////////////////
        // connect pulls to merged commits
        if (this.pullData !== undefined) {
            // SET pull map
            this.pullData.forEach(p => this.pullMapByNumber[p.number] = p);

            this.pullData.forEach( (pull) => {
                let number = pull.number;
                let parent = pull.head.sha;
                let child = pull.merge_commit_sha;
    if (this.getNodeById(parent) === undefined || (child !== undefined && this.getNodeById(child) === undefined)) return;
    // console.log("this.getNodeById[parent]", this.getNodeById(parent), parent)
                this.getNodeById(parent).pullRequestHeads.push(number);

                if (d => d.merge_commit_sha !== null) {
                    if ( !(child in this.nodesMap) ||  !(parent in this.nodesMap)) return;

                    let childCommit = this.nodesMap[child].commit;

                    if (childCommit.parents.findIndex(d => d === parent) >= 0) {
                        // console.log("already pull linked")
                        return;
                    }

                    childCommit.parents.push(parent);
                    if (childCommit.merge === undefined) {
                        childCommit.merge = [].concat([childCommit.parents.map(d => d.substring(0, 9) + "_p")]);
                    } else {
                        childCommit.merge.push(parent.substring(0, 9) + "_p");
                    }

                    this.getNodeById(childCommit.id).isMergeCommit = true;
                    this.nodesMap[child].pullRequestMerges.push(number);
                }
            });
        }

        // edge(network)
        commits.forEach(commit => {
            commit.parents.forEach(parentId => {
                let edge = new CommitEdge(commit.id, parentId);
                this.addEdge(edge);
            });
        });

        // set tagging information
        this.allNodeList.forEach(d => {
            if (d.commit.tags !== undefined && d.commit.tags.length > 0) {
                let tags = d.commit.tags.filter(tag => tag.startsWith(this.releasePrefix) === true).map(tag => tag.substring(this.releasePrefix.length, tag.length));
                if (tags.length <= 0) return;

                d.isRelease = true;
                d.releaseTagString = tags.join(",");
                tags = tags.filter(tag => {
                    let items = tag.split(".");
                    if (items.length === 2 && items[1] === "0") return true;
                    if (items.length === 3 && items[1] === "0" && items[2] === "0") return true;
                    else return false;
                });
                if (tags.length > 0) d.isMajorRelease = true;
            }
        });

        let branchedNodesNotHead = this.allNodeList.filter( node => 
            node.id !== this.headId
            // && this.getChildNodes(node).length === 0 
            && node.commit.branches !== undefined && node.commit.branches.length > 0
        ).reverse();

        // branchedNodes.reverse();
        let branchedNodes = [this.getNodeById(this.headId)].concat(branchedNodesNotHead);
        
        let FPTreeNodeListMapByNodeId = {};
// console.log("branchedNodes", branchedNodes)

        branchedNodes.forEach( branchedNode => {
            // newBranchNoByNodeId[branchedNode.id] = newBranchNo++;
// if (branchedNode.id.startsWith("b35dabf")) console.log("branchedNode", branchedNode);
            let id = branchedNode.id;
            let firstParentNodesOrderedList = [];
            let firstParentTreeBranchNames = this.nodesMap[id].commit.branches;
            let isHeadBranch = (id === this.headId);
            branchedNode.isLeaf = true;
            branchedNode.traversed = true;
            branchedNode.firstParentTreeBranchNames = firstParentTreeBranchNames;
            branchedNode.firstParentTreeLeafNode = branchedNode;

            while (id in this.firstParentIdMap) {
                id = this.firstParentIdMap[id];
                let node = this.getNodeById(id);

// if (branchedNode.id.startsWith("b35dabf")) console.log("branchedNode while ", node);
                if (node.traversed === true) break;

                if (isHeadBranch) {
                    node.isMainStem = true;
                    node.implicitBranchNo = 0;
                } else {
                    if (node.commit.branches !== undefined && node.commit.branches.length > 0) {
                        break;
                    }
                }

                firstParentNodesOrderedList.push(node);

                // TODO - suppose that isHead = origin/master
                // it is NOT commit's branch name but node's
                node.firstParentTreeBranchNames = firstParentTreeBranchNames;
                node.firstParentTreeLeafNode = branchedNode;
                // node.branches = headBranchNames;
                node.traversed = true;
            }

            FPTreeNodeListMapByNodeId[branchedNode.id] = firstParentNodesOrderedList;
        });


        /////////////////////////////////////
        // get implicit branch number
        let bno = 0;
        let rootCount = 0;
        this.allNodeList.forEach(node => {
            // when meet other roots
            if (node.isRoot && !node.isMainStem) {
                node.implicitBranchNo += 10000 + this.allNodeList.length + rootCount++;
            }

            let firstParentChildNodes = this.getChildNodes(node).filter(childNode => this.firstParentIdMap[childNode.id] === node.id);
            if (firstParentChildNodes.length === 0) {
                node.hasNoFirstParentChild = true;
                return;
            }
            let implicitBranchNo = node.implicitBranchNo;
            firstParentChildNodes
                .sort( (a, b) => (b.seq - a.seq))
                .sort( (a, b) => (b.implicitBranchNo - a.implicitBranchNo))
                .forEach( (childNode, i) => {
                    if (i === 0) {
                        childNode.implicitBranchNo = implicitBranchNo;
                    } else {
                        childNode.implicitBranchNo = ++bno;
                    }
            });
        });

        // branchedNodes = [this.getNodeById(this.headId)].concat(branchedNodesNotHead.reverse());
        branchedNodes = [this.getNodeById(this.headId)].concat(branchedNodesNotHead);
        branchedNodes.forEach( node => {
            FPTreeNodeListMapByNodeId[node.id]
                .reverse()
                .filter(d => d.isMergeCommit)
                .forEach( node => {
                    if (!node.isMergeTraversed) this.findMerges(node);
                });
        });

        // back to original
        this.gitData.reverse();
    }

    branchBackTracking(node, branchNames) {
        // masterFist가 보일 때 까지, 혹은 끝까지 갈 때 까지 add 시키자.

        // TODO 
        // branch 가 없는 애들을 찾아서 first parent가 이름을 가지고 있을 때까지 돌려서 해당 이름을 쭉 가지게 만들고
        // origin/master는 골라서 유지하도록 만들어야 함.
        node.branches = node.branches.concat(branchNames);
        node.branchNumbers = node.branchNumbers.concat(branchNames.map(d => this.branchesMap[d]));
        if (node.isMainStem || node.commit.parents.length === 0) {
            return;
        } else {
            this.branchBackTracking(this.nodesMap[node.commit.parents[0]], branchNames);
        }
    }

    getOverviewClusters(threshold, selection, prefMap = PreferenceWeights, filters, releaseBinningLevel, useHeuristicMerge) {
// console.log(selection)
        let nodeList;
        if (selection !== undefined) nodeList = this.allNodeList.filter( (d, i) => i >= selection[0] && i <= selection[1]);
        else nodeList = this.allNodeList;
        return this.getClusters(threshold, nodeList, prefMap, filters, releaseBinningLevel, useHeuristicMerge);
    }

    isClusterCut(node, releaseBinningLevel, useHeuristicMerge) {
        // cut clustering(grouping) if meet release node
        if ( (releaseBinningLevel === 2 && (node.isMajorRelease || (useHeuristicMerge && node.mergeNodesContainMajorRelease)))
                || (releaseBinningLevel === 1 && (node.isRelease || (useHeuristicMerge && node.mergeNodesContainRelease)))) {
            return true;
        }
        return false;
    }

    // TODO - need OPTIMIZATION
    keywordMatch = (kfList, node) => kfList.filter( f => {
        let [attr, val] = [f.attrName, f.keyword.toLowerCase()];
// console.log("test", attr, val, node.commit.author, node.commit.author.toLowerCase().indexOf(val))
        switch(attr.toLowerCase()) {
            case "a":
                return node.commit.author.toLowerCase().indexOf(val) >= 0;
            case "t":
                return node.commit.commitType.toLowerCase().indexOf(val) >= 0;
            case "f":
                return Object.keys(node.commit.diffStat.files).filter(name => name.toLowerCase().indexOf(val) >= 0).length > 0;
            case "m":
                // return Object.keys(node.commit.corpus).filter(name => name.toLowerCase().indexOf(val) >= 0).length > 0;
                return node.commit.corpus.filter(name => name.toLowerCase().indexOf(val) >= 0).length > 0;
            default:
                return false;
    }}).length > 0;

    // releaseBinningLevel
    // 0: none, 1: major, 2: isRelease (temporary)
    getClusters(threshold, nodeList, prefMap = PreferenceWeights, keywordFilterList, releaseBinningLevel = 0, useHeuristicMerge = true) {

        // KEYWORD FILTERS
        if (keywordFilterList.length > 0) {
            nodeList.forEach((node) => {
                // console.log("filter:::", node.commit.author, this.keywordMatch(keywordFilterList.filter(f => f.isIncludes), node));
                let inKF = keywordFilterList.filter(f => f.isIncludes);
                let exKF = keywordFilterList.filter(f => !f.isIncludes);
                let isIncludes, isExcludes;

                if (inKF.length === 0) isIncludes = true;
                else isIncludes = this.keywordMatch(inKF, node);
                if (exKF.length === 0) isExcludes = false;
                else isExcludes = this.keywordMatch(exKF, node);

                node.isFilteredOut = !(isIncludes && !isExcludes);
        // console.log("####!!!", node.commit.author, node.isFilteredOut, isIncludes, isExcludes)

            });
        } else {
            nodeList.forEach( node => node.isFilteredOut = false);
        }
        
// console.log("getclusters, FILTERS ", keywordFilterList, nodeList);

        // build threshold set
        let thresholdSet = new Set();
        nodeList.filter(node => !node.isFilteredOut).forEach( (node, i) => {
            let parentNode = node;
            while (true) {
                let nextFirstParentChildNodeWithSameBranchNo = this.getChildNodes(parentNode)
                    .filter(childNode => this.firstParentIdMap[childNode.id] === parentNode.id && parentNode.implicitBranchNo === childNode.implicitBranchNo);
                if (nextFirstParentChildNodeWithSameBranchNo.length === 0) {
                    break;
                } else if (nextFirstParentChildNodeWithSameBranchNo[0]) {
                    let scores = this.getScoreByPreferences(parentNode, nextFirstParentChildNodeWithSameBranchNo[0], prefMap, useHeuristicMerge);
                    thresholdSet.add(scores.sum);
// console.log("NaN node", scores.sum,node, scores, parentNode, nextFirstParentChildNodeWithSameBranchNo[0], prefMap, useHeuristicMerge)
                    break;
                }
                parentNode = nextFirstParentChildNodeWithSameBranchNo[0];
            }
        });
        thresholdSet.add(0);
        thresholdSet.add(Object.keys(prefMap).length);
        let sortedThresholdList = [...thresholdSet].sort((a, b) => a - b);
        // sortedThresholdList.push(Object.keys(PreferenceWeights).length);
        // sortedThresholdList = [0].concat(sortedThresholdList);
console.log("thresholdSet", thresholdSet, sortedThresholdList, threshold, prefMap);
      
        if (threshold === undefined) {
            threshold = sortedThresholdList[this.defaultThresholdStep];
// console.log("new start thr. => ", threshold);
        }

        let container = [];
        let clusterMapByNodeSeq = {};
        // let prefSum = Object.values(prefMap).reduce( (prev, cur) => { prev += cur; return prev;}, 0);
        // let prefNormalizedThreshold = prefSum * threshold / 100;
        let prefNormalizedThreshold = threshold;

        let targetNodeList = nodeList.filter(node => !node.isFilteredOut);
        if (useHeuristicMerge) targetNodeList = targetNodeList.filter(node => !node.isMergeTraversed);
        
        targetNodeList.forEach( node => {
                if (clusterMapByNodeSeq[node.seq] !== undefined) return;

                let cluster = new CommitCluster(container.length, node, prefMap);
                container.push(cluster);
                clusterMapByNodeSeq[node.seq] = cluster;

                // cut clustering(grouping) if meet release node
                if(this.isClusterCut(node, releaseBinningLevel, useHeuristicMerge)) {
// console.log("cut!!!", node.releaseTagString)
                    return;
                }

                let parentNode = node;
                while(true) {
                    let firstParentChildNodes = this.getChildNodes(parentNode).filter(
                        childNode => 
                        nodeList.indexOf(childNode) >= 0
                        && this.firstParentIdMap[childNode.id] === parentNode.id
                        && parentNode.implicitBranchNo === childNode.implicitBranchNo
                    );
                    
                    if (firstParentChildNodes.length == 0) break;
                    let firstParentChildNode = firstParentChildNodes[0];
                     
                    if (firstParentChildNode.isFilteredOut) {
                        // continue
                        parentNode = firstParentChildNode;
                    } else {
                        let scores = this.getScoreByPreferences(node, firstParentChildNode, prefMap, useHeuristicMerge);

                        thresholdSet.add(scores.sum);
                        if (scores.sum >= prefNormalizedThreshold) {
                            clusterMapByNodeSeq[firstParentChildNode.seq] = cluster;
                            cluster.addNode(firstParentChildNode, scores);
                            parentNode = firstParentChildNode;
    // console.log("grouped!!,", firstParentChildNode.commit.author, firstParentChildNode)
                        } else {
                            break;
                        }
                    }

                    // cut clustering(grouping) if meet release node
                    if(this.isClusterCut(firstParentChildNode, releaseBinningLevel, useHeuristicMerge)) {
                        break;
                    }
                }
            }
        );

        // set parent/child
        let doneSet = new Set();
        container.forEach( cluster => {
            // connect when implicitBranchNo is the same;
            let implicitBranchNo = cluster.nodeList[0].implicitBranchNo;
            if (!doneSet.has(implicitBranchNo)) {
                let sameBranchClusters = container.filter( c => c.nodeList[0].implicitBranchNo === implicitBranchNo).sort( (a, b) => a.nodeList[0].seq - b.nodeList[0].seq);
                sameBranchClusters.filter( (d, i) => i < sameBranchClusters.length - 1).forEach( (cluster, i) => {
                    cluster.child = sameBranchClusters[i + 1];
                    sameBranchClusters[i + 1].parent = cluster;
                });
    
                doneSet.add(implicitBranchNo);
            }

            cluster.branches = Array.from(cluster.nodeList
                .filter(d => d.firstParentTreeBranchNames !== undefined && d.firstParentTreeBranchNames.length > 0)
                .reverse()
                .reduce( (prev, cur) => {
                    // add pr branches first, then explicit branches;
                    cur.firstParentTreeBranchNames.filter(name => name.startsWith("origin/pr")).forEach( d => prev.add(d) );
                    cur.firstParentTreeBranchNames.filter(name => !name.startsWith("origin/pr")).forEach( d => prev.add(d) );
                    return prev;
                }, new Set())
            );
        });

        return [threshold, sortedThresholdList, container];
    }

    getLowLevelThresholdAndClusters(cluster, prefMap = PreferenceWeights, useHeuristicMerge) {
        if (cluster === undefined) return [];

        this.defaultThresholdStep = 2;
        return this.getClusters(undefined, cluster.nodeList, prefMap, useHeuristicMerge);
    }

    static getTextValue(dataName, value) {
        if (dataName.endsWith("Files") || dataName.endsWith("Dirs")) {
            let vs = value.split("/");
            let fileName = vs.slice(-1)[0];
            if (vs.length > 1) fileName = ".../" + fileName;
            // return fileName;
            return value;
        } else if (dataName === "authors") {
            return value.split(" <")[0].split(" ")[0];
        } else if (dataName === "authors#2") {
            return value.split(" <")[0];
        } else if (dataName === "commitTypes") {
            return value.split("_eng")[0].toUpperCase();
        } else {
            return value;
        }
    }

    static replaceAll(str, searchStr, replaceStr) {
        return str.split(searchStr).join(replaceStr);
    }

    static searchByKeywords(nodeList, keywords, attrName = "fullText") {
        let resultNodeList = [];
        let findAttrs;
        if (attrName === "fullText") {
            // findAttrs = CommitAttributeNames;
            findAttrs = CommitAttributeNames.concat();
        } else {
            findAttrs = [attrName];
        }
        keywords = keywords.map(d => d.toLowerCase());
        nodeList.forEach((node) => {
            let foundMap = keywords.reduce((prev, cur) => {
                prev[cur] = false;
                return prev;
            }, {});
            
            findAttrs.forEach((attr) => {
                let values = [];
                if (attr === "files") values = values.concat(Object.keys(node.commit.diffStat.files));
                else if (!(attr in node.commit)) return;
                else values = values.concat(node.commit[attr]);
                values.forEach(v => {
                    // AND
                    Object.entries(foundMap).filter(d => !d[1])
                        .forEach(d => {
                            let keyword = d[0];
                            if (v.toLowerCase().indexOf(keyword) >= 0) {
                                foundMap[d[0]] = true;
                            }
                        })
                    ;
                });
            });

            // if all keywords found
            if (Object.entries(foundMap).filter(d => d[1]).length > 0) {
                resultNodeList.push(node);
            }
        });
        // console.log("resultNodeList", resultNodeList);
        return resultNodeList;
    }

    static trimYYYYMMDD(dt) {
        return new Date(dt).toISOString().slice(0, 10);
    }

    static parseTime(dt) {
        let parseTime = d3.timeParse("%Y-%m-%d");
        return parseTime(GitAnalyzer.trimYYYYMMDD(dt));
    }

    getClusterBranchType(cluster) {
// if (cluster.nodeList.slice(-1)[0].id.startsWith("1f2dc3")) console.log("!!!!", cluster)
        // if this cluster has children, then follow it.
        while (cluster.child !== undefined) {
            cluster = cluster.child;
        }

        // if most child has no branchName
        if (cluster.branches.length === 0) {
            while (cluster.parent !== undefined ) {
                if (cluster.branches.length > 0) break;
                else cluster = cluster.parent;
            }
        }

        let branchNames = cluster.branches;

        let lastBranchName = (branchNames.length > 0 ? branchNames[0] : "");
// if (cluster.nodeList.slice(-1)[0].id.startsWith("1f2dc3")) console.log("!!!!", cluster, branchNames, lastBranchName)
        // let implicitBranchNo = cluster.nodeList[0].implicitBranchNo;
        let lastNode = cluster.nodeList.slice(-1)[0];
        let type = BranchTypes.EXPLICIT;

        if (lastNode.implicitBranchNo === 0) {
            type = BranchTypes.MAIN_STEM;
        } else if (lastBranchName.startsWith("origin/pr")) {
            let prNum = Number(lastBranchName.substring("origin/pr/".length, lastBranchName.length));
            if (this.pullMapByNumber[prNum] === undefined) {
console.log("NO PULL!!!! .. might pr removed", prNum, lastBranchName);
                type = BranchTypes.PR_CLOSED;
            } else {
                let closed = (this.pullMapByNumber[prNum].state === "closed");
                let merged = this.pullMapByNumber[prNum].merged;

                if (merged) {
                    type = BranchTypes.PR_MERGED;
                } else if (closed) {
                    type = BranchTypes.PR_CLOSED;
                } else {
                    type = BranchTypes.PR_OPEN;
                }
            }
        } else if (lastBranchName === "") {
            type = BranchTypes.IMPLICIT;
        }

        return type;
    }

    getScoreByPreferences(node1, node2, prefMap, useHeuristicMerge, maxCommitHours = 96, verbose = false) {
        let scores = undefined;
        let commit1 = (useHeuristicMerge && node1.mergeSquashCommit !== undefined ? node1.mergeSquashCommit : node1.commit);
        let commit2 = (useHeuristicMerge && node2.mergeSquashCommit !== undefined ? node2.mergeSquashCommit : node2.commit);

        if (commit1.no in this.scoreData && commit2.no in this.scoreData[commit1.no]) {
            scores = this.scoreData[commit1.no][commit2.no];
        }
// console.log("commit1.no", commit1.no, commit2.no, scores, useHeuristicMerge, node1.mergeSquashCommit, node2.mergeSquashCommit);
        if (scores === undefined ) {
            // console.log("%%% far nodes' score ", scores, node1, node2);
            scores = getScoreTemp(commit1, commit2, verbose);
            
            if ((this.scoreData[commit1.no] !== undefined)) {
                this.scoreData[commit1.no][commit2.no] = scores;
            } else {
                this.scoreData[commit1.no] = {};
                this.scoreData[commit1.no][commit2.no] = scores;
            }
        }

        let dateNormFunc = d3.scaleLinear().range([1, 0]).domain([0, maxCommitHours]);
        let diffHours = Math.min(Math.abs(new Date(commit1.date) - new Date(commit2.date))/24, maxCommitHours);
        // let diffDays = Math.abs(new Date(a.date) - new Date(b.date))/24/60/1000/60;
        //score["commitDate"] = dateNormFunc(Math.log10(diffDays));
        scores["commitDate"] = Math.abs(dateNormFunc(diffHours));
    
        scores.sum = Number(Object.entries(prefMap).reduce( (prev, entry) => {
            prev += entry[1] * Math.abs(scores[entry[0]]);
            return prev;
        }, 0).toFixed(7));

        return scores;
    }

    static getBranchNamesFromBranchClusterNodes(branchClusterNodes) {
        return Array.from(branchClusterNodes.filter(cn => cn.cluster.branches.length > 0).reverse().reduce( (prev, cur) => {
            cur.cluster.branches.forEach( b => prev.add(b) );
            return prev;
        }, new Set())).map(b => (b.startsWith("origin/") ? b.substring(7, b.length) : b))
    }

    static reduceLongName(name,threshold) {
        if(name.length < threshold) {
            return name;
        }
        else {
            return name.slice(0, threshold) + "...";
        }
    }

}

export default GitAnalyzer;