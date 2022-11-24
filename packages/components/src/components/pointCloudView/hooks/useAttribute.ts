
import {useContext} from 'react';
import {PointCloudContext} from '../PointCloudContext';


export const UseAttributes:any = ()=>{
    const {topViewInstance,mainViewInstance} = useContext(PointCloudContext)

    const updateTopViewAttribute = (attributeKeys:string)=>{
        topViewInstance?.pointCloud2dOperation.setDefaultAttribute(attributeKeys)
    }

    const updateMainViewAttribute = (attributeKeys:string)=>{
        mainViewInstance?.setDefaultAttribute(attributeKeys)
    }

    return {
        updateTopViewAttribute,
        updateMainViewAttribute
    }
}