
import {useContext} from 'react';
import {PointCloudContext} from '../PointCloudContext';


export const UseAttributes:any = ()=>{
    const {topViewInstance} = useContext(PointCloudContext)

    const updateTopViewAttribute = (attributeKeys:string)=>{
        topViewInstance?.pointCloud2dOperation.setDefaultAttribute(attributeKeys)
    }
    return {
        updateTopViewAttribute
    }
}