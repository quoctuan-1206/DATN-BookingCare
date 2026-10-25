import service from "../services/inventory.service.js";
import { inventoryQuerySchema, receiveSchema, issueSchema, adjustSchema } from "../validators/inventory.validator.js";
class InventoryController {
  async summary(req,res,next){try{const query=inventoryQuerySchema.parse(req.query);return res.json({success:true,data:await service.summary(req.user,query.clinic_id)});}catch(e){next(e);}}
  async batches(req,res,next){try{return res.json({success:true,...await service.listBatches(inventoryQuerySchema.parse(req.query),req.user)});}catch(e){next(e);}}
  async alerts(req,res,next){try{return res.json({success:true,...await service.listBatches({...inventoryQuerySchema.parse(req.query),onlyAlerts:true},req.user)});}catch(e){next(e);}}
  async transactions(req,res,next){try{return res.json({success:true,...await service.listTransactions(inventoryQuerySchema.parse(req.query),req.user)});}catch(e){next(e);}}
  async receive(req,res,next){try{return res.status(201).json({success:true,data:await service.receive(receiveSchema.parse(req.body),req.user.id,req.user)});}catch(e){next(e);}}
  async issue(req,res,next){try{return res.status(201).json({success:true,data:await service.issue(issueSchema.parse(req.body),req.user.id,req.user)});}catch(e){next(e);}}
  async adjust(req,res,next){try{return res.json({success:true,data:await service.adjust(adjustSchema.parse(req.body),req.user.id,req.user)});}catch(e){next(e);}}
  async processExpired(req,res,next){try{const query=inventoryQuerySchema.parse(req.query);return res.json({success:true,data:await service.processExpired(req.user.id,req.user,query.clinic_id)});}catch(e){next(e);}}
}
export default new InventoryController();
