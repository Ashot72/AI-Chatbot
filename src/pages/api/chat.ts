import type { NextApiRequest, NextApiResponse } from 'next'
import { PineconeClient } from "@pinecone-database/pinecone";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import * as Ably from 'ably'
import { uuid } from 'uuidv4';
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { ConversationLog } from "./conversationLog";
import { ChatOpenAI } from "langchain/chat_models/openai";

let client: PineconeClient | null = null

type PageSource = {
    pageContent: string,
    metadata: {
        url: string
    }
}

const initPineconeClient = async () => {
    client = new PineconeClient()
    await client.init({
        environment: process.env.PINECONE_ENVIRONMENT!,
        apiKey: process.env.PINECONE_API_KEY!
    })
}

const ably = new Ably.Realtime({ key: process.env.ABLY_API_KEY})

const handleRequest = async ({ prompt, userId, source, streaming }: { prompt: string, userId: string, source: boolean, streaming: boolean }) => {
   if(!client) {
    await initPineconeClient()
   }

   try {
     const channel = ably.channels.get(userId)
     const interactionId = uuid()

     const conversationLog = new ConversationLog(userId)
     const conversationHistory = await conversationLog.getConverstion({ limit: 10})
     await conversationLog.addEntry({ entry: prompt, speaker: "user"})

     const pineconeIndex = client!.Index(process.env.PINECONE_INDEX!)
     
     channel.publish({
        data: {
            event: "status",
            message: "Finding matches..."
        }
     })

     const vectorStore = await PineconeStore.fromExistingIndex(
        new OpenAIEmbeddings(),
        { pineconeIndex }
     )

     const model = new ChatOpenAI({
         temperature: 0,
         streaming,
         callbacks: [{
            async handleLLMNewToken(token) {
                channel.publish({
                    data: {
                        event: "response",
                        token,
                        interactionId 
                    }
                })
            },
            async handleLLMEnd() {
                channel.publish({
                    data: {
                        event: "responseEnd"
                    }
                })
            }
        }]         
    })
   
     const nonStreamingModel = new ChatOpenAI({})

     const chain = ConversationalRetrievalQAChain.fromLLM(
        model,
        vectorStore.asRetriever(),
        { 
            returnSourceDocuments: true,
            questionGeneratorChainOptions: {
                llm: nonStreamingModel
            }        
        }
     )

     let chat_history =  conversationHistory.join("\n")
     const response = await chain.call({ question: prompt, chat_history })

     if(!streaming) {
        channel.publish({
            data: {
                event: "response",
                token: response.text,
                interactionId 
            }
        })
     }

     if(source) {
        const pageContents: string[] = []

        let index = 1
        response.sourceDocuments.forEach((source: PageSource) => {
            const { pageContent, metadata: { url }} = source
        
            if(!pageContents.includes(pageContent)){
                const token = `<br/><b>Source #${index}</b>
                                    <br/>${pageContent}
                                    <br/><a href="${url}" target="_blank">${url}</a>` 
            
                channel.publish({
                    data: {
                        event: "response",
                        token: "<br/>" + token,
                        interactionId 
                    }
                })
            
                pageContents.push(pageContent)
                index++
            }
        });
    }

     await conversationLog.addEntry({ entry: response.text, speaker: "bot" })

    } catch(error) { 
       console.error(error)
   }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const {  body: { prompt, userId, source, streaming } } = req
    await handleRequest({ prompt, userId, source, streaming})
    res.status(200).json({ "message": "started" })
}