import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from "react-redux";
import { CommitCluster } from './analyzer/GithruClasses';
import * as d3 from 'd3';
import GitAnalyzer from './analyzer/GitAnalyzer';
import { intersection } from "lodash";
import { Checkbox } from '@material-ui/core';
import "./DetailCompare.css";
import * as actions from '../modules';
import { KeywordCloud } from './library/wordCloudGenerator';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked';


const DetailCompare = (props) => {

    const { hideFiles } = useSelector(state => state.summaryParameters);
    const { width } = props;


    //d3.select("#inspectionPane").style("width", "0px");
    // d3.select('#comparePane').style("width", "1700px");


    let aCapturedSummaryInfo = props.capturedSummaryInfoListForCompare[0];
    let bCapturedSummaryInfo = props.capturedSummaryInfoListForCompare[1];
    let aName = GitAnalyzer.getBranchNamesFromBranchClusterNodes(aCapturedSummaryInfo.clusterNodes)[0];
    let bName = GitAnalyzer.getBranchNamesFromBranchClusterNodes(bCapturedSummaryInfo.clusterNodes)[0];

    let reducingCapturedSummary = function(dict, val) {
        let fileList = val.clusterData.keywordsByRank;
       // console.log(fileList);
        fileList.forEach(e => {
            if(e[0] in dict) dict[e[0]] += e[1];
            else dict[e[0]] = e[1];
        })
        return dict;
    }

    let aCapturedSummaryInfoKeywordDict = aCapturedSummaryInfo.clusterNodes.reduce(reducingCapturedSummary, {});
    let bCapturedSummaryInfoKeywordDict = bCapturedSummaryInfo.clusterNodes.reduce(reducingCapturedSummary, {});


    let aCapturedSummaryInfoKeyword = [], 
        bCapturedSummaryInfoKeyword = [];
    
    for(let key in aCapturedSummaryInfoKeywordDict) 
        aCapturedSummaryInfoKeyword.push([key, aCapturedSummaryInfoKeywordDict[key]]);
    
    for(let key in bCapturedSummaryInfoKeywordDict) 
        bCapturedSummaryInfoKeyword.push([key, bCapturedSummaryInfoKeywordDict[key]]);

    const clusterNodesList = props.capturedSummaryInfoListForCompare.reduce((prev, capturedSummaryInfo) => {
        let newCluster = new CommitCluster(undefined, undefined, undefined);
        capturedSummaryInfo.clusterNodes.forEach(clusterNode => {
            clusterNode.cluster.nodeList.forEach(node => newCluster.addNode(node));
        });
        prev.push(newCluster);
        return prev;
    }, []);

    let aClusterNode = clusterNodesList[0];
    let bClusterNode = clusterNodesList[1];

    // Processing Data

    /* ================ Very IMPORTANT DATA Variables!! ========== */
    // overall
    let aCloc, bCloc;
    let aCommitNum, bCommitNum;

    // Author
    let interAuthorList;
    let aAuthorData, bAuthorData;
    let aAuthorArrayData = [], bAuthorArrayData = [];
    let aAuthorArrayDataLoc, bAuthorArrayDataLoc,
        aAuthorArrayDataCommit, bAuthorArrayDataCommit;

    // Commit Types
    let aCommitTypeArrayData = [], bCommitTypeArrayData = [];
    let aCommitTypeArrayDataLoc, bCommitTypeArrayDataLoc,
        aCommitTypeArrayDataCommit, bCommitTypeArrayDataCommit;
    /* ================ Very IMPORTANT DATA Variables!! ========== */

    // author data collection

    aCloc = aClusterNode.locStat.clocSum;
    bCloc = bClusterNode.locStat.clocSum;
    aCommitNum = aClusterNode.nodeCount;
    bCommitNum = bClusterNode.nodeCount;


    let authorCollector = function (authorList, node) {
        Object.keys(node.clusterData.authors).forEach(rawAuthor => {
            let author = GitAnalyzer.getTextValue("authors#2", rawAuthor); 
            authorList.push(author);
        })
        return authorList;
    }

    // interAuthorList = intersection(Array.from(new Set(aClusterNode.nodeList.reduce(authorCollector, []))),
    //     Array.from(new Set(bClusterNode.nodeList.reduce(authorCollector, []))));

    interAuthorList = intersection(Array.from(new Set(aCapturedSummaryInfo.clusterNodes.reduce(authorCollector, []))), 
                                   Array.from(new Set(bCapturedSummaryInfo.clusterNodes.reduce(authorCollector, []))));

    console.log(interAuthorList);


    let authorDataCollector = function (authorData, node) {
        Object.keys(node.clusterData.authors).forEach(rawAuthor => {
            let author = GitAnalyzer.getTextValue("authors#2", rawAuthor); 

            if (authorData[author] !== undefined) {
                authorData[author].commitNum += node.clusterData.authors[rawAuthor];
                authorData[author].cloc += node.clusterData.authorsLOCStat[rawAuthor].clocSum;
            }
            else {
                authorData[author] = {
                    commitNum: node.clusterData.authors[rawAuthor], 
                    cloc: node.clusterData.authorsLOCStat[rawAuthor].clocSum,
                    inIntersection: interAuthorList.includes(author) 
                }
            }
        })
        return authorData;
    }


    aAuthorData = aCapturedSummaryInfo.clusterNodes.reduce(authorDataCollector, {});
    bAuthorData = bCapturedSummaryInfo.clusterNodes.reduce(authorDataCollector, {});

    for (let authorKey in aAuthorData) {
        aAuthorArrayData.push({
            author: authorKey,
            commitNum: aAuthorData[authorKey].commitNum,
            loc: aAuthorData[authorKey].cloc,
            inIntersection: aAuthorData[authorKey].inIntersection
        });
    }
    for (let authorKey in bAuthorData) {
        bAuthorArrayData.push({
            author: authorKey,
            commitNum: bAuthorData[authorKey].commitNum,
            loc: bAuthorData[authorKey].cloc,
            inIntersection: bAuthorData[authorKey].inIntersection
        });
    }


    aAuthorArrayDataLoc = accumulatingLoc(aAuthorArrayData.sort(sortByLoc));
    bAuthorArrayDataLoc = accumulatingLoc(bAuthorArrayData.sort(sortByLoc));
    aAuthorArrayDataCommit = accumulatingCommitNum(aAuthorArrayData.sort(sortByCommitNum));
    bAuthorArrayDataCommit = accumulatingCommitNum(bAuthorArrayData.sort(sortByCommitNum));

    // CommitType data collection

    let commitTypeCollector = function (commitTypeList, node) {
        Object.keys(node.clusterData.commitTypes).forEach(commitType => {
            commitTypeList.push(commitType);
        })
        return commitTypeList;
    }

    let interCommitTypeList = intersection(Array.from(new Set(aCapturedSummaryInfo.clusterNodes.reduce(commitTypeCollector, []))),
                                           Array.from(new Set(bCapturedSummaryInfo.clusterNodes.reduce(commitTypeCollector, []))))


    let commitTypeDataCollector = function (commitTypeData, node) {
        Object.keys(node.clusterData.commitTypes).forEach(commitType => {
            if(commitTypeData[commitType] !== undefined) {
                commitTypeData[commitType].commitNum += node.clusterData.commitTypes[commitType];
                commitTypeData[commitType].cloc += node.clusterData.commitTypesLOCStat[commitType].clocSum;
            }
            else {
                commitTypeData[commitType] = {
                    commitNum :node.clusterData.commitTypes[commitType], 
                    cloc: node.clusterData.commitTypesLOCStat[commitType].clocSum,
                    inIntersection: interCommitTypeList.includes(commitType)
                }
            }
        })
       
        return commitTypeData;
    }

    let aCommitTypeData = aCapturedSummaryInfo.clusterNodes.reduce(commitTypeDataCollector, {});
    let bCommitTypeData = bCapturedSummaryInfo.clusterNodes.reduce(commitTypeDataCollector, {});

    //console.log(aCommitTypeData, bCommitTypeData)

    for (let commitTypeKey in aCommitTypeData) {
        aCommitTypeArrayData.push({
            commitType: commitTypeKey,
            commitNum: aCommitTypeData[commitTypeKey].commitNum,
            loc: aCommitTypeData[commitTypeKey].cloc,
            inIntersection: aCommitTypeData[commitTypeKey].inIntersection
        });
    }
    for (let commitTypeKey in bCommitTypeData) {
        bCommitTypeArrayData.push({
            commitType: commitTypeKey,
            commitNum: bCommitTypeData[commitTypeKey].commitNum,
            loc: bCommitTypeData[commitTypeKey].cloc,
            inIntersection: bCommitTypeData[commitTypeKey].inIntersection
        });
    }

    //console.log("Final CommitType DATA!!", aCommitTypeArrayData, bCommitTypeArrayData)

    aCommitTypeArrayDataLoc = accumulatingLoc(aCommitTypeArrayData.sort(sortByLoc));
    bCommitTypeArrayDataLoc = accumulatingLoc(bCommitTypeArrayData.sort(sortByLoc));
    aCommitTypeArrayDataCommit = accumulatingCommitNum(aCommitTypeArrayData.sort(sortByCommitNum));
    bCommitTypeArrayDataCommit = accumulatingCommitNum(bCommitTypeArrayData.sort(sortByCommitNum));

    // Keywords
    // variables for keyword
    let aClusterKeywordData = aCapturedSummaryInfoKeyword.sort((a,b) => b[1] - a[1]);
    let bClusterKeywordData = bCapturedSummaryInfoKeyword.sort((a,b) => b[1] - a[1]);

    let presentingKeywordNum = useRef(10);


    let aKeywords = [], bKeywords = [], interKeywords = [];
    for (let i = 0; i < 20; i++) {
        try {
            let word = aClusterKeywordData[i][0];
            aKeywords.push(word);
        }
        catch (e) { console.log("error") }
        try {
            let word = bClusterKeywordData[i][0];
            bKeywords.push(word);
        }
        catch (e) { console.log("error") }
    }
    interKeywords = intersection(aKeywords, bKeywords);

    let aList = aClusterKeywordData.slice(0, 20);
    let bList = bClusterKeywordData.slice(0, 20);
    let interList = interKeywords;

    // processing keyword data ENDD!!!


    // Processing data for file structure

    function generateFileDirData(aData, bData, aArray, bArray, aSum, bSum) {
        let aDataTempArray = [], bDataTempArray = [];
        for (let key in aData) aDataTempArray.push([key, aData[key]]);
        for (let key in bData) bDataTempArray.push([key, bData[key]]);

        aDataTempArray.sort((a, b) => b[1] - a[1]);
        bDataTempArray.sort((a, b) => b[1] - a[1]);

        aDataTempArray = aDataTempArray.slice(0, presentingKeywordNum.current);
        bDataTempArray = bDataTempArray.slice(0, presentingKeywordNum.current);
        let interArray = intersection(aDataTempArray.map(x => x[0]), bDataTempArray.map(x => x[0]));

        for (let i = 0; i < presentingKeywordNum.current; i++) {
            try {
                let name = aDataTempArray[i][0];
                aArray.push({
                    keyword: name,
                    score: aData[name] / aSum,
                    inIntersection: interArray.includes(name)
                });
            }
            catch {
                aArray.push({ keyword: "", score: 0, inIntersection: true });
            }
            try {
                let name = bDataTempArray[i][0];
                bArray.push({
                    keyword: name,
                    score: bData[name] / bSum,
                    inIntersection: interArray.includes(name)
                });
            }
            catch {
                bArray.push({ keyword: "", score: 0, inIntersection: true });
            }
        }
    }

    let reducingCapturedSummaryCloc = function(dict, val) {
        let fileDict = val.clusterData.clocByFiles;
        //console.log(fileList);
        for (let key in fileDict) {
            if(key in dict) dict[key] += fileDict[key];
            else dict[key] = fileDict[key];
        }
        return dict;
    }
    let reducingCapturedSummaryCommitNum = function(dict, val) {
        let fileDict = val.clusterData.touchCountByFiles;
        //console.log(fileList);
        for (let key in fileDict) {
            if(key in dict) dict[key] += fileDict[key];
            else dict[key] = fileDict[key];
        }
        return dict;
    }

    let aRawModLocFileData = aCapturedSummaryInfo.clusterNodes.reduce(reducingCapturedSummaryCloc, {});
    let aRawModNumFileData = aCapturedSummaryInfo.clusterNodes.reduce(reducingCapturedSummaryCommitNum, {});;
    let bRawModLocFileData = bCapturedSummaryInfo.clusterNodes.reduce(reducingCapturedSummaryCloc, {});
    let bRawModNumFileData = bCapturedSummaryInfo.clusterNodes.reduce(reducingCapturedSummaryCommitNum, {});;

    // Removing hideFiles
    hideFiles.forEach(fileName => {
        delete aRawModLocFileData[fileName]
        delete aRawModNumFileData[fileName]
        delete bRawModLocFileData[fileName]
        delete bRawModNumFileData[fileName]
    })

    let aLocFileArray = [], bLocFileArray = [], aNumFileArray = [], bNumFileArray = [];
    generateFileDirData(aRawModLocFileData, bRawModLocFileData, aLocFileArray, bLocFileArray, aCloc, bCloc);
    generateFileDirData(aRawModNumFileData, bRawModNumFileData, aNumFileArray, bNumFileArray, aCommitNum, bCommitNum);

    let aFileArray = [], bFileArray = [];
    for (let i = 0; i < presentingKeywordNum.current; i++) {
        aFileArray.push({
            keyword: aLocFileArray[i].keyword,
            loc: aLocFileArray[i],
            num: aNumFileArray[i]
        });
        bFileArray.push({
            keyword: bLocFileArray[i].keyword,
            loc: bLocFileArray[i],
            num: bNumFileArray[i]
        })
    }

    function processKey(word) {
        if (word === undefined) return word;
        return word.replace(/[`~! @#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
        // return replaceAll(replaceAll(replaceAll(replaceAll(replaceAll(replaceAll(replaceAll(word, ".", ""), ">", ""), "=", ""), "}", ""), "{", ""), " ", ""), "/", "");
    }


    // helper function to draw ben diagram
    function calIntersection(x0, y0, r0, x1, y1, r1) {
        var a, dx, dy, d, h, rx, ry;
        var x2, y2;
        dx = x1 - x0;
        dy = y1 - y0;

        d = Math.sqrt((dy * dy) + (dx * dx));

        if (d > (r0 + r1)) {
            return false;
        }
        if (d < Math.abs(r0 - r1)) {
            return false;
        }

        a = ((r0 * r0) - (r1 * r1) + (d * d)) / (2.0 * d);

        x2 = x0 + (dx * a / d);
        y2 = y0 + (dy * a / d);

        h = Math.sqrt((r0 * r0) - (a * a));

        rx = -dy * (h / d);
        ry = dx * (h / d);

        var xi = x2 + rx;
        var xi_prime = x2 - rx;
        var yi = y2 + ry;
        var yi_prime = y2 - ry;

        return [xi, xi_prime, yi, yi_prime];
    }

    // helper functions for sorting
    function sortByLoc(a, b) {
        return a.loc - b.loc;
    }

    function sortByCommitNum(a, b) {
        return a.commitNum - b.commitNum;
    }

    function accumulatingLoc(array) {
        let currentLocSum = 0;
        for (let i = 0; i < array.length; i++) {
            array[i]["currentLocSum"] = currentLocSum;
            currentLocSum += array[i]["loc"];
        }
        return array;
    }

    function accumulatingCommitNum(array) {
        let currentCommitSum = 0;
        for (let i = 0; i < array.length; i++) {
            array[i]["currentCommitSum"] = currentCommitSum;
            currentCommitSum += array[i]["commitNum"];
        }
        return array;
    }

    // Color scheme!!!!!!
    let color = {
        a: "rgb(255, 182, 182)",
        b: "#78e5cb",
        inter: "rgb(119, 122, 216)"
    }


    let aChecked = useRef(true);
    let interChecked = useRef(true);
    let bChecked = useRef(true);
    let isLoc = useRef(true); // false if commitNum

    let xAxisScale = useRef();

    let aAuthorSvgMolds = useRef();
    let aAuthorRects = useRef();
    let aAuthorTexts = useRef();

    let bAuthorSvgMolds = useRef();
    let bAuthorRects = useRef();
    let bAuthorTexts = useRef();

    let aCommitTypeSvgMolds = useRef();
    let aCommitTypeRects = useRef();
    let aCommitTypeTexts = useRef();

    let bCommitTypeSvgMolds = useRef();
    let bCommitTypeRects = useRef();
    let bCommitTypeTexts = useRef();


    let aFileSvg = useRef();
    let bFileSvg = useRef();

    let showFileFullPath = useRef(false);

    const dispatch = useDispatch();
    
    
    let updateXAxis;
    let updateAuthorSvg;
    let updateCommitTypeSvg;
    let updateKeywordSvg;
    let updatefileSvg;
    let updateLegends;
    
    useEffect(() => {
        dispatch(actions.updateScrollToRight(true));
        window.scrollTo({
            top:0,
            left:4000,
        });

        let mainSvg = d3.select("#compareClusters");
        mainSvg.selectAll("g").remove();


        /* ================================================== */
        /* ================================================== */
        /* Implementing Venn Diagram Comparison SELECTOR!!!!  */
        /* ================================================== */
        /* ================================================== */

        let radius = 45;
        let vennHeight = 65;
        let aClusterX = 72, bClusterX = 114;
        let interPoints = calIntersection(aClusterX, vennHeight, radius, bClusterX, vennHeight, radius);

        let vennSvg = mainSvg.append("g");

        let aCircle = vennSvg.append("g")
            .append("path")
            .attr("id", "aVenn")
            .style("fill", color.a)
            .attr("d", null)
            .attr("stroke", color.a)
            .attr("stroke-width", "0px")
            .style("opacity", 0.8)
            .style("cursor", "pointer")
            .on("mouseover", function (d) { d3.select(this).attr("stroke-width", 4); })
            .on("mouseout", function (d) { d3.select(this).attr("stroke-width", 0); })
            .on("click", function (d) {
                if (aChecked.current === true) {
                    d3.select(this).transition().duration(800).style("opacity", 0.3);
                    aChecked.current = false;
                    updateAuthorSvg();
                    updateCommitTypeSvg();
                    updateKeywordSvg();
                    updatefileSvg();
                    updateVennText();
                }
                else {
                    d3.select(this).transition().duration(800).style("opacity", 0.8);
                    aChecked.current = true;
                    updateAuthorSvg();
                    updateCommitTypeSvg();
                    updateKeywordSvg();
                    updatefileSvg();
                    updateVennText();
                }
            })

        aCircle.attr("d", function () {
            return "M" + interPoints[0] + "," + interPoints[2] + "A" + radius + "," + radius +
                " 0 1,1 " + interPoints[1] + "," + interPoints[3] + "A" + radius + "," + radius +
                " 0 0,0 " + interPoints[0] + "," + interPoints[2];
        });

        let bCircle = vennSvg.append("g")
            .append("path")
            .attr("id", "bVenn")
            .style("fill", color.b)
            .attr("d", null)
            .attr("stroke", color.b)
            .attr("stroke-width", "0px")
            .style("opacity", 0.8)
            .style("cursor", "pointer")
            .on("mouseover", function (d) { d3.select(this).attr("stroke-width", 4); })
            .on("mouseout", function (d) { d3.select(this).attr("stroke-width", 0); })
            .on("click", function (d) {
                if (bChecked.current === true) {
                    d3.select(this).transition().duration(800).style("opacity", 0.3);
                    bChecked.current = false;
                    updateAuthorSvg();
                    updateCommitTypeSvg();
                    updateKeywordSvg();
                    updatefileSvg();
                    updateVennText();
                }
                else {
                    d3.select(this).transition().duration(800).style("opacity", 0.8);
                    bChecked.current = true;
                    updateAuthorSvg();
                    updateCommitTypeSvg();
                    updateKeywordSvg();
                    updatefileSvg();
                    updateVennText();
                }
            })
        bCircle.attr("d", function () {
            return "M" + interPoints[0] + "," + interPoints[2] + "A" + radius + "," + radius +
                " 0 0,0 " + interPoints[1] + "," + interPoints[3] + "A" + radius + "," + radius +
                " 0 1,1 " + interPoints[0] + "," + interPoints[2];
        });

        let vennIntersection = vennSvg.append("g")
            .append("path")
            .attr("id", "interVenn")
            .style("fill", color.inter)
            .attr("d", null)
            .attr("stroke", color.inter)
            .attr("stroke-width", "0px")
            .style("opacity", 0.8)
            .style("cursor", "pointer")
            .on("mouseover", function (d) { d3.select(this).attr("stroke-width", 4); })
            .on("mouseout", function (d) { d3.select(this).attr("stroke-width", 0); })
            .on("click", function (d) {
                if (interChecked.current === true) {
                    d3.select(this).transition().duration(800).style("opacity", 0.3);
                    interChecked.current = false;
                    updateAuthorSvg();
                    updateCommitTypeSvg();
                    updateKeywordSvg();
                    updatefileSvg();
                    updateVennText();
                }
                else {
                    d3.select(this).transition().duration(800).style("opacity", 0.8);
                    interChecked.current = true;
                    updateAuthorSvg();
                    updateCommitTypeSvg();
                    updateKeywordSvg();
                    updatefileSvg();
                    updateVennText();
                }
            })

        vennIntersection.attr("d", function () {
            return "M" + interPoints[0] + "," + interPoints[2] + "A" + radius + "," + radius +
                " 0 0,1 " + interPoints[1] + "," + interPoints[3] + "A" + radius + "," + radius +
                " 0 0,1 " + interPoints[0] + "," + interPoints[2];
        });

        vennSvg.append("svg")
            .attr("x", 14)
            .attr("width", 70)
            .attr("height", 121)
            .append("text")
            .attr("id", "vennTextA")
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "middle")
            .attr("x", "50%")
            .attr("y", "50%")
            .style("font-size", "14px")
            .style("fill", "black")
            .style("font-weight", "bold")
            .text("#" + aCapturedSummaryInfo.id)
            // .text("#" + aCapturedSummaryInfo.id + " (" + aName + ")")

        vennSvg.append("svg")
            .attr("x", 100)
            .attr("width", 70)
            .attr("height", 121)
            .append("text")
            .attr("id", "vennTextB")
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "middle")
            .attr("x", "50%")
            .attr("y", "50%")
            .style("font-size", "14px")
            .style("fill", "black")
            .style("font-weight", "bold")
            // .text("#" + bCapturedSummaryInfo.id + " (" + bName + ")")
            .text("#" + bCapturedSummaryInfo.id)

        vennSvg.append("svg")
            .attr("x", 57)
            .attr("width", 70)
            .attr("height", 121)
            .append("text")
            .attr("id", "vennTextInter")
            .attr("dominant-baseline", "middle")
            .attr("text-anchor", "middle")
            .attr("x", "50%")
            .attr("y", "50%")
            .style("font-size", "15px")
            .style("fill", "black")
            .style("font-weight", "bold")
            // .text("#" + bCapturedSummaryInfo.id + " (" + bName + ")")
            .text("∩")

        function updateVennText() {
            if (aChecked.current)     d3.select("#vennTextA").transition().duration(800).style("opacity", 1);
            else                      d3.select("#vennTextA").transition().duration(800).style("opacity", 0);
            if (bChecked.current)     d3.select("#vennTextB").transition().duration(800).style("opacity", 1);
            else                      d3.select("#vennTextB").transition().duration(800).style("opacity", 0);
            if (interChecked.current) d3.select("#vennTextInter").transition().duration(800).style("opacity", 1);
            else                      d3.select("#vennTextInter").transition().duration(800).style("opacity", 0);
        }
        /* Finished Implementing Venn Diagram Comparison SELECTOR!!!!  */
 

        // Axis

        let xAxisLength = (width / 2) * 0.92;
        xAxisScale.current = d3.scaleLinear()
            .domain([0, Math.max(aClusterNode.locStat.clocSum, bClusterNode.locStat.clocSum)])
            .range([0, xAxisLength]);



        updateXAxis = function () {
            if (isLoc.current) {
                xAxisScale.current = d3.scaleLinear()
                    .domain([0, Math.max(aClusterNode.locStat.clocSum, bClusterNode.locStat.clocSum)])
                    .range([0, xAxisLength]);

            }
            else {
                xAxisScale.current = d3.scaleLinear()
                    .domain([0, Math.max(aClusterNode.nodeCount, bClusterNode.nodeCount)])
                    .range([0, xAxisLength]);

            }
        }

        let yAxisLength = 80;
        let yAxisMargin = 10;
        let rectHeight = (yAxisLength - 3 * yAxisMargin) / 2;

        // BARGRAPH Generator / updater

        function initBarGraphElement(type, svg, svgMolds, arrayDataLoc, rects, texts, defualtColor, checked) {
            console.log(arrayDataLoc);

            svgMolds.current = svg.selectAll("svg")
                .data(arrayDataLoc)
                .enter()
                .append("svg")
                .attr("x", d => xAxisScale.current(d.currentLocSum) + 1)
                .attr("y", 0)
                .attr("width", d => xAxisScale.current(d.loc))
                .attr("height", rectHeight)
                .attr("class", d => type + "_" + processKey(d[type]))
                .on("mouseover", function (d) {
                    if (d.inIntersection ? interChecked.current : checked.current) {
                        d3.selectAll("." + type + "_" + processKey(d[type])).attr("width", xAxisLength).raise()
                        d3.selectAll("." + type + "_rect_" + processKey(d[type])).style("opacity", 1);
                        d3.selectAll("." + type + "_text").style("opacity", 0);
                        d3.selectAll("." + type + "_text_" + processKey(d[type])).style("opacity", 1).style("font-weight", "bold");
                    
                        d3.select(".tooltipHover")
                          .style("left", (d3.event.pageX) + "px")		
                          .style("top", (d3.event.pageY) + "px")
                          .style("opacity", 0.8)
                          .style("width", "140px")
                          .html(isLoc.current ? d.loc.toFixed(0) + " lines modified" : d.commitNum.toFixed(1) + " commits")
                    }
                })
                .on("mouseout", function (d) {
                    if (d.inIntersection ? interChecked.current : checked.current) {
                        d3.selectAll("." + type + "_" + processKey(d[type])).attr("width", d => isLoc.current ? xAxisScale.current(d.loc) : xAxisScale.current(d.commitNum)).lower()
                        d3.selectAll("." + type + "_rect_" + processKey(d[type])).style("opacity", d => {
                            if (d.inIntersection) return interChecked.current ? 0.7 : 0.3;
                            else return checked.current ? 0.7 : 0.3;
                        });
                        d3.selectAll("." + type + "_text_" + processKey(d[type])).style("font-weight", 300);
                        d3.selectAll("." + type + "_text").style("opacity", d => {
                            if (d.inIntersection) return interChecked.current ? 1 : 0;
                            else return checked.current ? 1 : 0;
                        });
                    }
                    d3.select(".tooltipHover").style("opacity", 0);
                })
                .on("mousemove", function (d) {
                    d3.select(".tooltipHover")
                      .style("left", (d3.event.pageX) + "px")		
                      .style("top", (d3.event.pageY) + "px");
                });

            rects.current = svgMolds.current.append("rect")
                .attr("class", d => type + "_rect_" + processKey(d[type]))
                .attr("width", d => xAxisScale.current(d.loc))
                .attr("height", rectHeight)
                .attr("rx", 4).attr("ry", 4)
                .style("stroke", "white")
                .style("stroke-width", 0.5)
                .style("opacity", 0.7)
                .style("fill", d => {
                    if (d.inIntersection === true) return color.inter;
                    else return defualtColor;
                })



            texts.current = svgMolds.current.append("text")
                .attr("class", d => type + "_text " + type + "_text_" + processKey(d[type]))
                .attr("y", rectHeight * 0.6)
                .attr("x", 4)
                .text(d => d[type]);

        }

        function updateBarGraphElement(type, arrayData, svgMolds, rects, texts, defaultColor, checked) {

            svgMolds.current.data(arrayData)
                .join()
                .transition().duration(800)
                .attr("x", d => {
                    if (isLoc.current) return xAxisScale.current(d.currentLocSum) + 1
                    else return xAxisScale.current(d.currentCommitSum) + 1
                })
                .attr("width", d => { return isLoc.current ? xAxisScale.current(d.loc) : xAxisScale.current(d.commitNum); })
                .attr("class", d => type + "_" + processKey(d[type]))

            rects.current.data(arrayData)
                .join()
                .transition().duration(800)
                .style("opacity", d => {
                    if (d.inIntersection) return interChecked.current ? 0.7 : 0.3;
                    else return checked.current ? 0.7 : 0.3;
                })
                .style("fill", d => {
                    if (d.inIntersection === true) return color.inter;
                    else return defaultColor;
                })
                .attr("width", d => isLoc.current ? xAxisScale.current(d.loc) : xAxisScale.current(d.commitNum))
                .attr("class", d => type + "_rect_" + processKey(d[type]))

            texts.current.data(arrayData)
                .join()
                .transition().duration(800)
                .attr("class", d => type + "_text " + type + "_text_" + processKey(d[type]))
                .style("opacity", d => {
                    if (d.inIntersection) return interChecked.current ? 1 : 0;
                    else return checked.current ? 1 : 0;
                })
                .text(d => d[type]);
        }

        // End of BARGRAPH Generator / updater

        let labelYMargin = 15;

        // Author

        let authorX = (width / 2) * 0.04;
        let authorY = 160;

        let authorSvg = mainSvg.append("g");

        mainSvg.append("text")
               .text("Authors")
               .attr("x", authorX)
               .attr("y", authorY - labelYMargin)
               .style("font-size", "20px")
               .style("font-weight", 350);

        authorSvg.append("g")
            .attr('transform', 'translate(' + authorX + ',' + authorY + ')')
            .append("path")
            .attr("d", "M 0 0 L 0 " + yAxisLength)
            .style("stroke", "black")

        let authorAxis = authorSvg.append("g")
            .attr('transform', 'translate(' + authorX + ',' + (authorY + yAxisLength) + ')')
            .call(d3.axisBottom(xAxisScale.current));

        // appending legend

        authorSvg.append("text")
                 .text("#0")
                 .attr("x", 13)
                 .attr("y", authorY + 27)
                 .style("font-weight", 400);

        authorSvg.append("text")
                 .text("#1")
                 .attr("x", 13)
                 .attr("y", authorY + 62)
                 .style("font-weight", 400);

        authorSvg.append("text")
                 .attr("class", "basicXLegend")
                 .text("CLOC")
                 .attr("x", xAxisLength / 2 + 16)
                 .attr("y", authorY + yAxisLength + 35)
                 .style("font-weight", 400);

        /* ========= INIT AUTHOR - A START ========== */
        // preparing main svg
        let aAuthorSvg = authorSvg.append("g")
            .attr('transform', 'translate(' + authorX + ',' + (authorY + yAxisMargin) + ')');
        // preparing data
        aAuthorArrayData.sort(sortByLoc);

        //variables 
        initBarGraphElement("author", aAuthorSvg, aAuthorSvgMolds, aAuthorArrayDataLoc, aAuthorRects, aAuthorTexts, color.a, aChecked);
        /* ========== INIT AUTHOR - A END =========== */

        /* ========= INIT AUTHOR - B START ========== */
        // preparing main svg
        let bAuthorSvg = authorSvg.append("g")
            .attr('transform', 'translate(' + authorX + ',' + (authorY + yAxisMargin * 2 + rectHeight) + ')');
        // preparing data
        bAuthorArrayData.sort(sortByLoc);

        //variables 
        initBarGraphElement("author", bAuthorSvg, bAuthorSvgMolds, bAuthorArrayDataLoc, bAuthorRects, bAuthorTexts, color.b, bChecked);
        /* ========== INIT AUTHOR - B END =========== */

        updateAuthorSvg = function () {
            authorAxis.call(d3.axisBottom(xAxisScale.current));
            let aArrayData = isLoc.current ? aAuthorArrayDataLoc : aAuthorArrayDataCommit;
            let bArrayData = isLoc.current ? bAuthorArrayDataLoc : bAuthorArrayDataCommit;
            updateBarGraphElement("author", aArrayData, aAuthorSvgMolds, aAuthorRects, aAuthorTexts, color.a, aChecked)
            updateBarGraphElement("author", bArrayData, bAuthorSvgMolds, bAuthorRects, bAuthorTexts, color.b, bChecked)
        }

        // End of Author

        // CommitTypes

        let commitTypeX = authorX;
        let commitTypeY = authorY * 2 - 8;

        let commitTypeSvg = mainSvg.append("g");

        mainSvg.append("text")
               .text("Commit Type")
               .attr("x", commitTypeX)
               .attr("y", commitTypeY - labelYMargin)
               .style("font-size", "20px")
               .style("font-weight", 350);


        commitTypeSvg.append("g")
            .attr('transform', 'translate(' + commitTypeX + ',' + commitTypeY + ')')
            .append("path")
            .attr("d", "M 0 0 L 0 " + yAxisLength)
            .style("stroke", "black")

        let commitTypeAxis = commitTypeSvg.append("g")
            .attr('transform', 'translate(' + commitTypeX + ',' + (commitTypeY + yAxisLength) + ')')
            .call(d3.axisBottom(xAxisScale.current));

        commitTypeSvg.append("text")
                     .text("#0")
                     .attr("x", commitTypeX - 20)
                     .attr("y", commitTypeY + 27)
                     .style("font-weight", 400);

        commitTypeSvg.append("text")
                     .text("#1")
                     .attr("x", commitTypeX - 20)
                     .attr("y", commitTypeY + 62)
                     .style("font-weight", 400);


        commitTypeSvg.append("text")
                     .attr("class", "basicXLegend")
                     .text("CLOC")
                     .attr("x", commitTypeX + xAxisLength / 2 - 14)
                     .attr("y", commitTypeY + yAxisLength + 35)
                     .style("font-weight", 400);


        /* ========= INIT CommitType - A START ========== */
        // preparing main svg
        let aCommitTypeSvg = commitTypeSvg.append("g")
            .attr('transform', 'translate(' + commitTypeX + ',' + (commitTypeY + yAxisMargin) + ')');
        // preparing data
        aCommitTypeArrayData.sort(sortByLoc);

        //variables 
        initBarGraphElement("commitType", aCommitTypeSvg, aCommitTypeSvgMolds, aCommitTypeArrayDataLoc, aCommitTypeRects, aCommitTypeTexts, color.a, aChecked);
        /* ========== INIT CommitType - A END =========== */

        /* ========= INIT CommitType - B START ========== */
        // preparing main svg
        let bCommitTypeSvg = commitTypeSvg.append("g")
            .attr('transform', 'translate(' + commitTypeX + ',' + (commitTypeY + yAxisMargin * 2 + rectHeight) + ')');
        // preparing data
        bCommitTypeArrayData.sort(sortByLoc);

        //variables 
        initBarGraphElement("commitType", bCommitTypeSvg, bCommitTypeSvgMolds, bCommitTypeArrayDataLoc, bCommitTypeRects, bCommitTypeTexts, color.b, bChecked);
        /* ========== INIT CommitType - B END =========== */

        updateCommitTypeSvg = function () {
            commitTypeAxis.call(d3.axisBottom(xAxisScale.current));
            let aArrayData = isLoc.current ? aCommitTypeArrayDataLoc : aCommitTypeArrayDataCommit;
            let bArrayData = isLoc.current ? bCommitTypeArrayDataLoc : bCommitTypeArrayDataCommit;
            updateBarGraphElement("commitType", aArrayData, aCommitTypeSvgMolds, aCommitTypeRects, aCommitTypeTexts, color.a, aChecked)
            updateBarGraphElement("commitType", bArrayData, bCommitTypeSvgMolds, bCommitTypeRects, bCommitTypeTexts, color.b, bChecked)
        }
        // End of commitTypes

        // Keywords

        let keywordsX = authorX;
        let keywordsY = authorY * 4 + 195;
        let keywordsWidth = width * 0.5 * 0.92;
        let keywordsHeight = 270;

        let keywordsSvg = mainSvg.append("g")
            .attr('transform', 'translate(' + keywordsX + ',' + keywordsY + ')');

     

       
        mainSvg.append("text")
               .text("Keywords")
               .attr("x", keywordsX)
               .attr("y", keywordsY - labelYMargin)
               .style("font-size", "20px")
               .style("font-weight", 350);

        mainSvg.append("text")
               .text("(ranked by tf-idf score)")
               .attr("x", keywordsX + 93)
               .attr("y", keywordsY - labelYMargin - 1)
               .style("font-size", "13px")
               .style("font-weight", 350);
        
        // Appending Axis

        let keywordsAxisScale = d3.scaleLinear()
            .domain([0, 1])
            .range([0, keywordsWidth / 2 - 25]);
     
        KeywordCloud.generate(aList, bList, interList, "keywordsCanvas_1", "keywordsCanvas_2", 3, 0.5, 3, 10);
        
        let graphMargin = 5;
        let rectMargin = 5;
        let rectSingleHeight = (keywordsHeight - 2 * graphMargin - (presentingKeywordNum.current - 1) * rectMargin) / 10;
        let rectSingleY = rectSingleHeight + rectMargin;

        function initSmallChart(key, graphX, yourKeywordsSvg, keywordsData, defaultColor, checked, componentSvg, type) {

            yourKeywordsSvg.current = componentSvg.selectAll("." + key)
                .data(keywordsData)
                .enter()
                .append("svg")
                .attr("class", key)
                .attr("x", 1 + graphX)
                .attr("y", (d, i) => ((i) * rectSingleY + graphMargin))
                .on("mouseover", function (d) {
                    if (type === "keyword") {
                        if (d.inIntersection ? interChecked.current : checked.current) {
                            d3.selectAll("." + type + "_rect_" + processKey(d.keyword)).style("opacity", 1.0);
                            d3.selectAll("." + type + "_text_" + processKey(d.keyword)).style("font-weight", "bold");

                            d3.select(".tooltipHover")
                              .style("left", (d3.event.pageX) + "px")		
                              .style("top", (d3.event.pageY) + "px")
                              .style("opacity", 0.8)
                              .style("width", "80px")
                              .html(isLoc.current ? (d.loc*100).toFixed(2) + " %" : (100*d.commitNum).toFixed(2) + " %")
                        }
                        
                    }
                    else {
                        if (isLoc.current) {
                            if (d.loc.inIntersection ? interChecked.current : checked.current) {
                                d3.selectAll("." + type + "_rect_" + processKey(d.loc.keyword)).style("opacity", 1.0);
                                d3.selectAll("." + type + "_text_" + processKey(d.loc.keyword)).style("font-weight", "bold");
                                fileFullnameView.text(d.loc.keyword);
                                d3.select(".tooltipHover")
                                  .style("left", (d3.event.pageX) + "px")		
                                  .style("top", (d3.event.pageY) + "px")
                                  .style("opacity", 0.8)
                                  .style("width", "80px")
                                  .html(isLoc.current ? (d.loc.score*100).toFixed(2) + " %" : (100*d.num.score).toFixed(2) + " %")
                            }
                        }
                        else {
                            if (d.num.inIntersection ? interChecked.current : checked.current) {
                                d3.selectAll("." + type + "_rect_" + processKey(d.num.keyword)).style("opacity", 1.0);
                                d3.selectAll("." + type + "_text_" + processKey(d.num.keyword)).style("font-weight", "bold");
                                fileFullnameView.text(d.num.keyword);
                                d3.select(".tooltipHover")
                                  .style("left", (d3.event.pageX) + "px")		
                                  .style("top", (d3.event.pageY) + "px")
                                  .style("opacity", 0.8)
                                  .style("width", "80px")
                                  .html(isLoc.current ? (d.loc.score*100).toFixed(2) + " %" : (100*d.num.score).toFixed(2) + " %")
                            }
                        }
                       
                    }


                })
                .on("mouseout", function (d) {
                    if (type === "keyword") {
                        if (d.inIntersection ? interChecked.current : checked.current) {
                            d3.selectAll("." + type + "_rect_" + processKey(d.keyword)).style("opacity", 0.7);
                            d3.selectAll("." + type + "_text_" + processKey(d.keyword)).style("font-weight", 300);
                        }
                    }
                    else {
                        let keyword = isLoc.current ? d.loc.keyword : d.num.keyword;
                        if (isLoc.current) {
                            if (d.loc.inIntersection ? interChecked.current : checked.current) {
                                d3.selectAll("." + type + "_rect_" + processKey(keyword)).style("opacity", 0.7);
                                d3.selectAll("." + type + "_text_" + processKey(keyword)).style("font-weight", 300);
                            }
                        }
                        else {
                            if (d.num.inIntersection ? interChecked.current : checked.current) {
                                d3.selectAll("." + type + "_rect_" + processKey(keyword)).style("opacity", 0.7);
                                d3.selectAll("." + type + "_text_" + processKey(keyword)).style("font-weight", 300);
                            }
                        }
                        fileFullnameView.text("");
                    }
                    d3.select(".tooltipHover").style("opacity", 0);

                })
                .on("mousemove", function(d) {
                    d3.select(".tooltipHover")
                      .style("left", (d3.event.pageX) + "px")		
                      .style("top", (d3.event.pageY) + "px")
                });

            yourKeywordsSvg.current.append("rect")
                .attr("class", d => type + "_rect " + type + "_rect_" + processKey(d.keyword))
                .attr("width", d => {
                    if (type === "keyword")
                        return keywordsAxisScale(d.loc);
                    else
                        return keywordsAxisScale(d.loc.score);
                })
                .attr("height", rectSingleHeight)
                .style("fill", d => {
                    if (type === "keyword")
                        return d.inIntersection ? color.inter : defaultColor
                    else
                        return d.loc.inIntersection ? color.inter : defaultColor
                })
                .style("stroke-width", 0)
                .style("opacity", 0.7)
                .attr("rx", 2).attr("ry", 2);

            yourKeywordsSvg.current.append("text")
                .attr("class", d => type + "_text " + type + "_text_" + processKey(d.keyword))
                .text(d => {
                    if (type === "keyword")
                        return d.keyword;
                    else {
                        if(showFileFullPath.current)
                            return GitAnalyzer.reduceLongName(d.keyword, 60);
                        else {
                            let split = d.keyword.split("/");
                            return split[split.length - 1];
                        }
                    }
                })
                .attr("x", 3)
                .attr("y", 14);
        }

        function updateSmallChart(yourKeywordsSvg, checked, type, defaultColor) {
            yourKeywordsSvg.current.selectAll("rect")
                .attr("class", d => {
                    if (type === "keyword") {
                        return type + "_rect " + type + "_rect_" + processKey(d.keyword);
                    }
                    else {
                        let keyword = isLoc.current ? d.loc.keyword : d.num.keyword;
                        return type + "_rect " + type + "_rect_" + processKey(keyword)
                    }
                })
                .transition()
                .duration(800)
                .style("opacity", function (d) {
                    if (type === "keyword") {
                        if (d.inIntersection) return interChecked.current ? 0.7 : 0.3;
                        else return checked.current ? 0.7 : 0.3;
                    }
                    else {
                        if (isLoc.current ? d.loc.inIntersection : d.num.inIntersection) return interChecked.current ? 0.7 : 0.3;
                        else return checked.current ? 0.7 : 0.3;
                    }
                })
                .attr("width", function (d) {
                    if (type === "keyword") return isLoc.current ? keywordsAxisScale(d.loc) : keywordsAxisScale(d.commitNum);
                    else return isLoc.current ? keywordsAxisScale(d.loc.score) : keywordsAxisScale(d.num.score);
                })
                .style("fill", d => {
                    if (type === "keyword")
                        return d.inIntersection ? color.inter : defaultColor
                    else {
                        if (isLoc.current) return d.loc.inIntersection ? color.inter : defaultColor;
                        else return d.num.inIntersection ? color.inter : defaultColor;
                    }

                })
            yourKeywordsSvg.current.selectAll("text")
                .attr("class", d => {
                    if (type === "keyword") {
                        return type + "_text " + type + "_text_" + processKey(d.keyword);
                    }
                    else {
                        let keyword = isLoc.current ? d.loc.keyword : d.num.keyword;
                        return type + "_text " + type + "_text_" + processKey(keyword)
                    }
                })
                .transition()
                .duration(800)
                .style("opacity", function (d) {
                    if (type === "keyword") {
                        if (d.inIntersection) return interChecked.current ? 1 : 0;
                        else return checked.current ? 1 : 0;
                    }
                    else {
                        if (isLoc.current ? d.loc.inIntersection : d.num.inIntersection) return interChecked.current ? 1 : 0;
                        else return checked.current ? 1 : 0;
                    }
                })
                .text(d => {
                    if (type === "keyword") {
                        return d.keyword;
                    }
                    else {
                        let split = isLoc.current ? d.loc.keyword.split("/") : d.num.keyword.split("/")
                        return split[split.length - 1];
                    }
                })
        }

        
        

        updateKeywordSvg = function () {
            
        }


        // File structure

        let fileX = authorX;
        let fileY = authorY * 3 - 13;
        let fileWidth = width * 0.5;
        let fileHeight = keywordsHeight;

        let fileSvg = mainSvg.append("g")
            .attr('transform', 'translate(' + fileX + ',' + fileY + ')');

        mainSvg.append("text")
               .text("Files")
               .attr("x", fileX)
               .attr("y", fileY - labelYMargin)
               .style("font-size", "20px")
               .style("font-weight", 350);

        // Appending Axis

        let fileAxisScale = d3.scaleLinear()
            .domain([0, 1])
            .range([0, fileWidth / 2 - 25]);
        let fileAxis = d3.axisBottom(fileAxisScale).tickFormat(d3.format(".0%")).ticks(5);


        fileSvg.append("g")
            .append("path")
            .attr("d", "M 0 0 L 0 " + fileHeight)
            .style("stroke", "black");

        fileSvg.append("g")
            .append("path")
            .attr("d", "M " + (fileWidth / 2) + " 0 L " + (fileWidth / 2) + " " + fileHeight)
            .style("stroke", "black");

        fileSvg.append("g")
            .attr('transform', 'translate(' + 0 + ',' + fileHeight + ')')
            .call(fileAxis);

        fileSvg.append("g")
            .attr('transform', 'translate(' + (fileWidth / 2) + ',' + fileHeight + ')')
            .call(fileAxis);


        // legends

        fileSvg.append("text")
                    .attr("class","ratioXLegend")
                    .text("CLOC / Total CLOC (%)")
                    .style("font-weight", 400)
                    .attr("x", keywordsWidth / 4 - 66)
                    .attr("y", keywordsHeight + 35);

        fileSvg.append("text")
                    .attr("class","ratioXLegend")
                    .text("CLOC / Total CLOC (%)")
                    .style("font-weight", 400)
                    .attr("x", keywordsWidth * 3 / 4 - 66)
                    .attr("y", keywordsHeight + 35);

        let fileFullnameView = fileSvg.append("g")
            .attr('transform', 'translate(' + 1 + ',' + (fileHeight + 53) + ')')
            .append("text")
            .style("font-weight", "bold")
            .text("");

        initSmallChart("a", 0, aFileSvg, aFileArray, color.a, aChecked, fileSvg, "file");
        initSmallChart("b", (fileWidth / 2), bFileSvg, bFileArray, color.b, bChecked, fileSvg, "file");

        updatefileSvg = function() {
            if (isLoc.current) {
                updateSmallChart(aFileSvg, aChecked, "file", color.a);
                updateSmallChart(bFileSvg, bChecked, "file", color.b);
            }
            else {
                updateSmallChart(aFileSvg, aChecked, "file", color.a);
                updateSmallChart(bFileSvg, bChecked, "file", color.b);
            }
        }

        updateLegends = function () {

            console.log("UPDATESS!!")
            d3.selectAll(".basicXLegend")
              .text(() => {
                  if(isLoc.current) return "CLOC";
                  else return "Commit #"
              })
            d3.selectAll(".ratioXLegend")
              .text(() => {
                  if(isLoc.current) return "CLOC / Total CLOC (%)"
                  else return "Commit # / Total Commit # (%)"
              })
        }

         // Hovering

        let tooltip = d3.selectAll("#mainCompareDiv")
                        .append("div")
                        .attr("class", "tooltipHover")
                        .style("opacity", 0);

        tooltip.style("position", "absolute")
               .style("text-align", "center")
               .style("width", "120px")
               .style("height", "24px")
               .style("padding", "2px")
               .style("background", "#6ec2de")
               .style("border", "0px")
               .style("border-radius", "8px")
               .style("pointer-events", "none");

    
    }, [props.capturedSummaryInfoListForCompare]);


    return (
        <div id ="mainCompareDiv">
            <div id="title-panel" style={{width:800}}>
                <div id="repository-name">
                    COMPARE: 
                    <span style={{color: color.a}}>#{aCapturedSummaryInfo.id} ({aName})</span> vs <span style={{color: color.b}}>#{bCapturedSummaryInfo.id} ({bName})</span>
                </div>
                {/* <div id="legend-container">
                    {[ "authors", "keywords", "commitTypes", "clocByFiles", "clocByDirs" ].map((d, i) => {
                    let color = AttributeColors [ DataTypeByNameMap[d] ][ 3 ];
                    return (
                        <div key={i} className="legend-element" style={{
                            background: color,
                        }}>

                            <Icon>{AttributeIconSpecs[ d ]}</Icon>
                            <span>{d.split("clocBy").slice(-1)[ 0 ]}</span>

                        </div>
                        );
                    })}
                </div> */}
            </div>
            
            <div id="radioButtons" style={{position: "relative", left: "160px", top: "37px", width: "800px"}}>
                <RadioGroup aria-label="gender" name="gender1" defaultValue={"CLOC"} onChange={
                    function(event) {
                        if(event.target.value == "CLOC") {
                            isLoc.current = true;
                            updateXAxis();
                            updateAuthorSvg();
                            updateCommitTypeSvg();
                            updateKeywordSvg();
                            updatefileSvg();
                            updateLegends();
                        }
                        else {
                            isLoc.current = false;
                            updateXAxis();
                            updateAuthorSvg();
                            updateCommitTypeSvg();
                            updateKeywordSvg();
                            updatefileSvg();
                            updateLegends();
                        }
                    }
                }>
                    <div>
                        <Radio
                            style={{width:"25px", height:"25px", padding:0, margin: 0}}
                            color="primary"
                            value="CLOC"
                            icon={<RadioButtonUncheckedIcon fontSize="small" />}
                            checkedIcon={<RadioButtonCheckedIcon fontSize="small" />}
                            label="CLOC"
                        />
                        CLOC
                    </div>
                    <div>
                        <Radio
                            style={{width:"25px", height:"25px", padding:0, margin: 0}}
                            color="primary"
                            value="Commit #"
                            icon={<RadioButtonUncheckedIcon fontSize="small" />}
                            checkedIcon={<RadioButtonCheckedIcon fontSize="small" />}
                            label="Commit #"
                        />
                        Commit #
                    </div>
                </RadioGroup>
            </div>
            
            
            {/* <div style={{width:width, height:"50px"}} /> */}
            <div style={{ fontSize: "12px", left: "70px", top: "375px", position: "relative", width: "400px", margin: "0px"}} >
                <Checkbox
                    className={"showFileFullPath"}
                    size="small"
                    color="default"
                    defaultChecked={false}
                    onChange={()=> {
                        showFileFullPath.current = !showFileFullPath.current;
                        if(showFileFullPath.current) {
                            console.log("TRUE")
                            console.log(d3.selectAll(".file_text"))
                            d3.selectAll(".file_text")
                              .text(d => {
                                  return GitAnalyzer.reduceLongName(d.keyword, 60);
                              });
                        }
                        else {
                            console.log("FALSE")
                            d3.selectAll(".file_text")
                              .text(d => {
                                let split = d.keyword.split("/");
                                return split[split.length - 1];
                              })
                        }
                    }}
                />
                Show file path
            </div>
            <div style={{position: "relative", top: "-90px", left: "-10px"}}>
                <svg id="compareClusters" width={width} height={2000}></svg>
            </div>
            <div id="keywordsCanvas_1" style={{ width: "400px", height: "200px", position: "absolute", left: "1960px", top: "865px" }}></div>
            <div id="keywordsCanvas_2" style={{ width: "400px", height: "200px", position: "absolute", left: "2360px", top: "865px" }}></div>
        </div>
    )
}

export default DetailCompare;