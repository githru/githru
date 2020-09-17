import React, { useState, } from 'react';
import "./ValueSlider.css";
import Slider from '@material-ui/core/Slider';
import Button from '@material-ui/core/Button';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import { PreferenceList } from './analyzer/GithruClasses';
import { cloneDeep } from 'lodash';
import { useSelector, useDispatch } from 'react-redux';
import * as actions from '../modules';

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
  },
  div: {
    fontSize: "16px",
    fontWeight: "bold",
  },
  prefDiv: {
    display: "flex",
    fontSize: "12px",
    width: "100%",
    height: "20px",
    padding: 0
  },
  prefName: {
    // display: "flex",
    fontWeight: "bold",
    fontSize: "10px",
    width: "90px",
    textAlign: "right",
    paddingRight: 10,
    paddingTop: 5,
    textTransform: "uppercase"
  },
  buttons: {
    display: "flex",
    justifyContent: "center",
    marginTop: "8px",
    paddingLeft: "8px",
    paddingRight: "8px"
  }
}));

const HorizontalSlider = withStyles({
  root: {
    color: "#78909c",
    height: 8,
    padding: "10px 0px"
  },
  thumb: {
    height: "8px",
    width: "8px",
    marginTop: "-3px",
  },
  valueLabel: {
    fontSize: "10px",
    circle: {
      width: "10px",
      height: "10px",
    }
  },
  // valueLabelCircle: {
  //   width: "10px",
  //   height: "10px",
  // }
  // thumb: {
  //   height: 10,
  //   width: 10,
  //   backgroundColor: '#fff',
  //   border: '2px solid currentColor',
  //   // marginTop: -8,
  //   // marginLeft: -12,
  //   // '&:focus,&:hover,&$active': {
  //   //   boxShadow: 'inherit',
  //   // },
  // },
  // valueLabel: {
  //   left: 'calc(-50% + 4px)',
  // },
  // track: {
  //   height: 8,
  //   borderRadius: 4,
  // },
  // rail: {
  //   height: 8,
  //   borderRadius: 4,
  // },
})(Slider);

const PreferenceSliders = props => {
  const classes = useStyles();
// console.log("??", props.pref);
  const preferenceWeights = useSelector(state => state.groupingParameters.preferenceWeights);
  const [pref, setPref] = useState(preferenceWeights);

  const width = useSelector(state => state.layout.leftPaneWidth);
  const dispatch = useDispatch();

// console.log("PrefSliders ---", PreferenceList);

  // useEffect( () => {
  //   setPref(preferenceWeights);
  // }, [preferenceWeights]);

  // if (pref === undefined) return null;

  return (
    <div id="preferenceSliders" className="flexVerticalContainer" style={{ width: width, marginRight:10 }}>
      {PreferenceList.map((prefName, i) => (
        <div key={i} className={classes.prefDiv}>
          <div className={classes.prefName}>
            {prefName.startsWith("commit") ? "commit " + prefName.split("commit")[1] : prefName}
          </div>
          
          <div style={{width:"150px"}}>
            <HorizontalSlider
              value={pref[prefName]}
              min={0}
              max={1}
              step={0.1}
              valueLabelDisplay="auto"
              onChangeCommitted={(event, newValue) => {
                let newPref = cloneDeep(pref);
                newPref[prefName] = newValue;
                setPref(newPref);
              }}
              onChange={(event, newValue) => {
                let newPref = cloneDeep(pref);
                newPref[prefName] = newValue;
                setPref(newPref);
              }}
            />
          </div>
        </div>
      ))}
      {/* <div style={{height:10}}/> */}
      <div className={classes.buttons} >
          <Button style={{ "fontSize": "11px", "flex": 1, "marginRight": "8px"}}variant="outlined" size="small" onClick={() => {
              let newPref = cloneDeep(pref);
              PreferenceList.forEach(d => newPref[d] = 1);
              setPref(newPref);
          }}>
            RESET
          </Button>
          <Button style={{ "fontSize": "11px"}} size="small" variant="outlined" 
            onClick={() => dispatch(actions.updatePreferenceWeights(pref))}>
            CHANGE PREFERENCES
          </Button>
      </div>
    </div>
  );
}

export default PreferenceSliders;