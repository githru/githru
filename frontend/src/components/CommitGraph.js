import Button from '@material-ui/core/Button';
import * as d3 from 'd3';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from "react-redux";
import * as actions from '../modules';
import GitAnalyzer from './analyzer/GitAnalyzer';
import ValueSlider from './ValueSlider';
import BranchSummary from './BranchSummary';
import { intersection } from "lodash";

import { drawClusters } from './CommitGraphDrawCluster';
import { buildClusterNodes } from './CommitGraphClustering';

function highlightKeywordMatchBlock(searchResultList, currentClusterNodeList) {
    // highlight blocks
    let searchResultCommitSeqList = searchResultList.reduce((prev, cur) => {
        prev.push(cur.seq);
        return prev;
    }, []);
    d3.selectAll(".matches").remove();
    if (searchResultList.length === 0) return;
    
    let matchSvg = d3.select("#clusters").append("g").attr("class", "matches");
    currentClusterNodeList
        .reduce((prev, cur) => {
            prev = prev.concat(cur.blockList);
            return prev;
        }, [])
        .filter(block => d3.select("#block" + block.id).size() > 0)
        .forEach(block => {
            if (intersection(searchResultCommitSeqList, block.nodeList.map(d => d.seq)).length > 0) {
                let blockNode = d3.select("#block" + block.id);
                let x = +blockNode.attr("x");
                let y = +blockNode.attr("y");
                let width = +blockNode.attr("width");
                let height = +blockNode.attr("height");

                const over = 4;
                matchSvg
                    .append("ellipse")
                    .attr("class", "matchRect")
                    .attr("cx", x + width / 2.0)
                    .attr("cy", y + height / 2.0)
                    .attr("rx", width / 2.0 + over)
                    .attr("ry", height / 2.0 + over)
                    .style("fill", "red")
                    .style("fill-opacity", "0.2")
                    .style("stroke", "red")
                    .style("stroke-width", "2")
                    .style("pointer-events", "none")
                ;
            }
        });
    
    searchResultCommitSeqList.forEach ( seq => {
        const commitRect = d3.select("#commitRect" + seq);
        const x = +commitRect.attr("x");
        const y = +commitRect.attr("y");
        const width = +commitRect.attr("width");
        const height = +commitRect.attr("height");
        const over = 2;

        d3.select("#commitRects")
            .append("ellipse")
            .attr("class", "matchRect")
            .attr("cx", x + width / 2.0)
            .attr("cy", y + height / 2.0)
            .attr("rx", width / 2.0 + over)
            .attr("ry", height / 2.0)
            .style("fill", "red")
            .style("fill-opacity", "0.2")
            .style("stroke", "red")
            .style("stroke-width", "2")
            .style("pointer-events", "none")
        ;
    });
}

/////////////////////
// HOOK CLASS
const CommitGraph = (props) => {
    // const ignoreFiles = ["CHANGELOG.md", "version.txt"];
    const state = useSelector(state => state);
    const layout = JSON.parse(JSON.stringify(state.layout));
    const overviewWidth = layout.clusterOverviewWidth;
    const width = layout.clusterOverviewWidth - layout.clusterOverviewSliderWidth;
    const height = layout.clusterOverviewHeight;

    // local layout vars
    layout.height = height;
    layout.sliderWidth = layout.clusterOverviewSliderWidth;
    // layout.clusterOverviewMarginRight = 3;
    layout.clusterOverviewWidth = layout.width - layout.sliderWidth// - this.clusterOverviewMarginRight;
    layout.minBlockShow = 0;

    const dispatch = useDispatch();
    const updateClusterThreshold = (th) => dispatch(actions.updateClusterThreshold(th));
    const updateClusterOverviewHeight = (height) => dispatch(actions.updateClusterOverviewHeight(height));
    const [thresholdList, setThresholdList] = useState([]);

    // info = [clusterNodes, isBranch]
    let prevSelectedClusterNodesInfo = useRef([undefined, undefined]);
    const [selectedClusterNodesInfo, setSelectedClusterNodesInfo] = useState([undefined, undefined]);

    let clusteringResult = useRef();
    let clusterNodesResult = useRef();
    let clusterNodesByBranchNo = useRef();
    let groupSvgWidth = useRef(0);
    let totalStat = useRef([0, 0]);
    
    const showGroupSummaryFunc = (branchNo, clusterNodes) => {
        // CONTROL MULTI CLICK (SHIFT)
        let currentClusterNodes = prevSelectedClusterNodesInfo.current[1];
// console.log("prev = ", prevSelectedClusterNodesInfo.current);
        let multi = false;
        if (d3.event !== null 
                && d3.event.shiftKey 
                && branchNo === -1
                && prevSelectedClusterNodesInfo.current !== undefined && prevSelectedClusterNodesInfo.current[0] === -1 
                && prevSelectedClusterNodesInfo.current[1][0].cluster.nodeList[0].implicitBranchNo === clusterNodes[0].cluster.nodeList[0].implicitBranchNo
                ) {
            // already chosen => pass
            if (prevSelectedClusterNodesInfo.current[1].filter(d => d.cluster.id === clusterNodes[0].cluster.id).length === 0) {
                currentClusterNodes.push(clusterNodes[0]);
            }
            multi = true;
        } else {
            currentClusterNodes = clusterNodes;
        }
        prevSelectedClusterNodesInfo.current = [branchNo, currentClusterNodes];
        setSelectedClusterNodesInfo([branchNo, currentClusterNodes]);

        if (branchNo >= 0) d3.select("#underlines" + branchNo).style("fill-opacity", 1);
        
        return multi;
// console.log("showGroupSummaryFunc called", [branchNo, clusterNodes])
    }

    const buildAndDrawClusterNodes = () => {
        let [threshold, thresholdList, clusterList] = clusteringResult.current;

        setSelectedClusterNodesInfo([undefined, undefined]);

        clusterNodesResult.current = buildClusterNodes(props.gitAnalyzer, threshold, thresholdList, clusterList, state.groupingParameters.branchShowMapByType);
        setThresholdList(clusterNodesResult.current[2]);

        let svgHeight;
        [clusterNodesByBranchNo.current, groupSvgWidth.current, svgHeight] = drawClusters(
            layout, state.commitSeqSelection, clusterNodesResult.current[0], clusterNodesResult.current[1], 
            props.gitAnalyzer, state.groupingParameters.preferenceWeights, state.groupingParameters.threshold,
            state.groupingParameters.nonConflictGroupingLevel, state.summaryParameters.hideFiles,
            state.groupingParameters.useHeuristicMerge, state.showMergeLink, 
            showGroupSummaryFunc);
        updateClusterOverviewHeight(svgHeight);
        
        totalStat.current = [
            clusterNodesResult.current[0].filter(d => !d.isNonConfilctMerge).length,
            clusterNodesResult.current[0].filter(d => !d.isNonConfilctMerge).reduce( (prev, d) => prev + d.cluster.nodeCount, 0),
            // (useHeuristicMerge ? clusteringResult.current[0].filter(d => !d.isNonConfilctMerge).reduce( (prev, d) => prev + d.mergeNodes.nodeCount, 0) : 0)
        ];

// console.log("clusterNodesByBranchNo", clusterNodesByBranchNo.current, selectedClusterNodesInfo[0] in clusterNodesByBranchNo.current)
        if (!(selectedClusterNodesInfo[0] in clusterNodesByBranchNo.current)) {
            setSelectedClusterNodesInfo([undefined, undefined]);
            prevSelectedClusterNodesInfo.current = [undefined, undefined];
        } else {
            showGroupSummaryFunc(selectedClusterNodesInfo[0], clusterNodesByBranchNo.current[selectedClusterNodesInfo[0]]);
            // setSelectedClusterNodesInfo([selectedClusterNodesInfo[0], ]);
            // prevSelectedClusterNodesInfo.current()
        }

        highlight();
    }

    const highlight = () => {
        if (state.highlightQuery !== undefined && state.highlightQuery.length > 0) {
            let searchResultNodeList = GitAnalyzer.searchByKeywords(
                clusterNodesResult.current[0].reduce( (prev, clusterNode) => prev.concat(clusterNode.cluster.nodeList.map(d => d)), []), 
                state.highlightQuery);
            highlightKeywordMatchBlock(searchResultNodeList, clusterNodesResult.current[0]);
        } else {
            highlightKeywordMatchBlock([], undefined);
        }
    }

    //////////////////////////////////////
    // USE EFFECTS
    //////////////////////////////////////
    useEffect( () => {
        setSelectedClusterNodesInfo([undefined, undefined]);
    }, [state.globalCommitSeqSelectionByTemporalFilter]);

    useEffect(() => {
// console.log("called useEffect buildAndDrawClusterNodes");
// console.log("CHANGED USEEFFECT", state, prevSelectedClusterNodesInfo, selectedClusterNodesInfo, props.gitAnalyzer.allNodeList.filter(d => d.mergeNodes.length > 0));
        clusteringResult.current = props.gitAnalyzer.getOverviewClusters(
                state.groupingParameters.threshold, state.commitSeqSelection, state.groupingParameters.preferenceWeights, 
                state.groupingParameters.keywordFilterList, state.groupingParameters.releaseBinningLevel, state.groupingParameters.useHeuristicMerge);
        
        buildAndDrawClusterNodes();
    }, [
        state.groupingParameters.useHeuristicMerge,
        state.commitSeqSelection,
        state.groupingParameters.threshold, 
        state.groupingParameters.nonConflictGroupingLevel, 
        state.groupingParameters.releaseBinningLevel,
        state.groupingParameters.keywordFilterList,
        state.groupingParameters.preferenceWeights,
    ]);

    useEffect( () => {
        buildAndDrawClusterNodes();
    }, [
        state.groupingParameters.branchShowMapByType,
    ]);

    useEffect( () => {
        highlight();
    }, [state.highlightQuery,]);

    useEffect( () => {
        if(state.showMergeLink) {
            d3.selectAll(".mergedRelationLinks")
                .attr("orgVisibility", "visible")
                .style("visibility", "visible");
        }
        else {
            d3.selectAll(".mergedRelationLinks")
                .attr("orgVisibility", "hidden")
                .style("visibility", "hidden");
        }
    }, [state.showMergeLink,]);


    return (
        <div className="flexVerticalContainer" style={{ width: overviewWidth }}>
            <div className="flexContainer">
                <div width={layout.sliderWidth} align="right">
                    <ValueSlider
                        name={"clusterOverview"}
                        defaultStepValue={0}
                        threshold={state.groupingParameters.threshold}
                        changeThreshold={updateClusterThreshold}
                        height={height}
                        thresholdList={thresholdList}
                        width={layout.sliderWidth} />
                </div>
                <div 
                    id="branchSummaryDiv" 
                    style={{ position: "relative", zIndex: 1, float: "left" }} 
                    width={width} 
                    height={height}
                    visible={"visible"}
                >
                    {/* {selectedClusterNodesInfo[0] !== undefined && selectedClusterNodesInfo[1] !== undefined  && */}
                        <BranchSummary
                            clusterNodes = {selectedClusterNodesInfo[1]}
                            branchNo = {selectedClusterNodesInfo[0]}
                            width = {groupSvgWidth.current}
                            height = {state.layout.clusterOverviewHeight}
                            hideFiles = {state.summaryParameters.hideFiles}
                            summaryByLOC = {state.summaryParameters.summaryByLOC}
                            useHeuristicMerge = {state.groupingParameters.useHeuristicMerge}
                            branchShowMapByType = {state.groupingParameters.branchShowMapByType}
                            gitAnalyzer = {props.gitAnalyzer}
                        />
                    {/* } */}
                </div>
                <div>
                    <svg id="clusterOverviewSvg" width={width} height={height}
                        style={{ "background": "#fafafa", "opacity": "0.95" }}
                    // transform={"translate(" + this.margin.left + "," + this.margin.top + ")"}>           
                    >
                    </svg>
                </div>
            </div>
            <div className="flexContainer" style={{ width: overviewWidth, justifyContent: "space-between", height: "25px" }}>
                <div style={{width:layout.sliderWidth + 10}}></div>
                <div style={{width:"100%"}}>
                    ({totalStat.current[0]} CLUSTERS, {totalStat.current[1]} COMMITS)
                </div>
                <div align="right" style={{width:"300px", paddingTop:"5px", paddingRight:"5px"}}>
                    {selectedClusterNodesInfo[1] !== undefined &&
                        <Button style={{ "fontSize": "11px", "zIndex": 10 }} size="small" variant="outlined" 
                            onClick={ () => {
                                // if (selectedClusterNodesInfo[1] === undefined) return;
                                const maxCaptureCount = 6;
                                if (state.capturedSummaryInfoList.length >= maxCaptureCount) {
                                    alert("# of max CAPTURE is " + maxCaptureCount);
                                    return;
                                }
                                dispatch(actions.addCapturedSummaryInfoList(
                                    [
                                        selectedClusterNodesInfo[1],
                                        state.groupingParameters,
                                    ]
                                ));
                                console.log("button click", selectedClusterNodesInfo, selectedClusterNodesInfo[1], state.capturedSummaryInfoList.concat(selectedClusterNodesInfo[1]));
                            }}>
                            CAPTURE SELECTION
                        </Button>
                    }

                </div>
            </div>
            <div className="flexContainer">
                
            </div>
            {/* <ClusterToolTip
                    cluster={overCluster}
                /> */}
            <div id="clusterToolTip" className="tooltip" style={{ visibility: "hidden", opacity: 0.8 }}></div>
        </div>
    );
}


export default CommitGraph;