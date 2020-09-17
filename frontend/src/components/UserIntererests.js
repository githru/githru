import React, { useEffect } from 'react';
import "./UserInterests.css";
import GitAnalyzer from "./analyzer/GitAnalyzer";
import { makeStyles } from '@material-ui/core/styles';
import {DataTypeByNameMap} from "./analyzer/GithruClasses";
import * as d3 from 'd3';
import CheckIcon from '@material-ui/icons/Check';
import { changeRGBColorByOpacity } from './ColorClasses';

function ShowCheckBox(props) {
    if (props.bool === true) return (<CheckIcon />);
    else return "";
}

const UserInterests = props => {
    const { clusterColor, seq, interestedItemList, checkSvgWidth, itemNameWidth, detailNodeEdgeWidthRatio, clusters, width, itemHeight, keywords } = props;
console.log("UserInterests Render ----", props, clusters, );

    const buttonWidth = 15;

    function findInterestItemInCluster(item, cluster) {
        return GitAnalyzer.searchByKeywords(cluster.nodeList, item[1].split(" "), DataTypeByNameMap[item[0]]).length > 0;
    }

    useEffect( () => {
        let defaultClass = "attrHeadText";
        d3.selectAll(".interestKeyword").nodes().map(d => d3.select(d)).forEach( n => {
            if (props.keywords.filter(keyword => n.text().toLowerCase().indexOf(keyword) >= 0).length > 0)
                n.attr("class", defaultClass + " matchedText");
            else
                n.attr("class", defaultClass);
        });
    }, [props.keywords]);

    const xScale = d3.scaleBand().domain(d3.range(clusters.length)).range([0, checkSvgWidth])
        .paddingInner(detailNodeEdgeWidthRatio).paddingOuter(detailNodeEdgeWidthRatio / 2);

    let counts = clusters.map(d => 0);
    return (
        <div id={"interestsDiv" + seq} className="flexVerticalContainer">
            {interestedItemList.map((item, ki) => (
                <div key={ki} className="flexContainer"
                    style={{borderBottom:"1px solid"}}>
                    <div key={ki} 
                        style={{ 
                            width: itemNameWidth, 
                            font: "14px bold",
                            textAlign: "right",
                            height: "19px",
                            overflow: "hidden",
                            display: "flex"
                        }}>
                        <div width="10">
                            <svg width={buttonWidth} height="100%">
                                <text x="1" y="96%" textAnchor="center" 
                                    onClick={() => props.removeInterestsItem(ki)}
                                    cursor="pointer" style={{fontSize:"14px"}}>
                                    x
                                </text>                           
                            </svg>
                        </div>
                        <div>
                            <svg width={(itemNameWidth - buttonWidth)+"px"} height="100%" style={{marginLeft: "2px", marginRight: "2px"}}>
                                <text
                                    className="interestKeyword"
                                    x="97%"
                                    y="90%"
                                    style={{font:"12px bold"}}
                                    textAnchor="end"
                                >{GitAnalyzer.getTextValue(item[0], item[1])}</text>
                            </svg>
                        </div>
                    </div>
                    {clusters.map((cluster, ci) => {
                        // find item in cluster
                        let found = findInterestItemInCluster(item, cluster);
                        if (found) counts[ci] += 1;
                        let colWidth = (checkSvgWidth) / counts.length;
                        return (
                            <svg key={ci}
                                align="center"
                                style={{
                                    width: colWidth,
                                    fontSize: "11px",
                                    height: itemHeight,
                                    // marginBottom: "0px"
                                    
                                }}
                                >
                                <rect
                                    style={{
                                        x: xScale(0),
                                        // x: xScale(ci),
                                        y: 0,
                                        width: xScale.bandwidth(),
                                        height: itemHeight,
                                        fill: (found ? changeRGBColorByOpacity(clusterColor, 0.4) : ""),
                                        // fill: (found ? clusterColor : ""),
                                        strokeWidth: 0,
                                    }}
                                />
                                <ShowCheckBox bool={found} />
                            </svg>
                        );
                    })}
                </div>
            ))}
            <div className="flexContainer">
                <div style={{width: itemNameWidth}}></div>
                {counts.map((d, ci) => (
                    <div key={ci}
                        align="center"
                        style={{
                            width: (width - itemNameWidth) / counts.length,
                            fontSize: "11px",
                            height: itemHeight,
                        }}
                    >
                        {d}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default UserInterests;