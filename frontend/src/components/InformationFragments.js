import React from 'react';
import { makeStyles } from '@material-ui/styles';
import GitAnalyzer from './analyzer/GitAnalyzer';
import { Table, TableRow, TableCell, TableBody, Button } from '@material-ui/core';
import * as d3 from 'd3';
import { useSelector, useDispatch } from 'react-redux';
import * as actions from '../modules';
import { AttributeColors } from './ColorClasses';
import './InformationFragments.css';
import { DataTypeByNameMap } from './analyzer/GithruClasses';

const useStyles = makeStyles(theme => ({
    table: {
        padding: 1,
    },
    tableCell: {
        fontSize: "12px",
        paddingLeft: 2,
        paddingRight: 1,
        paddingTop: 1,
        paddingBottom: 1,
        maxHeight: "20px",
        // verticalAlign: "text-top",
        // minWidth: "40px"
    },
    favorites: {
        display: "flex",
        flexDirection: "column",
        maxWidth: "100%",
        overflowY: "auto",
        // maxHeight: "300px",
        width: "100%",
        // minHeight: "300px",
        padding: 2,
    },
    history: {
        display: "flex",
        flexDirection: "column",
        // maxHeight: "450px",
        maxWidth: "100%",
        width: "100%",
        overflowY: "auto",
    },
}));

const InformationFragments = (props) => {
    const classes = useStyles();
    const { width } = props;
    const buttonWidth = 15;

    const dispatch = useDispatch();
    const { fragmentHistory, favoriteFragments, currentCapturedSummaryInfoId } = useSelector(state => state);
    const addFavoriteFragment = (f) => dispatch(actions.registerFavoriteFragment(f));
    const removeFavoriteFragment = (f) => dispatch(actions.unregisterFavoriteFragment(f));
    const clearFragment = () => dispatch(actions.clearFragments());

    const addInterestsItems = (fragments) => {
        dispatch(actions.addItemsToCapturedSummaryInfo(fragments));
        // console.log("updated?", capturedSummaryInfoList, fragments)
    };


    // console.log(classes.favorites, favoriteFragments, props);
    return (
        <div className="flexVerticalContainer">
            {
                (favoriteFragments.length > 0 || fragmentHistory.length > 0) ? <>

                    <div className="fragment-list">
                        {
                            favoriteFragments.map((item, i) => {
                                return <div className="fragment-row" key={i}>
                                    <div className="fragment-cell-title" cursor="pointer">
                                        <span
                                        style={{
                                            color: AttributeColors[ DataTypeByNameMap[item[0]] ][ 0 ],
                                            fontSize: "12px",
                                            overflow: "hidden",
                                            fontWeight: "bold",
                                        }}
                                        onMouseOver={(event) => event.target.style.color = "red"}
                                        onMouseOut={(event) => event.target.style.color = AttributeColors[ DataTypeByNameMap[item[0]] ][ 0 ]}
                                        onClick={() => addInterestsItems([ item ], currentCapturedSummaryInfoId)}
                                    >{GitAnalyzer.getTextValue(item[ 0 ], item[ 1 ])}</span>
                                    </div>
                                    <div className="fragment-cell-pin"
                                        cursor="pointer"
                                        onClick={() => removeFavoriteFragment(item)}>
                                        <svg
                                            x="0px" y="0px" viewBox="0 0 476.258 476.258"
                                            width="15px" height="15px"
                                            fill="black" stroke="#000000" strokeWidth="0">
                                            <path d="M476.235,119.133L357.158,0L206.936,134.654c-19.906-7.082-39.446-10.666-58.205-10.666 c-31.648,0-58.709,10.364-78.259,29.972l-10.574,10.607l115.305,115.298L0.023,455.045l21.213,21.213l175.18-175.181 l115.325,115.318l10.606-10.614c16.936-16.948,27.105-39.913,29.41-66.414c1.905-21.911-1.6-45.947-10.156-70.022L476.235,119.133z M434.942,120.257L323.736,244.33l-91.784-91.811L356.025,41.303L434.942,120.257z M310.52,372.75L103.519,165.76 c12.401-7.74,27.764-11.773,45.212-11.773c16.56,0,34.831,3.715,53.014,10.748l109.781,109.813 C326.418,312.819,325.869,348.207,310.52,372.75z"></path>
                                        </svg>
                                    </div>
                                </div>
                            })
                        }
                    </div>
                    {favoriteFragments.length > 0 ? <>
                        <div>
                            <Button 
                                style={{ "fontSize": "11px", "zIndex": 10, width: "100%", marginBottom: "12px", background: "white" }} 
                                size="small" 
                                variant="outlined"
                                // className="control-button" 
                                size="small" variant="outlined" 
                                onClick={() => addInterestsItems(favoriteFragments)}>
                                    INSPECT ALL PINS
                            </Button>
                        </div>
                    </> : ""}
                    {/* <div className="flexContainer" style={{ justifyContent: "space-between", marginBottom: "12px" }}>
                        <Button className="control-button" size="small" variant="outlined" onClick={() => addInterestsItems(favoriteFragments)}>
                            SELECT ALL PINS
                        </Button>
                    </div> */}
                    <div className="fragment-list">
                        {
                            fragmentHistory.map((item, i) => {
                                let isPinned = (favoriteFragments.findIndex(d => d[ 0 ] === item[ 0 ] && d[ 1 ] === item[ 1 ]) >= 0);
                            
                                return (
                                    <div className="fragment-row" 
                                        key={i}
                                        onMouseOver={() => d3.select("#fragmentPin" + i).style("visibility", "visible")}
                                        onMouseOut={() => d3.select("#fragmentPin" + i).style("visibility", "hidden")}
                                    >
                                        <div className="fragment-cell-title" cursor="pointer">
                                            <span
                                                style={{
                                                    color: AttributeColors[ DataTypeByNameMap[item[0]] ][ 0 ],
                                                    fontSize: "12px",
                                                    overflow: "hidden",
                                                    fontWeight: (isPinned ? "bold" : ""),
                                                }}
                                                onMouseOver={(event) => event.target.style.color = "red"}
                                                onMouseOut={(event) => event.target.style.color = AttributeColors[ DataTypeByNameMap[item[0]] ][ 0 ]}
                                                onClick={() => { console.log("HERE???"); addInterestsItems([ item ]) }}
                                            >
                                                {/* {GitAnalyzer.getTextValue(item[ 0 ], item[ 1 ]).replace(/\//g, '/ ')} */}
                                                {GitAnalyzer.getTextValue(item[ 0 ], item[ 1 ])}
                                            </span>
                                        </div>
                                        <div className="fragment-cell-pin"
                                            id={"fragmentPin"+i}
                                            cursor="pointer"
                                            style={{visibility:"hidden"}}
                                            onClick={() => addFavoriteFragment(item)}>
                                            <svg
                                                x="0px" y="0px" viewBox="0 0 476.258 476.258"
                                                width="15px" height="15px"
                                                fill="black" stroke="#000000" strokeWidth="0">
                                                <path d="M476.235,119.133L357.158,0L206.936,134.654c-19.906-7.082-39.446-10.666-58.205-10.666 c-31.648,0-58.709,10.364-78.259,29.972l-10.574,10.607l115.305,115.298L0.023,455.045l21.213,21.213l175.18-175.181 l115.325,115.318l10.606-10.614c16.936-16.948,27.105-39.913,29.41-66.414c1.905-21.911-1.6-45.947-10.156-70.022L476.235,119.133z M434.942,120.257L323.736,244.33l-91.784-91.811L356.025,41.303L434.942,120.257z M310.52,372.75L103.519,165.76 c12.401-7.74,27.764-11.773,45.212-11.773c16.56,0,34.831,3.715,53.014,10.748l109.781,109.813 C326.418,312.819,325.869,348.207,310.52,372.75z"></path>
                                            </svg>
                                        </div>
                                    </div>
                                );
                            })
                        }
                    </div>
                    <div>
                    {/* style={{ justifyContent: "space-between", marginBottom: "12px" }}> */}
                        <Button 
                            style={{ "fontSize": "11px", "zIndex": 10, width: "100%", background: "white" }} 
                            size="small" 
                            variant="outlined"
                            // className="control-button" 
                            size="small" variant="outlined" onClick={clearFragment}>
                            CLEAR FRAGMENTS
                        </Button>
                    </div>
                </> : <div style={{ color: 'white' }}>Select information fragments</div>
            }
        </div>
    );
}

export default InformationFragments;