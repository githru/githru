import React, { useEffect, useRef, Fragment, } from 'react';
import { Table, TableRow, TableCell, TableBody, Hidden } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import * as d3 from 'd3';
import { getScoreColor, AttributeColors, BranchColors } from './ColorClasses';
import { PreferenceList, ClusterData, DataTypeByNameMap, BranchTypes } from './analyzer/GithruClasses';
import GitAnalyzer from './analyzer/GitAnalyzer';
import FileIcicleSummary from './FileIcicleSummary';
import WordCloud from 'wordcloud';

const useStyles = makeStyles(theme => ({
  table: {
    padding: 1,
  },
  tableCell: {
    fontSize: "12px",
    paddingLeft: 2,
    paddingRight: 1,
    paddingTop: 2,
    paddingBottom: 2,
    verticalAlign: "text-top",
    minWidth: "40px"
  },
  nodeList: {
    display: "flex",
    flexDirection: "column",
    maxHeight: "450px",
    maxWidth: "100%",
    overflowY: "auto",
  },
  bar: {
    padding: 0,
  },
  div: {
    font: "14px bold"
  },
  vseparator: {
    width: "100%",
    height: "10px"
  },
}));


const hover = (event) => {
  event.target.style.textDecoration = "underline";
  event.target.style.fontWeight = "bold";
  // event.target.style.color = "red";
  // event.target.style.fill = "red";
}
const hout = event => {
  event.target.style.textDecoration = "";
  event.target.style.color = "";
  event.target.style.fill = "";
  event.target.style.fontWeight = "400";
}

function Cause(props) {
  const { cluster, prefMap, gitAnalyzer, width } = props;

  if (cluster.id === -1) return "";

  const nodeList = cluster.nodeList;
  if (nodeList.length > 1) {
    let scoreSumMap = d3.range(nodeList.length - 1).reduce((prev, cur, i) => {
      let scoreMap = gitAnalyzer.getScoreByPreferences(nodeList[cur], nodeList[cur + 1], prefMap);
      // let scoreMap = scoreData[nodeList[cur].commit.no][nodeList[cur + 1].commit.no];
      PreferenceList.forEach(prefName => {
        let normedScore = +scoreMap[prefName] * prefMap[prefName];
        if (i === 0) prev[prefName] = normedScore;
        else prev[prefName] += normedScore;
      });
      return prev;
    }, {});

    let scoreSumList = Object.entries(scoreSumMap).map(d => [d[0], d[1] / (nodeList.length - 1)]);
    scoreSumList.sort((a, b) => b[1] - a[1]);
    let sum = scoreSumList.reduce((prev, cur) => { prev += cur[1]; return prev }, 0);
    let pos = 0;

    return (
      <div id="causeDiv"
        className="flexContainer"
        height="20px" width="100%">
        {scoreSumList.map((d, i) => {
          let xWidth = width * d[1] / sum;
          // let xPos = pos;
          pos += xWidth;

          return (
            <div
              key={i}
              height="20px"
              style={{
                fontSize: "12px",
                width: xWidth,
                background: getScoreColor(d[0], 3),
                strokeWidth: 0,
                overflow: "hidden",
              }}
            >
              {d[0]}
            </div>
          );
        })}
      </div>
    );
  } else {
    return (<div></div>);
  }
}

const BarChartSummary = (props) => {
  const ref = useRef();
  const yAxisHeight = 20;
  // const itemHeight = 20;
  const nameMargin = 2;

  const { dataNameList, clusterData, width, height } = props;
  const totalCount = clusterData.cluster.nodeCount;

  const numByDataName = { "authors": 15, "commitTypes": 4, "keywords": 10 };

  let dataList = dataNameList.map(dataName => {
    let data = Object.entries(clusterData[dataName]);

    // console.log(dataName, data)
    if (dataName != "keywords") data.sort((a, b) => b[1] - a[1]);
    else data.sort((a, b) => b[1][1] - a[1][1]);

    return data.filter((d, i) => i < numByDataName[dataName]).map(d => {
      if (dataName !== "keywords") d[1] = d[1] / totalCount;
      else d[1] = d[1][0] / totalCount;
      return d.concat(dataName)
    }
    );
  });
  // console.log("dataList", dataList)
  let authorList = dataList[0];
  let commitTypeList = dataList[1];
  let keywordList = dataList[2];

  keywordList = keywordList.sort((a, b) => b[1] - a[1]);
  console.log(keywordList);

  function processKey(word) {
    if (word === undefined) return word;
    return word.replace(/[`~! @#$%^&*()_|+\-=?;:'",.<>\{\}\[\]\\\/]/gi, '');
    // return replaceAll(replaceAll(replaceAll(replaceAll(replaceAll(replaceAll(replaceAll(word, ".", ""), ">", ""), "=", ""), "}", ""), "{", ""), " ", ""), "/", "");
}



  let authorRatio = 0.6;
  let commitTypeRatio = 0.2;
  
  // let sortedAuthorList = dataList.reduce((prev, cur) => prev.concat(cur), []);
  // console.log(sortedAuthorList)
  let xScaleDomainMax = 1;
  let xScale = d3.scaleLinear().domain([0, xScaleDomainMax]).range([0, width - nameMargin]);
  let yAuthorScale = d3.scaleBand().domain(authorList.map(d => d[0])).range([0, (height - yAxisHeight) * authorRatio * 0.95]).paddingInner(0.1).paddingOuter(0.1);
  let yCommitTypeScale = d3.scaleBand().domain(commitTypeList.map(d => d[0])).range([0, (height - yAxisHeight) * commitTypeRatio * 0.95]).paddingInner(0.1).paddingOuter(0.1);

  useEffect(() => {
    const svgAuthor = d3.select("#barStatAuthor").attr("transform", "translate(0," + (0) + ")");
    const svgCommitType = d3.select("#barStatCommitType").attr("transform", "translate(0," + (0) + ")");
    
    svgAuthor.selectAll("g").remove();
    svgCommitType.selectAll("g").remove();

    const yAuthorAxis = d3.axisLeft(yAuthorScale).ticks(0).tickSizeInner(0).tickSizeOuter(0);
    const yCommitTypeAxis = d3.axisLeft(yCommitTypeScale).ticks(0).tickSizeInner(0).tickSizeOuter(0);

    const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.format(".0%")).tickSizeOuter(0);
    let textSize = 15;

    // auhor's detailed chart bar
    let rectsAuthor = svgAuthor.selectAll("g")
      .data(authorList)
      .enter()
      .append("g")
      ;
    rectsAuthor.append("rect")
      .attr("x", nameMargin)
      .attr("y", d => yAuthorScale(d[0]))
      .attr("width", d => xScale(d[1]))
      .attr("height", yAuthorScale.bandwidth())
      .style("stroke-width", 0)
      .style("fill", d => AttributeColors[DataTypeByNameMap[d[2]]][1])
      .style("fill-opacity", 0.3)
      ;
    rectsAuthor.append("text")
      .attr("x", nameMargin + 1)
      .attr("y", d => (yAuthorScale(d[0]) + yAuthorScale.bandwidth() - (yAuthorScale.bandwidth() - textSize) / 2))
      .style("font-size", "12px")
      .style("font-weight", "400")
      .style("cursor", "pointer")
      .text(d => GitAnalyzer.getTextValue(d[2], d[0]))
      .on("mouseover", () => hover(d3.event))
      .on("mouseout", () => hout(d3.event))
      .on("click", d => props.registerFavoriteFragment([d[2], d[0]]));
    ;

    let xAxisRenderAuthor = svgAuthor.append("g")
      .attr("transform", "translate(" + nameMargin + "," + (height - yAxisHeight) * (authorRatio * 0.95) + ")")
      .call(xAxis);
    xAxisRenderAuthor.selectAll("text").style("font-size", "10px");
    xAxisRenderAuthor.selectAll(".domain").style("stroke", "#AAAAAA")
      ;
    let yAxisRenderAuthor = svgAuthor.append("g")
      .attr("transform", "translate(1, 0)")
      .call(yAuthorAxis);
    yAxisRenderAuthor.selectAll("text").style("font-size", "10px");
    yAxisRenderAuthor.selectAll(".domain").style("stroke", "#AAAAAA")

    // commit type's detailed char bar (TODO)


    let rectsCommitType = svgCommitType.selectAll("g")
      .data(commitTypeList)
      .enter()
      .append("g")
      ;
    rectsCommitType.append("rect")
      .attr("x", nameMargin)
      .attr("y", d => yCommitTypeScale(d[0]))
      .attr("width", d => xScale(d[1]))
      .attr("height", yCommitTypeScale.bandwidth())
      .style("stroke-width", 0)
      .style("fill", d => AttributeColors[DataTypeByNameMap[d[2]]][1])
      .style("fill-opacity", 0.3)
      ;
    rectsCommitType.append("text")
      .attr("x", nameMargin + 1)
      .attr("y", d => (yCommitTypeScale(d[0]) + yCommitTypeScale.bandwidth() - (yCommitTypeScale.bandwidth() - textSize) / 2))
      .style("font-size", "12px")
      .style("font-weight", "400")
      .style("cursor", "pointer")
      .text(d => GitAnalyzer.getTextValue(d[2], d[0]))
      .on("mouseover", () => hover(d3.event))
      .on("mouseout", () => hout(d3.event))
      .on("click", d => props.registerFavoriteFragment([d[2], d[0]]));
    ;

    let xAxisRenderCommitType = svgCommitType.append("g")
      .attr("transform", "translate(" + nameMargin + "," + (height - yAxisHeight) * (commitTypeRatio * 0.95) + ")")
      .call(xAxis);
    xAxisRenderCommitType.selectAll("text").style("font-size", "10px");
    xAxisRenderCommitType.selectAll(".domain").style("stroke", "#AAAAAA")
      ;
    let yAxisRenderCommitType = svgCommitType.append("g")
      .attr("transform", "translate(1, 0)")
      .call(yCommitTypeAxis);
    yAxisRenderCommitType.selectAll("text").style("font-size", "10px");
    yAxisRenderCommitType.selectAll(".domain").style("stroke", "#AAAAAA")

    let max = 5;
    let min = 3;

    let aMin = keywordList[0][1];
    let aMax = keywordList[0][1];

    keywordList.forEach(node => {
        if(node[1] > aMax) aMax = node[1];
        if(node[1] < aMin) aMin = node[1];
    })

    keywordList.forEach(node => {
        node[1] = ((node[1] - aMin) / (aMax - aMin)) * (max - min) + min;
    })

    console.log(AttributeColors.keyword[2])

    WordCloud(document.getElementById("keywordsDetailedList"), {
      list: keywordList,
      wait: 0,
      rotateRatio: 0,
      weightFactor: 3,
      color: AttributeColors.keyword[1],
      classes: function(word) {
          return "wordCloud wordCloud_" + processKey(word); 
      },
      hover: function(item, dimension, event) {
          if(item !== undefined) {
              d3.selectAll(".wordCloud")
                .style("font-weight", "300")
                .style("opacity", 0.5);
              d3.selectAll(".wordCloud_" + processKey(item[0]))
                .style("font-weight", "900")
                .style("opacity", 1);
          }
      }

    
  });
  d3.select("#keywordsDetailedList")
        .on("mouseleave", function(d) {
            d3.selectAll(".wordCloud")
            .style("font-weight", 300)
            .style("opacity", 1);
        })
        
  

  }, [clusterData]);

  return (
    // <div style={{
    //overflowY:"auto", 
    // height:summaryHeight}}>
    <div>
      <div id="keywordsDetailedList" style={{position: "relative", top: "-40px", width: "151px", height: "120px"}}>
      </div>
      <div className="flexVerticalContainer" style={{ width: "100%", position: "relative", top: "-40px"}}>
      {/* <div style={{font:"14px bold"}}>{dataName}</div> */}
      <svg id={"barStatAuthor"} width="100%" ref={ref} height={height * authorRatio }></svg>
      <svg id={"barStatCommitType"} width="100%" ref={ref} height={height * authorRatio}></svg>
      </div>
    
    </div>

  );
}

const MessagePrint = (props) => {
  let message = (props.message !== undefined && props.message !== null ? props.message : "");

  return (
    <div style={{ display: "flex", flexWrap: "wrap", fontSize: "10px", marginLeft:props.marginLeft }}>
      {message.trim().split("\n").map( (line, li) => 
        <Fragment key={li}>
          {line.trim() !== "" && line.trim().split(" ").map((word, i) => (
            <div key={i} style={{ display: "inline", cursor: "pointer", }}>
              <span
                onMouseOver={hover}
                onMouseOut={hout}
                onClick={() => props.registerFavoriteFragment(["keywords", word])}
              >
                {word}
              </span>
              &nbsp;
            </div>
          ))}
          {line.trim() !== "" && <br />}
        </Fragment>
      )}
    </div>
  );
}

const NodeDetail = (props) => {
  const classes = useStyles();
  const { node, parentNode, registerFavoriteFragment, gitAnalyzer } = props;
  // console.log("NodeDetail", props);
  const isParent = (parentNode === undefined && node.mergeNodes.length > 0);
  const isChild = (parentNode !== undefined);
  const className = (isChild ? "commitChildRow" + parentNode.seq : "commitRow" + node.seq);

  const toggleRowShow = () => {
    let childClass = "." + "commitChildRow" + node.seq;
    // console.log("togrowshow", d3.select(childClass).style("visibility"));
    let visible = d3.select(childClass).style("visibility") === "visible";

    d3.selectAll(childClass).style("visibility", (visible ? "collapse" : ""));
  }

  return (
    <TableRow
      className={"flexContainer " + className}
      style={{ visibility: (isChild ? "collapse" : "") }}
    >
      {props.useHeuristicMerge && (
        <TableCell className={classes.tableCell} style={{ width: "40px", cursor: "pointer" }}>
          <div align="center"
            onClick={isParent ? toggleRowShow : undefined}
          // onClick = {parentNode !== undefined ? () => toggleRowShow : undefined}
          >
            {isChild ? "+" :
              (isParent &&
                <u>CM({node.mergeNodes.length})</u>
              )
            }
          </div>
          {/* <div>{(hasMergeNodes ? "M(" + node.mergeNodes.length + ")" : (isMergeNode ? "⎿" : ""))}</div> */}
        </TableCell>
      )}
      {!props.useHeuristicMerge && (
        <TableCell className={classes.tableCell} style={{ width: "40px", }}>
          <div align="center">
            {node.isMergeTraversed && node.mergedToNode !== undefined &&
              <Fragment>
                CMed 
                <br />
                <span style={{fontSize: "8px"}}>({node.mergedToNode.id.substring(0, 7)})</span>
              </Fragment>
            }
          </div>
          {/* <div>{(hasMergeNodes ? "M(" + node.mergeNodes.length + ")" : (isMergeNode ? "⎿" : ""))}</div> */}
        </TableCell>
      )}
      <TableCell className={classes.tableCell}>
        <div
          style={{ width: "55px", fontSize: "10px", cursor: "pointer" }}
          onMouseOver={hover}
          onMouseOut={hout}
          onClick={() => registerFavoriteFragment(["keywords", node.commit.id.substring(0, 6)])}
        >#{node.commit.id.substring(0, 6)}</div>
      </TableCell>
      <TableCell className={classes.tableCell}>
        <div
          style={{ width: "55px", fontSize: "10px" }}
          // onMouseOver={hover}
          // onMouseOut={hout}
        // onClick={() => registerFavoriteFragment(["date", node.commit.date])}
        >{GitAnalyzer.getTextValue("date", GitAnalyzer.trimYYYYMMDD(node.commit.date)).substring(2, 10)}</div>
      </TableCell>
      <TableCell className={classes.tableCell} style={{cursor: "pointer"}}>
        <div
          style={{}}
          onMouseOver={hover}
          onMouseOut={hout}
          onClick={() => registerFavoriteFragment(["authors", node.commit.author])}
        >
          {/* {GitAnalyzer.getTextValue("authors", node.commit.author)} */}
          {GitAnalyzer.getTextValue("authors#2", node.commit.author)}
        </div>
      </TableCell>
      <TableCell className={classes.tableCell} >
        <div
          style={{ width: "30px", fontSize: "10px", cursor: "pointer" }}
          onMouseOver={hover}
          onMouseOut={hout}
          onClick={() => registerFavoriteFragment(["commitTypes", node.commit.commitType])}
        >{GitAnalyzer.getTextValue("commitTypes", node.commit.commitType).substring(0, 3)}</div>
      </TableCell>
      <TableCell className={classes.tableCell}>
        <div className="flexVerticalContainer">
          <MessagePrint message={node.commit.message} registerFavoriteFragment={registerFavoriteFragment} />
          {node.pullRequestHeads.map((prNum, i) => {
            
            let {message, body, state, merged} = gitAnalyzer.pullMapByNumber[prNum];
            let closed = (state === "closed");
            let type;

            if (merged) {
                type = BranchTypes.PR_MERGED;
            } else if (closed) {
                type = BranchTypes.PR_CLOSED;
            } else {
                type = BranchTypes.PR_OPEN;
            }
            
            return (
              <React.Fragment key={i}>
                <div style={{fontWeight:"900", color: BranchColors[type] }}>[Pull Request #{prNum}] - {type.substring(3, type.length)}</div>
                {message !== undefined && message !== null && message.trim() !== "" && 
                  <MessagePrint marginLeft={10} message={message} registerFavoriteFragment={registerFavoriteFragment}/>
                }
                {body !== undefined && body !== null && body.trim() !== "" && 
                  <MessagePrint marginLeft={10} message={body} registerFavoriteFragment={registerFavoriteFragment}/>
                }
              </React.Fragment>
            );
          })}
        </div>
      </TableCell>
      <TableCell className={classes.tableCell} >
        <div
          style={{ width: "80px", wordBreak: "break-word", }}
        // onMouseOver={hover}
        // onMouseOut={hout}
        >
          {node.commit.tags !== undefined && node.commit.tags.length > 0 && GitAnalyzer.getTextValue("tags", node.commit.tags.join(", "))}
          {node.commit.tags !== undefined && node.commit.tags.length > 0 && <br />}
          {node.commit.branches !== undefined && GitAnalyzer.getTextValue("branches", node.commit.branches.map(b => (b.startsWith("origin/") ? b.split("origin/")[1] : b)).join(", "))}
        </div>
      </TableCell>
      {/* <TableCell className={classes.tableCell} style={{ width: "50px" }}>
        <div
          onMouseOver={hover}
          onMouseOut={hout}
        >{node.commit.branches !== undefined && GitAnalyzer.getTextValue("branches", node.commit.branches.join(", "))}</div>
      </TableCell> */}
    </TableRow>
  )
}

const NodeDetailList = (props) => {
  const classes = useStyles();
  const { nodeList, gitAnalyzer, } = props;

  return (
    <Table size="small" className={classes.table}>
      <TableBody>
        {nodeList.map((node, i) => {
          return (
            <React.Fragment key={node.id}>
              <NodeDetail
                node={node}
                gitAnalyzer={gitAnalyzer}
                registerFavoriteFragment={props.registerFavoriteFragment}
                useHeuristicMerge={props.useHeuristicMerge}
              />
              {node.mergeNodes.map((mn, fi) => (
                <NodeDetail
                  gitAnalyzer={gitAnalyzer}
                  parentNode={node}
                  node={mn}
                  key={fi}
                  registerFavoriteFragment={props.registerFavoriteFragment}
                  useHeuristicMerge={props.useHeuristicMerge}
                />
              ))}
            </React.Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}



///////////////////////////////////////
// DEFAULT HOOK
///////////////////////////////////////
const GroupSummary = props => {
  const classes = useStyles();
  const { selectedClusterNode, width, gitAnalyzer, arrowStartX, arrowWidth, registerFavoriteFragment } = props;
  //const clusterData = new ClusterData(selectedClusterNode.cluster, gitAnalyzer.corpusData);
  const clusterData = selectedClusterNode.clusterData;
  const { cluster } = clusterData;
  const { nodeList } = cluster;
  const marginLeft = 10;
  // const width = props.width - marginLeft;
  const height = 400;
  const barChartWidth = 150;
  const fileSummaryWidth = 400;
  const rightWidth = width - barChartWidth - fileSummaryWidth;
  const arrowHeight = 20;
  const showNameList = ["authors", "commitTypes", "keywords",];

  // console.log("groupsummary rerender", clusterData)
  return (
    <div className="flexVerticalContainer">
      <div id="GroupSummaryArrowAreaDiv"
        style={{ height: arrowHeight + "px", width: "100%" }}>
        <svg
          id={"GroupSummaryArrowAreaSvg"}
          className="branchSummaryArrowArea"
          style={{
            position: "absolute",
            width: "100%",
            height: arrowHeight + "px",
            pointerEvents: "none"
          }}
        >
          <line
            // className={["branchSummaryArrowLine", clusterNode.cluster.id].join("_") + " branchSummaryArrowLine"}
            x1={arrowStartX}
            x2={0}
            y1={0}
            y2={arrowHeight}
            style={{
              strokeWidth: 1,
              stroke: selectedClusterNode.color,
              strokeOpacity: 1
            }}
          />
          <line
            // className={["branchSummaryArrowLine", clusterNode.cluster.id].join("_") + " branchSummaryArrowLine"}
            x1={arrowStartX + arrowWidth}
            x2={width}
            y1={0}
            y2={arrowHeight}
            style={{
              strokeWidth: 1,
              stroke: selectedClusterNode.color,
              strokeOpacity: 1
            }}
          />
        </svg>
      </div>
      <div
        id="GroupSummaryTitle"
        className="flexVerticalContainer"
        style={{ width: width }}
      >
        <div className={classes.div + " flexContainer"}>
          <div style={{ width: "60px" }}>CAUSE: &nbsp;</div>
          <Cause
            cluster={cluster}
            width={340}
            // scoreData={gitAnalyzer.scoreData}
            prefMap={cluster.pref}
            gitAnalyzer={gitAnalyzer}
          />
        </div>
        <div className={classes.div + " flexContainer"}>
          <div style={{ width: "60px" }}>RANGE: &nbsp;</div>
          <div>
            {GitAnalyzer.trimYYYYMMDD(nodeList[0].commit.date).substring(2, 10)}(#{nodeList[0].commit.id.substring(0, 6)})
            ~ &nbsp;
          {GitAnalyzer.trimYYYYMMDD(nodeList.slice(-1)[0].commit.date).substring(2, 10)}(#{nodeList.slice(-1)[0].commit.id.substring(0, 6)})
          , {cluster.nodeCount} commits, {cluster.locStat.clocSum} CLOC
          </div>
        </div>
        <div className={classes.div + " flexContainer"}>
          <div>
            {cluster.nodeCount} COMMITS, {cluster.locStat.clocSum} CLOC
          </div>
        </div>
        <div style={{ height: "2px" }} />
      </div>
      <div id="GroupSummaryDiv"
        className="flexContainer"
        style={{ width: width }}>
        {/* style={{width:props.width-marginLeft, marginLeft:marginLeft + "px"}}> */}
        {/* <div>FOCUS SELECTED Cluster Context (ⓒx{nodeList.length})</div> */}
        <div className="flexVerticalContainer" style={{ width: fileSummaryWidth + "px" }}>
          <div id="groupFileSummaryDiv">
            <FileIcicleSummary
              width={fileSummaryWidth}
              height={height}
              rawModLocData={clusterData.clocByFiles}
              rawInsertLocData={clusterData.insertionByFiles}
              rawDeleteLocData={clusterData.deletionByFiles}
              rawModNumData={clusterData.touchCountByFiles}
              file2Author={clusterData.fileToAuthor}
              pageNum={5}
            />
          </div>
        </div>

        <div name="nodeList" className={classes.nodeList} style={{
          width: rightWidth + "px",
          marginLeft: marginLeft,
          height: height
        }}>
          <NodeDetailList
            gitAnalyzer={gitAnalyzer}
            nodeList={nodeList}
            registerFavoriteFragment={registerFavoriteFragment}
            useHeuristicMerge={props.useHeuristicMerge}
          />
        </div>

        <div className="flexContainer" style={{
          width: barChartWidth + "px",
          // flexWrap: "wrap",
          marginLeft: "5px",
          marginRight: "5px"
        }}>
          {/* {showNameList.map((dataName, i) => ( */}
          <BarChartSummary
            // key={i}
            dataNameList={showNameList}
            clusterData={clusterData}
            width={barChartWidth - 10}
            height={height}
            registerFavoriteFragment={registerFavoriteFragment}
          />
          {/* ))} */}
        </div>
      </div>
      <div style={{ height: "50px" }}></div>
    </div>
  )
}

export default GroupSummary;