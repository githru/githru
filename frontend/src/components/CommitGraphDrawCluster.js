import * as d3 from 'd3';
import GitAnalyzer from './analyzer/GitAnalyzer';
import { intersection } from "lodash";
import { BranchColors } from './ColorClasses';


const moverLinks = (HALinkIds) => {
    HALinkIds.forEach(l => d3.select("#mergedRelationLink_" + l)
        .style("stroke-dasharray", "")
        .style("stroke", "BLACK").style("visibility", ""));
}

const mleaveLinks = (HALinkIds) => {
    HALinkIds.forEach(l => {
        let link = d3.select("#mergedRelationLink_" + l);
        link.style("stroke", link.attr("orgColor"))
            .style("stroke-dasharray", "1, 1")
            .style("visibility", link.attr("orgVisibility"));
    });
}

// selectedClusters 조정해야함
export function drawClusters(
    layout, sel, clusterNodeList, maxBlockIndex, gitAnalyzer, pref, threshold,
    nonConflictGroupingLevel = 0, ignoreFiles = [], useHeuristicMerge, showMergeLink, showGroupSummaryFunc) {
    const defaultBlockOpacity = 0.4;
    const defaultClusterOpacity = 0.05;
    // const selectedClusterOpacity = 0.5;

// console.log("DRAWCLUSTER!!!", clusterNodeList, maxBlockIndex, showGroupSummaryFunc)
    if (sel === undefined) sel = [0, gitAnalyzer.allNodeList.length - 1];
    d3.select("#clusterOverviewSvg").selectAll("g").remove();
    // console.log("brushed", sel);

    let marginLeft = 1;
    let marginRight = 1;
    let width = layout.clusterOverviewWidth - marginLeft - marginRight;
    let height = layout.orgClusterOverviewHeight;
    let maxHeightCommitCount = 10;
    let startBlockIndex, endBlockIndex;
    let summaryLineHeight = 10;

    startBlockIndex = 0;
    endBlockIndex = maxBlockIndex + 1;

    const yRange = d3.range(0, d3.max(clusterNodeList.map(d => d.y)) + 1);
    const minHeight = yRange.slice(-1)[0] * 60;
    // console.log("minHeight = ", minHeight, height);

    if (minHeight > layout.orgClusterOverviewHeight) height = minHeight;
    // else if (minHeight < layout.clusterOverviewHeight) height = layout.orgClusterOverviewHeight;
// console.log("overview height adjust", yRange, minHeight, height, layout)
    d3.select("#clusterOverviewSvg").attr("height", height);

    console.log("BRUSHING CONVERTED", startBlockIndex, endBlockIndex, width, layout.clusterOverviewWidth);
    let xBandScale = d3.scaleBand().domain(d3.range(0, endBlockIndex - 1)).range([0, width]);
    let yBandScale = d3.scaleBand().domain(yRange).range([0, height - summaryLineHeight]).paddingInner(0.2).paddingOuter(0.2);
    let xRectScale = d3.scaleLinear().domain([0, endBlockIndex - 1]).range([0, width]);
    let blockHeightScale = d3.scaleLinear().range([0, yBandScale.bandwidth() - 2]).domain([0, maxHeightCommitCount]);
    let clusterOverviewSvg = d3.select("#clusterOverviewSvg")
        .append("g")
        .attr("transform", "translate(" + marginLeft + " 0)")
        .attr("id", "clusters");

    let colorByBranchNo = {};

    // console.log("BRUSHED clusterNodeList", clusterNodeList)
    // console.log("BRUSHED clusternodelist", clusterNodeList.filter(cn => cn.blockList[0].x <= endBlockIndex && cn.blockList.slice(-1)[0].x >= startBlockIndex));
    // let brushedClusterNodeList = clusterNodeList.filter(cn => cn.blockList[0].x <= endBlockIndex && cn.blockList.slice(-1)[0].x >= startBlockIndex);
    let brushedClusterNodeList = clusterNodeList;
    //////////////////////////////////////////////
    // nonConflictGroupMerging (나중에 function으로 빼라.)
    //////////////////////////////////////////////
    if (nonConflictGroupingLevel > 0) {
        let branchNodesListForSwitching = Object.values(brushedClusterNodeList
            .reduce((prev, clusterNode) => {
                let branchNum = clusterNode.cluster.nodeList[0].implicitBranchNo;
                if (branchNum in prev) prev[branchNum].push(clusterNode);
                else prev[branchNum] = [clusterNode];
                return prev;
            }, {}))
            .filter(cn => cn.length > 2);
        // console.log("branchNodesListForSwitching", branchNodesListForSwitching);

        // switch non-confilct groups
        branchNodesListForSwitching.forEach(branchNodes => {
            branchNodes.sort((a, b) => a.blockList[0].x - b.blockList[0].x);
            let fileSetList = branchNodes.map(clusterNode => getFileSetForCluster(clusterNode.cluster, ignoreFiles));

            branchNodes.filter((d, i) => i < branchNodes.length - 2).forEach((clusterNode, i) => {
                // break recursive
                if (clusterNode.isNonConfilctMerge) return;

                // A(org) -> B(skip) -> C(target)
                let fileSetOrg = Array.from(fileSetList[i]);
                let fileSetSkip = Array.from(fileSetList[i + 1]);
                let fileSetTarget = Array.from(fileSetList[i + 2]);
                // console.log("fileSet", fileSetOrg, fileSetSkip, fileSetTarget);
                // console.log("check check!!", intersection(fileSetOrg, fileSetSkip), intersection(fileSetSkip, fileSetTarget));
                // check non-conflict
                if (intersection(fileSetOrg, fileSetSkip).length > 0 || intersection(fileSetSkip, fileSetTarget).length > 0) return;

                // check similarity between A end and C first
                // console.log("compare", clusterNode.cluster.nodeList.slice(-1)[0], branchNodes[i+2].cluster.nodeList[0]);
                let scores = gitAnalyzer.getScoreByPreferences(clusterNode.cluster.nodeList.slice(-1)[0], branchNodes[i + 2].cluster.nodeList[0], pref, false);
                // console.log("NONCONFLICT SWITCH", branchNodes, threshold, scores.sum, fileSetOrg, fileSetSkip, fileSetTarget);

                // 
                if (threshold <= scores.sum) {
                    let targetClusterNode = branchNodes[i + 2];
                    targetClusterNode.isNonConfilctMerge = true;

                    targetClusterNode.cluster.nodeList.forEach(n => clusterNode.cluster.addNode(n, scores));
                    // clusterNode.cluster.nodeList.concat(targetCluster.nodeList);
                    clusterNode.blockList.slice(-1)[0].isNonConflictMergedSource = true;
                    clusterNode.blockList.slice(-1)[0].commitCount += targetClusterNode.cluster.nodeList.length;
                    targetClusterNode.blockList.forEach(b => b.isNonConflictMergedTarget = true);
                }
            });
        });
    }
    //////////////////////////////////////////////
    let blockMapByNode = {};
    // SET MERGED NODE RELATION
    brushedClusterNodeList.forEach(clusterNode => {
        let blockList = clusterNode.blockList.filter(d => !d.isNonConflictMergedTarget);
        blockList.forEach(block => {
            block.nodeList.forEach(node => {
                blockMapByNode[node.id] = block;
            });
        })
    });

    let clusterNodesByBranchNo = brushedClusterNodeList
        .reduce((prev, clusterNode) => {
            let branchNum = clusterNode.cluster.nodeList[0].implicitBranchNo;
            if (branchNum in prev) prev[branchNum].push(clusterNode);
            else prev[branchNum] = [clusterNode];
            return prev;
        }, {});

    // console.log("brushedClusterNodeList", brushedClusterNodeList, xBandScale.bandwidth());
    //////////////////////////////////////////
    // PRE-BUILD HA MergeLINKS
    let toBlockListMapByBlock = {};
    brushedClusterNodeList.forEach(clusterNode => {
        clusterNode.blockList.filter(b => b.containsMergeTraversedNodes).map(block => {
            let toBlockList = Array.from(block.mergedToNodeList.reduce((prev, node) => {
                let matchedBlock = blockMapByNode[node.id];
                if (matchedBlock !== undefined) prev.add(matchedBlock);
                return prev;
            }, new Set()));
            toBlockListMapByBlock[block.id] = toBlockList;
            toBlockList.map(toBlock => {
                let id = block.id + "_" + toBlock.id;
                block.HALinkIds.push(id);
                toBlock.HALinkIds.push(id);
            });
        });
    });

    brushedClusterNodeList
        .forEach(clusterNode => {
            let blocksBox = clusterOverviewSvg.append("g");
            let boxWidth = (clusterNode.blockList.slice(-1)[0].x - clusterNode.blockList[0].x + 1) * xBandScale.bandwidth();
            let boxHeight = yBandScale.bandwidth();
            let x = xRectScale(clusterNode.blockList[0].x);
            let y = yBandScale(clusterNode.y);

            clusterNode.branchType = gitAnalyzer.getClusterBranchType(clusterNode.cluster);
            clusterNode.color = getClusterNodeColor(clusterNode);
            let clusterColor = clusterNode.color;
            
            clusterNode.x = x;
            clusterNode.width = boxWidth;
            clusterNode.height = y + boxHeight;

            // let drawBlockList = clusterNode.blockList.filter(b => b.x >= startBlockIndex && b.x <= endBlockIndex);
            let drawBlockList = clusterNode.blockList;
            let elem = clusterOverviewSvg.append("g").selectAll("rect")
                // .data(drawBlockList.filter(d => d.x >= startBlockIndex && d.x <= endBlockIndex))
                .data(drawBlockList)
                .enter();
            elem.append("rect")
                .attr("class", "block")
                .attr("id", d => "block" + d.id)
                // .attr("x", d => {console.log("xxx", d, d.x, xBandScale(d.x)); return xBandScale(d.x)})
                .attr("x", d => xBandScale(d.x))
                .attr("y", d => yBandScale(clusterNode.y) + (yBandScale.bandwidth() - blockHeightScale(Math.min(d.commitCount, maxHeightCommitCount))) / 2)
                .attr("width", xBandScale.bandwidth())
                .attr("height", d => blockHeightScale(Math.min(d.commitCount, maxHeightCommitCount)))
                .attr("rx", (xBandScale.bandwidth() >= 10 ? 5 : 2))
                .style("pointer-events", "none")
                .style("fill", d => {
                    if (d.isNonConflictMergedTarget) return "white";
                    else return clusterColor;
                })
                .style("fill-opacity", d => {
                    if (d.isNonConflictMergedSource || d.isNonConflictMergedTarget) return 1;
                    else if (d.containsMergeTraversedNodes) return 0;
                    else return defaultBlockOpacity;
                })
                .style("stroke-width", d => {
                    // if (useHeuristicMerge && d.containsMergedNodes && !d.isNonConflictMergedTarget) {
                    if (d.containsMergedNodes && !d.isNonConflictMergedTarget) {
                        if (xBandScale.bandwidth() < 15) return 1;
                        else return 2;
                    }
                    else if (d.containsMergeTraversedNodes) return 1;
                    else return 0;
                })
                .style("stroke", d => {
                    // if (useHeuristicMerge && d.containsMergedNodes && !d.isNonConflictMergedTarget) return "black";
                    if (d.containsMergedNodes && !d.isNonConflictMergedTarget) return "black";
                    else if (d.containsMergeTraversedNodes) return "grey";
                    else return "";
                })
                .style("stroke-dasharray", d => (!useHeuristicMerge && (d.containsMergedNodes || d.containsMergeTraversedNodes) ? "1, 1" : ""))
                ;

            //////////////////////////////////////////////
            // SET releaseStr to block
            drawBlockList.forEach(block => {
                let releaseNodeList = block.nodeList.filter(node => node.isRelease);

                if (useHeuristicMerge) {
                    releaseNodeList = releaseNodeList.concat(
                        block.nodeList.reduce((prev, node) =>
                            prev.concat(node.mergeNodes.filter(node => node.isRelease && node.seq >= sel[0] && node.seq <= sel[1]))
                            , [])
                    );
                }
                block.releaseNodeList = releaseNodeList;
                releaseNodeList.sort((a, b) => b.seq - a.seq);
                if (releaseNodeList.length === 1) block.releaseTagString = releaseNodeList[0].releaseTagString;
                if (releaseNodeList.length > 1)
                    block.releaseTagString = releaseNodeList[0].releaseTagString + " (~" + releaseNodeList.slice(-1)[0].releaseTagString + ")";
                if (releaseNodeList.filter(node => node.isMajorRelease).length > 0) block.containsMajorRelease = true;
                else block.containsMajorRelease = false;
                // console.log("block", releaseNodeList, block);

                ////////////////////////////////// 
                // HA MERGED EDGES
                if (block.containsMergeTraversedNodes) {
                    let toBlockList = toBlockListMapByBlock[block.id];
                    let linkVertical = d3.linkVertical().x(d => d.x).y(d => d.y);
                    let linkHorizontal = d3.linkHorizontal().x(d => d.x).y(d => d.y);

                    let dataset = toBlockList.map(toBlock => {
                        // console.log("check", clusterNode, toBlock.clusterNode, clusterNode === toBlock.clusterNode);
                        let sx, sy, tx, ty;
                        sx = xRectScale(block.x) + xBandScale.bandwidth() / 2;
                        sy = yBandScale(clusterNode.y) + boxHeight / 2;
                        tx = xRectScale(toBlock.x) + xBandScale.bandwidth() / 2;
                        ty = yBandScale(toBlock.clusterNode.y) + boxHeight / 2;
                        // console.log("coordinagtes, ", sx, sy, tx, ty, block.mergedToNodeList, toBlock.nodeList, block.mergedToNodeList.map(n => blockMapByNode[n.id]), blockMapByNode,)
// if (toBlock.clusterNode.y === clusterNode.y) console.log("appeared horizon", block, toBlock);
                        return {
                            source: { x: sx, y: sy, }, target: { x: tx, y: ty }, toBlock: toBlock,
                            id:block.id + "_" + toBlock.id,
                            linkFunc: (toBlock.clusterNode.y !== clusterNode.y ? linkVertical : linkHorizontal),
                        }
                    });
                    clusterOverviewSvg.append("g").selectAll("path")
                        .data(dataset)
                        .enter()
                        .append("path")
                        .attr("id", d => "mergedRelationLink_" + block.id + "_" + d.toBlock.id)
                        .attr("class", "mergedRelationLinks")// + "mergedRelationLinks_" + d.id)
                        .attr("d", d => d.linkFunc(d))
                        .attr("orgColor", clusterColor)
                        .attr("orgVisibility", (showMergeLink ? "visible" : "hidden"))
                        .style("pointer-events", "none")
                        .style("stroke-dasharray", ("1, 1"))
                        .style("stroke", clusterColor)
                        .style("stroke-width", 2)
                        .style("fill-opacity", 0)
                        .style("stroke-opacity", "0.6")
                        .style("visibility", function () {
                            return (showMergeLink ? "visible" : "hidden");
                        });
                }
            });

            let releaseBlockList = drawBlockList.filter(block => block.releaseTagString !== undefined && block.releaseTagString !== "");
            let releases = clusterOverviewSvg.append("g").selectAll("line")
                .data(releaseBlockList)
                .enter();
            releases.append("line")
                .attr("id", d => d.releaseTagString)
                .attr("stroke", "red")
                .style("stroke-width", "2px")
                .attr("x1", d => xBandScale(d.x) + xBandScale.bandwidth())
                .attr("x2", d => xBandScale(d.x) + xBandScale.bandwidth())
                .attr("y1", yBandScale(clusterNode.y) - 3)
                .attr("y2", yBandScale(clusterNode.y) + yBandScale.bandwidth() + 3)
                .style("stroke-dasharray", "2")
                ;
            releases
                .append("text")
                .attr("x", d => xBandScale(d.x) + xBandScale.bandwidth())
                .attr("y", yBandScale(clusterNode.y))
                .attr("text-anchor", "start")
                .style("font-size", "10px")
                .style("font-weight", d => (d.containsMajorRelease ? "bold" : ""))
                .text(d => d.releaseTagString)
                ;

            colorByBranchNo[clusterNode.cluster.nodeList[0].implicitBranchNo] = clusterColor;


            /////////////////////////////////////
            // BLOCKS BOX
            let HALinkIds = clusterNode.blockList.reduce((prev, block) => prev.concat(block.HALinkIds), []);
            blocksBox.append("rect")
                .attr("class", "blocksBox")
                .attr("id", "blocksBox" + clusterNode.cluster.id)
                .attr("style", "stroke:" + clusterColor + ";fill-opacity:" + defaultClusterOpacity + ";fill:" + clusterColor)
                .style("stroke-dasharray", (clusterNode.isNonConfilctMerge ? 4 : 0))
                .style("stroke-opacity", (clusterNode.isNonConfilctMerge ? 0.3 : 1))
                .style("stroke-width", 1)
                .style("cursor", "pointer")
                .attr("x", x)
                .attr("y", y)
                .attr("width", boxWidth)
                .attr("height", boxHeight)
                .attr("rx", (boxWidth >= 10 ? 5 : 2))
                .on("click", function () {
                    // BLOCK CLICK EVENT (NOT BRANCH)
                    if (clusterNode.isNonConfilctMerge) return;

                    let isMulti = showGroupSummaryFunc(-1, [clusterNode]);
                    if (!isMulti) {
                        d3.selectAll(".blocksBox").style("fill-opacity", defaultClusterOpacity);
                    }
                    // d3.selectAll(".blocksBox").style("fill-opacity", defaultClusterOpacity);
                    d3.select(this).style("fill-opacity", "0.4");
                    d3.selectAll(".branchUnderlines").style("fill-opacity", 0.4);
                    // showBranchSummary(clusterNodesByBranchNo[branchNo], branchNo, width, height, ignoreFiles, summaryByLOC);
                })
                .on("mouseover", function () {
                    if (clusterNode.isNonConfilctMerge) return;
                    d3.select(this).style("stroke-width", 3);

                    if (!useHeuristicMerge) moverLinks(HALinkIds);
                })
                .on("mouseleave", function () {
                    if (clusterNode.isNonConfilctMerge) return;
                    d3.select(this).style("stroke-width", 1);

                    if (!useHeuristicMerge) mleaveLinks(HALinkIds);
                })
                ;
            if (boxWidth >= 10) {
                blocksBox
                    .append("text")
                    .attr("x", x + boxWidth)
                    .attr("y", y + yBandScale.bandwidth() - 1)
                    .attr("text-anchor", "end")
                    .style("font-size", "12px")
                    .text(clusterNode.isNonConfilctMerge ? "" : clusterNode.cluster.nodeCount)// + clusterNode.cluster.mergedNodeCount)
                    // .text(clusterNode.blockList.reduce((prev, cur) => (prev + cur.commitCount), 0))
                    ;
            }

            ////////////////////////////////// 
            // EDGES
            let dataset = [];
            let child = clusterNode.cluster.child;
            let parent = clusterNode.cluster.parent;
            const pushDataSet = (node, isChild) => {
                if (node === undefined) return true;

                let sx, sy, tx, ty;

                let [minNX, maxNX] = d3.extent(node.blockList.map(d => d.x));
                if (isChild) {
                    sx = x + boxWidth;
                    sy = y + boxHeight / 2;
                    tx = xRectScale(minNX);
                    ty = yBandScale(node.y) + boxHeight / 2;
                } else {
                    sx = xRectScale(maxNX) + xBandScale.bandwidth();
                    sy = yBandScale(node.y) + boxHeight / 2;
                    tx = x;
                    ty = y + boxHeight / 2;
                }

                dataset.push({
                    source: { x: sx, y: sy, }, target: { x: tx, y: ty }
                });
            }

            if (child !== undefined) pushDataSet(clusterNodeList.filter(d => d.cluster === child)[0], true);
            if (parent !== undefined) pushDataSet(clusterNodeList.filter(d => d.cluster === parent)[0], false);
            // console.log("datset.lnegth = ", clusterNode.cluster, child, parent, clusterNode.cluster.id, dataset.length, dataset)
            blocksBox.selectAll("path")
                .data(dataset)
                .enter()
                .append("path")
                .attr("class", "edge" + clusterNode.cluster.id)
                .attr("d", d3.linkHorizontal().x(d => d.x).y(d => d.y))
                .style("pointer-events", "none")
                // .style("stroke-dasharray", ("1, 1"))
                .style("stroke", clusterColor)
                .style("stroke-width", 2)
                .style("fill-opacity", 0)
                .style("stroke-opacity", "0.3")
            ;
        });

    //////////////////////////////////////////////////
    // UNDERLINES
    Object.values(clusterNodesByBranchNo).forEach(branchClusterNodes => {
        branchClusterNodes.sort((a, b) => a.blockList[0].x - b.blockList[0].x);
        let branchNo = branchClusterNodes[0].cluster.nodeList[0].implicitBranchNo;
        let elem = clusterOverviewSvg.append("g");
        let branchUnderlineWidth = xRectScale(branchClusterNodes.slice(-1)[0].blockList.slice(-1)[0].x) + xBandScale.bandwidth() - xRectScale(branchClusterNodes[0].blockList[0].x);

        let HALinkIds = branchClusterNodes.reduce((p, clusterNode) =>
            p.concat(clusterNode.blockList.reduce((prev, block) => prev.concat(block.HALinkIds), []))
            , []);
        
        let branchNames = GitAnalyzer.getBranchNamesFromBranchClusterNodes(branchClusterNodes);

        elem.append("rect")
            .attr("class", "branchUnderlines")
            .attr("id", "underlines" + branchNo)
            // .style(, "stroke-width:" + summaryLineHeight + "px")
            .attr("x", xRectScale(branchClusterNodes[0].blockList[0].x))
            .attr("width", branchUnderlineWidth)
            .attr("y", yBandScale(branchClusterNodes[0].y) + yBandScale.bandwidth())// + summaryLineHeight / 2)
            .attr("rx", (xRectScale(branchClusterNodes.slice(-1)[0].blockList.slice(-1)[0].x) + xBandScale.bandwidth() - xRectScale(branchClusterNodes[0].blockList[0].x) >= 10 ? 4 : 2))
            .attr("height", summaryLineHeight)
            .style("fill", colorByBranchNo[branchNo])
            .style("fill-opacity", "0.4")
            .style("stroke", colorByBranchNo[branchNo])
            .style("stroke-opacity", 0.4)
            .style("cursor", "pointer")
            .on("click", function () {
                console.log("branch show", branchNo);
                showGroupSummaryFunc(branchNo, branchClusterNodes);
                // d3.select(this)
                //     .attr("y", yBandScale(branchNodes[0].y) + yBandScale.bandwidth())
                //     .attr("height", summaryLineHeight);
                d3.selectAll(".branchUnderlines").style("fill-opacity", 0.4);
                d3.select(this).style("fill-opacity", 1);
                d3.select(".blocksBox").style("fill-opacity", defaultClusterOpacity);
            })
            .on("mouseover", function (d) {
                // d3.select(this)
                //     .attr("y", yBandScale(branchNodes[0].y))
                //     .attr("height", yBandScale.bandwidth() + summaryLineHeight);
                d3.select(this).style("stroke-width", "3px").style("stroke-opacity", 1)//.style("fill-opacity", 0);

                if (!useHeuristicMerge) moverLinks(HALinkIds);
                
                d3.select("#clusterToolTip")
                    .html(branchNames.join("<br />"))
                    .style("visibility", "visible")
                    .style("opacity", 0.8)
                    .style("left", (d3.event.pageX + 4) + "px")
                    .style("top", (d3.event.pageY - 2) + "px");
            })
            .on("mouseleave", function (d) {
                // d3.select(this)
                // .attr("y", yBandScale(branchNodes[0].y) + yBandScale.bandwidth())
                // .attr("height", summaryLineHeight);
                d3.select(this).style("stroke-width", "1px").style("stroke-opacity", 0.4)//.style("fill-opacity", 0.4);

                if (!useHeuristicMerge) mleaveLinks(HALinkIds);
                d3.select("#clusterToolTip").style("visibility", "hidden");
            })
            ;

        elem.append("text")
            .attr("id", "foldButton" + branchNo)
            .attr("x", Math.min(xRectScale(branchClusterNodes.slice(-1)[0].blockList.slice(-1)[0].x) + xBandScale.bandwidth(), width) + 2)
            .attr("y", yBandScale(branchClusterNodes[0].y) + yBandScale.bandwidth() + summaryLineHeight)
            // .text(branchNo + "<")
            // .text( (branchNodes[0].cluster.branches.length > 0 ? branchNodes[0].cluster.branches.map(b => b.split("/").slice(-1)[0]) : "") + "▼")
            .text(
                // GitAnalyzer.getBranchNamesFromBranchClusterNodes(branchClusterNodes).join(",") + 
                "▼")
            .style("font-size", (branchUnderlineWidth > 30 ? "14px" : (branchUnderlineWidth > 8 ? "12px" : "8px")))
            .style("font-weight", "bold")
            .style("pointer-events", "none")
            .attr("fill", colorByBranchNo[branchNo])
            .attr("text-anchor", "end")
    });

    return [clusterNodesByBranchNo, width, height];
}

function getClusterNodeColorFromClusterNodes(clusterNodes) {
    return getClusterNodeColor(clusterNodes.slice(-1)[0].cluster);
}

function getClusterNodeColor(clusterNode) {
    return BranchColors[clusterNode.branchType];
}

function getFileSetForCluster(cluster, ignoreFiles) {
    return cluster.nodeList.reduce((prev, node) => {
        let fileNameList = Object.keys(node.commit.diffStat.files);
        fileNameList.filter(f => ignoreFiles.indexOf(f) < 0).forEach(d => prev.add(d));
        return prev;
    }, new Set());
}