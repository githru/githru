import "./TemporalSelector.css";
import * as d3 from 'd3';
import { AttributeColors } from "./ColorClasses"
import GitAnalyzer from './analyzer/GitAnalyzer';
import * as actions from '../modules';

import React, { useRef, useEffect } from 'react';
import { useDispatch, useSelector, shallowEqual } from "react-redux";

let commitBrush = undefined;
let commitSeqXScale = undefined;

function navRender(props, state) {
    // VARIABLES
    
    const arrowSvgHeight = state.arrowSvgHeight;
    const brushHandleSize = 6;
    const navMarginLeft = brushHandleSize / 2;
    const navMarginBottom = 3;
    const temporalAxisHeight = 22;
    const tagHeight = 50;
    const temporalAreaHeight = state.temporalAreaHeight;
    const leftWidth = state.leftPaneWidth + 11;
    const width = state.width;
    const parseTime = GitAnalyzer.parseTime;

// console.log("navigationRender");
    const { allNodeList } = props.gitAnalyzer;
// console.log("navigationRender--- allnodeList.length=", allNodeList.length);
    const focusHeight = 25;
    const height = state.temporalSelectorHeight - navMarginBottom;
    const focusRelativeHeightPosition = height - focusHeight;
    const marginLeft = navMarginLeft;

    let globalStartSeq, globalEndSeq;
    if (state.globalCommitSeqSelectionByTemporalFilter === undefined) {
        globalStartSeq = 0;
        globalEndSeq = allNodeList.length - 1;
    } else {
        [globalStartSeq, globalEndSeq] = state.globalCommitSeqSelectionByTemporalFilter;
    }

    const globalFilteredNodeList = allNodeList.filter( 
            node => node.seq >= globalStartSeq && node.seq <= globalEndSeq );

    // FUNCTIONS INIT
    const handleTemporalLabel = (selection, xTemporalScale) => {
        let leftAlignWidth = (selection[0] > 50 ? 45 : 0);
        let rightAlignWidth = (selection[1] > width - 50 ? 80 : 40);
        d3.select("#temporalStartDiv")
            // .style("left", (leftWidth + selection[0] + 20) + "px")
            .style("left", (selection[0] - leftAlignWidth) + "px")
            .text(getTemporalLabelByDate(xTemporalScale.invert(selection[0])));
        d3.select("#temporalEndDiv")
            // .style("left", (leftWidth + selection[1] - 40 + 15) + "px")
            .style("left", (selection[1] - rightAlignWidth) + "px")
            .text(getTemporalLabelByDate(xTemporalScale.invert(selection[1])));
    }

    const handleCommitLabel = (selection, commitSeqXScale, globalStartSeq) => {
        let newXScale = d3.scaleLinear().rangeRound([0, globalFilteredNodeList.length - 1]).domain(commitSeqXScale.range());
        let newSel = selection.map(d => newXScale(d));

        let [startLabel, endLabel] = newSel.map(d => {
            let node = globalFilteredNodeList[d];
            if (node.isRelease) return node.releaseTagString;
            else return "#" + node.commit.id.substring(0, 6);
        });

        let leftAlignWidth = (selection[0] > 60 ? 60 : 0);
        let rightAlignWidth = (selection[1] > width - 70 ? 100 : 60);
        d3.select("#commitStartDiv")
            // .style("left", (leftWidth + selection[0] + 20) + "px")
            .style("left", (selection[0] - leftAlignWidth) + "px")
            .text(startLabel + "(" + (newSel[0] + globalStartSeq) + ")");
        d3.select("#commitEndDiv")
            // .style("left", (leftWidth + selection[1] - 65 + 15) + "px")
            .style("left", (selection[1] - rightAlignWidth) + "px")
            .text(endLabel + "(" + (newSel[1] + globalStartSeq) + ")");
    }

    const drawTemporalToCommitArrow = () => {
        let tSel = d3.brushSelection(d3.select("#temporalBrush").node());
        let cSel = d3.brushSelection(d3.select("#commitBrush").node());

        if (tSel === null || cSel === null) return;
        drawSelectionArrow("navigationSvg", [[tSel[0], cSel[0]], [tSel[1], cSel[1]]], [temporalAreaHeight, temporalAreaHeight + tagHeight - navMarginBottom]);
    }

    const drawCommitToClusterArrow = (selection) => {
        if (selection === null) return;
        drawSelectionArrow("arrowSvg",
            [[selection[0], state.clusterOverviewSliderWidth],
            [selection[1], state.clusterOverviewWidth]], [0, arrowSvgHeight]
        );
    }

    const getCommitBrushSelectionsTriggeredByTemporalBrush = (selection, commitSeqXScale, bins, globalStartSeq) => {
        if (selection === null) return null;
// console.log("getCommitBrushSelectionsTriggeredByTemporalBrush", d3.event.target);
        let newXScale = d3.scaleLinear().rangeRound([0, bins.length - 1]).domain(commitSeqXScale.range());
        let startBinIndex, endBinIndex;
        [startBinIndex, endBinIndex] = selection.map(d => newXScale(d));
// console.log("before startBinIndex, endBinIndex", startBinIndex, endBinIndex, bins)

        for (; startBinIndex < endBinIndex; startBinIndex++) {
            if (bins[startBinIndex].length !== 0) break;
        }
        for (; endBinIndex > startBinIndex; endBinIndex--) {
            if (bins[endBinIndex].length !== 0) break;
        }
// console.log("startBinIndex, endBinIndex", startBinIndex, endBinIndex, bins, commitSeqXScale)

        if (bins[startBinIndex] === undefined) {
            return null;
        } else {
// console.log("return", [commitSeqXScale(bins[startBinIndex][0].seq - globalStartSeq), commitSeqXScale(bins[endBinIndex].slice(-1)[0].seq - globalStartSeq)])
            return [commitSeqXScale(bins[startBinIndex][0].seq - globalStartSeq), commitSeqXScale(bins[endBinIndex].slice(-1)[0].seq - globalStartSeq)];
        }
    }

    const commitBrushFunc = (selection, commitSeqXScale) => {
        console.log("brushed width x", d3.event, selection);
        if (selection === null) return null;

        let commitSeqScale = d3.scaleLinear().range([0, globalFilteredNodeList.length - 1]).domain(commitSeqXScale.range());
        let commitSeqSelection = selection.map(d => Math.round(commitSeqScale(d)));

        // STATE UPDATE
        state.udpateCommitsByTemporalBrush(commitSeqSelection.map(d => d + globalStartSeq));
// console.log("###udpateCommitsByTemporalBrush", commitSeqSelection.map(d => d + globalStartSeq))
        // handle deco
        d3.select("#navigationSvg").selectAll(".handle")
            .style("stroke", d3.schemeCategory10[0])
            .style("fill", d3.schemeCategory10[0])
            .style("fill-opacity", 0.2)
            ;

        return commitSeqSelection;
    }

    const drawSelectionArrow = (svg, rangeX, rangeY) => {
        d3.select("#" + svg).selectAll(".rangeArrowLine").remove();
        d3.select("#" + svg).selectAll(".rangeArrowLine")
            .data(rangeX)
            .enter()
            .append("line")
            .attr("class", "rangeArrowLine")
            .attr("id", svg + "ArrowLine")
            .attr("x1", d => d[0])
            .attr("x2", d => d[1])
            .attr("y1", rangeY[0])
            .attr("y2", rangeY[1])
            .style("stroke-width", 1)
            .style("stroke", d3.schemeCategory10[0])
            ;
    }

    const getTemporalLabelByDate = (dt) => {
        return new Date(dt).toISOString().slice(2, 10);
    }

    // LOGIC
    let navigationSvg = d3.select("#navigationSvg");
    let commitSeqXScale = d3.scaleBand().range([marginLeft, width - marginLeft]).domain(d3.range(globalFilteredNodeList.length));
    // let colorScale = d3.scaleLinear().range(["white", "black"]).domain([0, 1000]);

    ////////////////////////////////////////////
    // commit rects
    navigationSvg.append("g")
        .attr("id", "commitRects")
        .attr("transform", "translate(0 " + focusRelativeHeightPosition + ")")
        .selectAll("line")
        .data(globalFilteredNodeList)
        .enter()
        .append("rect")
        .attr("id", d => "commitRect" + d.seq)
        .attr("class", "commitRect")
        .attr("x", d => commitSeqXScale(d.seq - globalStartSeq))
        .attr("y", 0)
        .attr("width", commitSeqXScale.bandwidth())
        .attr("height", focusHeight)
        // .style("fill", d => colorScale(d.cloc))
        .style("fill", d => {
            if (d.isMajorRelease) return AttributeColors.highlight[0];
            else if (d.isRelease) return AttributeColors.highlight[2];
            else return AttributeColors["commit"][2];
            // return "AAA";
        })
        .style("stroke-width", d => (d.isRelease === true ? "1px" : "0"))
        .style("stroke", d => (d.isMajorRelease ? AttributeColors.highlight[0] : (d.isRelease ? AttributeColors.highlight[2] : "")))
        .style("stroke-opacity", 0.8);
    ;
    
    // COMMIT SEQ AXIS
//     let commitSeqAxis = d3.axisBottom(commitSeqXScale);    
//     const commitSeqTickCount = 10;
//     const commitSeqTickInterval = parseInt((commitSeqXScale.domain().slice(-1)[0] - commitSeqXScale.domain()[0]) / commitSeqTickCount);

//     console.log("seqscale", commitSeqTickInterval, commitSeqXScale.domain(), commitSeqXScale.domain().filter( (d, i) => (i % commitSeqTickInterval) === (commitSeqTickInterval - 1)));

//     let commitSeqAxisArea = d3.select("#arrowSvg").append("g")
//         .attr("id", "commitSeqAxis")
//         .call(
//             commitSeqAxis.tickSizeOuter(commitSeqAxis.tickSize()).tickSize(commitSeqAxis.tickSize() * -1)
//             .tickValues( commitSeqXScale.domain().filter( (d, i) => {
//                 return (i % commitSeqTickInterval) === (commitSeqTickInterval - 1);
// //                 const diff = e - s;
// // console.log("range", diff, s, e, diff / 10,  (i%(diff/10)))
// //                 if ( (e - s) > tickCount) {
// //                     return (i % ( diff / 10)) === 0;
// //                 } else {
// //                     return true;
// //                 }
//             }))
//         );
//     commitSeqAxisArea.select("path").style("stroke-opacity", 0);
//     commitSeqAxisArea.selectAll(".tick line").style("stroke-opacity", 0);
//     commitSeqAxisArea.selectAll("text").style("font-size", "8px");


    ///////////////////////////////
    // tagging
    ///////////////////////////////
    // Temporal Area chart Filter (binning by day)
    let startDate = parseTime(globalFilteredNodeList[0].commit.date);
    let endDate = parseTime(globalFilteredNodeList.slice(-1)[0].commit.date);
// console.log(startDate, endDate)
    let xTemporalScale = d3.scaleTime().domain([startDate, endDate]).range([marginLeft, width - marginLeft]);
    let histogram = d3.histogram()
        .value(d => parseTime(d.commit.date))
        .domain(xTemporalScale.domain())
        .thresholds(xTemporalScale.ticks(d3.timeDay))
        ;
    let bins = histogram(globalFilteredNodeList).map(d => {
        d.cloc = d.reduce( (prev, node) => prev + node.cloc, 0);
        return d;
    });

    let temporalYSizeHalf = (temporalAreaHeight - temporalAxisHeight) / 2;
    let yTemporalCommitCountScale = d3.scaleLinear().range([temporalYSizeHalf, 0]).domain([0, d3.max(bins, d => d.length)]);
    let yTemporalCLOCScale = d3.scaleLinear().range([temporalYSizeHalf, 0]).domain([0, d3.max(bins, d => d.cloc)]);

    let tempArea = navigationSvg.append("g")
// console.log("bins", bins, temporalAreaHeight)
    tempArea.append("path")
        .attr("transform", "translate(0, " + (temporalAxisHeight) + ")")
        .datum(bins)
        .attr("fill", AttributeColors["commit"][0])
        .attr("stroke", AttributeColors["commit"][0])
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.9)
        .attr("d", d3.area()
            .x(d => xTemporalScale(d.x0))
            .y0(temporalYSizeHalf)
            .y1(d => yTemporalCommitCountScale(d.length))
            .curve(d3.curveCatmullRom.alpha(0.4))
        )
    ;
    tempArea.append("path")
        .attr("transform", "translate(0, " + (temporalAxisHeight + temporalYSizeHalf) + ")")
        .datum(bins)
        .attr("fill", AttributeColors["commit"][0])
        .attr("stroke", AttributeColors["commit"][0])
        .attr("stroke-width", 1.5)
        .attr("opacity", 0.9)
        .attr("d", d3.area()
            .x(d => xTemporalScale(d.x0))
            .y0(temporalYSizeHalf)
            .y1(d => yTemporalCLOCScale(d.cloc))
            .curve(d3.curveCatmullRom.alpha(0.4))
        )
    ;
    tempArea.append("text")
        .attr("x", 7)
        .attr("y", temporalAxisHeight + 10)
        .attr("text-anchor", "start")
        .style("font-size", "10px")
        .style("font-weight", 500)
        .text("COMMIT #")
    ;
    tempArea.append("text")
        .attr("x", 7)
        .attr("y", temporalAxisHeight + temporalYSizeHalf + 10)
        .attr("text-anchor", "start")
        .style("font-size", "10px")
        .style("font-weight", 500)
        .text("CLOC")
    ;


    let tempAxis = d3.axisTop(xTemporalScale);
    tempArea.append("g")
        .call(tempAxis.tickSizeOuter(tempAxis.tickSize()).tickSize(tempAxis.tickSize() * -1))
        .attr("transform", "translate(" + 0 + "," + (temporalAxisHeight - 1) + ")")
        .selectAll(".tick line")
        .attr("transform", "translate(" + 0 + "," + tempAxis.tickSize() / 2 + ")")
        ;

    let releaseTagNodeList = globalFilteredNodeList.filter(d => d.isRelease);
    let releaseBins = histogram(releaseTagNodeList);
    // let bar = tempArea.selectAll(".bar")
    //     .data(releaseBins)
    //     .enter().append("g")
    //     .attr("class", "bar")
    // bar.append("rect")
    //     .attr("x", d => xTemporalScale(d.x0))
    //     .attr("y", temporalAxisHeight)
    //     .attr("width", d => { return xTemporalScale(d.x1) - xTemporalScale(d.x0); })
    //     .attr("height", d => (d.length > 0 ? temporalAreaHeight - temporalAxisHeight : 0))
    //     .style("opacity", 0.3)
    //     .style("stroke", d => (d.filter(node => node.isMajorRelease).length > 0 ? "black" : "#AAAAAA"))
    //     ;

    ///////////////////////////////////////////////
    // release link between commitseq and temporal
    // console.log("link bt", releaseTagNodeList)
    let links = navigationSvg.append("g");
    links.selectAll("line")
        .data(releaseTagNodeList)
        .enter()
        .append("line")
        .attr("class", "linkBetweenCT")
        .attr("x1", d => xTemporalScale(parseTime(d.commit.date)))
        .attr("x2", d => commitSeqXScale(d.seq - globalStartSeq))
        .attr("y1", temporalAreaHeight)
        .attr("y2", focusRelativeHeightPosition)
        .style("stroke-width", 1)
        .style("stroke", d => (d.isMajorRelease ? "black" : "#BBBBBB"))
        .style("opacity", 0.3)
        .on("mouseenter", function (d) {
            d3.select(this).style("stroke", "red").style("stroke-width", "3px");
            d3.select("#releaseLabelDiv")
                .text(d.releaseTagString)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 10) + "px")
                .style("opacity", 1)
                ;
            d3.select("#commitRect" + d.seq).attr("height", focusHeight + 10).attr("y", -5);
        })
        .on("mouseleave", function (d) {
            d3.select(this)
                .style("stroke", (d.isMajorRelease ? "black" : "#BBBBBB"))
                .style("stroke-width", "1px")
                ;
            d3.select("#commitRect" + d.seq).attr("height", focusHeight).attr("y", 0);
            d3.select("#releaseLabelDiv").style("opacity", 0.2);
        })
        ;
    ;
    links.selectAll("text")
        .data(releaseTagNodeList.filter(d => d.isMajorRelease && d.releaseTagString.split(".")[1] === "0"))
        .enter()
        .append("text")
        .attr("x", d => commitSeqXScale(d.seq))
        .attr("y", focusRelativeHeightPosition)
        .attr("text-anchor", "end")
        .text(d => d.releaseTagString.split(".").slice(0, 2).join("."))
        .style("transform", "rotate(45)")
        ;


    ////////////////////////////////////////////////
    // brushes
    let commitBrush = d3.brushX()
        .extent([[marginLeft, focusRelativeHeightPosition], [width - marginLeft, height]]);
    let temporalBrush = d3.brushX()
        .extent([[marginLeft, temporalAxisHeight], [width - marginLeft, temporalAreaHeight]]);
    navigationSvg.append("g")
        .attr("id", "commitBrush")
        .attr("class", "brush")
        .call(commitBrush)
        .call(commitBrush.move, commitSeqXScale.range());
    navigationSvg.append("g")
        .attr("id", "temporalBrush")
        .attr("class", "brush")
        .call(temporalBrush)
        .call(temporalBrush.move, commitSeqXScale.range())
        ;

    temporalBrush.on("brush", () => {
        drawTemporalToCommitArrow();
        handleTemporalLabel(d3.event.selection, xTemporalScale);
    });
    commitBrush.on("brush", () => {
        drawCommitToClusterArrow(d3.event.selection);
        drawTemporalToCommitArrow();
// console.log("commitBrush", d3.event.selection, commitSeqXScale)
        handleCommitLabel(d3.event.selection, commitSeqXScale, globalStartSeq);
    });

    temporalBrush.on("end", () => {
        if (d3.event.selection === null) return;
        let newSelection = getCommitBrushSelectionsTriggeredByTemporalBrush(d3.event.selection, commitSeqXScale, bins, globalStartSeq);

        d3.select("#commitBrush").call(commitBrush.move, newSelection);
        drawTemporalToCommitArrow();
    });
    commitBrush.on("end", () => {
        if (d3.event.selection === null) return;
        let brushedSeqs = commitBrushFunc(d3.event.selection, commitSeqXScale);
        let newSelection = brushedSeqs.map(d => xTemporalScale(parseTime(globalFilteredNodeList[d].commit.date)));

        let brushG = d3.select("#temporalBrush");
        brushG.select(".selection").attr("x", newSelection[0]).attr("width", newSelection[1] - newSelection[0]);
        brushG.select(".handle--e").attr("x", newSelection[1] - brushHandleSize / 2);
        brushG.select(".handle--w").attr("x", newSelection[0] - brushHandleSize / 2);
        ;
        brushG._groups[0][0].__brush.selection[0][0] = newSelection[0];
        brushG._groups[0][0].__brush.selection[1][0] = newSelection[1];
        drawTemporalToCommitArrow();
        handleTemporalLabel(newSelection, xTemporalScale);
    });

    navigationSvg.select("#commitBrush").select(".selection")
        .attr("asdf", "asdf")
        .style("fill", AttributeColors["commit"][0])
        .style("fill-opacity", 0.2)
        ;
    navigationSvg.select("#temporalBrush").select(".selection")
        .style("fill", AttributeColors["commit"][0])
        .style("fill-opacity", 0.2)
        ;

    // handle deco
    d3.select("#navigationSvg").selectAll(".handle")
        .style("stroke", d3.schemeCategory10[0])
        .style("fill", d3.schemeCategory10[0])
        .style("fill-opacity", 0.2)
        ;
    drawTemporalToCommitArrow();
    drawCommitToClusterArrow(commitSeqXScale.range());
    handleTemporalLabel(xTemporalScale.range(), xTemporalScale);
    handleCommitLabel(commitSeqXScale.range(), commitSeqXScale, globalStartSeq);

// console.log("function state,", state, commitSeqXScale.range(), commitSeqXScale)

    // state.setCommitBrush(commitBrush);
    // state.setCommitSeqXScale(commitSeqXScale);

    return [commitBrush, commitSeqXScale];
}

const TemporalSelector = props => {
// console.log("TemporalSelector render");

    const state = useSelector(state => ({
        threshold: state.threshold,

        titlePanelHeight: state.layout.titlePanelHeight,
        temporalSelectorHeight: state.layout.temporalSelectorHeight,
        temporalAreaHeight: state.layout.temporalAreaHeight,
        width: state.layout.width,
        leftPaneWidth: state.layout.leftPaneWidth,
        clusterOverviewSliderWidth: state.layout.clusterOverviewSliderWidth,
        clusterOverviewWidth: state.layout.clusterOverviewWidth,
        arrowSvgHeight:30,      
        
        globalCommitSeqSelectionByTemporalFilter: state.globalCommitSeqSelectionByTemporalFilter,
    }));
    state.props = props;

    const dispatch = useDispatch();
    const udpateCommitsByTemporalBrush = (sel) => dispatch(actions.udpateCommitsByTemporalBrush(sel));
    state.udpateCommitsByTemporalBrush = udpateCommitsByTemporalBrush;
    const commitSeqSelectionByTemporalFilter = useSelector(state => state.commitSeqSelectionByTemporalFilter);

    let isInitRef = useRef(true);
    
    useEffect( () => {
        d3.select("#navigationSvg").selectAll("g").remove();
        d3.select("#arrowSvg").selectAll(".rangeArrowLine").remove();
        // d3.select("#commitSeqAxis").remove();

        [commitBrush, commitSeqXScale] = navRender(props, state); //, state.commitSeqSelection);
        udpateCommitsByTemporalBrush(state.globalCommitSeqSelectionByTemporalFilter);
    }, [state.globalCommitSeqSelectionByTemporalFilter]);

    useEffect( () => {
        if (isInitRef.current) {
            isInitRef.current = false;
        } else {
console.log("changed commitseqselection executed", state, state.commitBrush, commitBrush, commitSeqXScale);
            d3.select("#commitBrush").call(commitBrush.move, commitSeqSelectionByTemporalFilter.map(d => commitSeqXScale(d) + commitSeqXScale.bandwidth()/2));
        }
    }, [commitSeqSelectionByTemporalFilter]);

    return (
        <div>
            <div className="flexVerticalContainer" style={{ width: state.width }}>
                <div id="temporalLabelsDiv"
                    style={{
                        position: "relative",
                        zIndex: 1,
                        float: "left",
                        height: 0,
                    }}
                >
                    <div id="temporalStartDiv" className="rangeTooltip" style={{ opacity: 1, top: state.temporalAreaHeight + 4 }}>
                    </div>
                    <div id="temporalEndDiv" className="rangeTooltip" style={{ opacity: 1, top: state.temporalAreaHeight + 4 }}>
                    </div>
                </div>
                <div id="commitLabelsDiv"
                    style={{
                        position: "relative",
                        zIndex: 1,
                        float: "left",
                        height: 0,
                    }}
                >
                    <div id="commitStartDiv" className="rangeTooltip" style={{ opacity: 1, top: state.temporalSelectorHeight  }}>
                    </div>
                    <div id="commitEndDiv" className="rangeTooltip" style={{ opacity: 1, top: state.temporalSelectorHeight  }}>
                    </div>
                </div>
                <div>
                    <svg id="navigationSvg" width={state.width} height={state.temporalSelectorHeight} />
                    <svg id="arrowSvg" width={state.width} height={state.arrowSvgHeight} />
                    <div id="releaseLabelDiv" className="releaseLabelTooltip" style={{ opacity: 0, }} />
                </div>
            </div>
        </div>
    );
}

export default TemporalSelector;