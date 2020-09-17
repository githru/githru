import 'date-fns';
import React, { useState } from 'react';
import { useDispatch, useSelector } from "react-redux";
import * as actions from '../modules';

import GitAnalyzer from './analyzer/GitAnalyzer';

import "./TemporalFilter.css";
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControl from '@material-ui/core/FormControl';
import RadioButtonUncheckedIcon from '@material-ui/icons/RadioButtonUnchecked';
import RadioButtonCheckedIcon from '@material-ui/icons/RadioButtonChecked';
import Select from '@material-ui/core/Select';

const useStyles = makeStyles(theme => ({
    formControl: {
        margin: 0,
    },
    dateField: {
        width: "90px",
        fontSize: "10px",
        margin: 0,
        padding: 0,
    },

}));

const SearchDiv = (props) => {
// console.log("p", props.releaseNodeList);
    return (
        <RadioGroup name={props.name} style={{ width: "110px" }} value={props.value} onChange={props.onChange}>
            <div className="flexVerticalContainer">
                <div className="flexContainer">
                    <div>
                        <Radio
                            style={{width:"25px", height:"25px", padding:0, margin: 0}}
                            value="tag"
                            color="primary"
                            icon={<RadioButtonUncheckedIcon fontSize="small" />}
                            checkedIcon={<RadioButtonCheckedIcon fontSize="small" />}
                        />
                    </div>
                    <div>
                        <Select
                            id={props.name + "Release"}
                            value={props.release}
                            onChange={props.heandleReleaseChange}
                            style={{width:"90px", fontSize:"12px"}}
                            native
                        >  
                            <option value={props.root}>INIT</option>
                            {props.releaseNodeList.map( (node, i) => (
                                <option key={i} value={node.seq} >
                                    {node.releaseTagString}
                                </option>
                            ))}
                            <option value={props.head}>LATEST</option>
                        </Select>
                    </div>
                </div>
                <div className="flexContainer">
                    <div>
                        <Radio
                            style={{width:"25px", height:"25px", padding:0, margin: 0}}
                            value="date"
                            color="primary"
                            disableRipple
                            icon={<RadioButtonUncheckedIcon fontSize="small" />}
                            checkedIcon={<RadioButtonCheckedIcon fontSize="small" />}
                        />
                    </div>
                    <div>
                        <TextField 
                            id={props.name + "Date"} 
                            type="date" 
                            className={props.dateField} 
                            value={props.startRelease}
                            defaultValue={props.defaultDateValue}
                            onChange={(event) => props.handleDateChange(event.target.value)}
                        />
                    </div>
                </div>
            </div>
        </RadioGroup>
    );
}

const TemporalFilter = props => {
    const classes = useStyles();
    const [fromType, setFromType] = React.useState("tag");
    const [toType, setToType] = React.useState("tag");
    const [startDate, setStartDate] = React.useState("date");
    const [endDate, setEndDate] = React.useState("date");

    const headSeq = props.gitAnalyzer.allNodeList.slice(-1)[0].seq;
    const rootSeq = props.gitAnalyzer.allNodeList[0].seq;

    let defaultStartSeq = rootSeq;
    let defaultEndSeq = headSeq;    
    if (props.gitAnalyzer.repoName === "realm-java") {
        defaultStartSeq = 15731;
        defaultEndSeq = 15972;    
    } else if (props.gitAnalyzer.repoName === "MixedRealityToolkit-Unity") {
        defaultStartSeq = 11152;
        defaultEndSeq = 11231;
    }
    
    const [startRelease, setStartRelease] = React.useState(defaultStartSeq);
    const [endRelease, setEndRelease] = React.useState(defaultEndSeq);
    
    const dispatch = useDispatch(); 
    // const filterSelection = useSelector(state => state.commitFilterSelection);

    const handleFromTypeChange = event => {
        setFromType(event.target.value);
    };
    const handleToTypeChange = event => {
        setToType(event.target.value);
    };
    const handleStartDateChange = date => {
        setStartDate(date);
    }
    const handleEndDateChange = date => {
        setEndDate(date);
    }
    const handleStartReleaseChange = event => {
        setStartRelease(event.target.value);
    };
    const handleEndReleaseChange = event => {
        setEndRelease(event.target.value);
    };
    const releaseNodeList = props.gitAnalyzer.allNodeList.filter(d => d.isRelease);
    const rootDate = GitAnalyzer.trimYYYYMMDD(props.gitAnalyzer.allNodeList[0].commit.date);
    const headDate = GitAnalyzer.trimYYYYMMDD(props.gitAnalyzer.allNodeList.slice(-1)[0].commit.date);
    
// console.log("tf props.gitAnalyzer", props.gitAnalyzer.allNodeList, "release", releaseNodeList)
    function getSeqByDate(date, isStart) {
        let fi;
        if (isStart) {
            for (let fi = 0; fi < props.gitAnalyzer.allNodeList.length; fi++) {
// console.log("NONONONO", GitAnalyzer.trimYYYYMMDD(props.gitAnalyzer.allNodeList[fi].commit.date));
                if (GitAnalyzer.trimYYYYMMDD(props.gitAnalyzer.allNodeList[fi].commit.date) >= date) {
                    return props.gitAnalyzer.allNodeList[fi].seq;
                }
            }
        } else {
            for (let fi = props.gitAnalyzer.allNodeList.length - 1; fi >= 0 ; fi--) {
                if (GitAnalyzer.trimYYYYMMDD(props.gitAnalyzer.allNodeList[fi].commit.date) <= date) {
                    return props.gitAnalyzer.allNodeList[fi].seq;
                }
            }
        }

        return isStart? 0 : props.gitAnalyzer.allNodeList.length - 1;
    }


// console.log("what the hell?")
    return (
            <div className="flexVerticalContainer">
                <FormControl component="fieldset" className={classes.formControl}>
                    <div className="flexContainer" style={{alignItems: "center"}}>
                        <SearchDiv
                            name="from"
                            value={fromType}
                            onChange={handleFromTypeChange}
                            dateField={classes.dateField}
                            date={startDate}
                            handleDateChange={handleStartDateChange}
                            release={startRelease}
                            heandleReleaseChange={handleStartReleaseChange}
                            defaultDateValue={rootDate}
                            defaultReleaseValue={rootSeq}
                            head={headSeq}
                            root={rootSeq}
                            releaseNodeList={releaseNodeList}
                        />
                        <div>&nbsp; ~ </div>
                        <SearchDiv
                            name="to"
                            value={toType}
                            onChange={handleToTypeChange}
                            dateField={classes.dateField}
                            date={endDate}
                            handleDateChange={handleEndDateChange}
                            release={endRelease}
                            heandleReleaseChange={handleEndReleaseChange}
                            defaultDateValue={headDate}
                            defaultReleaseValue={headSeq}
                            head={headSeq}
                            root={rootSeq}
                            releaseNodeList={releaseNodeList}
                        />
                    </div>
                </FormControl>
                <div className="flexVerticalContainer" style={{alignItems:"center"}}>
                    <div style={{height:"10px"}}></div>
                    <div style={{width:"95%"}}>
                        <Button 
                            style={{ "fontSize": "11px", width:"100%" }} size="small" variant="outlined" 
                            onClick={() => {
                                let fromSeq = startRelease;
                                let toSeq = endRelease;
                                if (fromType === "date") {
                                    fromSeq = getSeqByDate(startDate, true)
                                } 
                                if (toType === "date") {
                                    toSeq = getSeqByDate(endDate, false)
                                }
// console.log("NONONONO", fromType, toType, startDate, endDate, fromSeq, toSeq);
                                // props.onCommitFilterChanged([fromSeq, toSeq]);
                                dispatch(actions.updateGlobalCommitsByTemporalFilter([Number(fromSeq), Number(toSeq)]));
                        }}>
                            TEMPORAL FILTER
                        </Button>
                    </div>
                </div>
            </div>
    );
}

export default TemporalFilter;