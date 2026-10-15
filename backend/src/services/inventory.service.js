import prisma from "../config/prisma.js";

function fail(message, statusCode = 400) { const e = new Error(message); e.statusCode = statusCode; throw e; }

class InventoryService {
  async availability(medicineId) {
    const now = new Date();
    const batches = await prisma.inventory_batches.findMany({where:{medicine_id:Number(medicineId),is_locked:false,quantity_remaining:{gt:0},OR:[{expires_at:null},{expires_at:{gte:now}}]},select:{quantity_remaining:true}});
    return batches.reduce((sum,b)=>sum+b.quantity_remaining,0);
  }
  async summary() {
    const [medicines, batches, recent] = await Promise.all([
      prisma.medicines.findMany({ include: { inventory_batches: true }, orderBy: { name: "asc" } }),
      prisma.inventory_batches.findMany({ where: { quantity_remaining: { gt: 0 } }, include: { medicines: true }, orderBy: { expires_at: "asc" }, take: 500 }),
      prisma.inventory_transactions.findMany({ include: { medicines: true, allocations: { include: { inventory_batches: true } } }, orderBy: { created_at: "desc" }, take: 10 }),
    ]);
    const now = new Date(); const edge = new Date(now); edge.setDate(edge.getDate() + 90);
    const rows = medicines.map(m => ({ id: m.id, name: m.name, unit: m.unit, minimum_stock: m.minimum_stock, issue_strategy: m.issue_strategy, stock: m.inventory_batches.reduce((sum,b) => sum + b.quantity_remaining, 0) }));
    return { totals: { items: rows.length, units: rows.reduce((s,m)=>s+m.stock,0), low_stock: rows.filter(m=>m.stock<=m.minimum_stock).length, expiring: batches.filter(b=>b.expires_at && new Date(b.expires_at)<=edge && new Date(b.expires_at)>=now).length, expired: batches.filter(b=>b.expires_at && new Date(b.expires_at)<now).length }, medicines: rows, batches, transactions: recent };
  }

  async listBatches({ search, page = 1, limit = 50, onlyAlerts = false }) {
    const where = { ...(search ? { OR: [{ batch_code: { contains: search } }, { medicines: { name: { contains: search } } }] } : {}) };
    const all = await prisma.inventory_batches.findMany({ where, include: { medicines: true }, orderBy: [{ expires_at: "asc" }, { received_at: "asc" }] });
    const now = new Date(); const edge = new Date(now); edge.setDate(edge.getDate()+90);
    const filtered = onlyAlerts ? all.filter(b => b.quantity_remaining>0 && (b.quantity_remaining<=b.medicines.minimum_stock || (b.expires_at && new Date(b.expires_at)<=edge))) : all;
    return { total: filtered.length, page, limit, data: filtered.slice((page-1)*limit,page*limit) };
  }

  async listTransactions({ search, page=1, limit=50, kind }) {
    const where = { ...(kind ? { kind } : {}), ...(search ? { medicines: { name: { contains: search } } } : {}) };
    const [total,data]=await prisma.$transaction([prisma.inventory_transactions.count({where}),prisma.inventory_transactions.findMany({where,include:{medicines:true,allocations:{include:{inventory_batches:true}}},orderBy:{created_at:"desc"},skip:(page-1)*limit,take:limit})]);
    return {total,page,limit,data};
  }

  async receive(input, actorId) {
    return prisma.$transaction(async tx => {
      const medicine=await tx.medicines.findUnique({where:{id:input.medicine_id}}); if(!medicine) fail("Không tìm thấy mặt hàng",404);
      const batch=await tx.inventory_batches.create({data:{medicine_id:input.medicine_id,batch_code:input.batch_code,quantity_received:input.quantity,quantity_remaining:input.quantity,expires_at:input.expires_at||null,unit_cost:input.unit_cost,supplier:input.supplier||null}});
      const transaction=await tx.inventory_transactions.create({data:{medicine_id:input.medicine_id,kind:"RECEIPT",quantity:input.quantity,note:input.note||null,actor_id:actorId,allocations:{create:{batch_id:batch.id,quantity:input.quantity}}}});
      return {batch,transaction};
    });
  }

  async issue(input, actorId) {
    return prisma.$transaction(async tx => {
      const medicine=await tx.medicines.findUnique({where:{id:input.medicine_id}}); if(!medicine) fail("Không tìm thấy mặt hàng",404);
      // Lock candidate rows before checking and decrementing; the transaction serializes competing issues on these batches.
      const order=(input.strategy||medicine.issue_strategy)==="FIFO" ? "received_at ASC, id ASC" : "expires_at IS NULL, expires_at ASC, received_at ASC, id ASC";
      const candidates=await tx.$queryRawUnsafe(`SELECT id, quantity_remaining, expires_at, is_locked FROM inventory_batches WHERE medicine_id = ? AND quantity_remaining > 0 AND is_locked = 0 AND (expires_at IS NULL OR expires_at >= CURRENT_DATE()) ORDER BY ${order} FOR UPDATE`, input.medicine_id);
      const available=candidates.reduce((s,b)=>s+Number(b.quantity_remaining),0); if(available<input.quantity) fail(`Không đủ tồn khả dụng (còn ${available})`,409);
      let remaining=input.quantity; const allocations=[];
      for(const batch of candidates){ if(!remaining) break; const take=Math.min(remaining,Number(batch.quantity_remaining)); const result=await tx.inventory_batches.updateMany({where:{id:Number(batch.id),quantity_remaining:{gte:take},is_locked:false},data:{quantity_remaining:{decrement:take}}}); if(result.count!==1) fail("Tồn kho vừa thay đổi, vui lòng thử lại",409); allocations.push({batch_id:Number(batch.id),quantity:take}); remaining-=take; }
      const transaction=await tx.inventory_transactions.create({data:{medicine_id:input.medicine_id,kind:"ISSUE",quantity:input.quantity,reference_type:input.reference_type||null,reference_id:input.reference_id||null,note:input.note||null,actor_id:actorId,allocations:{create:allocations}}});
      return transaction;
    },{isolationLevel:"Serializable"});
  }

  async adjust(input, actorId) {
    return prisma.$transaction(async tx=>{ const batch=await tx.inventory_batches.findUnique({where:{id:input.batch_id}}); if(!batch) fail("Không tìm thấy lô",404); const next=batch.quantity_remaining+input.quantity; if(next<0) fail("Điều chỉnh không thể làm tồn âm"); const updated=await tx.inventory_batches.updateMany({where:{id:batch.id,quantity_remaining:batch.quantity_remaining},data:{quantity_remaining:next}}); if(updated.count!==1) fail("Lô vừa thay đổi, hãy tải lại",409); const txrow=await tx.inventory_transactions.create({data:{medicine_id:batch.medicine_id,kind:"ADJUSTMENT",quantity:input.quantity,note:input.note,actor_id:actorId,allocations:{create:{batch_id:batch.id,quantity:Math.abs(input.quantity)}}}}); return {batch:{...batch,quantity_remaining:next},transaction:txrow}; },{isolationLevel:"Serializable"});
  }

  async processExpired(actorId) {
    return prisma.$transaction(async tx => {
      const expired=await tx.$queryRaw`SELECT id, medicine_id, quantity_remaining FROM inventory_batches WHERE quantity_remaining > 0 AND expires_at < CURRENT_DATE() FOR UPDATE`;
      const processed=[];
      for(const batch of expired){
        const quantity=Number(batch.quantity_remaining);
        const result=await tx.inventory_batches.updateMany({where:{id:Number(batch.id),quantity_remaining:quantity},data:{quantity_remaining:0,is_locked:true}});
        if(result.count!==1) fail("Lô hàng vừa thay đổi, hãy thử lại",409);
        processed.push(await tx.inventory_transactions.create({data:{medicine_id:Number(batch.medicine_id),kind:"EXPIRED",quantity,note:"Hủy tồn lô hết hạn",actor_id:actorId,allocations:{create:{batch_id:Number(batch.id),quantity}}}}));
      }
      return {count:processed.length,transactions:processed};
    },{isolationLevel:"Serializable"});
  }
}
export default new InventoryService();
