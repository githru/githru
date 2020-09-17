import React, { useState, useEffect, useRef } from 'react';
import "./ValueSlider.css";
import Slider from '@material-ui/core/Slider';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import * as d3 from 'd3';
import { blueGrey } from '@material-ui/core/colors';

const useStyles = makeStyles(theme => ({
  icon: {
    height: 35,
    width: 35,
    margin: theme.spacing(0),
    color: "skyblue",
  },
  button: {
      height:40,
      width:40,
      margin: theme.spacing(0),
      padding: 0,
      minWidth: 40
  }
}));

const PrettoSlider = withStyles({
    root: {
      color: "#78909c",
      width: 100,
      height: 100
    },
    thumb: {
      height: 20,
      width: 20,
      backgroundColor: "#fff",
      border: "2px solid currentColor",
      marginTop: -8,
      marginLeft: -12,
      "&:focus,&:hover,&$active": {
        boxShadow: "inherit"
      }
    },
    active: {},
    valueLabel: {
      left: "calc(-50%)"
    },
    track: {
      height: 20,
      borderRadius: 7
    },
    rail: {
      height: 20,
      borderRadius: 5
    },
    mark: {
      height: 1,
      width: 8,
    }
  })(Slider);


const ValueSlider = props => {
    // const classes = useStyles();
    const [stepValue, setStepValue] = useState(props.defaultStepValue);
    const [max, setMax] = useState(1);

    const index = (props.index === undefined ? "" : props.index);
    const divId = props.name + "ValueSlider" + index;

    const maxStepCount = 50;
    const thresholdList = useRef(undefined);

    useEffect( () => {
// console.log("valueslider useEffect called, th=", props, thresholdList, (props.thresholdList !== undefined ? props.thresholdList.slice(0, maxStepCount).push(props.thresholdList.slice(-1)[0]) : "aaa"))
      let arrayIndices = [];//FromMaxStep = d3.range([0, maxStepCount]);
      let fi = 0, aIndex = 0;
      while (aIndex < props.thresholdList.length - maxStepCount) {
        arrayIndices.push(maxStepCount + aIndex);
        aIndex += ++fi;
      }
// console.log("arrayIndices", arrayIndices);

      thresholdList.current = (props.thresholdList !== undefined && props.thresholdList.length > maxStepCount 
        ? props.thresholdList.slice(0, maxStepCount).concat(arrayIndices.map(d => props.thresholdList[d])).concat(props.thresholdList.slice(-1)[0])
        : props.thresholdList);

      if (thresholdList.current !== undefined && thresholdList.current.length > 0) {
        let sv = thresholdList.current.indexOf(props.threshold);
        if (sv < 0) {
          for (let fi = 0; fi <= thresholdList.current.length - 2; fi++) {
            if (props.threshold > thresholdList.current[fi] && props.threshold <= thresholdList.current[fi+1]) {
// console.log("break, ", sv, props.threshold, thresholdList[fi], thresholdList[fi+1], fi)
              sv = fi + 1;
              break;
            }
            if (fi === thresholdList.current.length - 2) sv = fi;
          }
        }
// console.log("--", props.threshold, sv, thresholdList, );
          
        setStepValue(sv);
        setMax(thresholdList.current.length - 1);
      }

      d3.select("#" + divId).selectAll(".MuiSlider-rail").style("width", "10px");
      d3.select("#" + divId).selectAll(".MuiSlider-track").style("width", "10px");
    }, [props.thresholdList]);

// console.log("valueslider", stepValue, max, props, props.defaultStepValue);
    return (
        <div id={divId} className="flexVerticalContainer" style={{width:props.width}}>
            <div align="center"
                style={{"margin":"0px 10px 5px 0px", "height":props.height - 30}}>
                <PrettoSlider
                    // defaultValue={props.threshold}
                    value={stepValue}
                    onChangeCommitted={(event, newValue) => {
                        setStepValue(newValue);
                        props.changeThreshold(thresholdList.current[newValue]);
                    }}
                    onChange={(event, newValue) => {
                        setStepValue(newValue);
                    }}
                    // aria-labelledby="vertical-slider"
                    min={0}
                    max={max}
                    marks={max < 100 ? true : undefined}
                    step={1}
                    orientation="vertical"
                    valueLabelDisplay="auto"
                    // onChangeCommitted={(threshold) => props.changeThreshold(threshold)}
                />
            </div>
            <div align="center" style={{height:"25px", fontSize: "9px", fontWeight: "600"}}>CLSTR STEP</div>
            {/* <div style={{height:"50px", margin: "0px 10px 0px 5px"}}>
                <Button className={classes.button} variant="outlined">
                    <RefreshRoundedIcon className={classes.icon} onClick={() => props.changeThreshold(threshold)}/>
                </Button>
            </div> */}
        </div>
    );
}

export default ValueSlider;