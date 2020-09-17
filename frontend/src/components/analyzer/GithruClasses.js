import { cloneDeep } from 'lodash';

export class ViewNode {
    constructor(node) {
        this.node = node;
        this.x = undefined;
        this.y = undefined;
    }
}

export class ViewCluster {
    constructor(cluster) {
        this.cluster = cluster;
    }
}

export class CommitNode {
    constructor(id, commit) {
        // default
        this.id = id;
        this.commit = commit;
        this.seq = 0;

        // toplology
        this.hasNoFirstParentChild = false;
        this.isMainStem = false;
        this.isRoot = false;
        this.implicitBranchNo = -1;

        // context
        this.isMergeCommit = false;
        this.isMergeTraversed = false;
        this.mergedToNode = undefined;

        this.isLeaf = false;
        this.pullRequestHeads = [];
        this.pullRequestMerges = [];

        this.mergeNodes = [];
        this.mergeSquashCommit = undefined;
        this.mergeNodesContainRelease = false;
        this.mergeNodesContainMajorRelease = false;
        this.cloc = 0;

        // Filtering
        this.isFiltered = true;

        // 
        this.tags = [];
        this.branches = [];
        // this.notFirstParentTreeBranchNames = [];
        // this.notFirstParentTreeLeafNode = undefined;
        this.firstParentTreeBranchNames = [];
        this.firstParentTreeLeafNode = undefined;
        this.branchNumbers = [];
        this.traversed = false;
        
        this.isMajorRelease = false;
        this.isRelease = false;
        this.releaseTagString = undefined;

        // this.cluster = undefined;
        this.locStat = new LOCStat();
        this.calCLOCStat();
    }

    calCLOCStat() {
        if (this.commit === undefined) {
            console.log("COMMIT UNDEFINED");
            return;
        }
        
        Object.entries(this.commit.diffStat.files).forEach( entry => {
            // files
            let [fileName, value] = entry;
            this.locStat.clocSum += value.insertions + value.deletions;
            this.locStat.insertLocSum += value.insertions;
            this.locStat.deleteLocSum += value.deletions;
        });
    }
}

export class LOCStat {
    constructor(locStat, ratio = 1) {
        this.clocSum = 0;
        this.insertLocSum = 0;
        this.deleteLocSum = 0;
        if (locStat !== undefined) this.addStat(locStat, ratio);
    }
    
    addStat(targetStat, ratio = 1) {
        this.clocSum += targetStat.clocSum * ratio;
        this.insertLocSum += targetStat.insertLocSum * ratio;
        this.deleteLocSum += targetStat.deleteLocSum * ratio;
    }
}

export class CommitEdge {
    constructor(childId, parentId) {
        this.fromNodeId = childId;
        this.toNodeId = parentId;
    }
}

export class CommitCluster {
    constructor(id, node, pref) {
        this.nodeCount = 0;
        this.mergedNodeCount = 0;
        this.locStat = new LOCStat();
        this.onPullRequestBranch = false;
        
        if (id === undefined) {
            this.id = -1;
            this.nodeList = [];
            return;
        } else {
            this.id = id;
            this.nodeList = [node];
            node.cluster = this;
            this.nodeCount++;
            this.mergedNodeCount += node.mergeNodes.length;

            this.locStat.addStat(node.locStat);
        }

        this.parent = undefined;
        this.child = undefined;

        this.pref = pref;
        this.branches = [];

        this.scoresList = [];
    }

    addNode(node, score = 0) {
        node.cluster = this;
        this.nodeList.push(node);
        this.nodeCount++;
        this.mergedNodeCount += node.mergeNodes.length;
        this.locStat.addStat(node.locStat);

        this.scoresList = [score];
    }
}

export class CommitAuthor {
    constructor(name, email, githubId) {
        this.name = name;
        this.email = email;
        this.githubId = githubId;
    }
}

export const DataTypeByNameMap = {
    authors:"author",
    authorsLOCStat:"author",
    keywords:"keyword",
    commitTypes:"commitType",
    commitTypesLOCStat:"commitType",
    clocByFiles:"file",
    insertionByFiles:"file",
    deletionByFiles:"file",
    touchCountByFiles:"file",
    clocByDirs:"dir",
    insertionByDirs:"dir",
    deletionByDirs:"dir",
    touchCountByDirs:"dir",
    fileToAuthor:"file",
    commitCount:"commit",
}

export class ClusterData {
    constructor(cluster, corpusData, useHeuristicMerge) {
        this.cluster = cluster;
        this.corpusData = corpusData;
        // this.fileToAuthor = {};
        this.idxToTfidfSum = {};
        this.keywordsByRank = [];
        // this.idxToTfidfLOCStatSum = {};

        // init
        Object.keys(DataTypeByNameMap).forEach( (name) => this[name] = {});
        // Object.keys(ClusterLOCDataNamesMap).forEach( (name) => this[name] = {});
        this.analyze(cluster, useHeuristicMerge);
    }

    analyze(cluster, useHeuristicMerge) {
        // additional infos 
        // this.wordTfIdfRank = [];

        // by jeonhyun97
        let mockKeywords = {};
        // let mockKeywordsLOCStat = {};

        cluster.nodeList.forEach( (node) => {
            let isHM = useHeuristicMerge && node.mergeSquashCommit !== undefined ? true : false;
            let commit = cloneDeep(useHeuristicMerge && node.mergeSquashCommit !== undefined ? node.mergeSquashCommit : node.commit);
            // temporary
            if (!(commit.author instanceof Array)) commit.author = [commit.author];
            if (!(commit.commitType instanceof Array)) commit.commitType = [commit.commitType];

            this.increaseMapValueByKeyArray(this.authors, commit.author);
            this.increaseMapValueByKeyArray(this.authorsLOCStat, commit.author, node.locStat);
            this.increaseMapValueByKeyArray(this.commitTypes, commit.commitType);
            this.increaseMapValueByKeyArray(this.commitTypesLOCStat, commit.commitType, node.locStat);

            let uniqCorpus = Object.keys(commit.corpus.reduce( (prev, cur) => {prev[cur] = true; return prev;}, {}));
            uniqCorpus.forEach( (c) => this.increaseMapValueByKey(mockKeywords, c));

            if(!isHM) {
                let fileInfos = commit.diffStat.files;
                console.log("INFO", fileInfos);
                for(let file in fileInfos) {

                    if(this.fileToAuthor[file] == undefined) 
                        this.fileToAuthor[file] = {};
                    if(this.fileToAuthor[file] != undefined) {
                        let author = commit.author;
                        if(this.fileToAuthor[file].hasOwnProperty(author)) { // if file already holding author
                            this.fileToAuthor[file][author].insertions += fileInfos[file].insertions;
                            this.fileToAuthor[file][author].deletions += fileInfos[file].deletions;
                            this.fileToAuthor[file][author].count += 1;
                        }
                        else {
                            let dict = {
                                insertions : fileInfos[file].insertions,
                                deletions : fileInfos[file].deletions,
                                count : 1
                            }
                            this.fileToAuthor[file][author] = dict;
                        }
                    }
                }
            }

            else {
                node.mergeNodes.forEach(commitNode => {
                    let subCommit = commitNode.commit;
                    let fileInfos = subCommit.diffStat.files;
                    let author = subCommit.author;
                    for(let file in fileInfos) {
                        if(this.fileToAuthor[file] == undefined) 
                            this.fileToAuthor[file] = {};
                        
                        if(this.fileToAuthor[file].hasOwnProperty(author)) {
                            this.fileToAuthor[file][author].insertions += fileInfos[file].insertions;
                            this.fileToAuthor[file][author].deletions += fileInfos[file].deletions;
                            this.fileToAuthor[file][author].count += 1;
                        }
                        else {
                            let dict = {
                                insertions : fileInfos[file].insertions,
                                deletions : fileInfos[file].deletions,
                                count : 1
                            }
                            this.fileToAuthor[file][author] = dict;;
                        }
                    }
                })

            }

            for (let idx in commit.tfidf) {
                if (this.idxToTfidfSum[idx] != undefined) {
                    this.idxToTfidfSum[idx] += commit.tfidf[idx];
                    // this.idxToTfidfLOCStatSum[idx].addStat(node.locStat);
                }
                else {
                    this.idxToTfidfSum[idx] = commit.tfidf[idx];
                    // this.idxToTfidfLOCStatSum[idx] = node.locStat;
                }
            }

            let alreadyIncreased= {};
            Object.keys(commit.diffStat.files).forEach( (fileName) => {
                // files
                let f = commit.diffStat.files;
                let clocSum = f[fileName].insertions + f[fileName].deletions;
                
                if (!(fileName in alreadyIncreased)) {
                    this.increaseMapValueByKey(this.touchCountByFiles, fileName);
                    alreadyIncreased[fileName] = true;
                }
                this.addValueToMap(this.clocByFiles, fileName, clocSum);
                this.addValueToMap(this.insertionByFiles, fileName, f[fileName].insertions);
                this.addValueToMap(this.deletionByFiles, fileName, f[fileName].deletions);

                // dirs
                let fileNameSlice = fileName.split("/");
                if (fileNameSlice.length > 1) {
                    let dirs = fileNameSlice.slice(0, fileNameSlice.length - 2).reduce( (prev, cur, i) => {
                        let prevDir = (i > 0 ? prev[prev.length - 1] + "/" : "");
                        prev.push(prevDir + cur);
                        return prev;
                    }, []);

                    dirs.forEach( dir => {
                        if (!(dir in alreadyIncreased)) {
                            this.increaseMapValueByKey(this.touchCountByDirs, dir);
                            alreadyIncreased[dir] = true;
                        }
                        this.addValueToMap(this.clocByDirs, dir, clocSum);
                    });
                }
            });
        });

        for (let idx in this.idxToTfidfSum) {
            this.keywordsByRank.push([this.corpusData[idx], this.idxToTfidfSum[idx]])
        }
        this.keywordsByRank.sort(function (a,b) {
            return b[1] - a[1];
        });

        
        this.keywordsByRank.forEach(e => {
            this.keywords[e[0]] = [mockKeywords[e[0]], e[1]];
            // this.keywordsLOCStat[e[0]] = [mockKeywordsLOCStat[e[0]], e[1]];
        });
    }

    increaseMapValueByKey(map, key) {
        this.addValueToMap(map, key, 1);
    }

    increaseMapValueByKeyArray(map, keyArray, locStat) {
        if (locStat === undefined) {
            keyArray.forEach(key => this.addValueToMap(map, key, 1/keyArray.length));
        } else {
            keyArray.forEach(key => this.addLOCStatValueToMap(map, key, locStat, 1/keyArray.length));
        }
    }

    addValueToMap(map, key, value) {
        if (map[key] !== undefined) map[key] += value;
        else map[key] = value;
    }

    addLOCStatValueToMap(map, key, locStat, ratio) {
        if (map[key] !== undefined) map[key].addStat(locStat, ratio);
        else map[key] = new LOCStat(locStat, ratio);
    }
}

export class ClusterNode {
    constructor(cluster) {
        this.cluster = cluster;

        // this.startX = 0;
        // this.endX = 0;

        this.y = 0;
        this.blockList = [];

        // box layout
        this.x = 0;
        this.width = 0;
        this.height = 0;
        this.color = undefined;
        this.branchType = undefined;
        this.isNonConfilctMerge = false;

        this.isIncludeFiltered = false;
        this.isExcludeFiltered = false;
    }
}

export class ClusterBlock {
    constructor(id, nodeList, startCommitSeq, endCommitSeq, x, 
            containsMergedNodes = false, containsMergeTraversedNodes = false, mergedToNodeList = [], clusterNode) {
        this.id = id;
        this.startCommitSeq = startCommitSeq;
        this.endCommitSeq = endCommitSeq;
        this.commitCount = nodeList.length;

        this.x = x;

        this.nodeList = nodeList;
        this.isNonConflictMergedSource = false;
        this.isNonConflictMergedTarget = false;
        this.containsMergedNodes = containsMergedNodes;
        this.containsMergeTraversedNodes = containsMergeTraversedNodes;
        this.containsMajorRelease = false;
        this.mergedToNodeList = mergedToNodeList;

        this.releaseTagString = "";
        this.releaseNodeList = [];

        this.clusterNode = clusterNode;
        
        this.HALinkIds = [];
    }
}

export class KeywordFilter {
    constructor (isIncludes, attrName, keyword) {
        this.isIncludes = isIncludes;
        this.attrName = attrName;
        this.keyword = keyword;
    }
}

export class CapturedSummaryInfo {
    constructor(id, clusterNodes, groupingParameters, interestedItemList = []) {
        this.id = id;
        this.clusterNodes = clusterNodes;
        this.groupingParameters = groupingParameters;
        this.interestedItemList = interestedItemList;        
    }
}


export var CommitAttributeNames = [
    "id", "parents", "files", "message", "author", "commitType", "corpus", "branches", "tags",
];

export var PreferenceList = [
    "author", 
    "message",
    "file", 
    "commitType",
    "commitDate", 
];

export var PreferenceWeights = {
    author: 1,
    commitDate: 1,
    file: 1,
    message: 1,
    commitType: 1,
};

export var AttrsAbbreviationMap = {
    "authors": "Ⓐ",
    "keywords": "Ⓜ", 
    "commitTypes": "Ⓣ",
    "touchCountByFiles": "Ⓕ", 
    "touchCountByDirs": "Ⓓ",
}

export var BranchTypes = {
    MAIN_STEM: "MAIN_STEM",
    EXPLICIT: "EXPLICIT", 
    IMPLICIT: "IMPLICIT",
    PR_MERGED: "PR_MERGED",
    PR_CLOSED: "PR_CLOSED",
    PR_OPEN: "PR_OPEN",
}