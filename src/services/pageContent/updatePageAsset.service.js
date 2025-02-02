import db from '../../db/models'
import ajv from '../../libs/ajv'
import ServiceBase from '../../libs/serviceBase'
import config from '../../configs/app.config'
import { uploadFile, validateFile } from '../../utils/common'
import { SUCCESS_MSG } from '../../utils/constants/success'
import { updateEntity, getOne } from '../../utils/crud'
import { OK, LOGICAL_ENTITY, PAGE_ASSET_TYPE } from '../../utils/constants/constant'

const schema = {
  type: 'object',
  properties: {
    pageId: { 
      type: 'string',
      pattern: '^[0-9]+$' 
    },
    assetKey: { type: 'string', pattern: '^[a-zA-Z]([\\w-]*[a-zA-Z0-9])?$'},
    assetValue: { type: ['string', 'object'] }
  },
  required: ['pageId', 'assetKey']
}

const constraints = ajv.compile(schema)

export class UpdatePageAsset extends ServiceBase {
  get constraints () {
    return constraints
  }

  async run () {
    const { pageId, assetKey, assetValue } = this.args
    const {
      req: {
        file: digitalAsset
      }
    } = this.context

    const fileCheckResponse = validateFile(null, digitalAsset)
    console.log(pageId, assetKey, assetValue)

    
    const transaction = this.context.sequelizeTransaction
    try {
      const {dataValues : { assets: assetsList }} = await getOne({ model: db.PageContent, data: { pageId }, attributes: ['assets'], transaction })
      if(assetsList === null) {
        return this.addError('AssetKeyNotFoundErrorType')
      } else {
        const allAssetKeys = Object.keys(assetsList)
        if(!allAssetKeys.includes(assetKey)) {
          return this.addError('AssetKeyNotFoundErrorType')
        }
      }
      let newAssetsList = assetsList

      if(fileCheckResponse === OK && assetsList[assetKey].assetType != PAGE_ASSET_TYPE.DIGITAL) return this.addError('InvalidAssetValueErrorType')
      else if(fileCheckResponse != OK && assetsList[assetKey].assetType === PAGE_ASSET_TYPE.DIGITAL) return this.addError('InvalidAssetValueErrorType')
      else if(assetsList[assetKey].assetType != PAGE_ASSET_TYPE.DIGITAL && !assetValue) return this.addError('InvalidAssetValueErrorType')
      
      if(assetsList[assetKey].assetType === PAGE_ASSET_TYPE.DIGITAL) {
        if (fileCheckResponse === OK) {
          if (digitalAsset && typeof (digitalAsset) === 'object') {
            const fileName = `${config.get('env')}/assets/${LOGICAL_ENTITY.DIGITAL_ASSET}/${pageId}-${Date.now()}.${digitalAsset.mimetype.split('/')[1]}`
            await uploadFile(digitalAsset, fileName)

            const dataObj = {}
            dataObj[`${assetKey}`] = {
              assetKey,
              assetValue: fileName,
              assetType: assetsList[assetKey].assetType
            }
            newAssetsList = { ...newAssetsList, ...dataObj }
            await updateEntity({
              model: db.PageContent,
              values: { pageId },
              data: { assets: newAssetsList },
              transaction
            })
            return { success: true, message: SUCCESS_MSG.UPDATE_SUCCESS }
          }
        }
      } else {
        const dataObj = {}
        dataObj[`${assetKey}`] = {
          assetKey,
          assetValue,
          assetType: assetsList[assetKey].assetType
        }
        newAssetsList = { ...newAssetsList, ...dataObj }
        await updateEntity({
          model: db.PageContent,
          values: { pageId },
          data: { assets: newAssetsList },
          transaction
        })
      return { success: true, message: SUCCESS_MSG.UPDATE_SUCCESS }
      }
    } catch (error) {
      this.addError('InternalServerErrorType', error)
    }
  }
}
