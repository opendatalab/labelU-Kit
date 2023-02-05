import currentStyles from '../../pages/inputData/index.module.scss';

const UploadFolderController = {
  isInArray: (children: any, index: number, paths: any) => {
    return children.some((childItem: any) => childItem.title === paths[index]);
  },
  getIndexInArray: (children: any, index: any, paths: any) => {
    return children.find((childrenItem: any) => childrenItem.title === paths[index]);
  },
  confirmFolder: (parent: any, index: any, paths: any, data: any) => {
    let child = undefined;
    if (parent.children) {
      child = UploadFolderController.isInArray(parent.children, index, paths);
    } else {
      parent.icon = <img src="/src/icons/folder.png" />;
      parent.title = paths[index];
      parent.key = new Date().getTime() + Math.random();
      parent.children = [];
      child = false;
      UploadFolderController.confirmFolder(parent, index, paths, data);
      return;
    }
    if (!child) {
      if (index === paths.length - 1) {
        parent.children.push({
          icon: <img src="/src/icons/picture.png" alt="" />,
          title: (
            <div className={currentStyles.itemInFolder}>
              <div className={currentStyles.columnFileName}>{paths[paths.length - 1]}</div>
              <div className={currentStyles.columnStatus}>
                {data.hasUploaded ? (
                  <div className={currentStyles.uploadStatus}>
                    <div className={currentStyles.greenCircle} />
                    已上传
                  </div>
                ) : (
                  <div className={currentStyles.uploadStatus}>
                    <div className={currentStyles.redCircle} />
                    上传失败
                  </div>
                )}
              </div>
              <div className={currentStyles.columnOptionButtons}>
                {!data.hasUploaded && <div className={currentStyles.columnOption1}> 重新上传 </div>}
                <div
                  className={currentStyles.columnOption}
                  // onClick = {UploadFolderController.deleteFile(data)}
                >
                  删除
                </div>
              </div>
            </div>
          ),

          key: new Date().getTime() + Math.random(),
          isLeaf: true,
        });
      } else {
        parent.children.push({
          icon: <img src="/src/icons/folder.png" />,
          title: <span>&nbsp;&nbsp;{paths[index]}</span>,
          key: new Date().getTime() + Math.random(),
          children: [],
        });
        UploadFolderController.confirmFolder(parent.children[parent.children.length - 1], index + 1, paths, data);
      }
    } else {
      if (index !== paths.length - 1) {
        const childIndex = UploadFolderController.getIndexInArray(parent.children, index, paths);
        if (childIndex || childIndex === 0) {
          UploadFolderController.confirmFolder(parent.children[childIndex], index + 1, paths, data);
        } else {
          // eslint-disable-next-line no-console
          console.error('数据有问题');
        }
      } else {
        parent.children.push({
          icon: <img src="/src/icons/folder.png" />,
          title: paths[paths.length - 1],
          key: new Date().getTime() + Math.random(),
          isLeaf: true,
        });
      }
    }
  },
};
export default UploadFolderController;
