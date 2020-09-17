import React, { useState, Fragment } from 'react';
import * as actions from '../modules';
import { useSelector, useDispatch } from 'react-redux';
import { Checkbox } from '@material-ui/core';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import "./ManageParameter.css"
import Form from 'react-bootstrap/Form';


const useStyles = makeStyles(theme => ({
    root: {
        margin: "0px",
        padding: "2px",
    },
    container: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    textArea: {
        marginTop: "8px",
        marginBottom: "8px",
        minHeight: "50px",
        fontSize: "12px",
    },
}));

const ManageParameters = (props) => {
    const classes = useStyles();

    const {
        width,
        releaseBinningLevel,
        nonConflictGroupingLevel,
        summaryByLOC,
        hideFiles,
        useHeuristicMerge,
        // showPullRequestBranch,
        showMergeLink,
        branchShowMapByType,
    } = useSelector(state => ({
        width: state.layout.leftPaneWidth,
        releaseBinningLevel: state.groupingParameters.releaseBinningLevel,
        nonConflictGroupingLevel: state.groupingParameters.nonConflictGroupingLevel,
        useHeuristicMerge: state.groupingParameters.useHeuristicMerge,
        // showPullRequestBranch: state.groupingParameters.showPullRequestBranch,
        branchShowMapByType: state.groupingParameters.branchShowMapByType,
        summaryByLOC: state.summaryParameters.summaryByLOC,
        hideFiles: state.summaryParameters.hideFiles,
        showMergeLink: state.showMergeLink,
    }));

    // console.log("hidefile", hideFiles)
    const [ hideFilesStr, setHideFilesStr ] = useState(hideFiles.join("\n"));
    const dispatch = useDispatch();

    const parseFilterStr = (str, isIncludes) => {
        // console.log("parseFilterStr", str, isIncludes, str.split("\n"))
        return str.split("\n").map(d => d.trim()).filter(d => d !== "");
    }

    const defaultHideFilesValue = "CHANGELOG.md\nversion.txt"

    return (
        <div className="flexVerticalContainer">

            {/* <SectionTitle title="" /> */}
            {/* <div style={{ fontSize: "12px" }}>
                <Checkbox
                    className={classes.root}
                    size="small"
                    color="default"
                    checked={(!showPullRequestBranch)}
                    onChange={() => {
                        dispatch(actions.updateShowPullRequestBranch(!showPullRequestBranch));
                    }}
                />
                Hide Pull Request Branches
            </div> */}
            <SectionTitle title="BRANCH TYPE FILTER" />
            <div className="parameter-body">
                {["EXPLICIT", "IMPLICIT", "PR_OPEN", ].map( (type, i) => {
                    let bool = branchShowMapByType[type];
                    return (<Fragment key={i}>
                        <Checkbox
                            className={classes.root}
                            size="small"
                            color="default"
                            checked={bool}
                            onChange={() => {
                                dispatch(actions.updateBranchShowMapByType([type, !bool]));
                            }}
                        />{type}
                    </Fragment>);
                })}
            </div>
            <div className="parameter-body">
                {["PR_MERGED", "PR_CLOSED"].map( (type, i) => {
                    let bool = branchShowMapByType[type];
                    return (<Fragment key={i}>
                        <Checkbox
                            className={classes.root}
                            size="small"
                            color="default"
                            checked={bool}
                            onChange={() => {
                                dispatch(actions.updateBranchShowMapByType([type, !bool]));
                            }}
                        />{type}
                    </Fragment>);
                })}
            </div>
            <SectionTitle title="CLUSTERING" />
            <div className="parameter-body">
                <Checkbox
                    className={classes.root}
                    size="small"
                    color="default"
                    checked={(useHeuristicMerge)}
                    onChange={() => {
                        dispatch(actions.updateUseHeuristicMerge(!useHeuristicMerge));
                    }}
                />
                Apply CONTEXTUAL squash MERGE
            </div>
            <div style={{
                marginLeft: "17px",
                fontSize: "12px",
                display: (!useHeuristicMerge ? "" : "none")
            }}>
                <Checkbox
                    className={classes.root}
                    size="small"
                    color="default"
                    checked={(!showMergeLink)}
                    onChange={() => {
                        dispatch(actions.updateShowMergeLink(!showMergeLink));
                    }}
                />
                    Hide CONTEXTUAL squash MERGE Edges
            </div>
            <div className="parameter-body">
                <Checkbox
                    className={classes.root}
                    size="small"
                    color="default"
                    checked={(nonConflictGroupingLevel > 0)}
                    onChange={() => {
                        let val = (nonConflictGroupingLevel > 0 ? 0 : 1);
                        dispatch(actions.updateNonConflictGroupingLevel(val));
                    }}
                />
                Non-Conflict Clustering
            </div>
            <div className="parameter-body">
                <Checkbox
                    className={classes.root}
                    size="small"
                    color="default"
                    checked={(releaseBinningLevel === 1)}
                    onChange={() => {
                        let val = (releaseBinningLevel === 1 ? 0 : 1);
                        dispatch(actions.updateReleaseBinningLevel(val));
                    }}
                />
                CUT at RELEASE
            </div>
            <div className="parameter-body">
                <Checkbox
                    className={classes.root}
                    size="small"
                    color="default"
                    checked={(releaseBinningLevel === 2)}
                    onChange={() => {
                        let val = (releaseBinningLevel === 2 ? 0 : 2);
                        dispatch(actions.updateReleaseBinningLevel(val));
                    }}
                />
                CUT at MAJOR RELEASE
            </div>
            <div className="parameter-body" align="right">
                <span
                    style={{ "fontSize": "11px", width: "100%", textDecoration: "underline", cursor:"pointer" }}
                    onClick={() => {
                        dispatch(actions.updateUseHeuristicMerge(false));
                        ["EXPLICIT", "IMPLICIT", "PR_OPEN", "PR_MERGED", "PR_CLOSED"].map( type => dispatch(actions.updateBranchShowMapByType([type, true])));
                    }}>
                    SHOW ALL BRANCHES/NODES
                </span>
            </div>
            {/* <div style={{ height: "20px" }}></div> */}
            <SectionTitle title={"SUMMARY"} />
            <div className="parameter-body">
                <Checkbox
                    className={classes.root}
                    size="small"
                    color="default"
                    checked={(summaryByLOC)}
                    onChange={() => {
                        console.log("summaryByLOC", summaryByLOC);
                        dispatch(actions.updateSummaryByLOC(!summaryByLOC));
                    }}
                />
                Summary by CLOC
            </div>
            <div className="flexVerticalContainer" style={{
                fontSize: "12px",
                paddingLeft: "8px",
                paddingRight: "8px"
            }}>
                <form className={classes.container} noValidate autoComplete="on">
                    <Form.Control
                        className={classes.textArea}
                        as="textarea" rows="2"
                        placeholder="INSERT FILE NAMES"
                        defaultValue={hideFilesStr}
                        onChange={(event) => {
                            setHideFilesStr(event.target.value);
                        }}
                    />
                </form>
                <div style={{ width: "100%", alignItems: "center" }}>
                    <Button
                        style={{ "fontSize": "11px", width: "100%" }} size="small" variant="outlined"
                        onClick={() => {
                            let fList = hideFilesStr.split("\n").map(d => d.trim()).filter(d => d !== "");
                            console.log("hide files", fList);
                            dispatch(actions.updateHideFiles(fList));
                        }}>
                        Hide files on Summary
                    </Button>
                </div>
            </div>
        </div >
    );
}

export default ManageParameters;

const SubTitle = (props) => {
    return <div style={{
        fontSize: '13px',
        fontWeight: '500',
        marginTop: "5px",
        fontWeight: "600",
        fontSize: "0.75rem"
    }}>{props.title}</div>
}

const SectionTitle = (props) => {
    return <div style={{
        fontWeight: "500",
        // fontSize: "0.86rem",
        borderBottom: "1px solid #ccc",
        paddingLeft: "3px",
        paddingBottom: "1px",
        marginBottom: "4px",
        marginTop: "4px"
    }}>{props.title}</div>
}