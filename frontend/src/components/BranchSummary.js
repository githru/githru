import * as d3 from 'd3';
import React, { useLayoutEffect, useRef, useState, Fragment } from 'react';
import { useDispatch, useSelector } from "react-redux";
import { ClusterBlock, ClusterNode, ClusterData, AttrsAbbreviationMap, DataTypeByNameMap, LOCStat } from "./analyzer/GithruClasses";
import { AttributeColors } from './ColorClasses';
import GitAnalyzer from './analyzer/GitAnalyzer';
import GroupSummary from './GroupSummary';
import * as actions from '../modules';


const branchSummaryValueRectMouseover = (d, color, rectMargin) => {
// console.log("branchSummaryValueRectMouseover", d);
    if (d === undefined) return;

    let sameValueElements = d3.selectAll(".branchSummaryValueRect")
        // .filter(selection => (selection !== undefined && d[0] === selection[0] && d[1] === selection[1]));
        .filter(selection => {return (selection.data !== undefined && d[0] === selection.data[0] && d[1] === selection.data[1]);})
        .each( function() {
            let newColor = d3.select(this).attr("highlight-color");
            d3.select(this)
                .style("font-weight", "bold")
                .style("background-color", newColor);
            d3.select(this).select("span").style("background", newColor);
        });

    // sameValueElements.style("opacity", "1");
    // sameValueElements.style("border", "2px blue solid");
    // sameValueElements.style("font-weight", "bold");
    sameValueElements.style("font-weight", "bold")
    // sameValueElements.style("border", "2px blue solid")
    sameValueElements.style("opacity", 1.0)
// console.log("samevalue", sameValueElements);

    sameValueElements.each(function () {
        let [clusterId, valueId] = d3.select(this).attr("id").split("_").slice(1, 3);    
        d3.select("#branchSummaryClusterRect_" + clusterId).style("border", rectMargin + "px " + color + " solid");
        d3.select("#blocksBox" + clusterId).style("stroke-width", "3px");
        // d3.select("#" + d3.select(this).attr("id") + "_text").style("font-weight", "normal");
        d3.selectAll(".branchSummaryArrowLine_" + clusterId)
            // .style("stroke-width", "2px")
            .style("stroke-opacity", 1);
    });
}

const branchSummaryValueRectMouseleave = (rectMargin) => {
    d3.selectAll(".branchSummaryValueRect").each( function() {
        let orgColor = d3.select(this).attr("org-color");
        d3.select(this)
            .style("font-weight", "normal")
            .style("background-color", orgColor);
        d3.select(this).select("span").style("background", orgColor);
    })
    ;

    d3.selectAll(".branchSummaryClusterRect").style("border", "dotted " + rectMargin + "px WhiteSmoke");
    d3.selectAll(".blocksBox").style("stroke-width", "1px");
    d3.selectAll(".branchSummaryArrowLine").style("stroke-width", "1px").style("stroke-opacity", 0.3);
    // d3.selectAll(".branchSummaryValueRectText").style("font-weight", "");
}



///////////////////////////////////////////////////
// MAIN HOOK
const BranchSummary = (props) => {
// console.log("BranchSummary start!!", props);
    const {branchNo, width, height, hideFiles, summaryByLOC} = props;
    const clusterOverviewHeight = useSelector(state => state.layout.clusterOverviewHeight);
    let isInitRef = useRef(true);

    const clusterNodes = (props.clusterNodes === undefined ? [] : props.clusterNodes.filter(d => !d.isNonConfilctMerge));
    clusterNodes.sort((a, b) => a.x - b.x);

    const itemHeight = 20;
    const itemTopCount = 5;
    let arrowHeight = 20;

    let showAttrs;
    let showAttrValueCount;
    let showAttrRenderFlow;
    let showByCommitCountOnly;

    const dispatch = useDispatch();
    const registerFavoriteFragment = (f) => {
        dispatch(actions.registerFavoriteFragment(f));
    }
    const [selectedClusterNodeIndex, setSelectedClusterNodeIndex] = useState(undefined);


    if (!summaryByLOC) {
        showAttrs = [["authors"], ["commitTypes"], ["touchCountByFiles", "touchCountByDirs"], ["keywords"], ];
        showAttrValueCount = [3, 3, 4, 3];
        // showAttrRenderFlow = [false, false, true, false];
        showAttrRenderFlow = [true, true, true, true];
        showByCommitCountOnly = [true, true, false, true];
    } else {
        showAttrs = [["authorsLOCStat"], ["commitTypesLOCStat"], ["clocByDirs"], ["clocByFiles"], ["keywords"], ];
        showAttrValueCount = [2, 2, 2, 3, 3];
        // showAttrRenderFlow = [false, false, true, true, false];
        showAttrRenderFlow = [true, true, true, true, true];
        showByCommitCountOnly = [false, false, false, false, true];
    }

    const margin = 2;
    const divHeight = itemHeight * showAttrValueCount.reduce( (prev, cur, i) => prev + (showAttrRenderFlow[i] ? cur : 1), 0) + margin * 2;
    const summaryWidth = 0;
    const underlineHeight = 10;
    let itemMinWidth = 20;
    const summaryMinWidth = 600;
    const totalCommitCount = clusterNodes.filter(d => !d.isNonConfilctMerge).reduce((prev, node) => prev + node.cluster.nodeCount, 0);
    const totalCLOC = clusterNodes.filter(d => !d.isNonConfilctMerge).reduce((prev, node) => prev + node.cluster.locStat.clocSum, 0);
    const totalValue = (!summaryByLOC ? totalCommitCount : totalCLOC);

    if (itemMinWidth * clusterNodes.length > width) itemMinWidth = 10;
    let maxWidth = Math.max(width, itemMinWidth * clusterNodes.length);

    let summaryStartX = 0;
    let summaryEndX = width;
    let arrowDivStartX = 0;
    let arrowDivWidth = width;

    clusterNodes.forEach(clusterNode => {
        let clusterData = new ClusterData(clusterNode.cluster, props.gitAnalyzer.corpusData, props.useHeuristicMerge);
        clusterData["touchCountByDirs"] = Object.entries(clusterData["touchCountByDirs"])
            .filter(d => d[0].split("/").length === 4)
            .reduce((prev, cur) => { prev[cur[0]] = cur[1]; return prev }, {});
        clusterData["clocByDirs"] = Object.entries(clusterData["clocByDirs"])
            .filter(d => d[0].split("/").length === 4)
            .reduce((prev, cur) => { prev[cur[0]] = cur[1]; return prev }, {});

        clusterNode.clusterData = clusterData;
// console.log("clusterData", clusterData);
    });

    // branch name
    clusterNodes.reverse();

    let branchNames = GitAnalyzer.getBranchNamesFromBranchClusterNodes(clusterNodes);

    clusterNodes.reverse();
    // if (!props.showPullRequestBranch) branchNames = branchNames.filter( b => b.startsWith("origin/pr") === false);
    let branchName = branchNames.join(", ")
    
    let widthScale, rectWidths;
// console.log("overflow?", itemMinWidth * totalValue > width, itemMinWidth * totalValue , width)
    if (itemMinWidth * totalValue > width) {
        widthScale = d3.scaleLinear().range([0, maxWidth - (itemMinWidth * clusterNodes.length)]).domain([0, totalValue - clusterNodes.length]);
        rectWidths = clusterNodes.map( clusterNode => itemMinWidth + widthScale(
            (summaryByLOC ? clusterNode.cluster.locStat.clocSum : clusterNode.cluster.nodeCount - 1)
        ));
    } else {
        widthScale = d3.scaleLinear().range([0, width]).domain([0, totalValue]);
        
        rectWidths = clusterNodes.map( clusterNode => widthScale(
            (summaryByLOC ? clusterNode.cluster.locStat.clocSum : clusterNode.cluster.nodeCount)
        ));
    }
    
    const rectMargin = 2;

    /////////////////////////////////////////////
    // DRAW SUMMARY FUNC
    const drawSummary = (clusterNode, index) => {
        if (clusterNode.isNonConfilctMerge) return;

        let branchSummaryClusterRectStr = "branchSummaryClusterRect_" + clusterNode.cluster.id;
        // d3.select("#" + branchSummaryClusterRectStr).selectAll("div").remove();
// console.log("removed? ", d3.select("#" + branchSummaryClusterRectStr).selectAll("div"));
        let topDataList = showAttrs.reduce((prev, attrList, attrIndex) => {
            let dataList = attrList.reduce((p, attr) => p.concat(
                Object.entries(clusterNode.clusterData[attr]).map(d => 
                    [attr].concat( [d[0], (d[1] instanceof LOCStat ? d[1].clocSum : d[1])] )
            )), []);
            // let ignoreList = dataList.filter(d => d[0].endsWith("Files") && hideFiles.indexOf(d[1]) >= 0);
// console.log(dataList);
            if (dataList.length === 0) return prev;
            if(dataList.length === 0 || dataList[0][0] != "keywords") {
                dataList = dataList.filter(d => !(d[0].endsWith("Files") && hideFiles.indexOf(d[1]) >= 0))
                    .sort((a, b) => b[2] - a[2])
                    // .concat(ignoreList)
            } else {
                dataList = dataList.filter(d => !(d[0].endsWith("Files") && hideFiles.indexOf(d[1]) >= 0))
                    .sort((a, b) => b[2][1] - a[2][1])
                    .map( d => [d[0], d[1], d[2][0]])
                ;
            }
            dataList = dataList.filter((d, i) => i < showAttrValueCount[attrIndex]);

            Array(showAttrValueCount[attrIndex] - dataList.length).fill().forEach(() => dataList.push(undefined));
            prev.push(dataList);
            return prev;
        }, []);

        // d3.select("#" + branchSummaryClusterRectStr).selectAll(".branchSummaryClusterRect").selectAll("div").remove();
        // let borderRect = d3.select("#branchSummary" + branchNo + "_" + index + "_border_rect").selectAll(".branchSummaryClusterRect").data(topDataList).enter();
        d3.select("#" + branchSummaryClusterRectStr).selectAll(".branchSummaryValueWrap").remove();
        let borderRect = d3.select("#" + branchSummaryClusterRectStr).selectAll(".branchSummaryClusterRect").data(topDataList).enter();
// console.log("borderRect = ", branchSummaryClusterRectStr, d3.select(branchSummaryClusterRectStr), borderRect, topDataList)

        borderRect.append("div")
            .attr("id", (d, i) => "branchSummaryValueWrap_" + clusterNode.cluster.id + "_" + i)
            // .attr("class", (d, i) => (showAttrRenderFlow[i] ? "flexVerticalContainer": "flexContainer"))
            .attr("class", (d, i) => "branchSummaryValueWrap " + (showAttrRenderFlow[i] ? "flexVerticalContainer": "flexContainer"))
            .style("width", "100%")//(rectWidths[index] - rectMargin * 2) + "px")
            // .style("height", itemHeight + "px")
            .style("background-color","#EEEEEE")//"rgba(128,128,128,0.1)")
            .style("border", "1px " + clusterNode.color)
            .style("flex-wrap", "wrap")
            .style("font-size", "12px")
            .on("click", () => {
                d3.selectAll(".branchSummaryClusterRectOver").style("opacity", 0)
                d3.select("#branchSummaryClusterRect_" + clusterNode.cluster.id + "_over").style("opacity", 0.2).style("background", clusterNode.color);
                setSelectedClusterNodeIndex(index);
            })
            .on("mouseenter", function(d) {
                // if (!showAttrRenderFlow[d.parentIndex]) 
                d3.select(branchSummaryClusterRectStr).style("border", rectMargin + "px " + clusterNode.color + " solid");
                d3.select(this).style("overflow", "visible").style("font-size", "12px").style("z-index", 100);
                d3.select(this).selectAll("span").style("background")
                branchSummaryValueRectMouseover(d.data, clusterNode.color, rectMargin);
            })
            .on("mouseleave", function(d) {
                // if (!showAttrRenderFlow[d.parentIndex]) 
                d3.select(this).style("overflow", "hidden");
                d3.select(this).style("z-index", undefined).style("font-size", "12px");
                branchSummaryValueRectMouseleave(rectMargin);
            })
            // .style("z-index", (d, i) => showAttrRenderFlow[i] ? i * 10 + 1 : (i * 10))
                .selectAll(".branchSummaryValueRect")
                .data( (d, i) => d.map( (data) => { return {"data": data, "parentIndex": i}; }))
                .enter()
                    .append("div")
                    .attr("id", (d, i) => "branchSummaryValueRect_" + clusterNode.cluster.id + "_" + d.parentIndex + "_" + i)
                    .attr("class", "branchSummaryValueRect")
                    // .style("width", d => (d.data ? (100 * d.data[2] / 
                    //         (summaryByLOC && showAttrRenderFlow[d.parentIndex] ? clusterNode.cluster.locStat.clocSum : clusterNode.cluster.nodeCount)
                    //     ) : 0) + "%")
                    .style("width", d => { 
                        // console.log("summaryByLOC", d, summaryByLOC, !showByCommitCountOnly[d.parentIndex]);
                        return (d.data ? (100 * d.data[2] / 
                        (summaryByLOC && !showByCommitCountOnly[d.parentIndex] ? clusterNode.cluster.locStat.clocSum : clusterNode.cluster.nodeCount)
                    ) : 0) + "%";})
                    .style("height", itemHeight + "px")
                    // .style("height", d => (d.data === undefined && showAttrRenderFlow[d.parentIndex]) ? (itemHeight) + "px" : "")
                    .style("border-radius", "5px")
                    .style("background-color", d => { return (d.data ? AttributeColors[DataTypeByNameMap[d.data[0]]][3] : "");  } )
                    .attr("highlight-color", d => { return (d.data ? AttributeColors[DataTypeByNameMap[d.data[0]]][1] : "");  } )
                    .attr("org-color", d => { return (d.data ? AttributeColors[DataTypeByNameMap[d.data[0]]][3] : "");  } )
                    // .style("opacity", 1)
                    .style("font-size", "12px")
                    .style("overflow", "hidden")
                    .style("padding-left", "2px")
                    .style("color", d => (d.data === undefined ? "" : (d.data[0].endsWith("Files") && hideFiles.indexOf(d.data[1]) >= 0 ? "grey" : "")))
                    .on("mouseover", function(d) {
                        // if (!showAttrRenderFlow[d.parentIndex]) 
                        d3.select(this).style("overflow", "visible").style("font-size", "12px").style("z-index", 100);
                        d3.select(this).selectAll("span").style("background")
                        branchSummaryValueRectMouseover(d.data, clusterNode.color, rectMargin);
                    })
                    .on("mouseleave", function(d) {
                        // if (!showAttrRenderFlow[d.parentIndex]) 
                        d3.select(this).style("overflow", "hidden");
                        d3.select(this).style("z-index", undefined).style("font-size", "12px");
                        branchSummaryValueRectMouseleave(rectMargin);
                    })
                    .append("span")
                        .attr("class", "valueRectSpan")
                        .text(d => d.data === undefined ? "" : GitAnalyzer.getTextValue(d.data[0], d.data[1]))
                        .style("overflow", d => showAttrRenderFlow[d.parentIndex] ? "visible" : "hidden")
                        .style("white-space", "pre")
        ;
        
        // resize height(rendered) 
        // let bsrect = d3.select("#" + branchSummaryClusterRectStr);
        // let totalWrapHeight = showAttrRenderFlow.reduce( (prev, cur, i) => prev + bsrect.select("#branchSummaryValueWrap_" + clusterNode.cluster.id + "_" + i).node().getBoundingClientRect().height, 0);
        // d3.select("#" + branchSummaryClusterRectStr).style("height", (totalWrapHeight + rectMargin * 2) + "px");
// console.log("totalWrapHeight", totalWrapHeight)
    }
    

    useLayoutEffect( () => {
        setSelectedClusterNodeIndex(undefined);
// console.log("useEffect (NOT INIT)", branchNo, clusterNodes, hideFiles)
        // if (!isInitRef.current) {
            // d3.selectAll(".branchSummaryClusterRect").selectAll("div").remove();
            clusterNodes.forEach( (clusterNode, i) => {
                let branchSummaryClusterRectStr = "branchSummaryClusterRect_" + clusterNode.cluster.id;
                // d3.select("#" + branchSummaryClusterRectStr).selectAll("div").remove();
                drawSummary(clusterNode, i);
            });

            if (clusterNodes.length === 1 && clusterNodes[0].cluster.nodeList.length < 100) setSelectedClusterNodeIndex(0);
        // }
    // });
    }, [branchNo, JSON.stringify(clusterNodes.map(d => d.cluster.id)), hideFiles]);

    useLayoutEffect( () => {
        let prevIndex = selectedClusterNodeIndex;
        setSelectedClusterNodeIndex(undefined);
        clusterNodes.forEach( (clusterNode, i) => {
            drawSummary(clusterNode, i);
        });
// console.log("useLayoutEffect prevIndex", prevIndex)
        setSelectedClusterNodeIndex(prevIndex);
    }, [summaryByLOC]);

    if (clusterNodes.length === 0) return (<div></div>);

    let currentX = 0;
    let descriptionHeight = 30;

    let branchNum = (clusterNodes.length > 0 ? clusterNodes[0].cluster.nodeList[0].implicitBranchNo : -1);
    arrowHeight = clusterOverviewHeight - Number(d3.select("#underlines" + branchNum).attr("y")) + descriptionHeight;
// console.log("BS render?", divHeight,  branchNo, arrowHeight, clusterOverviewHeight, d3.select("#underlines" + branchNum).attr("y1"));
// console.log("selectedClusterNodeIndex !== undefined && clusterNodes[selectedClusterNodeIndex] !== undefined", props,selectedClusterNodeIndex !== undefined, clusterNodes[selectedClusterNodeIndex] !== undefined)

    let containReleaseList = clusterNodes.reduce( (prev, clusterNode) => 
        prev.concat( clusterNode.blockList.reduce( (p, block) => p.concat(block.releaseNodeList.map(d => d.releaseTagString)), []) )
    , []);
    if (containReleaseList.length > 3) containReleaseList = [containReleaseList[0], containReleaseList[1], "...", containReleaseList.slice(-1)[0]];
    let containReleaseNames = containReleaseList.join(", ");

    return (
        <div id={"branchSummaryDiv" + branchNo}>
            <svg id={"branchSummaryArrow" + branchNo}
                className="branchSummaryArrowArea"
                style={{
                    position:"absolute",
                    width: arrowDivWidth + "px",
                    height: arrowHeight + "px",
                    left: arrowDivStartX + "px",
                    top: clusterNodes[0].height + underlineHeight + "px",
                    pointerEvents: "none"
                }}
            >
                {clusterNodes.map( (clusterNode, i) => {
                    let startCurrentX = currentX;
                    currentX += rectWidths[i];
                    return (
                        <React.Fragment key={i}>
                        <line 
                            className={["branchSummaryArrowLine", clusterNode.cluster.id].join("_") + " branchSummaryArrowLine"}
                            x1={Math.max(0, clusterNode.x - summaryStartX)}
                            x2={startCurrentX}
                            y1={0}
                            y2={arrowHeight}
                            style={{
                                strokeWidth: 1,
                                stroke: clusterNode.color,
                                strokeOpacity: 0.3
                            }}
                        />
                        <line 
                            className={["branchSummaryArrowLine", clusterNode.cluster.id].join("_") + " branchSummaryArrowLine"}
                            x1={Math.max(0, clusterNode.x - summaryStartX + clusterNode.width)}
                            x2={currentX}
                            y1={0}
                            y2={arrowHeight}
                            style={{
                                strokeWidth: 1,
                                stroke: clusterNode.color,
                                strokeOpacity: 0.3
                            }}
                        />
                        </React.Fragment>
                    );
                })}
            </svg>

            <div id={"branchDescription" + branchNo}
                align="left"
                style={{
                    position: "absolute",
                    width: arrowDivWidth + "px",
                    height: "20px",
                    left: arrowDivStartX + "px",
                    top: (clusterNodes[0].height + underlineHeight + arrowHeight - descriptionHeight + 10 ) + "px",
                    fontSize: "14px",
                    fontWeight: "bold",
                    overflow: "visible",
                    whiteSpace: "nowrap",
                }}
            >
                [{containReleaseNames}] {branchName}  
                <span style={{fontWeight: "normal"}}> (total {(summaryByLOC ? "CLOC" : "commit #")}: {totalValue})</span>
                {/* {clusterNodes[0].cluster.implicitBranchNo} */}
            </div>
            
            <div id={"branchSummary" + branchNo}
                className="branchSummaryArea"
                style={{
                    position: "absolute",
                    "width": maxWidth + summaryWidth + "px",
                    "height": (divHeight) + "px",
                    "left": summaryStartX + "px",
                    "top": (clusterNodes[0].height + underlineHeight + arrowHeight) + "px",
                }}
                className="flexContainer"
            >
                {clusterNodes.map( (clusterNode, i) => {
                    let overWidth = (i > 0 ? rectWidths.slice(0, i).reduce( (prev, cur) => prev + cur, 0) : 0);
                    return(
                        <Fragment key={clusterNode.cluster.id}>
                            <div
                                id={"branchSummaryClusterRect_" + clusterNode.cluster.id}
                                className="branchSummaryClusterRect flexVerticalContainer"
                                style={{
                                    width: rectWidths[i],
                                    // height: clusterNode.isNonConfilctMerge ? itemHeight : itemHeight * showAttrValueCount.length,
                                    fill: "white",
                                    // strokeDasharray: (clusterNode.isNonConfilctMerge ? 4 : 0),
                                    backgroundColor: "white",
                                    border: "dotted " + rectMargin + "px WhiteSmoke",
                                    cursor: "pointer",
                                }}
                            >
                            </div>
                            <div
                                id={"branchSummaryClusterRect_" + clusterNode.cluster.id + "_over"}
                                className="branchSummaryClusterRectOver flexVerticalContainer"
                                style={{
                                    position: "absolute",
                                    height: (divHeight) + "px",
                                    left: overWidth + "px",
                                    top: "0px",
                                    width: rectWidths[i],
                                    pointerEvents: "none",
                                    opacity: 0,
                                    // height: clusterNode.isNonConfilctMerge ? itemHeight : itemHeight * showAttrValueCount.length,
                                    // background: "white",
                                    // strokeDasharray: (clusterNode.isNonConfilctMerge ? 4 : 0),
                                    // backgroundColor: "white",
                                    // border: "dotted " + rectMargin + "px WhiteSmoke",
                                    // cursor: "pointer",
                                }}
                            >
                            </div>
                        </Fragment>
                    );
                })}
            </div>
            <div
                style={{
                    position: "absolute",
                    // "width": maxWidth + summaryWidth + "px",
                    "width" : width + "px",
                    // "height": (divHeight) + "px",
                    "left": summaryStartX + "px",
                    "top": (clusterNodes[0].height + underlineHeight + arrowHeight + divHeight) + "px",
            }}
            >
                {selectedClusterNodeIndex !== undefined && clusterNodes[selectedClusterNodeIndex] !== undefined &&
                    <GroupSummary
                        gitAnalyzer={props.gitAnalyzer}
                        width={width}
                        selectedClusterNode={clusterNodes[selectedClusterNodeIndex]}
                        arrowStartX={rectWidths.filter( (d, i) => i < selectedClusterNodeIndex).reduce( (prev, cur) => prev + cur, 0)}
                        arrowWidth={rectWidths[selectedClusterNodeIndex]}
                        registerFavoriteFragment={registerFavoriteFragment}
                        useHeuristicMerge={props.useHeuristicMerge}
                    />
                }
            </div>
            
        </div>
    );
}
        
export default BranchSummary;