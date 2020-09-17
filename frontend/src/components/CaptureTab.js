import React, { useState } from 'react';
import { makeStyles } from '@material-ui/styles';
import { useSelector, useDispatch } from 'react-redux';
import * as d3 from 'd3';
import DeleteIcon from '@material-ui/icons/Delete';
import * as actions from '../modules';
import GitAnalyzer from './analyzer/GitAnalyzer';
import { Table, TableRow, TableCell, TableBody, Checkbox, Button } from '@material-ui/core';
import { SidePanelContentUnit } from './container/SidePanelContentUnit';
import './CaptureTab.css';
import { changeRGBColorByOpacity } from './ColorClasses';

const useStyles = makeStyles(theme => ({
    root: {
        margin: "0px",
        padding: "2px",
    },
    table: {
        padding: 1,
    },
    tableCell: {
        fontSize: "12px",
        paddingLeft: 2,
        paddingRight: 1,
        paddingTop: 1,
        paddingBottom: 1,
        // maxHeight: "20px",
        // verticalAlign: "text-top",
        // minWidth: "40px"
    },
}));

const CaptureTab = (props) => {
    const classes = useStyles();
    const { capturedSummaryInfoList, scrollToRight } = useSelector(state => state);
    const [ checkedDic, setCheckedDic ] = useState({});
    const dispatch = useDispatch();

    // setCheckedListForCompare()
    // console.log("captureTab render", capturedSummaryInfoList, checkedDic);

    return (<SidePanelContentUnit title="Captured Cluster(s)" style={{ background: "#7a7c90" }}>
        <div
            id="captureTabDiv"
            className="flexVerticalContainer"
            style={{
                // width: props.width + "px",
                width: "100%",
                fontSize: "12px",
                height: props.height,
            }}
        >
            {(capturedSummaryInfoList.length > 0 ? 
                <>
                {capturedSummaryInfoList.map( (capturedInfo, i) => {
                    let { id, clusterNodes, groupingParameters } = capturedInfo;

                    const firstCommit = clusterNodes[ 0 ].cluster.nodeList[ 0 ].commit;
                    const endCommit = clusterNodes.slice(-1)[ 0 ].cluster.nodeList.slice(-1)[ 0 ].commit;

                    const getCommitName = (commit) => {
                        if (commit.tags !== undefined && commit.tags.length > 0) return commit.tags[0];
                        if (commit.branches !== undefined && commit.branches.length > 0) 
                            return (commit.branches[0].startsWith("origin/") ? commit.branches[0].split("origin/")[1] : commit.branches[0]);
                        return "#" + commit.id.substring(0, 6);
                    };

                    return <div className="element" key={id}>
                        <div className="left-strip" style={{
                            background: changeRGBColorByOpacity(clusterNodes[ 0 ].color, 0.4),
                        }}>
                            <div>#{id}</div>
                            <Checkbox
                                id={"capCheckBox" + id}
                                className={classes.root}
                                size="small"
                                color="default"
                                onChange={(event) => {
                                    let n = { ...checkedDic };
                                    n[ id ] = event.target.checked;
                                    setCheckedDic(n);
                                }}
                            />
                        </div>

                        <div className="content" style={{ cursor: "default" }} /*onClick={() => {
                            dispatch(actions.updateCurrentCapturedSummaryInfoId(id));
                            d3.selectAll(".detailTabPanel").style("display", "none");
                            d3.select("#detailTabPanel" + id).style("display", "");
                            d3.select("#comparePane").style("display", "none");

                            dispatch(actions.updateScrollToRight(true));
                            window.scrollTo(4000, 0);
                        }*/>
                            <div className="element-header">
                                <div className='element-branch-name'>
                                    {GitAnalyzer.getBranchNamesFromBranchClusterNodes(clusterNodes)[ 0 ]}
                                </div>

                                <DeleteIcon
                                    size="small"
                                    color="action"
                                    className="element-remove-button"
                                    onClick={() => {
                                        let n = { ...checkedDic };
                                        delete n[ id ];
                                        setCheckedDic(n);
                                        dispatch(actions.removeCapturedSummaryInfoList(i));
                                    }}
                                />
                            </div>

                            <div className="element-body">
                                <div style={{ width: "100%", fontSize: "8px" }}>
                                    {GitAnalyzer.trimYYYYMMDD(firstCommit.date).substring(2, 11)} ~ {GitAnalyzer.trimYYYYMMDD(endCommit.date).substring(2, 11)}
                                    <br />({getCommitName(firstCommit)}) ~ ({getCommitName(endCommit)})
                                </div>
                            </div>
                        </div>
                    </div>
                })}
                </>
                : <div style={{ color: 'white' }}>Select cluster(s) for capture</div>
            )}
        </div>
        <div>
            <Button 
                style={{ "fontSize": "11px", "zIndex": 10, width: "100%", background: "white" }} 
                size="small" 
                variant="outlined"
                disabled={capturedSummaryInfoList.length < 2}
                onClick={() => {
                    let checkedList = Object.entries(checkedDic).filter(d => d[ 1 ]).map(d => d[ 0 ]);
                    if (checkedList.length !== 2) {
                        alert("CHOOSE 2 SUMMARIES!");
                        return;
                    }
                    let cList = checkedList.map(index => capturedSummaryInfoList[ capturedSummaryInfoList.findIndex(fi => fi.id === +index) ]);
                    console.log("cList", cList);
                    dispatch(actions.updateCapturedSummaryInfoListForCompare(cList));

                    d3.select("#comparePane").style("display", "");
                    d3.selectAll(".detailTabPanel").style("display", "none");

                    // window.scrollTo(4000, 0);
                }}>
                COMPARE
            </Button>
        </div>

    </SidePanelContentUnit>
    );
}

export default CaptureTab;