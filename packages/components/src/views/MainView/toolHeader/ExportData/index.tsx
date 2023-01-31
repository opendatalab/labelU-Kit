import React from 'react';
import { Button } from 'antd/es';
import { connect } from 'react-redux';
import type { Dispatch } from 'redux';
import { useTranslation } from 'react-i18next';

import type { AppState } from '@/store';
import type { ToolInstance } from '@/store/annotation/types';
import type { IFileItem, OnSubmit } from '@/types/data';
import { ANNOTATION_ACTIONS } from '@/store/Actions';
import { ESubmitType } from '@/constant';

interface IProps {
  toolInstance: ToolInstance;
  imgList: IFileItem[];
  onSubmit?: OnSubmit;
  exportData?: (imgList: IFileItem[]) => void;
  dispatch: Dispatch;
}

const ExportData: React.FC<IProps> = ({ imgList, dispatch, exportData }) => {
  const { t } = useTranslation();

  if (!exportData) {
    return null;
  }

  const exportDataFuc = () => {
    dispatch({
      type: ANNOTATION_ACTIONS.SUBMIT_FILE_DATA,
      payload: {
        submitType: ESubmitType.Export,
      },
    });

    if (exportData) {
      exportData(imgList);
    }
  };

  return (
    <Button style={{ marginLeft: 20 }} onClick={exportDataFuc}>
      {t('Export')}
    </Button>
  );
};

const mapStateToProps = (state: AppState) => ({
  toolInstance: state.annotation.toolInstance,
  imgList: state.annotation.imgList,
  onSubmit: state.annotation.onSubmit,
});

export default connect(mapStateToProps)(ExportData);
