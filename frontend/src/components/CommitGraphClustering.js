import * as d3 from 'd3';
import { ClusterBlock, ClusterNode } from "./analyzer/GithruClasses";

export function buildClusterNodes(gitAnalyzer, threshold, thresholdList, clusterList, branchShowMapByType) {
    // console.log("clusterOverviewRender", pref, threshold, releaseBinningLevel, gitAnalyzer, selection, keywordFilterList);
    if (threshold === undefined) threshold = 0;
    let clusterNodeList = [];
    // let pointSet = new Set();
    
    let [startPoint, endPoint] = d3.extent(clusterList.reduce((prev, cluster) => prev.concat(cluster.nodeList), []).map(n => n.seq));
    // let startPoint = clusterList[0].nodeList[0].seq;
    // let endPoint = clusterList.slice(-1)[0].nodeList.slice(-1)[0].seq;
    // let pointArrayForCheckEmptyBlock = d3.range(startPoint, endPoint + 1).map(d => false);
    // console.log("nodeList = ", clusterList.map(c => c.nodeList), clusterList.reduce( (prev, cluster) => prev.concat(cluster.nodeList), []).map(n => n.seq).sort( (a, b) => a - b ));
    let xArray = d3.range(startPoint, endPoint + 1).map(d => -1);
    let clusterNodeMapByCluster = {};
    let cIndex = 0;

    clusterList.forEach(cluster => {
        ////////////////////////////////
        // FILTER branchShowMapByType
        let branchType = gitAnalyzer.getClusterBranchType(cluster);
        let noShowTypes = Object.entries(branchShowMapByType).filter(entry => entry[1] === false).map(e => e[0]);
        // SKIP IF NO SHOW
        if (noShowTypes.findIndex(t => t === branchType) >= 0) return;

        ////////////////////////////////
        // BUILD NODES
        cluster.nodeList.forEach(n => xArray[n.seq - startPoint] = cIndex);
        
        let clusterNode = new ClusterNode(cluster);
        clusterNode.branchType = branchType;
        clusterNodeList.push(clusterNode);
        clusterNodeMapByCluster[clusterNode.cluster.id] = clusterNode;
        cIndex++;
    });

    // console.log("xArray", xArray, startPoint, endPoint)
    let fi, blockStartSeq = startPoint, blockIndex = 0, prevClusterIndexOfBlock = xArray[0];
    for (fi = startPoint + 1; fi <= endPoint + 1; fi++) {
        let currentClusterIndexOfBlock = xArray[fi - startPoint];
        // console.log("looping!!", fi - startPoint, prevClusterIndexOfBlock, currentClusterIndexOfBlock, "blockIndex = ", blockIndex);

        if (fi !== endPoint + 1 && currentClusterIndexOfBlock < 0) continue;
        if (prevClusterIndexOfBlock === -1) prevClusterIndexOfBlock = currentClusterIndexOfBlock;

        if (currentClusterIndexOfBlock !== prevClusterIndexOfBlock) {
            // console.log("changed!!", fi - startPoint, prevClusterIndexOfBlock, currentClusterIndexOfBlock, "blockIndex = ", blockIndex);
            // console.log("clusterNode?", prevClusterIndexOfBlock, currentClusterIndexOfBlock, clusterNodeList[prevClusterIndexOfBlock])
            // create and insert cluster node
            let clusterNode = clusterNodeList[prevClusterIndexOfBlock];
            let nodeList = clusterNode.cluster.nodeList.filter(n => (n.seq >= blockStartSeq && n.seq < fi));
            let containsMergedNodes = nodeList.filter(node => node.mergeNodes.length > 0).length > 0;
            let containsMergeTraversedNodes = nodeList.filter(node => node.isMergeTraversed).length > 0;
            let mergedToNodeList = nodeList.filter(node => node.mergedToNode !== undefined).map(n => n.mergedToNode);
            // console.log("mergedToNodeList", nodeList, mergedToNodeList);
            clusterNode.y = Math.min(...clusterNode.cluster.nodeList.map(d => d.implicitBranchNo));
            clusterNode.blockList.push(new ClusterBlock(blockIndex, nodeList, blockStartSeq, fi, blockIndex, containsMergedNodes, containsMergeTraversedNodes, mergedToNodeList, clusterNode));
            blockIndex++;
            blockStartSeq = fi;
        }
        prevClusterIndexOfBlock = currentClusterIndexOfBlock;
    }

console.log("clusterNodeList Reslut", clusterNodeList);

    // compress vertical
    clusterNodeList.sort((a, b) => (b.blockList.slice(-1)[0].x - a.blockList.slice(-1)[0].x));

    let maxBlockIndex = blockIndex;
    // let maxBlockIndex = pointList.length - 1;
    let xMargin = 3;
    let maxY = 1;
    let yArray = Array.from({ length: maxBlockIndex }, d => maxBlockIndex);
    clusterNodeList.filter(nodeList => nodeList.y !== 0).forEach(cn => {
        if (cn.cluster.child !== undefined && clusterNodeMapByCluster[cn.cluster.child.id] !== undefined) return;
        // if (cn.cluster.child !== undefined && (!showPullRequestBranch && cn.cluster.child.onPullRequestBranch)) return;
        let startX = cn.blockList[0].x;
        let endX = cn.blockList[cn.blockList.length - 1].x;
        // let endX = Math.max(cn.blockList[cn.blockList.length - 1].x + xMargin, pointList.length - 1);
        let y;
        for (y = 1; y < maxY; y++) {
            if (Math.max(0, yArray[y] - xMargin) > endX) {
                break;
            }
        }
        if (y === maxY) {
            maxY++;
        }
        // yArray[y] = startX;

        let endXOfClusterTree = startX;
        let pc = cn.cluster.parent;
        while (pc !== undefined) {
            // there can be some cases when parent is hidden but grandparent is not... -_-
            if (clusterNodeMapByCluster[pc.id] === undefined) {
                pc = pc.parent;
                continue;
            }
            endXOfClusterTree = clusterNodeMapByCluster[pc.id].blockList[0].x;
            clusterNodeMapByCluster[pc.id].y = y;
            pc = pc.parent;
        }
        yArray[y] = endXOfClusterTree;
        cn.y = y;
    });

    return [clusterNodeList, maxBlockIndex, thresholdList];
}