import { prisma } from "./database";
import { Speaker } from '@prisma/client';

class ConversationLog {
    constructor(public userId: string) {
        this.userId = userId
    }

    public async addEntry({ entry, speaker }: { entry: string, speaker: Speaker }) {
        await prisma.conversations.create({ data: { user_id: this.userId, entry, speaker}})           
    }

    public async getConverstion({ limit }: { limit: number }): Promise<string[]> {
       const conversaion = await prisma.conversations.findMany(
        { 
            where: { user_id: this.userId },
            take: limit, 
            orderBy: [{ create_at: 'desc' }] 
        })    
       return conversaion.map((data) => data.entry).reverse()
    }
}

export { ConversationLog }