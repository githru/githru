import React, { useRef } from 'react';
import TemporalFilter from './components/TemporalFilter';
import GitAnalyzer from './components/analyzer/GitAnalyzer';
import TemporalSelector from './components/TemporalSelector';
import { useSelector, shallowEqual, useDispatch } from 'react-redux';
import CommitGraph from './components/CommitGraph';
// import ClusterSummary from './components/ClusterSummary';
import { AttributeColors, BranchColors, changeRGBColorByOpacity } from './components/ColorClasses';

import './App.css';
import KeywordTextAreaFilter from './components/KeywordTextAreaFilter';
import PreferenceSliders from './components/PreferenceSliders';
import ManageParameters from './components/ManageParameters';
import InformationFragments from './components/InformationFragments';
import CaptureTab from './components/CaptureTab';
// import Inspection from './components/Inspection';
import CompareSummary from './components/CompareSummary';
import HighlightQuery from './components/HighlightQuery';
import { SidePanelContentUnit } from './components/container/SidePanelContentUnit';
import Button from '@material-ui/core/Button';
import Icon from '@material-ui/core/Icon';
import { AttributeIconSpecs } from './components/LegendIcons';
import { DataTypeByNameMap } from './components/analyzer/GithruClasses';
import ArrowBackIcon from '@material-ui/icons/ArrowBack';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import * as actions from './modules';


const AppV2 = props => {
  const defaultThresholdStep = 25;
  const gitAnalyzerRef = useRef(undefined);
  // const initRef = useRef(true);
  // Importing json files
  const repo = props.match.params.repo;
  const mainStemBranchName = props.match.params.mainStemBranchName;
  console.log("mainStemBranchName", repo, mainStemBranchName);

  const releasePrefix = props.match.params.releasePrefix;
  const data = require('./json/' + repo + '.commits.json');
  const scoreData = require('./json/' + repo + '.score.json');
  const corpusData = require('./json/' + repo + '.corpus.json');
  const pullData = require('./json/' + repo + '.pulls.json');


  const {
    leftPaneWidth,
    clusterOverviewWidth,
    rightPaneWidth,
    rightPaneMargin,
    // selectedClusterDataForSummary,
    temporalSelectorHeight,
    clusterOverviewHeight,
    orgClusterOverviewHeight,
    capturedSummaryInfoListForCompare,
    useHeuristicMerge,

  } = useSelector(state => ({
    leftPaneWidth: state.layout.leftPaneWidth,
    clusterOverviewWidth: state.layout.clusterOverviewWidth,
    rightPaneWidth: state.layout.rightPaneWidth,
    rightPaneMargin: state.layout.rightPaneMargin,
    // selectedClusterDataForSummary: state.selectedClusterDataForSummary,
    temporalSelectorHeight: state.layout.temporalSelectorHeight,
    clusterOverviewHeight: state.layout.clusterOverviewHeight,
    orgClusterOverviewHeight: state.layout.orgClusterOverviewHeight,
    capturedSummaryInfoListForCompare: state.capturedSummaryInfoListForCompare,
    useHeuristicMerge: state.useHeuristicMerge,

  }), shallowEqual);

  const prevUseHeuristicMergeRef = useRef(undefined);
  if (gitAnalyzerRef.current === undefined || prevUseHeuristicMergeRef.current !== useHeuristicMerge) {
    gitAnalyzerRef.current = new GitAnalyzer(data, scoreData, corpusData, pullData,
      defaultThresholdStep, repo, releasePrefix, mainStemBranchName);
    // initRef.current = false;
    prevUseHeuristicMergeRef.current = useHeuristicMerge;
  }
  const gitAnalyzer = gitAnalyzerRef.current;

  return (
    <div className="bodyDiv flexContainer" id="app-screen-root">
      <div className="sidebar" id="main-sidebar">
        <div className="flexVerticalContainer">
          <SidePanelContentUnit title="Global Temporal Filter" show={true}>
            <TemporalFilter
              gitAnalyzer={gitAnalyzer}
            />
          </SidePanelContentUnit>

          <SidePanelContentUnit title="Preferences Weights" show={true}>
            <PreferenceSliders />
          </SidePanelContentUnit>

          <SidePanelContentUnit title="Parameters">
            <ManageParameters />
          </SidePanelContentUnit>

          <SidePanelContentUnit title="Highlight">
            <HighlightQuery />
          </SidePanelContentUnit>

          <SidePanelContentUnit title="Keyword Filter" show={true}>
            <KeywordTextAreaFilter
              gitAnalyzer={gitAnalyzer}
            />            
          </SidePanelContentUnit>
          
        </div>
      </div>


      <div className="flexVerticalContainer" id="center-pane">
        <div id="title-panel">
          <div id="repository-name">
            GIThru: Contextual History of "{repo}" repository.
          </div>
          <div id="legend-container">
            ATTRS:
            {[ "authors", "keywords", "commitTypes", "clocByFiles", "clocByDirs" ].map((d, i) => {
            let color = AttributeColors[ DataTypeByNameMap[d] ][ 3 ];
            return (
              <div key={i} className="legend-element" style={{
                background: color,
              }}>

                <Icon>{AttributeIconSpecs[ d ]}</Icon>
                <span>{d.split("clocBy").slice(-1)[ 0 ]}</span>

              </div>
            );
          })}
            <div style={{ width: "20px" }} />
            BRANCH:
            {Object.entries(BranchColors).map((d, i) => {
              let [ key, color ] = d;
              color = changeRGBColorByOpacity(color, 0.7);

              return (
                <div key={i} className="legend-element" style={{
                  background: color,
                }}>{key}</div>
              );
            })}
          </div>
        </div>
        <div id="main-panel-content">
          <div id="overviewPane">
            <TemporalSelector
              gitAnalyzer={gitAnalyzer}
            // threshold={this.state.threshold}
            // keywords={this.state.keywords}
            />
          </div>
          <div id="clusterAndDetail" className="flexContainer">
            <div id="clusterAndDetailPane" className="flexVerticalContainer">
              <div id="clusterPane">
                <CommitGraph
                  gitAnalyzer={gitAnalyzerRef.current}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        id="rightPane"
        style={{
          width: rightPaneWidth + "px",
        }}
        className="flexVerticalContainer"
      >
        <div
          id="verticalTab"
          style={{
            width: rightPaneWidth + "px",
          }}
        >
          <CaptureTab
            width={rightPaneWidth}
            height={temporalSelectorHeight + orgClusterOverviewHeight}
          />
        </div>
        <div style={{"background-color": "#7a7c90", height : "439px"}}>
          {/*<div id="fragments">
            <InformationFragments
              width={rightPaneWidth}
            />
        </div>*/}
        </div>
      </div>
      <div>
        <ScrollButton />
      </div>
      <div
        id="comparePane"
        style={{
          width: "1900px",
          display: "none",
        }}
      >
        <CompareSummary
          gitAnalyzer={gitAnalyzer}
          capturedSummaryInfoListForCompare={capturedSummaryInfoListForCompare}
        />
      </div>
    </div>
  );
}

export default AppV2;


const ScrollButton = () => {
  const { scrollToRight } = useSelector(state => state);
  const dispatch = useDispatch();  
  
  return (
    <div>
      {scrollToRight &&
        <Button onClick={() => {
          dispatch(actions.updateScrollToRight(false));
          window.scrollTo(0, 0);
        }}>
          <ArrowBackIcon fontSize="large"/>
        </Button>
      }
      {!scrollToRight &&
        <Button onClick={() => {
          dispatch(actions.updateScrollToRight(true));
          window.scrollTo({top:0, left:4000});
        }}>
          <ArrowForwardIcon fontSize="large" />
        </Button>
      }
    </div>
  );
}