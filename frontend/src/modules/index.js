import { createAction, handleActions } from 'redux-actions';
import { PreferenceWeights, CapturedSummaryInfo, BranchTypes } from "../components/analyzer/GithruClasses";

const UPDATE_CLUSTER_OVERVIEW_HEIGHT = "./UPDATE_CLUSTER_OVERVIEW_HEIGHT";
const UPDATE_GLOBAL_COMMITS_BY_TEMPORAL_FILTER = './UPDATE_GLOBAL_COMMITS_BY_TEMPORAL_FILTER';
const UPDATE_COMMITS_BY_TEMPORAL_FILTER = './UPDATE_COMMITS_BY_TEMPORAL_FILTER';
const UPDATE_COMMITS_BY_TEMPORAL_BRUSH = "./UPDATE_COMMITS_BY_TEMPORAL_BRUSH";
const UPDATE_CLUSTER_THRESHOLD = "./UPDATE_CLUSTER_THRESHOLD";
// const UPDATE_SELECTED_CLUSTER_DATA_FOR_SUMMARY = "./UPDATE_SELECTED_CLUSTER_DATA_FOR_SUMMARY";
const UPDATE_NONCONFLICT_GROUPING_LEVEL = "./UPDATE_NONCONFLICT_GROUPING_LEVEL";
const UPDATE_RELEASE_BINNING_LEVEL = "./UPDATE_RELEASE_BINNING_LEVEL";
const UPDATE_SUMMARY_BY_LOC = "./UPDATE_SUMMARY_BY_LOC";
const UPDATE_KEYWORD_FILTER_LIST = "./UPDATE_KEYWORD_FILTER_LIST";
const UPDATE_PREFERENCE_WEIGHTS = "./UPDATE_PREFERENCE_WEIGHTS";
const UPDATE_HIDE_FILES = "./UPDATE_HIDE_FILES";
const UPDATE_HEURISTIC_MERGE = "./UPDATE_HEURISTIC_MERGE";

const ADD_CAPTURED_SUMMARY_INFO_LIST = "./ADD_CAPTURED_SUMMARY_INFO_LIST";
const REMOVE_CAPTURED_SUMMARY_INFO_LIST = "./REMOVE_CAPTURED_SUMMARY_INFO_LIST";
const UPDATE_CURRENT_CAPTURED_SUMMARY_INFO_ID = "./UPDATE_CURRENT_CAPTURED_SUMMARY_INFO_ID";
const ADD_ITEMS_TO_CAPTURED_SUMMARY_INFO = "./ADD_ITEMS_TO_CAPTURED_SUMMARY_INFO";
const REMOVE_ITEM_FROM_CAPTURED_SUMMARY_INFO = "./REMOVE_ITEM_FROM_CAPTURED_SUMMARY_INFO";

const ADD_FRAGMENT_HISTORY = "./ADD_FRAGMENT_HISTORY";
const CLEAR_FRAGMENTS = "./CLEAR_FRAGMENTS;"
const REGISTER_FAVORITE_FRAGMENT = "./REGISTER_FAVORITE_FRAGMENT";
const UNREGISTER_FAVORITE_FRAGMENT = "./UNREGISTER_FAVORITE_FRAGMENT";
const UPDATE_CAPTURED_SUMMARY_INFO_LIST_FOR_COMPARE = "./UPDATE_CAPTURED_SUMMARY_INFO_LIST_FOR_COMPARE";
// const UPDATE_SHOW_PULL_REQUEST_BRANCH = "./UPDATE_SHOW_PULL_REQUEST_BRANCH";
const UPDATE_HIGHLIGHT_QUERY = "./UPDATE_HIGHLIGHT_QUERY";
const UPDATE_SHOW_MERGE_LINK = "./UPDATE_SHOW_MERGE_LINK";
const UPDATE_BRANCH_SHOW_BY_TYPE = "./UPDATE_BRANCH_SHOW_BY_TYPE";
const UPDATE_SCROLL_TO_RIGHT = "./UPDATE_SCROLL_TO_RIGHT";

export const updateClusterOverviewHeight = createAction(UPDATE_CLUSTER_OVERVIEW_HEIGHT);
export const updateGlobalCommitsByTemporalFilter = createAction(UPDATE_GLOBAL_COMMITS_BY_TEMPORAL_FILTER);
export const updateCommitsByTemporalFilter = createAction(UPDATE_COMMITS_BY_TEMPORAL_FILTER);
export const udpateCommitsByTemporalBrush = createAction(UPDATE_COMMITS_BY_TEMPORAL_BRUSH);
export const updateClusterThreshold = createAction(UPDATE_CLUSTER_THRESHOLD);
// export const updateSelectedClusterDataForSummary = createAction(UPDATE_SELECTED_CLUSTER_DATA_FOR_SUMMARY);
export const updateNonConflictGroupingLevel = createAction(UPDATE_NONCONFLICT_GROUPING_LEVEL);
export const updateReleaseBinningLevel = createAction(UPDATE_RELEASE_BINNING_LEVEL);
export const updateSummaryByLOC = createAction(UPDATE_SUMMARY_BY_LOC);
export const updateKeywordFilterList = createAction(UPDATE_KEYWORD_FILTER_LIST);
export const updatePreferenceWeights = createAction(UPDATE_PREFERENCE_WEIGHTS);
export const updateHideFiles = createAction(UPDATE_HIDE_FILES);
export const updateUseHeuristicMerge = createAction(UPDATE_HEURISTIC_MERGE);
// export const updateShowPullRequestBranch = createAction(UPDATE_SHOW_PULL_REQUEST_BRANCH);

export const addCapturedSummaryInfoList = createAction(ADD_CAPTURED_SUMMARY_INFO_LIST);
export const removeCapturedSummaryInfoList = createAction(REMOVE_CAPTURED_SUMMARY_INFO_LIST);
export const updateCurrentCapturedSummaryInfoId = createAction(UPDATE_CURRENT_CAPTURED_SUMMARY_INFO_ID);
export const addItemsToCapturedSummaryInfo = createAction(ADD_ITEMS_TO_CAPTURED_SUMMARY_INFO);
export const removeItemFromCaptureSummaryInfo = createAction(REMOVE_ITEM_FROM_CAPTURED_SUMMARY_INFO);

export const addFragmentHistory = createAction(ADD_FRAGMENT_HISTORY);
export const clearFragments = createAction(CLEAR_FRAGMENTS);
export const registerFavoriteFragment = createAction(REGISTER_FAVORITE_FRAGMENT);
export const unregisterFavoriteFragment = createAction(UNREGISTER_FAVORITE_FRAGMENT);

export const updateCapturedSummaryInfoListForCompare = createAction(UPDATE_CAPTURED_SUMMARY_INFO_LIST_FOR_COMPARE);
export const updateHighlightQuery = createAction(UPDATE_HIGHLIGHT_QUERY);
export const updateShowMergeLink = createAction(UPDATE_SHOW_MERGE_LINK);
export const updateBranchShowMapByType = createAction(UPDATE_BRANCH_SHOW_BY_TYPE);

export const updateScrollToRight = createAction(UPDATE_SCROLL_TO_RIGHT);

const summaryPane = { 
    width: 1850,
    left: 250,
    right: 200,
    rightPaneMargin: 10,
};
const inspectionPane = {
    width: 1600,
};
const initBranchShowMapByType = {
    // MASTER: true,
    EXPLICIT: true,
    IMPLICIT: true,
    PR_MERGED: false,
    PR_CLOSED: false,
    PR_OPEN: true,
}

const initialState = {
    gitAnalyzer: undefined,
    globalCommitSeqSelectionByTemporalFilter: undefined,
    commitSeqSelectionByTemporalFilter: undefined,
    commitSeqSelection: undefined,

    layout: {
        overviewWidth: summaryPane.width - summaryPane.left - summaryPane.right,
        leftPaneWidth: summaryPane.left,
        rightPaneWidth: summaryPane.right - summaryPane.rightPaneMargin * 2,
        rightPaneMargin: summaryPane.rightPaneMargin,

        width: summaryPane.width - summaryPane.left - summaryPane.right,

        clusterOverviewSliderWidth: 34,
        clusterOverviewWidth: summaryPane.width - summaryPane.left - summaryPane.right,
        
        temporalAreaHeight: 80,
        temporalSelectorHeight: 150,
        
        orgClusterOverviewHeight: 400,
        clusterOverviewHeight: 400,
        inspectionPaneWidth: inspectionPane.width,

        titlePanelHeight: 43,
    },
    
    groupingParameters: {
        preferenceWeights: PreferenceWeights,
        threshold: 0,
        nonConflictGroupingLevel: 0,
        releaseBinningLevel: 1,
        keywordFilterList: [],
        useHeuristicMerge: true,
        // showPullRequestBranch: false,
        branchShowMapByType: initBranchShowMapByType,
    },

    highlightQuery: [],

    showMergeLink: false,

    summaryParameters: {
        summaryByLOC: false,
        hideFiles: ["CHANGELOG.md", "version.txt"],  
    },
    searchResultList: [],
    // selectedClusters: new Set(),
    // selectedClusterDataForSummary: undefined,

    capturedSummaryInfoSeq: 0,
    capturedSummaryInfoList: [],
    currentCapturedSummaryInfoId: undefined,

    favoriteFragments: [],
    fragmentHistory: [],

    capturedSummaryInfoListForCompare: undefined,

    scrollToRight: false,
};

export default handleActions({
    [updateClusterOverviewHeight]: (state, action) => {
        return {
            ...state,
            layout: {
                ...state.layout,
                clusterOverviewHeight: action.payload,
            },
        }
    },
    [updateGlobalCommitsByTemporalFilter]: (state, action) => {
        return {
            ...state,
            globalCommitSeqSelectionByTemporalFilter: action.payload,
        }
    },
    [updateCommitsByTemporalFilter]: (state, action) => {
        return {
            ...state,
            commitSeqSelectionByTemporalFilter: action.payload
        };
    },
    [udpateCommitsByTemporalBrush]: (state, action) => {
        return {
            ...state,
            commitSeqSelection: action.payload,
        }
    },
    
    // GROUP PARAMETERS
    [updateClusterThreshold]: (state, action) => {
        return {
            ...state,
            groupingParameters: {
                ...state.groupingParameters,
                threshold: action.payload,
            }
        }
    },
    // [updateSelectedClusterDataForSummary]: (state, action) => {
    //     return {
    //         ...state,
    //         selectedClusterDataForSummary: action.payload,
    //     }
    // },
    [UPDATE_NONCONFLICT_GROUPING_LEVEL]: (state, action) => {
        return {
            ...state,
            groupingParameters: {
                ...state.groupingParameters,
                nonConflictGroupingLevel: action.payload,
            }
        }
    },
    [UPDATE_RELEASE_BINNING_LEVEL]: (state, action) => {
        return {
            ...state,
            groupingParameters: {
                ...state.groupingParameters,
                releaseBinningLevel: action.payload,
            }
        }
    },
    [UPDATE_KEYWORD_FILTER_LIST]: (state, action) => {
        return {
            ...state,
            groupingParameters: {
                ...state.groupingParameters,
                keywordFilterList: action.payload,
            }
        }
    },
    [updateUseHeuristicMerge]: (state, action) => {
        return {
            ...state,
            groupingParameters: {
                ...state.groupingParameters,
                useHeuristicMerge: action.payload,
            }
        }
    },
    [UPDATE_PREFERENCE_WEIGHTS]: (state, action) => {
        return {
            ...state,
            groupingParameters: {
                ...state.groupingParameters,
                preferenceWeights: action.payload,
            }
        }
    },
    // [UPDATE_SHOW_PULL_REQUEST_BRANCH]: (state, action) => {
    //     return {
    //         ...state,
    //         groupingParameters: {
    //             ...state.groupingParameters,
    //             showPullRequestBranch: action.payload,
    //         }
    //     }
    // },
    [updateBranchShowMapByType]: (state, action) => {
        let [type, bool] = action.payload;
        
        let map = {...state.groupingParameters.branchShowMapByType};
        map[type] = bool;

        return {
            ...state,
            groupingParameters: {
                ...state.groupingParameters,
                branchShowMapByType: map,
            }
        }
    },

    // SUMMARY PARAMS
    [UPDATE_SUMMARY_BY_LOC]: (state, action) => {
        return {
            ...state,
            summaryParameters: {
                ...state.summaryParameters,
                summaryByLOC: action.payload,
            }
        }
    },
    [updateHideFiles]: (state, action) => {
        return {
            ...state,
            summaryParameters: {
                ...state.summaryParameters,
                hideFiles: action.payload,
            }
        }
    },
    

    // CAPTURED SUMMARY INFO
    [addCapturedSummaryInfoList]: (state, action) => {
        return {
            ...state,
            capturedSummaryInfoSeq: state.capturedSummaryInfoSeq+1,
            capturedSummaryInfoList: 
                state.capturedSummaryInfoList.concat(
                    new CapturedSummaryInfo(state.capturedSummaryInfoSeq, action.payload[0], {...action.payload[1]}))
        }
    },
    [removeCapturedSummaryInfoList]: (state, action) => {
        state.capturedSummaryInfoList.splice(+action.payload, 1);

        return {
            ...state,
            capturedSummaryInfoList: state.capturedSummaryInfoList,
        }
    },
    [updateCurrentCapturedSummaryInfoId]: (state, action) => {
        return {
            ...state,
            currentCapturedSummaryInfoId: action.payload,
        }
    },
    [addItemsToCapturedSummaryInfo]: (state, action) => {
        if (state.currentCapturedSummaryInfoId === undefined) return state;

        const itemList = action.payload;
        let info = state.capturedSummaryInfoList[state.capturedSummaryInfoList.findIndex(d => d.id===state.currentCapturedSummaryInfoId)];
// console.log("NONONO", itemList, info );
        let newItems = itemList.filter( item => info.interestedItemList.findIndex(d => d[0] === item[0] && d[1] === item[1]) < 0);
        info.interestedItemList = info.interestedItemList.concat(newItems);

// console.log("addItemsToCapturedSummaryInfo", newItems, state.capturedSummaryInfoList, info.interestedItemList);
        return {
            ...state,
            capturedSummaryInfoList: [].concat(state.capturedSummaryInfoList)
        }
    },
    [removeItemFromCaptureSummaryInfo]: (state, action) => {
        let info = state.capturedSummaryInfoList[state.capturedSummaryInfoList.findIndex(d => d.id===state.currentCapturedSummaryInfoId)];
        // let info = state.capturedSummaryInfoList[state.currentCapturedSummaryInfoId];
        info.interestedItemList.splice(+action.payload, 1);
        info.interestedItemList = [].concat(info.interestedItemList);

// console.log("addItemsToCapturedSummaryInfo", newItems, state.capturedSummaryInfoList, info.interestedItemList);
        return {
            ...state,
            capturedSummaryInfoList: [].concat(state.capturedSummaryInfoList)
        }
    },
    
    
    // FRAGMENTS
    [addFragmentHistory]: (state, action) => {
        return {
            ...state,
            fragmentHistory: state.fragmentHistory.concat([action.payload]),
        }
    },
    [clearFragments]: (state, action) => {
        return {
            ...state,
            fragmentHistory: [],
            favoriteFragments: [],
        }
    },
    [registerFavoriteFragment]: (state, action) => {
// console.log("registerFavoriteFragment", state.favoriteFragments, action.payload)
        let fragment = action.payload;
        let exists = false;
        for (let fi = 0; fi < state.favoriteFragments.length; fi++) {
            let d = state.favoriteFragments[fi];
            if (d[0] === fragment[0] && d[1] === fragment[1]) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            return {
                ...state,
                favoriteFragments: state.favoriteFragments.concat([fragment]),
            }
        } else return state;
    },
    [unregisterFavoriteFragment]: (state, action) => {
        let fragment = action.payload;
        let index = state.favoriteFragments.findIndex(d => d[0] === fragment[0] && d[1] === fragment[1]);
        state.favoriteFragments.splice(index, 1);
// console.log("unregisterFavoriteFragment", fragment, index)
        if (index >= 0) {
            return {
                ...state,
                favoriteFragments: [].concat(state.favoriteFragments),
            }
        } else return state;
    },
    [updateCapturedSummaryInfoListForCompare]: (state, action) => {
        return {
            ...state,
            capturedSummaryInfoListForCompare: action.payload,
        }
    },
    [UPDATE_HIGHLIGHT_QUERY]: (state, action) => {
        return {
            ...state,
            highlightQuery: action.payload,
        }
    },
    [UPDATE_SHOW_MERGE_LINK]: (state, action) => {
        return {
            ...state,
            showMergeLink: action.payload,
        }
    },
    [UPDATE_SCROLL_TO_RIGHT]: (state, action) => {
        return {
            ...state,
            scrollToRight: action.payload,
        }
    },
}, initialState);