import { Toast } from 'vant';

import api from '@/api';
import { i18n } from '@/utils/i18n';
import ustorage from '@/utils/LocalStorage';
import { MPVirtualWall, MapDef, MapMode, MPForbiddenZone, MapElemKey } from '@/service/Map/MapDefined';
import { mapHelper } from '@/service/Map/MapHelper';
import VuexFun from '@/utils/VuexFun.js';

//获取分区地图（云端获取）
const getMap = async function getMap() {
  const ret = {
    m_mapIsEmpty: false,
    wholeMap: {},
  };
  return await api.requestAreaMapBNS().then((res) => {
    if (res.errorCode == 1 || !this.DeviceStatus.deviceStatus.is_room_map) {
      ret.m_mapIsEmpty = true;
    } else {
      ret.wholeMap = {
        map: {
          mapInfo: res.data,
          roomNameInfo: res.roomNameInfo,
        },
        forbidden: this.MapStatus.mapStatus.forbidden,
        mopForbidden: this.MapStatus.mapStatus.mopForbidden,
        virtualWall: this.MapStatus.mapStatus.virtualWall,
      };
      ret.m_mapIsEmpty = false;
    }
    return ret;
  });
};

const addVM = async function addVM(mapContainer = this.$refs.mapEdit.$refs.mapRef) {
  //添加虚拟墙
  let uconfig = ustorage.syncFirst_FunctionClick('AddVM');
  if (uconfig) {
    await new Promise((resolve) => {});
  }

  let walls = this.MapCacheStatus.mapStatus.virtualWall;
  if (walls.length >= MapDef.VIRTUAL_WALL_MAX) {
    this.$RBDialog.addMessage({
      title: i18n.t('TIPS'),
      message: i18n.t('MAX_ADD_WALL'),
      confirm: i18n.t('ALERT_OK'),
      handleConfirm: () => {},
    });
    return;
  }

  let newWalls = [];
  mapHelper.disableAllVM(walls);
  mapHelper.disableAllFD(this.MapCacheStatus.mapStatus.forbidden);
  newWalls = newWalls.concat(walls);
  newWalls.push(mapContainer.addNewVmTo(walls));

  let param = {};
  param[MapElemKey.MAP_VIRTUALWALL_KEY] = newWalls;
  VuexFun.updateMapCacheStatus(param);
  // this.operationTip = this.$t('PLACE_WALL_WARNING')
  // Toast({
  //   message: this.$t('PLACE_WALL_WARNING'),
  //   position: 'bottom',
  //   duration: 2000
  // });
};

const addFD = async function addFD(mapContainer = this.$refs.mapEdit.$refs.mapRef) {
  //添加禁区
  let uconfig = ustorage.syncFirst_FunctionClick('AddFD');
  if (uconfig) {
    await new Promise((resolve) => {});
  }
  let forbiddens = this.MapCacheStatus.mapStatus.forbidden;
  let mopForbiddens = this.MapCacheStatus.mapStatus[MapElemKey.MAP_MOPFORBIDDEN_KEY];
  if (forbiddens.length >= MapDef.FORBIDDEN_MAX) {
    this.$RBDialog.addMessage({
      title: this.$t('TIPS'),
      message: this.$t('MAX_ADD_AREA'),
      confirm: this.$t('ALERT_OK'),
      meaasgeAlign: 'center',
      handleConfirm: () => {},
    });
    return;
  }
  let newForbiddens = [];
  mapHelper.disableAllVM(this.MapCacheStatus.mapStatus.virtualWall);
  mapHelper.disableAllFD(forbiddens);
  mapHelper.disableAllFD(mopForbiddens);
  newForbiddens = newForbiddens.concat(forbiddens);
  newForbiddens.push(mapContainer.addNewForbiddenTo(forbiddens));
  let param = {};
  param[MapElemKey.MAP_FORBIDDEN_KEY] = newForbiddens;
  param[MapElemKey.MAP_MOPFORBIDDEN_KEY] = mopForbiddens;
  VuexFun.updateMapCacheStatus(param);
};

const addMopFD = async function addMopFD(mapContainer = this.$refs.mapEdit.$refs.mapRef) {
  //添加拖地禁区
  let uconfig = ustorage.syncFirst_FunctionClick('AddFD');
  if (uconfig) {
    await new Promise((resolve) => {});
  }
  let mopForbiddens = this.MapCacheStatus.mapStatus.mopForbidden;
  let forbiddens = this.MapCacheStatus.mapStatus.forbidden;
  if (mopForbiddens.length >= MapDef.MOPFORBIDDEN_MAX) {
    this.$RBDialog.addMessage({
      title: this.$t('TIPS'),
      message: this.$t('MAX_ADD_AREA'),
      confirm: this.$t('ALERT_OK'), //"我知道了",
      meaasgeAlign: 'center',
      handleConfirm: () => {},
    });
    return;
  }
  let newForbiddens = [];
  mapHelper.disableAllVM(this.MapCacheStatus.mapStatus.virtualWall);
  mapHelper.disableAllFD(mopForbiddens);
  mapHelper.disableAllFD(forbiddens);
  newForbiddens = newForbiddens.concat(mopForbiddens);
  newForbiddens.push(mapContainer.addNewForbiddenTo(mopForbiddens));

  let param = {};
  param[MapElemKey.MAP_MOPFORBIDDEN_KEY] = newForbiddens;
  param[MapElemKey.MAP_FORBIDDEN_KEY] = forbiddens;
  VuexFun.updateMapCacheStatus(param);
};

const addRect = async function addRect() {
  //添加划区
  let rects = this.MapCacheStatus.mapStatus.drawRect;
  let targets = this.MapCacheStatus.mapStatus.targetPosition;
  if (rects.length + targets.length >= MapDef.RECT_MAX) {
    this.$RBDialog.addMessage({
      title: this.$t('TIPS'),
      message: this.$t('MAX_ADD_REC'),
      confirm: this.$t('ALERT_OK'),
      meaasgeAlign: 'center',
      handleConfirm: () => {},
    });
    return;
  }
  let newRects = [];
  newRects = newRects.concat(rects);
  newRects.push(this.$refs.mainMap.$refs.mapRef.addNewRectTo([...rects, ...targets]));
  let param = {};
  param[MapElemKey.MAP_RECT_KEY] = newRects;
  VuexFun.updateMapCacheStatus(param);
};

const addTarget = async function addTarget() {
  //添加目标点
  let rects = this.MapCacheStatus.mapStatus.drawRect;
  let targets = this.MapCacheStatus.mapStatus.targetPosition;
  if (rects.length + targets.length >= MapDef.RECT_MAX) {
    this.$RBDialog.addMessage({
      title: this.$t('TIPS'),
      message: this.$t('MAX_ADD_REC'),
      confirm: this.$t('ALERT_OK'),
      meaasgeAlign: 'center',
      handleConfirm: () => {},
    });
    return;
  }
  let newTargets = [];
  newTargets = newTargets.concat(targets);
  newTargets.push(this.$refs.mainMap.$refs.mapRef.addNewTargetTo([...rects, ...targets]));
  let param = {};
  param[MapElemKey.MAP_TARGET_KEY] = newTargets;
  VuexFun.updateMapCacheStatus(param);
};

const saveMap = async function saveMap() {
  let checkResult = this.$refs.mapEdit.$refs.mapRef.ifDistanceLegal(false);

  let saveprocess = () => {
    this.$loading.show({ text: i18n.t('MAP_IS_UPDATING') });

    let setting_param = {
      save_setting: this.MapCacheStatus.mapStatus,
    };

    api.logical_check_buried_point('save_setting', ['关', '开'], setting_param);

    Promise.all([
      api.cmdWall(this.MapCacheStatus.mapStatus.virtualWall),
      api.cmdForbiddenZones(this.MapCacheStatus.mapStatus.forbidden),
      api.cmdMopForbiddenZones(this.MapCacheStatus.mapStatus.mopForbidden),
    ])
      .then((res) => {
        setTimeout(() => {
          this.$route.name === 'ForbiddenEdit' && this.$router.go(-1);
          this.$loading.hide();

          api.request_result_buried_point('save_setting', 'success', ['关', '开'], setting_param);
        }, 6000);
      })
      .catch((error) => {
        console.log(error);
        api.request_result_buried_point('save_setting', 'fail', ['关', '关'], setting_param, error);
      });
  };
  if (!checkResult[0]) {
    this.$RBDialog.addMessage({
      title: checkResult[1], //"温馨提示",
      message: '',
      confirm: this.$t('OK'), //"我知道了",
      cancel: this.$t('CANCEL'), //"我知道了",
      handleConfirm: () => {
        saveprocess();
      },
      handleCancel: () => {},
    });
    return;
  }
  saveprocess();
};

const mapSplit = async function mapSplit(mapContainer = this.$refs.mapEdit.$refs.mapRef) {
  this.operateStatus = OPERATE_STATUS.SPLIT;
  let walls = this.MapCacheStatus.mapStatus.splitLine;
  if (walls.length >= MapDef.SPLIT_LINE_MAX) {
    this.clearSubTimer();
    return;
  }
  let newWalls = [];
  mapHelper.disableAllSplitLine(walls);
  newWalls = newWalls.concat(walls);
  newWalls.push(mapContainer.addNewSplitLineTo(walls));

  let param = {};
  param[MapElemKey.MAP_SPLITLINE_KEY] = newWalls;
  VuexFun.updateMapCacheStatus(param);
};

const clearRectEle = function clearRectEle() {
  let param = {};
  param[MapElemKey.MAP_RECT_KEY] = [];
  param[[MapElemKey.MAP_TARGET_KEY]] = [];
  VuexFun.updateMapCacheStatus(param);
};

const mapMerge = async function mapMerge() {
  let param = {};
  param[MapElemKey.MAP_SPLITLINE_KEY] = [];
  VuexFun.updateMapCacheStatus(param);
  this.operateStatus = OPERATE_STATUS.MERGE;
};

const renameRoom = async function renameRoom() {};

const OPERATE_STATUS = {
  NONE: 'none',
  SPLIT: 'roomSplit',
  MERGE: 'roomMerge',
  RENAME: 'roomRename',
  VIRTUALWALL: 'virtualWall',
  FORBIDDEN: 'forbidden',
  MOP: 'mopForbidden',
};

const MAP_EDIT_STATUS = {
  ROOMEDIT: 'roomEdit',
  FORBIDDENEDIT: 'forbiddenEdit',
};

const MAP_TITLE = {
  [OPERATE_STATUS.SPLIT]: i18n.t('ROOM_SPLIT_TEXT'),
  [OPERATE_STATUS.MERGE]: i18n.t('ROOM_MERGER_TEXT'),
  [OPERATE_STATUS.RENAME]: i18n.t('ROOM_RENAME'),
  [OPERATE_STATUS.VIRTUALWALL]: i18n.t('ADD_WALL'),
  [OPERATE_STATUS.MOP]: i18n.t('ADD_MOP_RESTRICT_AREA'),
  [OPERATE_STATUS.FORBIDDEN]: i18n.t('ADD_RESTRICT_AREA'),
  [MAP_EDIT_STATUS.ROOMEDIT]: i18n.t('ROOM_EDIT_TITLE'),
  [MAP_EDIT_STATUS.FORBIDDENEDIT]: i18n.t('CUSTOM_FORBIDDEN_TITLE'),
};

export {
  addMopFD,
  addFD,
  getMap,
  addVM,
  addRect,
  saveMap,
  addTarget,
  renameRoom,
  mapSplit,
  mapMerge,
  clearRectEle,
  OPERATE_STATUS,
  MAP_EDIT_STATUS,
  MAP_TITLE,
};
